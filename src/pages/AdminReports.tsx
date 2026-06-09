import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Loader2, Check, Trash2, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Report {
  id: string;
  user_id: string;
  description: string;
  email: string | null;
  status: string;
  created_at: string;
}

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("problem_reports")
      .select("id, user_id, description, email, status, created_at")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast.error("Couldn't load reports");
      return;
    }
    setReports((data ?? []) as Report[]);
  };

  useEffect(() => { load(); }, []);

  const markResolved = async (id: string) => {
    const { error } = await supabase
      .from("problem_reports")
      .update({ status: "resolved" })
      .eq("id", id);
    if (error) return toast.error("Couldn't update");
    setReports((r) => r.map((x) => (x.id === id ? { ...x, status: "resolved" } : x)));
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this report?")) return;
    const { error } = await supabase.from("problem_reports").delete().eq("id", id);
    if (error) return toast.error("Couldn't delete");
    setReports((r) => r.filter((x) => x.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-primary" /> Problem Reports
        </h1>
        <p className="text-muted-foreground">Issues submitted by users from Settings.</p>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : reports.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No reports yet.</CardContent></Card>
      ) : (
        reports.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(r.created_at).toLocaleString()}</span>
                  <Badge variant={r.status === "resolved" ? "secondary" : "default"}>{r.status}</Badge>
                </div>
                <div className="flex gap-2">
                  {r.status !== "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => markResolved(r.id)} className="gap-1">
                      <Check className="w-4 h-4" /> Resolve
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(r.id)} className="gap-1 text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm">{r.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="w-3.5 h-3.5" />
                <span className="break-all">{r.email ?? r.user_id}</span>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}