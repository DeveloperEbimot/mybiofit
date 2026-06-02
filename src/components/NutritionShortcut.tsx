import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Beef, Wheat, Droplets, Leaf, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Log {
  calories: number; protein: number; carbs: number; fat: number; fiber: number; logged_at: string;
}

const stats = [
  { key: "calories", label: "Calories", unit: "kcal", icon: Flame, color: "from-orange-500 to-amber-500" },
  { key: "protein", label: "Protein", unit: "g", icon: Beef, color: "from-emerald-500 to-teal-500" },
  { key: "carbs", label: "Carbs", unit: "g", icon: Wheat, color: "from-yellow-500 to-amber-500" },
  { key: "fat", label: "Fat", unit: "g", icon: Droplets, color: "from-rose-500 to-red-500" },
  { key: "fiber", label: "Fiber", unit: "g", icon: Leaf, color: "from-sky-500 to-blue-500" },
] as const;

export default function NutritionShortcut() {
  const { user } = useAuth();
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("nutrition_logs")
      .select("calories,protein,carbs,fat,fiber,logged_at")
      .eq("user_id", user.id)
      .eq("logged_at", today)
      .then(({ data }) => {
        const t = ((data as Log[]) || []).reduce(
          (a, l) => ({
            calories: a.calories + Number(l.calories || 0),
            protein: a.protein + Number(l.protein || 0),
            carbs: a.carbs + Number(l.carbs || 0),
            fat: a.fat + Number(l.fat || 0),
            fiber: a.fiber + Number(l.fiber || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
        );
        setTotals(t);
      });
  }, [user]);

  if (!user) return null;

  const go = (d: number) => {
    setDir(d);
    setIndex((i) => (i + d + stats.length) % stats.length);
  };

  const s = stats[index];
  const value = Math.round(totals[s.key]);

  // swipe handlers
  let startX = 0;
  const onTouchStart = (e: React.TouchEvent) => { startX = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };

  return (
    <section className="animate-fade-up" style={{ animationDelay: "0.06s" }}>
      <Link
        to="/stats"
        className="block relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur p-4"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Today's Nutrition</p>
          <div className="flex items-center gap-1">
            {stats.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === index ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative h-16 overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={s.key}
              custom={dir}
              initial={{ x: dir >= 0 ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: dir >= 0 ? -60 : 60, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex items-center gap-3"
            >
              <div className={`shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-display text-2xl font-extrabold leading-tight">
                  {value} <span className="text-sm font-semibold text-muted-foreground">{s.unit}</span>
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => { e.preventDefault(); go(-1); }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/60 hover:bg-background border border-border flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => { e.preventDefault(); go(1); }}
            className="absolute right-6 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-background/60 hover:bg-background border border-border flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </Link>
    </section>
  );
}