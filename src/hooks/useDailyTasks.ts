import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface DailyTask {
  id: string;
  title: string;
  task_type: "exercise" | "meal" | "custom";
  completed: boolean;
  task_date: string;
}

const getTodayDate = () => new Date().toISOString().split("T")[0];

export function useDailyTasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) { setTasks([]); setLoading(false); return; }
    setLoading(true);
    const today = getTodayDate();

    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_date", today)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching daily tasks:", error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      setTasks(data as DailyTask[]);
      setLoading(false);
      return;
    }

    // Auto-generate tasks for today
    const autoTasks = await generateDailyTasks(user.id, today);
    setTasks(autoTasks);
    setLoading(false);
  }, [user]);

  const generateDailyTasks = async (userId: string, today: string): Promise<DailyTask[]> => {
    const defaultTasks: { title: string; task_type: "exercise" | "meal" | "custom" }[] = [];

    // Check for fitness plan
    const { data: plans } = await supabase
      .from("fitness_plans")
      .select("content, plan_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (plans && plans.length > 0) {
      defaultTasks.push({
        title: `Complete today's ${plans[0].plan_type} workout`,
        task_type: "exercise",
      });
    } else {
      defaultTasks.push({
        title: "Do 30 minutes of exercise",
        task_type: "exercise",
      });
    }

    // Meal reminders
    defaultTasks.push(
      { title: "Log breakfast", task_type: "meal" },
      { title: "Log lunch", task_type: "meal" },
      { title: "Log dinner", task_type: "meal" }
    );

    // Insert auto tasks
    const inserts = defaultTasks.map((t) => ({
      user_id: userId,
      title: t.title,
      task_type: t.task_type,
      completed: false,
      task_date: today,
    }));

    const { data: inserted, error } = await supabase
      .from("daily_tasks")
      .insert(inserts)
      .select();

    if (error) {
      console.error("Error generating daily tasks:", error);
      return [];
    }

    return (inserted as DailyTask[]) || [];
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const { error } = await supabase
      .from("daily_tasks")
      .update({ completed: !task.completed })
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const addCustomTask = async (title: string) => {
    if (!user || !title.trim()) return;
    const today = getTodayDate();

    const { data, error } = await supabase
      .from("daily_tasks")
      .insert({
        user_id: user.id,
        title: title.trim(),
        task_type: "custom",
        completed: false,
        task_date: today,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
      return;
    }

    if (data) setTasks((prev) => [...prev, data as DailyTask]);
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from("daily_tasks")
      .delete()
      .eq("id", taskId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const completeAll = async () => {
    if (!user) return;
    const pending = tasks.filter((t) => !t.completed);
    if (pending.length === 0) return;
    const ids = pending.map((t) => t.id);
    const { error } = await supabase
      .from("daily_tasks")
      .update({ completed: true })
      .in("id", ids);
    if (error) {
      toast({ title: "Error", description: "Failed to complete all tasks", variant: "destructive" });
      return;
    }
    setTasks((prev) => prev.map((t) => ({ ...t, completed: true })));
    toast({ title: "All tasks completed! 🎉" });
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return { tasks, loading, toggleTask, addCustomTask, deleteTask, completeAll, progress, completedCount };
}
