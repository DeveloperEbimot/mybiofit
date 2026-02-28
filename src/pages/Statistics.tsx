import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Plus, Trash2, TrendingUp, Flame, Beef, Wheat, Droplets, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

interface NutritionLog {
  id: string;
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  logged_at: string;
}

const MACRO_COLORS = [
  "hsl(145, 80%, 50%)",  // protein - primary green
  "hsl(45, 90%, 55%)",   // carbs - gold
  "hsl(0, 70%, 55%)",    // fat - red
  "hsl(200, 70%, 55%)",  // fiber - blue
];

export default function Statistics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    meal_name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    fiber: "",
  });

  useEffect(() => {
    if (user) fetchLogs();
    else {
      const saved = localStorage.getItem("biofit-nutrition-logs");
      setLogs(saved ? JSON.parse(saved) : []);
      setLoading(false);
    }
  }, [user]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("nutrition_logs")
      .select("*")
      .order("logged_at", { ascending: false })
      .limit(100);
    setLogs((data as NutritionLog[]) || []);
    setLoading(false);
  };

  const addLog = async () => {
    if (!form.meal_name || !form.calories) {
      toast({ title: "Please fill in meal name and calories", variant: "destructive" });
      return;
    }
    const entry: NutritionLog = {
      id: crypto.randomUUID(),
      meal_name: form.meal_name,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      carbs: Number(form.carbs) || 0,
      fat: Number(form.fat) || 0,
      fiber: Number(form.fiber) || 0,
      logged_at: new Date().toISOString().split("T")[0],
    };

    if (user) {
      const { error } = await supabase.from("nutrition_logs").insert({
        user_id: user.id,
        meal_name: entry.meal_name,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        fiber: entry.fiber,
      });
      if (error) {
        toast({ title: "Failed to save", variant: "destructive" });
        return;
      }
      fetchLogs();
    } else {
      const updated = [entry, ...logs];
      setLogs(updated);
      localStorage.setItem("biofit-nutrition-logs", JSON.stringify(updated));
    }

    setForm({ meal_name: "", calories: "", protein: "", carbs: "", fat: "", fiber: "" });
    setShowForm(false);
    toast({ title: "Meal logged!" });
  };

  const deleteLog = async (id: string) => {
    if (user) {
      await supabase.from("nutrition_logs").delete().eq("id", id);
      fetchLogs();
    } else {
      const updated = logs.filter((l) => l.id !== id);
      setLogs(updated);
      localStorage.setItem("biofit-nutrition-logs", JSON.stringify(updated));
    }
  };

  // Today's totals
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter((l) => l.logged_at === today);
  const totals = todayLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein: acc.protein + l.protein,
      carbs: acc.carbs + l.carbs,
      fat: acc.fat + l.fat,
      fiber: acc.fiber + l.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  // Last 7 days chart data
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const dayLogs = logs.filter((l) => l.logged_at === key);
    const dayTotal = dayLogs.reduce(
      (a, l) => ({
        calories: a.calories + l.calories,
        protein: a.protein + l.protein,
        carbs: a.carbs + l.carbs,
        fat: a.fat + l.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    return { day: d.toLocaleDateString("en", { weekday: "short" }), ...dayTotal };
  });

  // Pie data for today
  const pieData = [
    { name: "Protein", value: totals.protein, unit: "g" },
    { name: "Carbs", value: totals.carbs, unit: "g" },
    { name: "Fat", value: totals.fat, unit: "g" },
    { name: "Fiber", value: totals.fiber, unit: "g" },
  ].filter((d) => d.value > 0);

  const statCards = [
    { label: "Calories", value: totals.calories, unit: "kcal", icon: Flame, color: "text-orange-400" },
    { label: "Protein", value: totals.protein, unit: "g", icon: Beef, color: "text-primary" },
    { label: "Carbs", value: totals.carbs, unit: "g", icon: Wheat, color: "text-yellow-400" },
    { label: "Fat", value: totals.fat, unit: "g", icon: Droplets, color: "text-red-400" },
    { label: "Fiber", value: totals.fiber, unit: "g", icon: Leaf, color: "text-blue-400" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" /> Nutrition Stats
          </h1>
          <p className="text-muted-foreground mt-1">Track your daily macros and calories</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Log Meal
        </Button>
      </motion.div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2 md:col-span-3">
                  <Label>Meal Name</Label>
                  <Input value={form.meal_name} onChange={(e) => setForm({ ...form, meal_name: e.target.value })} placeholder="e.g. Grilled Chicken Salad" />
                </div>
                {(["calories", "protein", "carbs", "fat", "fiber"] as const).map((f) => (
                  <div key={f}>
                    <Label className="capitalize">{f} {f === "calories" ? "(kcal)" : "(g)"}</Label>
                    <Input type="number" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} placeholder="0" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Button onClick={addLog}>Save</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Today's Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="text-center">
              <CardContent className="pt-4 pb-3">
                <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
                <div className="text-2xl font-bold text-foreground">{Math.round(s.value)}</div>
                <div className="text-xs text-muted-foreground">{s.unit} {s.label}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> 7-Day Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="calories" fill="hsl(145, 80%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Macro Split</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}g`}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={MACRO_COLORS[i % MACRO_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground">Log a meal to see your macro split</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Meals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Meals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="text-muted-foreground">No meals logged yet. Tap "Log Meal" to get started!</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {logs.slice(0, 20).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <span className="font-medium text-foreground">{log.meal_name}</span>
                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                      <span>{log.calories} kcal</span>
                      <span>P: {log.protein}g</span>
                      <span>C: {log.carbs}g</span>
                      <span>F: {log.fat}g</span>
                      <span>{log.logged_at}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteLog(log.id)}>
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
