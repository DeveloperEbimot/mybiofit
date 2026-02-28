import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, Loader2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface ParsedNutrition {
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

function extractNutrition(text: string): ParsedNutrition | null {
  try {
    // Look for a JSON block in the response
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*?"meal_name"[\s\S]*?\}/);
    if (jsonMatch) {
      const raw = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(raw);
      if (parsed.meal_name) return {
        meal_name: parsed.meal_name,
        calories: Number(parsed.calories) || 0,
        protein: Number(parsed.protein) || 0,
        carbs: Number(parsed.carbs) || 0,
        fat: Number(parsed.fat) || 0,
        fiber: Number(parsed.fiber) || 0,
      };
    }
  } catch {}
  return null;
}

export default function ScanMeal() {
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [nutrition, setNutrition] = useState<ParsedNutrition | null>(null);
  const [logged, setLogged] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const logToStats = async (data: ParsedNutrition) => {
    if (user) {
      const { error } = await supabase.from("nutrition_logs").insert({
        user_id: user.id,
        meal_name: data.meal_name,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        fiber: data.fiber,
      });
      if (error) {
        toast({ title: "Failed to log to stats", variant: "destructive" });
        return;
      }
    } else {
      const saved = localStorage.getItem("biofit-nutrition-logs");
      const logs = saved ? JSON.parse(saved) : [];
      logs.unshift({
        id: crypto.randomUUID(),
        ...data,
        logged_at: new Date().toISOString().split("T")[0],
      });
      localStorage.setItem("biofit-nutrition-logs", JSON.stringify(logs));
    }
    setLogged(true);
    toast({ title: "Meal logged to Statistics!", description: `${data.calories} kcal • ${data.protein}g protein • ${data.carbs}g carbs • ${data.fat}g fat` });
  };

  const analyzeMeal = async () => {
    if (!image) return;
    setLoading(true);
    setAnalysis("");
    setNutrition(null);
    setLogged(false);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Analyze this meal image. My diet goal is: ${profile.dietGoal}. 

IMPORTANT: At the very end of your response, include a JSON block with the estimated nutrition data in this exact format:
\`\`\`json
{"meal_name": "Name of the meal", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "fiber": 0}
\`\`\`

Tell me: 1) What foods you see 2) Estimated calories and macros (protein, carbs, fat, fiber in grams) 3) Whether it fits my ${profile.dietGoal} diet 4) Suggestions to improve it. Be specific and helpful.` }],
          image,
          systemPrompt: "You are BioFit AI, a nutrition expert. Analyze food images and provide detailed nutritional analysis. Always estimate calories and macronutrients. Be encouraging but honest. ALWAYS include a JSON block at the end with meal_name, calories, protein, carbs, fat, fiber values.",
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let result = "";

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
            if (c) { result += c; setAnalysis(result); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }

      // Extract nutrition from completed response
      const parsed = extractNutrition(result);
      if (parsed) setNutrition(parsed);
    } catch (e) {
      console.error(e);
      setAnalysis("Error analyzing meal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2">Scan Your Meal</h1>
        <p className="text-muted-foreground">Upload a photo and AI will analyze if it fits your <span className="text-primary font-medium">{profile.dietGoal}</span> diet.</p>
      </motion.div>

      <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {!image ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card border-2 border-dashed border-border hover:border-primary/50 transition-colors p-12 text-center cursor-pointer"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-2">Take a photo or upload an image</p>
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" /> Choose Image
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="glass-card overflow-hidden">
            <img src={image} alt="Meal" className="w-full max-h-64 object-cover" />
          </div>
          <div className="flex gap-2">
            <Button onClick={analyzeMeal} disabled={loading} className="flex-1">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {loading ? "Analyzing..." : "Analyze Meal"}
            </Button>
            <Button variant="outline" onClick={() => { setImage(null); setAnalysis(""); setNutrition(null); setLogged(false); }}>
              New Photo
            </Button>
          </div>
        </div>
      )}

      {analysis && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <h2 className="font-display font-semibold text-lg mb-3 text-primary">Analysis Result</h2>
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{analysis.replace(/```json[\s\S]*?```/g, "").trim()}</ReactMarkdown>
          </div>

          {nutrition && !logged && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{nutrition.meal_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {nutrition.calories} kcal • P: {nutrition.protein}g • C: {nutrition.carbs}g • F: {nutrition.fat}g • Fiber: {nutrition.fiber}g
                  </p>
                </div>
                <Button onClick={() => logToStats(nutrition)} size="sm" className="gap-2">
                  <BarChart3 className="w-4 h-4" /> Log to Stats
                </Button>
              </div>
            </motion.div>
          )}

          {logged && (
            <div className="mt-4 p-3 rounded-lg bg-primary/10 text-primary text-sm font-medium text-center">
              ✓ Logged to Statistics
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
