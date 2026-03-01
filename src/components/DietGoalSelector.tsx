import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const dietGoals = [
  { value: "weight-loss", label: "Weight Loss" },
  { value: "muscle-gain", label: "Muscle Gain" },
  { value: "maintenance", label: "Maintenance" },
  { value: "keto", label: "Keto" },
  { value: "vegan", label: "Vegan" },
  { value: "high-protein", label: "High Protein" },
  { value: "low-carb", label: "Low Carb" },
  { value: "mediterranean", label: "Mediterranean" },
];

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export default function DietGoalSelector({ value, onChange }: Props) {
  return (
    <div className="glass-card p-6 max-w-sm mx-auto space-y-3">
      <label className="text-sm font-medium text-muted-foreground">Your Diet Goal</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-secondary border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dietGoals.map(g => (
            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
