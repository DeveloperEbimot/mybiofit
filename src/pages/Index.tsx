import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import RatingPopup from "@/components/RatingPopup";
import {
  Camera,
  UtensilsCrossed,
  ShoppingCart,
  Dumbbell,
  MessageCircle,
  Calculator,
  ArrowRight,
  Zap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";

const DietGoalSelector = lazy(() => import("@/components/DietGoalSelector"));
const DailyTasks = lazy(() => import("@/components/DailyTasks"));

const features = [
  { icon: Camera, label: "Scan Meal", desc: "Snap a photo — AI breaks down calories, macros & more instantly", to: "/scan", color: "text-biofit-glow" },
  { icon: UtensilsCrossed, label: "Recipes", desc: "Personalized recipes matched to your diet goal", to: "/recipes", color: "text-biofit-amber" },
  { icon: ShoppingCart, label: "Grocery List", desc: "Auto-generate shopping lists from your meal plans", to: "/grocery", color: "text-biofit-blue" },
  { icon: Dumbbell, label: "Fitness Plan", desc: "Monthly workout routines tailored to you", to: "/fitness", color: "text-biofit-purple" },
  { icon: Calculator, label: "BMI Calculator", desc: "Track body composition over time", to: "/bmi", color: "text-biofit-red" },
  { icon: MessageCircle, label: "AI Chat", desc: "Ask anything about nutrition & fitness", to: "/chat", color: "text-primary" },
];

export default function Index() {
  const { profile, updateProfile } = useUserProfile();
  const { user } = useAuth();

  return (
    <div className="space-y-10">
      <RatingPopup />
      <section className="relative text-center py-14 md:py-20 animate-fade-up overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full bg-primary/10 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center animate-scale-in">
            <Zap className="w-10 h-10 text-primary" />
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Eat Smarter with <span className="text-gradient">BioFit</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto mb-8">
            Snap a photo of any meal and get instant AI-powered nutrition analysis, personalized recipes & fitness plans.
          </p>

          {!user && (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Button asChild size="lg" className="text-base px-8 gap-2 shadow-lg shadow-primary/25">
                  <Link to="/scan">
                    <Camera className="w-5 h-5" />
                    Scan Your First Meal
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8 gap-2">
                  <Link to="/chat">
                    <Sparkles className="w-5 h-5" />
                    Talk to AI Coach
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">No credit card required · Free to get started</p>
            </>
          )}
        </div>
      </section>

      {/* ─── Diet Goal Selector ─── */}
      <Suspense fallback={<div className="glass-card p-6 max-w-sm mx-auto h-24 animate-pulse" />}>
        <DietGoalSelector value={profile.dietGoal} onChange={(v) => updateProfile({ dietGoal: v })} />
      </Suspense>

      {/* ─── Daily Tasks ─── */}
      <Suspense fallback={<div className="glass-card p-6 animate-pulse h-40" />}>
        <DailyTasks />
      </Suspense>

      {/* ─── Feature Grid ─── */}
      <section>
        <h2 className="font-display text-2xl font-bold text-foreground mb-5 text-center">
          Everything You Need
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={f.to}
              className="animate-fade-up"
              style={{ animationDelay: `${0.1 * i}s` }}
            >
              <Link
                to={f.to}
                className="glass-card p-5 block group hover:glow-border transition-all duration-300 h-full"
              >
                <f.icon className={`w-8 h-8 mb-3 ${f.color}`} />
                <h3 className="font-display font-semibold text-foreground mb-1">{f.label}</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{f.desc}</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {!user && (
        <section className="glass-card p-8 md:p-12 text-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
            Ready to Transform Your Diet?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Start by scanning a meal or chatting with our AI coach. It takes less than 30 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="text-base px-8 gap-2 shadow-lg shadow-primary/25">
              <Link to="/scan">
                <Camera className="w-5 h-5" />
                Get Started Now
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-base gap-2">
              <Link to="/recipes">
                Browse Recipes
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* ─── Contact Us ─── */}
      <section className="text-center py-6 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <Button asChild variant="outline" size="lg" className="text-base gap-2">
          <a href="mailto:biofit096@gmail.com">
            <MessageCircle className="w-5 h-5" />
            Contact Us
          </a>
        </Button>
        <p className="text-xs text-muted-foreground mt-2">biofit096@gmail.com</p>
      </section>
    </div>
  );
}
