import { useState } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, Loader2, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useGroceryList } from "@/hooks/useGroceryList";
import { useAIChat } from "@/hooks/useAIChat";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function Recipes() {
  const { profile } = useUserProfile();
  const { addMultiple } = useGroceryList();
  const [query, setQuery] = useState("");
  const { messages, isLoading, sendMessage } = useAIChat(
    `You are BioFit's recipe chef AI. Generate recipes that fit the user's ${profile.dietGoal} diet. Always include:
1. Recipe name
2. Prep time and cook time
3. Complete ingredient list with amounts
4. Step-by-step cooking instructions (numbered)
5. Nutritional info (calories, protein, carbs, fat per serving)
6. Tips for the diet goal

Format nicely with markdown. Be creative and practical.`
  );

  const handleGenerate = () => {
    if (!query.trim()) {
      sendMessage(`Give me a delicious recipe that fits my ${profile.dietGoal} diet. Surprise me with something healthy and tasty!`);
    } else {
      sendMessage(`Give me a ${profile.dietGoal}-friendly recipe for: ${query}. Include full ingredients and step-by-step instructions.`);
    }
    setQuery("");
  };

  const extractIngredients = (text: string): string[] => {
    const lines = text.split("\n");
    const ingredients: string[] = [];
    let inIngredients = false;
    for (const line of lines) {
      if (line.toLowerCase().includes("ingredient")) inIngredients = true;
      else if (inIngredients && line.startsWith("-")) {
        ingredients.push(line.replace(/^-\s*/, "").trim());
      } else if (inIngredients && line.startsWith("##")) inIngredients = false;
    }
    return ingredients;
  };

  const addToGrocery = (content: string) => {
    const ingredients = extractIngredients(content);
    if (ingredients.length > 0) {
      addMultiple(ingredients);
      toast.success(`Added ${ingredients.length} ingredients to grocery list!`);
    } else {
      toast.error("Couldn't extract ingredients. Try asking for a recipe with a clear ingredient list.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2">AI Recipes</h1>
        <p className="text-muted-foreground">Get personalized <span className="text-primary font-medium">{profile.dietGoal}</span> recipes with step-by-step instructions.</p>
      </motion.div>

      <div className="flex gap-2">
        <Input
          placeholder="e.g. chicken pasta, smoothie, salad... or leave blank for a surprise!"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
          className="bg-secondary border-border"
        />
        <Button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UtensilsCrossed className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-4">
        {messages.filter(m => m.role === "assistant").map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <div className="prose prose-sm prose-invert max-w-none mb-4">
              <ReactMarkdown>{m.content}</ReactMarkdown>
            </div>
            <Button variant="outline" size="sm" onClick={() => addToGrocery(m.content)}>
              <ShoppingCart className="w-4 h-4 mr-2" /> Add Ingredients to Grocery List
            </Button>
          </motion.div>
        ))}
      </div>

      {messages.length === 0 && !isLoading && (
        <div className="glass-card p-12 text-center">
          <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Ask for any recipe and I'll make it fit your diet!</p>
        </div>
      )}
    </div>
  );
}
