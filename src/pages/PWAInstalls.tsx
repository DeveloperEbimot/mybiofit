import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Smartphone, Monitor, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DailyCount {
  date: string;
  count: number;
}

export default function PWAInstalls() {
  const [total, setTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [weekCount, setWeekCount] = useState(0);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    setLoading(true);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalRes, todayRes, weekRes] = await Promise.all([
      supabase.from("pwa_installs").select("id", { count: "exact", head: true }),
      supabase.from("pwa_installs").select("id", { count: "exact", head: true }).gte("installed_at", todayStart),
      supabase.from("pwa_installs").select("id", { count: "exact", head: true }).gte("installed_at", weekAgo),
    ]);

    setTotal(totalRes.count ?? 0);
    setTodayCount(todayRes.count ?? 0);
    setWeekCount(weekRes.count ?? 0);

    // Fetch last 14 days for chart
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentInstalls } = await supabase
      .from("pwa_installs")
      .select("installed_at")
      .gte("installed_at", twoWeeksAgo)
      .order("installed_at", { ascending: true });

    if (recentInstalls) {
      const grouped: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const key = d.toISOString().split("T")[0];
        grouped[key] = 0;
      }
      recentInstalls.forEach((r) => {
        const key = new Date(r.installed_at).toISOString().split("T")[0];
        if (grouped[key] !== undefined) grouped[key]++;
      });
      setDailyCounts(Object.entries(grouped).map(([date, count]) => ({ date, count })));
    }

    setLoading(false);
  }

  const maxCount = Math.max(...dailyCounts.map((d) => d.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading stats...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">PWA Installs</h1>
        <p className="text-muted-foreground text-sm mt-1">Track how many users installed BioFit</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="glass-card border-0">
          <CardContent className="p-4 text-center">
            <Download className="w-6 h-6 text-primary mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-foreground">{total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="p-4 text-center">
            <Smartphone className="w-6 h-6 text-biofit-glow mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-foreground">{todayCount}</div>
            <div className="text-xs text-muted-foreground">Today</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-0">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-biofit-amber mx-auto mb-2" />
            <div className="font-display text-2xl font-bold text-foreground">{weekCount}</div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Simple Bar Chart */}
      <Card className="glass-card border-0">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-lg">Last 14 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {dailyCounts.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">
                  {d.count > 0 ? d.count : ""}
                </span>
                <div
                  className="w-full rounded-t bg-primary/80 transition-all min-h-[2px]"
                  style={{ height: `${(d.count / maxCount) * 100}%` }}
                />
                <span className="text-[9px] text-muted-foreground rotate-[-45deg] origin-top-left whitespace-nowrap">
                  {new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
