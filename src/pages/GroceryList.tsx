import { useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Plus, Trash2, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGroceryList } from "@/hooks/useGroceryList";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { useAIGate } from "@/hooks/useAIGate";
import ReactMarkdown from "react-markdown";

export default function GroceryList() {
  const { items, addItem, toggleItem, removeItem, clearChecked, addMultiple } = useGroceryList();
  const { profile } = useUserProfile();
  const gate = useAIGate("grocery_ai");
  const [newItem, setNewItem] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = () => {
    if (newItem.trim()) {
      addItem(newItem.trim());
      setNewItem("");
    }
  };

  const analyzeGroceryGaps = async () => {
    if (!gate.tryConsume()) return;
    setLoading(true);
    setAiSuggestion("");
    const itemNames = items.map(i => i.name).join(", ");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat-groq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          ...gate.anonHeaders,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `My current grocery list has: ${itemNames || "nothing yet"}. My diet goal is ${profile.dietGoal}. What essential items am I missing for a balanced ${profile.dietGoal} diet? Suggest specific items I should add. Also suggest a quick meal I could make with what I have.` }],
          promptId: "general",
        }),
      });

      if (!resp.ok || !resp.body) {
        let message = "Failed to get suggestions.";
        try {
          const data = await resp.json();
          if (data?.error) message = data.error;
        } catch {}
        throw new Error(message);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) { result += c; setAiSuggestion(result); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
    } catch (e) {
      setAiSuggestion(e instanceof Error ? e.message : "Error getting suggestions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const unchecked = items.filter(i => !i.checked);
  const checked = items.filter(i => i.checked);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2">Grocery List</h1>
        <p className="text-muted-foreground">Manage your shopping list. AI can find what's missing for your diet.</p>
      </motion.div>

      <div className="flex gap-2">
        <Input
          placeholder="Add an item..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="bg-secondary border-border"
        />
        <Button onClick={handleAdd}><Plus className="w-4 h-4" /></Button>
      </div>

      <Button variant="outline" onClick={analyzeGroceryGaps} disabled={loading} className="w-full">
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
        AI: What's Missing for My Diet?
      </Button>

      {aiSuggestion && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{aiSuggestion}</ReactMarkdown>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        {unchecked.map(item => (
          <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card p-3 flex items-center gap-3">
            <Checkbox checked={false} onCheckedChange={() => toggleItem(item.id)} />
            <span className="flex-1 text-foreground">{item.name}</span>
            <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </div>

      {checked.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Checked ({checked.length})</span>
            <Button variant="ghost" size="sm" onClick={clearChecked} className="text-muted-foreground">Clear</Button>
          </div>
          {checked.map(item => (
            <div key={item.id} className="glass-card p-3 flex items-center gap-3 opacity-50">
              <Checkbox checked={true} onCheckedChange={() => toggleItem(item.id)} />
              <span className="flex-1 line-through">{item.name}</span>
              <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="glass-card p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Your grocery list is empty. Add items or get AI suggestions!</p>
        </div>
      )}
    </div>
  );
}
