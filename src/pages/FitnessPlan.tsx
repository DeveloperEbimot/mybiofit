import { useState } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserProfile } from "@/hooks/useUserProfile";
import ReactMarkdown from "react-markdown";

const planTypes = [
  { value: "weight-loss", label: "Weight Loss" },
  { value: "muscle-gain", label: "Muscle Gain" },
  { value: "endurance", label: "Endurance" },
  { value: "flexibility", label: "Flexibility & Mobility" },
  { value: "hiit", label: "HIIT Training" },
  { value: "strength", label: "Strength Training" },
  { value: "beginner", label: "Beginner Friendly" },
];

export default function FitnessPlan() {
  const { profile } = useUserProfile();
  const [planType, setPlanType] = useState(profile.dietGoal === "muscle-gain" ? "muscle-gain" : "weight-loss");
  const [plan, setPlan] = useState<string>(() => {
    const saved = localStorage.getItem("biofit-fitness-plan");
    return saved || "";
  });
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    setLoading(true);
    setPlan("");

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/biofit-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Create a detailed 4-week ${planType} fitness plan for me. My profile: Age ${profile.age}, ${profile.gender}, ${profile.weight}kg, ${profile.height}cm, activity level: ${profile.activityLevel}.

For each week, provide:
- Daily workout schedule (which days to train, which to rest)
- For each exercise include:
  1. Exercise name
  2. Sets x Reps (or duration)
  3. Step-by-step form instructions
  4. Common mistakes to avoid
  5. Modifications for beginners

Include warm-up and cool-down routines. Make it progressive (increasing difficulty each week). Use markdown formatting with clear headers.`
          }],
        }),
      });

      if (!resp.ok || !resp.body) throw new Error("Failed");
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
            if (c) { result += c; setPlan(result); }
          } catch { buffer = line + "\n" + buffer; break; }
        }
      }
      localStorage.setItem("biofit-fitness-plan", result);
    } catch (e) {
      setPlan("Error generating plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = () => {
    setPlan("");
    localStorage.removeItem("biofit-fitness-plan");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2">Fitness Plan</h1>
        <p className="text-muted-foreground">Get a personalized monthly workout plan with step-by-step exercise guides.</p>
      </motion.div>

      <div className="glass-card p-5 space-y-4">
        <label className="text-sm font-medium text-muted-foreground">Choose Your Plan Type</label>
        <Select value={planType} onValueChange={setPlanType}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {planTypes.map(p => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button onClick={generatePlan} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Dumbbell className="w-4 h-4 mr-2" />}
            {plan ? "Regenerate Plan" : "Generate Plan"}
          </Button>
          {plan && (
            <>
              <Button variant="outline" onClick={generatePlan} disabled={loading}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={deletePlan} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {plan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="prose prose-sm prose-invert max-w-none">
            <ReactMarkdown>{plan}</ReactMarkdown>
          </div>
        </motion.div>
      )}

      {!plan && !loading && (
        <div className="glass-card p-12 text-center">
          <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Choose a plan type and generate your personalized fitness plan!</p>
        </div>
      )}
    </div>
  );
}
