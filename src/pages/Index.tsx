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
  TrendingUp,
  Users,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";

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

      {/* ─── Bottom CTA ─── */}
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
