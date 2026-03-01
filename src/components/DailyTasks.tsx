import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Trash2, Dumbbell, UtensilsCrossed, ListTodo, Loader2 } from "lucide-react";
import { useDailyTasks, DailyTask } from "@/hooks/useDailyTasks";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const taskIcons: Record<string, typeof Dumbbell> = {
  exercise: Dumbbell,
  meal: UtensilsCrossed,
  custom: ListTodo,
};

const taskColors: Record<string, string> = {
  exercise: "text-biofit-purple",
  meal: "text-biofit-amber",
  custom: "text-primary",
};

export default function DailyTasks() {
  const { user } = useAuth();
  const { tasks, loading, toggleTask, addCustomTask, deleteTask, progress, completedCount } = useDailyTasks();
  const [newTask, setNewTask] = useState("");

  if (!user) return null;

  const handleAdd = () => {
    if (!newTask.trim()) return;
    addCustomTask(newTask);
    setNewTask("");
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Today's Tasks</h2>
          <p className="text-xs text-muted-foreground">
            {completedCount}/{tasks.length} completed
          </p>
        </div>
        <div className="w-24">
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {tasks.map((task) => {
              const Icon = taskIcons[task.task_type] || ListTodo;
              const color = taskColors[task.task_type] || "text-primary";

              return (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    task.completed
                      ? "bg-primary/5 opacity-60"
                      : "bg-secondary/50 hover:bg-secondary"
                  }`}
                >
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      task.completed
                        ? "bg-primary border-primary"
                        : "border-muted-foreground/40 hover:border-primary"
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                  </button>

                  <Icon className={`w-4 h-4 shrink-0 ${color}`} />

                  <span
                    className={`text-sm flex-1 ${
                      task.completed
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </span>

                  {task.task_type === "custom" && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {/* Add custom task */}
      <div className="flex gap-2 pt-2">
        <Input
          placeholder="Add a custom task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="bg-secondary border-border text-sm"
        />
        <Button size="icon" variant="outline" onClick={handleAdd} disabled={!newTask.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </motion.section>
  );
}
