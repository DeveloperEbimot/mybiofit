import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Play, Pause, SkipForward, RotateCcw, Check, ArrowLeft, Trophy, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MUSCLE_GROUPS, buildWorkout, type MuscleGroup, type Exercise } from "@/lib/exercises";
import { toast } from "sonner";

type Phase = "select" | "ready" | "exercise" | "rest" | "done";

export default function FitnessPlan() {
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [workout, setWorkout] = useState<Exercise[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("select");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const current = workout[index];
  const next = workout[index + 1];

  // Beep helper
  const beep = (freq = 880, duration = 120) => {
    if (muted) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.start();
      osc.stop(ctx.currentTime + duration / 1000);
    } catch {}
  };

  // Timer
  useEffect(() => {
    if (paused) return;
    if (phase !== "exercise" && phase !== "rest" && phase !== "ready") return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          // transition
          if (phase === "ready") {
            setPhase("exercise");
            beep(1200, 200);
            return current?.duration ?? 30;
          }
          if (phase === "exercise") {
            beep(440, 300);
            if (index >= workout.length - 1) {
              setPhase("done");
              return 0;
            }
            setPhase("rest");
            return current?.rest ?? 15;
          }
          if (phase === "rest") {
            beep(1200, 200);
            setIndex((i) => i + 1);
            setPhase("exercise");
            return workout[index + 1]?.duration ?? 30;
          }
        }
        if (s <= 4 && s > 1 && (phase === "exercise" || phase === "rest")) beep(660, 80);
        return s - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, index]);

  const startWorkout = (m: MuscleGroup) => {
    const w = buildWorkout(m);
    setMuscle(m);
    setWorkout(w);
    setIndex(0);
    setPhase("ready");
    setSecondsLeft(5);
    setPaused(false);
    toast.success(`${MUSCLE_GROUPS.find((g) => g.id === m)?.label} workout loaded!`);
  };

  const skip = () => {
    if (phase === "exercise") {
      if (index >= workout.length - 1) {
        setPhase("done");
        return;
      }
      setPhase("rest");
      setSecondsLeft(current?.rest ?? 15);
    } else if (phase === "rest") {
      setIndex((i) => i + 1);
      setPhase("exercise");
      setSecondsLeft(workout[index + 1]?.duration ?? 30);
    } else if (phase === "ready") {
      setPhase("exercise");
      setSecondsLeft(current?.duration ?? 30);
    }
  };

  const reset = () => {
    setPhase("select");
    setMuscle(null);
    setIndex(0);
    setWorkout([]);
    setPaused(false);
  };

  const totalDuration = workout.reduce((sum, e) => sum + e.duration + e.rest, 0);
  const elapsed =
    workout.slice(0, index).reduce((sum, e) => sum + e.duration + e.rest, 0) +
    (current
      ? phase === "exercise"
        ? current.duration - secondsLeft
        : phase === "rest"
        ? current.duration + (current.rest - secondsLeft)
        : 0
      : 0);
  const overallProgress = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  // ─── Selection screen ───
  if (phase === "select") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-2 flex items-center gap-3 uppercase tracking-tight">
            <Dumbbell className="w-8 h-8 text-primary" /> Hit Your Focus Areas
          </h1>
          <p className="text-muted-foreground">Pick a muscle group and start a guided workout with a built-in timer.</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {MUSCLE_GROUPS.map((g, i) => (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => startWorkout(g.id)}
              className={`relative aspect-square rounded-2xl bg-gradient-to-br ${g.gradient} p-5 text-left overflow-hidden group shadow-xl`}
            >
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              <div className="absolute -bottom-4 -right-4 text-8xl md:text-9xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500">
                {g.emoji}
              </div>
              <div className="relative z-10 flex flex-col h-full justify-end">
                <p className="font-display text-xl md:text-2xl font-extrabold text-white uppercase tracking-tight drop-shadow-lg">
                  {g.label}
                </p>
                <p className="text-white/80 text-xs mt-1">Tap to start</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Done screen ───
  if (phase === "done") {
    return (
      <div className="max-w-md mx-auto text-center py-10 space-y-6">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
            <Trophy className="w-12 h-12 text-primary-foreground" />
          </div>
        </motion.div>
        <h2 className="font-display text-3xl font-extrabold uppercase">Workout Complete! 🔥</h2>
        <p className="text-muted-foreground">
          You crushed {workout.length} exercises. Recovery time — hydrate and stretch.
        </p>
        <div className="flex gap-2 justify-center">
          <Button onClick={reset} size="lg" className="rounded-2xl">
            <RotateCcw className="w-4 h-4 mr-2" /> New Workout
          </Button>
          <Button onClick={() => muscle && startWorkout(muscle)} variant="outline" size="lg" className="rounded-2xl">
            Repeat
          </Button>
        </div>
      </div>
    );
  }

  // ─── Active workout ───
  if (!current) return null;

  const isResting = phase === "rest";
  const isReady = phase === "ready";
  const phaseDuration = isReady ? 5 : isResting ? current.rest : current.duration;
  const phaseProgress = ((phaseDuration - secondsLeft) / phaseDuration) * 100;

  return (
    <div className="max-w-2xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={reset} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Exit
        </Button>
        <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {MUSCLE_GROUPS.find((g) => g.id === muscle)?.label} • {index + 1}/{workout.length}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setMuted((m) => !m)} aria-label="Toggle sound">
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>

      <Progress value={overallProgress} className="h-1.5 mb-6" />

      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${phase}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border-2 border-primary/20">
            <CardContent className="p-0">
              {/* Phase banner */}
              <div className={`px-5 py-2 text-center text-xs font-bold uppercase tracking-widest ${
                isReady ? "bg-amber-500/15 text-amber-500" :
                isResting ? "bg-blue-500/15 text-blue-500" :
                "bg-primary/15 text-primary"
              }`}>
                {isReady ? "Get Ready" : isResting ? "Rest" : "Go!"}
              </div>

              {/* Exercise illustration */}
              <div className="bg-gradient-to-br from-secondary/50 to-background aspect-square max-h-[320px] flex items-center justify-center relative overflow-hidden">
                {!isResting && current.gifUrl ? (
                  <img
                    src={current.gifUrl}
                    alt={current.name}
                    className="w-full h-full object-contain p-4"
                    onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                  />
                ) : null}
                <motion.div
                  animate={isResting ? { scale: [1, 1.1, 1] } : { rotate: [0, -5, 5, 0] }}
                  transition={{ duration: isResting ? 2 : 1.5, repeat: Infinity }}
                  className="absolute text-9xl"
                  style={{ display: !isResting && current.gifUrl ? "none" : "block" }}
                >
                  {isResting ? "💧" : current.emoji}
                </motion.div>
              </div>

              {/* Timer + name */}
              <div className="p-6 text-center space-y-3">
                <p className="font-display text-5xl font-extrabold tabular-nums tracking-tight">
                  {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
                </p>
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                  {isResting ? "Rest" : isReady ? `Up Next: ${current.name}` : current.name}
                </h2>
                <Progress value={phaseProgress} className="h-2" />
              </div>

              {/* Controls */}
              <div className="flex gap-2 px-6 pb-6">
                <Button
                  onClick={() => setPaused((p) => !p)}
                  size="lg"
                  className="flex-1 rounded-2xl gap-2 h-13"
                >
                  {paused ? <><Play className="w-5 h-5" /> Resume</> : <><Pause className="w-5 h-5" /> Pause</>}
                </Button>
                <Button onClick={skip} variant="outline" size="lg" className="rounded-2xl gap-2 h-13">
                  <SkipForward className="w-5 h-5" /> Skip
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Instructions */}
      {!isResting && !isReady && (
        <Card className="mt-4">
          <CardContent className="p-5">
            <p className="font-display font-bold text-sm uppercase tracking-widest text-muted-foreground mb-3">
              How to do it
            </p>
            <ol className="space-y-2">
              {current.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-foreground/90 leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Next exercise preview (carousel-style row) */}
      <div className="mt-4">
        <p className="font-display font-bold text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">
          Up Next
        </p>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
          {workout.slice(index + 1, index + 5).map((ex) => (
            <div
              key={ex.id}
              className="shrink-0 w-32 bg-card rounded-2xl border border-border p-3 snap-start"
            >
              <div className="aspect-square bg-secondary/50 rounded-xl flex items-center justify-center text-4xl mb-2">
                {ex.emoji}
              </div>
              <p className="text-xs font-bold leading-tight line-clamp-2">{ex.name}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{ex.duration}s</p>
            </div>
          ))}
          {workout.slice(index + 1).length === 0 && (
            <div className="shrink-0 w-full text-center py-4 text-muted-foreground text-sm flex items-center justify-center gap-2">
              <Check className="w-4 h-4 text-primary" /> Last exercise!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}