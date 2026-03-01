import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Camera, UtensilsCrossed, ShoppingCart, Dumbbell, MessageCircle, Calculator, ArrowRight, Zap } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DailyTasks = lazy(() => import("@/components/DailyTasks"));

const features = [
  { icon: Camera, label: "Scan Meal", desc: "AI analyzes your food", to: "/scan", color: "text-biofit-glow" },
  { icon: UtensilsCrossed, label: "Recipes", desc: "Diet-friendly recipes", to: "/recipes", color: "text-biofit-amber" },
  { icon: ShoppingCart, label: "Grocery List", desc: "Smart shopping", to: "/grocery", color: "text-biofit-blue" },
  { icon: Dumbbell, label: "Fitness Plan", desc: "Monthly workouts", to: "/fitness", color: "text-biofit-purple" },
  { icon: Calculator, label: "BMI Calculator", desc: "Track your body", to: "/bmi", color: "text-biofit-red" },
  { icon: MessageCircle, label: "AI Chat", desc: "Voice & text chat", to: "/chat", color: "text-primary" },
];

const dietGoals = [
  { value: "weight-loss", label: "Weight Loss" },
  { value: "muscle-gain", label: "Muscle Gain" },
  { value: "maintenance", label: "Maintenance" },
  { value: "keto", label: "Keto" },
  { value: "vegan", label: "Vegan" },
  { value: "high-protein", label: "High Protein" },
  { value: "low-carb", label: "Low Carb" },
  { value: "mediterranean", label: "Mediterranean" },
];

export default function Index() {
  const { profile, updateProfile } = useUserProfile();

  return (
    <div className="space-y-8">
      {/* Hero - uses CSS animations to avoid blocking LCP */}
      <section className="text-center py-12 animate-fade-up">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center animate-scale-in">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
          Welcome to <span className="text-gradient">BioFit</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto mb-8">
          Your AI-powered nutrition & fitness companion. Scan meals, get recipes, build plans — all personalized to you.
        </p>

        {/* Diet Goal Selector */}
        <div className="glass-card p-6 max-w-sm mx-auto space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Your Diet Goal</label>
          <Select value={profile.dietGoal} onValueChange={(v) => updateProfile({ dietGoal: v })}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dietGoals.map(g => (
                <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Daily Tasks */}
      <Suspense fallback={<div className="glass-card p-6 animate-pulse h-40" />}>
        <DailyTasks />
      </Suspense>

      {/* Feature Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <div
            key={f.to}
            className="animate-fade-up"
            style={{ animationDelay: `${0.1 * i}s` }}
          >
            <Link
              to={f.to}
              className="glass-card p-5 block group hover:glow-border transition-all duration-300"
            >
              <f.icon className={`w-8 h-8 mb-3 ${f.color}`} />
              <h3 className="font-display font-semibold text-foreground mb-1">{f.label}</h3>
              <p className="text-xs text-muted-foreground mb-3">{f.desc}</p>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        ))}
      </section>
    </div>
  );
}
