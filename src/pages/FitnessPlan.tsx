import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Dumbbell, Loader2, RefreshCw, Trash2, ChevronDown, ChevronRight, Calendar, Target, AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

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
  const { user } = useAuth();
  const [planType, setPlanType] = useState(profile.dietGoal === "muscle-gain" ? "muscle-gain" : "weight-loss");
  const [plan, setPlan] = useState("");
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({ 0: true });

  useEffect(() => {
    if (user) {
      supabase.from("fitness_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            setPlan(data[0].content);
            setPlanType(data[0].plan_type);
            setPlanId(data[0].id);
          }
        });
    } else {
      const saved = localStorage.getItem("biofit-fitness-plan");
      if (saved) setPlan(saved);
    }
  }, [user]);

  const generatePlan = async () => {
    setLoading(true);
    setPlan("");
    setExpandedWeeks({ 0: true });

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

Structure your response EXACTLY like this using markdown:

# 🏋️ [Plan Title]

Brief overview paragraph.

## Week 1: [Week Theme]

### Day 1: [Muscle Group / Focus]
**Warm-up (5-10 min)**
- Exercise 1

**Main Workout**

#### 1. [Exercise Name]
- **Sets × Reps:** 3 × 12
- **How to do it:** Step by step numbered instructions
- **Common mistakes:** What to avoid
- **Beginner modification:** Easier alternative

#### 2. [Exercise Name]
...repeat format

**Cool-down (5-10 min)**
- Stretches

### Day 2: [Focus]
...

### Rest Day
...

## Week 2: [Week Theme]
...continue same format with progressive difficulty

## Week 3: [Week Theme]
...

## Week 4: [Week Theme]
...

## 💡 Tips & Notes
- Recovery advice
- Nutrition tips

Use this exact formatting. Keep exercises clear and well-structured.`
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

      if (user) {
        if (planId) await supabase.from("fitness_plans").delete().eq("id", planId);
        const { data } = await supabase.from("fitness_plans").insert({ user_id: user.id, plan_type: planType, content: result }).select().single();
        if (data) setPlanId(data.id);
        toast.success("Fitness plan saved!");
      } else {
        localStorage.setItem("biofit-fitness-plan", result);
      }
    } catch (e) {
      setPlan("Error generating plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async () => {
    setPlan("");
    setPlanId(null);
    localStorage.removeItem("biofit-fitness-plan");
    if (user && planId) {
      await supabase.from("fitness_plans").delete().eq("id", planId);
      toast.success("Plan deleted");
    }
  };

  const toggleWeek = (i: number) => {
    setExpandedWeeks(prev => ({ ...prev, [i]: !prev[i] }));
  };

  // Split plan into sections by ## headers (weeks)
  const renderStructuredPlan = () => {
    if (!plan) return null;

    const sections = plan.split(/(?=^## )/m);
    const intro = sections[0]; // Content before first ## (title + overview)
    const weekSections = sections.slice(1);

    return (
      <div className="space-y-4">
        {/* Plan Title & Overview */}
        {intro && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="prose prose-sm prose-invert max-w-none mb-6 [&>h1]:text-2xl [&>h1]:font-display [&>h1]:text-primary [&>h1]:mb-3 [&>p]:text-muted-foreground">
              <ReactMarkdown>{intro}</ReactMarkdown>
            </div>
          </motion.div>
        )}

        {/* Week Cards */}
        {weekSections.map((section, i) => {
          const titleMatch = section.match(/^## (.+)/m);
          const title = titleMatch ? titleMatch[1] : `Section ${i + 1}`;
          const content = section.replace(/^## .+\n/, "");
          const isWeek = title.toLowerCase().includes("week");
          const isTips = title.toLowerCase().includes("tip") || title.toLowerCase().includes("note");
          const isExpanded = expandedWeeks[i] ?? false;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-secondary/50 transition-colors py-4"
                  onClick={() => toggleWeek(i)}
                >
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      {isTips ? (
                        <Lightbulb className="w-5 h-5 text-accent-foreground" />
                      ) : isWeek ? (
                        <Calendar className="w-5 h-5 text-primary" />
                      ) : (
                        <Target className="w-5 h-5 text-primary" />
                      )}
                      {title}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="pt-0 pb-5">
                    <div className="prose prose-sm prose-invert max-w-none
                      [&>h3]:text-primary [&>h3]:font-display [&>h3]:text-base [&>h3]:mt-5 [&>h3]:mb-2 [&>h3]:pb-2 [&>h3]:border-b [&>h3]:border-border/50
                      [&>h4]:text-foreground [&>h4]:font-semibold [&>h4]:text-sm [&>h4]:mt-4 [&>h4]:mb-1
                      [&>p]:text-muted-foreground [&>p]:text-sm [&>p]:leading-relaxed
                      [&>ul]:text-muted-foreground [&>ul]:text-sm [&>ul]:space-y-1
                      [&_strong]:text-foreground
                      [&>hr]:border-border/30 [&>hr]:my-4
                    ">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
          <Dumbbell className="w-8 h-8 text-primary" /> Fitness Plan
        </h1>
        <p className="text-muted-foreground">Get a personalized monthly workout plan with step-by-step exercise guides.</p>
      </motion.div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <label className="text-sm font-medium text-muted-foreground">Choose Your Plan Type</label>
          <Select value={planType} onValueChange={setPlanType}>
            <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
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
                <Button variant="outline" onClick={generatePlan} disabled={loading} size="icon"><RefreshCw className="w-4 h-4" /></Button>
                <Button variant="outline" onClick={deletePlan} size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {plan && renderStructuredPlan()}

      {!plan && !loading && (
        <Card className="p-12 text-center">
          <Dumbbell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Choose a plan type and generate your personalized fitness plan!</p>
          {!user && <p className="text-xs text-muted-foreground mt-2">Sign in to save your plans!</p>}
        </Card>
      )}
    </div>
  );
}
