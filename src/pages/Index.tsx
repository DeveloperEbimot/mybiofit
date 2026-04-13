import { lazy, Suspense, useEffect, useState } from "react";
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
  Zap,
  Target,
  Trophy,
  TrendingUp,
  Timer,
  Activity,
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
  "Champions aren't made in gyms. Champions are made from something deep inside.",
  "Sweat is just fat crying.",
  "The pain you feel today will be the strength you feel tomorrow.",
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

const stats = [
  { icon: Trophy, label: "Meals Tracked", value: "10K+", color: "text-biofit-amber" },
  { icon: TrendingUp, label: "Goals Hit", value: "95%", color: "text-primary" },
  { icon: Timer, label: "Avg Scan Time", value: "3s", color: "text-biofit-blue" },
  { icon: Activity, label: "Active Users", value: "5K+", color: "text-biofit-purple" },
];

function AnimatedCounter({ target, suffix = "" }: { target: string; suffix?: string }) {
  return <span className="tabular-nums">{target}{suffix}</span>;
}

export default function Index() {
  const { profile, updateProfile } = useUserProfile();
  const { user } = useAuth();

  return (
    <div className="space-y-8 pb-8">
      <RatingPopup />

      {/* ─── Motivational Quote Banner ─── */}
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 p-5">
          {/* Sporty diagonal stripe accent */}
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rotate-45 rounded-lg" />
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rotate-45 rounded-lg" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse-glow">
              <Flame className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">🔥 Daily Fuel</p>
              <p className="text-sm font-medium text-foreground/90 italic leading-relaxed truncate">
                "{getQuote()}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Hero ─── */}
      <section className="relative text-center py-8 md:py-14 animate-fade-up overflow-hidden" style={{ animationDelay: "0.05s" }}>
        {/* Dynamic background elements */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/8 blur-[100px]" />
          <div className="absolute top-10 right-10 w-3 h-3 rounded-full bg-primary/30 animate-float" />
          <div className="absolute bottom-16 left-16 w-2 h-2 rounded-full bg-accent/40 animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute top-20 left-1/4 w-1.5 h-1.5 rounded-full bg-biofit-amber/30 animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6 text-xs font-bold uppercase tracking-widest text-primary">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Fitness
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-extrabold mb-4 leading-[1.1] tracking-tight">
            Train Smart.{" "}
            <br className="hidden md:block" />
            <span className="text-gradient">Eat Smarter.</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto mb-8 leading-relaxed">
            Your AI-powered coach for nutrition, fitness & wellness. Snap meals, crush goals, track progress.
          </p>

          {!user && (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Button asChild size="lg" className="text-base px-8 gap-2 rounded-2xl shadow-xl shadow-primary/25 h-13 font-bold uppercase tracking-wide">
                  <Link to="/scan">
                    <Camera className="w-5 h-5" />
                    Start Now
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="text-base px-8 gap-2 rounded-2xl h-13">
                  <Link to="/chat">
                    <Sparkles className="w-5 h-5" />
                    Talk to Coach
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Free forever · No credit card</p>
            </>
          )}
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="grid grid-cols-4 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="ios-card p-3 md:p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-1.5 ${s.color}`} />
              <p className="font-display font-extrabold text-lg md:text-xl text-foreground">
                <AnimatedCounter target={s.value} />
              </p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
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
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-border" />
          <h2 className="font-display text-2xl font-extrabold text-foreground text-center tracking-tight uppercase">
            Your Toolkit
          </h2>
          <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-border" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {features.map((f, i) => (
            <div
              key={f.to}
              className="animate-fade-up"
              style={{ animationDelay: `${0.06 * i}s` }}
            >
              <Link
                to={f.to}
                className="ios-card p-5 block group h-full relative overflow-hidden"
              >
                {/* Subtle sport stripe */}
                <div className={`absolute top-0 right-0 w-1 h-full bg-gradient-to-b ${f.gradient} opacity-40 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display font-bold text-foreground mb-1 text-sm uppercase tracking-wide">{f.label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1.5 transition-all mt-3" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <AdSense className="my-4" />

      {!user && (
        <section className="relative overflow-hidden rounded-2xl border border-primary/20 p-8 md:p-10 text-center animate-fade-up" style={{ animationDelay: "0.3s" }}>
          {/* Diagonal sport stripes */}
          <div className="absolute inset-0 opacity-[0.03]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="absolute h-full w-12 bg-foreground -skew-x-12" style={{ left: `${i * 80}px` }} />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          <div className="relative z-10">
            <Target className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse-glow rounded-full" />
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-3 tracking-tight uppercase">
              Ready to Crush It?
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm leading-relaxed">
              Join thousands of athletes eating smarter and training harder.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="text-base px-8 gap-2 rounded-2xl shadow-xl shadow-primary/25 h-13 font-bold uppercase tracking-wide">
                <Link to="/scan">
                  <Zap className="w-5 h-5" />
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
