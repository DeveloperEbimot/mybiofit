import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import RatingPopup from "@/components/RatingPopup";
import AdSense from "@/components/AdSense";
import {
  Camera,
  UtensilsCrossed,
  ShoppingCart,
  Dumbbell,
  MessageCircle,
  Calculator,
  ArrowRight,
  Flame,
  Sparkles,
  Heart,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";

const DietGoalSelector = lazy(() => import("@/components/DietGoalSelector"));
const DailyTasks = lazy(() => import("@/components/DailyTasks"));

const motivationalQuotes = [
  "Your body can stand almost anything. It's your mind that you have to convince.",
  "The only bad workout is the one that didn't happen.",
  "Small daily improvements lead to stunning results.",
  "Don't stop until you're proud.",
  "Discipline is choosing between what you want now and what you want most.",
];

const getQuote = () => {
  const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return motivationalQuotes[day % motivationalQuotes.length];
};

const features = [
  { icon: Camera, label: "Scan Meal", desc: "AI-powered nutrition analysis from a photo", to: "/scan", gradient: "from-emerald-500 to-teal-500" },
  { icon: UtensilsCrossed, label: "Recipes", desc: "Recipes matched to your goals", to: "/recipes", gradient: "from-amber-500 to-orange-500" },
  { icon: ShoppingCart, label: "Grocery List", desc: "Smart shopping lists", to: "/grocery", gradient: "from-blue-500 to-cyan-500" },
  { icon: Dumbbell, label: "Fitness Plan", desc: "Workouts tailored to you", to: "/fitness", gradient: "from-purple-500 to-violet-500" },
  { icon: Calculator, label: "BMI Calculator", desc: "Track your body composition", to: "/bmi", gradient: "from-rose-500 to-pink-500" },
  { icon: MessageCircle, label: "AI Coach", desc: "Ask anything, anytime", to: "/chat", gradient: "from-primary to-accent" },
];

export default function Index() {
  const { profile, updateProfile } = useUserProfile();
  const { user } = useAuth();

  return (
    <div className="space-y-8 pb-8">
      <RatingPopup />

      {/* ─── Motivational Quote ─── */}
      <section className="animate-fade-up">
        <div className="ios-card p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          <div className="relative z-10">
            <Flame className="w-6 h-6 text-primary mx-auto mb-3" />
            <p className="text-sm md:text-base font-medium text-foreground/90 italic leading-relaxed max-w-md mx-auto">
              "{getQuote()}"
            </p>
            <p className="text-xs text-muted-foreground mt-2">Daily Motivation</p>
          </div>
        </div>
      </section>

      {/* ─── Hero ─── */}
      <section className="relative text-center py-10 md:py-16 animate-fade-up overflow-hidden" style={{ animationDelay: "0.05s" }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-primary/8 blur-[80px]" />
        </div>

        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-scale-in shadow-xl shadow-primary/20">
            <Heart className="w-9 h-9 text-primary-foreground" />
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
            Your Health,{" "}
            <span className="text-gradient">Reimagined</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto mb-8 leading-relaxed">
            Snap a meal, get instant insights. Personalized nutrition & fitness powered by AI.
          </p>

          {!user && (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Button asChild size="lg" className="text-base px-8 gap-2 rounded-2xl shadow-xl shadow-primary/25 h-12">
                  <Link to="/scan">
                    <Camera className="w-5 h-5" />
                    Scan Your First Meal
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="text-base px-8 gap-2 rounded-2xl h-12">
                  <Link to="/chat">
                    <Sparkles className="w-5 h-5" />
                    Talk to AI Coach
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Free to get started · No credit card needed</p>
            </>
          )}
        </div>
      </section>

      {/* ─── Diet Goal Selector ─── */}
      <Suspense fallback={<div className="ios-card p-6 max-w-sm mx-auto h-24 animate-pulse" />}>
        <DietGoalSelector value={profile.dietGoal} onChange={(v) => updateProfile({ dietGoal: v })} />
      </Suspense>

      {/* ─── Daily Tasks ─── */}
      <Suspense fallback={<div className="ios-card p-6 animate-pulse h-40" />}>
        <DailyTasks />
      </Suspense>

      <AdSense className="my-4" />

      {/* ─── Feature Grid ─── */}
      <section>
        <h2 className="font-display text-2xl font-bold text-foreground mb-5 text-center tracking-tight">
          Everything You Need
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {features.map((f, i) => (
            <div
              key={f.to}
              className="animate-fade-up"
              style={{ animationDelay: `${0.08 * i}s` }}
            >
              <Link
                to={f.to}
                className="ios-card p-5 block group h-full"
              >
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-1 text-sm">{f.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all mt-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <AdSense className="my-4" />

      {!user && (
        <section className="ios-card p-8 md:p-10 text-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <Target className="w-10 h-10 text-primary mx-auto mb-4" />
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Ready to Transform?
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm leading-relaxed">
            Join thousands who are already eating smarter and living healthier.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="text-base px-8 gap-2 rounded-2xl shadow-xl shadow-primary/25 h-12">
              <Link to="/scan">
                <Camera className="w-5 h-5" />
                Get Started
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-base gap-2 rounded-2xl h-12">
              <Link to="/recipes">
                Browse Recipes
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <section className="text-center py-6 animate-fade-up" style={{ animationDelay: "0.4s" }}>
        <Button asChild variant="outline" size="lg" className="text-base gap-2 rounded-2xl">
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
