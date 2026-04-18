import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/hooks/useAuth";

const DietGoalSelector = lazy(() => import("@/components/DietGoalSelector"));
const DailyTasks = lazy(() => import("@/components/DailyTasks"));

export default function Index() {
  const { profile, updateProfile } = useUserProfile();
  const { user } = useAuth();
  const { t } = useTranslation();

  const displayName =
    (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    (user?.user_metadata?.name as string | undefined)?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    t("home.friend");

  const quotes = t("quotes", { returnObjects: true }) as string[];
  const getQuote = () => {
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    return quotes[day % quotes.length];
  };

  const features = [
    { icon: Camera, label: t("features.scan_meal"), desc: t("features.scan_desc"), to: "/scan", gradient: "from-emerald-500 to-teal-500" },
    { icon: UtensilsCrossed, label: t("features.recipes"), desc: t("features.recipes_desc"), to: "/recipes", gradient: "from-amber-500 to-orange-500" },
    { icon: ShoppingCart, label: t("features.grocery_list"), desc: t("features.grocery_desc"), to: "/grocery", gradient: "from-blue-500 to-cyan-500" },
    { icon: Dumbbell, label: t("features.fitness_plan"), desc: t("features.fitness_desc"), to: "/fitness", gradient: "from-purple-500 to-violet-500" },
    { icon: Calculator, label: t("features.bmi_calculator"), desc: t("features.bmi_desc"), to: "/bmi", gradient: "from-rose-500 to-pink-500" },
    { icon: MessageCircle, label: t("features.ai_coach"), desc: t("features.ai_coach_desc"), to: "/chat", gradient: "from-primary to-accent" },
  ];

  return (
    <div className="space-y-8 pb-8">
      <RatingPopup />

      {/* ─── Motivational Quote Banner ─── */}
      <section className="animate-fade-up">
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 p-5">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/10 rotate-45 rounded-lg" />
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-primary/5 rotate-45 rounded-lg" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25 animate-pulse-glow">
              <Flame className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">{t("home.daily_fuel")}</p>
              <p className="text-sm font-medium text-foreground/90 italic leading-relaxed">
                "{getQuote()}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Hero ─── */}
      <section className="relative text-center py-8 md:py-14 animate-fade-up overflow-hidden" style={{ animationDelay: "0.05s" }}>
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-primary/8 blur-[100px]" />
          <div className="absolute top-0 left-[15%] w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent animate-line-move" />
          <div className="absolute top-0 left-[40%] w-px h-full bg-gradient-to-b from-transparent via-accent/15 to-transparent animate-line-move" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-0 left-[65%] w-px h-full bg-gradient-to-b from-transparent via-primary/15 to-transparent animate-line-move" style={{ animationDelay: "3s" }} />
          <div className="absolute top-0 left-[85%] w-px h-full bg-gradient-to-b from-transparent via-accent/20 to-transparent animate-line-move" style={{ animationDelay: "0.8s" }} />
          <div className="absolute top-[30%] left-0 h-px w-full bg-gradient-to-r from-transparent via-primary/15 to-transparent animate-line-sweep" />
          <div className="absolute top-[70%] left-0 h-px w-full bg-gradient-to-r from-transparent via-accent/10 to-transparent animate-line-sweep" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6 text-xs font-bold uppercase tracking-widest text-primary">
            <Zap className="w-3.5 h-3.5" />
            {t("home.ai_powered")}
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-extrabold mb-4 leading-[1.1] tracking-tight">
            {t("home.headline")}{" "}
            <br className="hidden md:block" />
            <span className="text-gradient">{t("home.headline2")}</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-lg max-w-lg mx-auto mb-8 leading-relaxed">
            {t("home.subtitle")}
          </p>

          {!user && (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                <Button asChild size="lg" className="text-base px-8 gap-2 rounded-2xl shadow-xl shadow-primary/25 h-13 font-bold uppercase tracking-wide">
                  <Link to="/scan">
                    <Camera className="w-5 h-5" />
                    {t("home.start_now")}
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="text-base px-8 gap-2 rounded-2xl h-13">
                  <Link to="/chat">
                    <Sparkles className="w-5 h-5" />
                    {t("home.talk_to_coach")}
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t("home.free_forever")}</p>
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
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-border" />
          <h2 className="font-display text-2xl font-extrabold text-foreground text-center tracking-tight uppercase">
            {t("home.your_toolkit")}
          </h2>
          <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-border" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {features.map((f, i) => (
            <div key={f.to} className="animate-fade-up" style={{ animationDelay: `${0.06 * i}s` }}>
              <Link to={f.to} className="ios-card p-5 block group h-full relative overflow-hidden">
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
          <div className="absolute inset-0 opacity-[0.03]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="absolute h-full w-12 bg-foreground -skew-x-12" style={{ left: `${i * 80}px` }} />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
          <div className="relative z-10">
            <Target className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse-glow rounded-full" />
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-3 tracking-tight uppercase">
              {t("home.ready")}
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6 text-sm leading-relaxed">
              {t("home.ready_desc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="text-base px-8 gap-2 rounded-2xl shadow-xl shadow-primary/25 h-13 font-bold uppercase tracking-wide">
                <Link to="/scan">
                  <Zap className="w-5 h-5" />
                  {t("home.get_started")}
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="text-base gap-2 rounded-2xl h-12">
                <Link to="/recipes">
                  {t("home.browse_recipes")}
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
            {t("home.contact_us")}
          </a>
        </Button>
        <p className="text-xs text-muted-foreground mt-2">biofit096@gmail.com</p>
      </section>
    </div>
  );
}
