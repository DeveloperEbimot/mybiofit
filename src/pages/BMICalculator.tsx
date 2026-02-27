import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function BMICalculator() {
  const { profile, updateProfile } = useUserProfile();
  const [weight, setWeight] = useState(profile.weight.toString());
  const [height, setHeight] = useState(profile.height.toString());
  const [age, setAge] = useState(profile.age.toString());
  const [gender, setGender] = useState(profile.gender);
  const [result, setResult] = useState<{ bmi: number; category: string; color: string } | null>(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (!w || !h) return;

    const bmi = w / (h * h);
    let category = "", color = "";

    if (bmi < 18.5) { category = "Underweight"; color = "text-biofit-blue"; }
    else if (bmi < 25) { category = "Normal"; color = "text-primary"; }
    else if (bmi < 30) { category = "Overweight"; color = "text-biofit-amber"; }
    else { category = "Obese"; color = "text-destructive"; }

    setResult({ bmi: Math.round(bmi * 10) / 10, category, color });
    updateProfile({ weight: w, height: parseFloat(height), age: parseInt(age), gender });
  };

  const Icon = result ? (result.bmi < 18.5 ? TrendingDown : result.bmi >= 25 ? TrendingUp : Minus) : Calculator;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2">BMI Calculator</h1>
        <p className="text-muted-foreground">Calculate your Body Mass Index and update your profile.</p>
      </motion.div>

      <div className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Weight (kg)</label>
            <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Height (cm)</label>
            <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Age</label>
            <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Gender</label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={calculate} className="w-full">Calculate BMI</Button>
      </div>

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center glow-border">
          <Icon className={`w-12 h-12 mx-auto mb-4 ${result.color}`} />
          <p className="text-5xl font-display font-bold mb-2">{result.bmi}</p>
          <p className={`text-xl font-semibold ${result.color}`}>{result.category}</p>
          <div className="mt-6 w-full h-3 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-biofit-blue via-primary via-biofit-amber to-destructive"
              style={{ width: `${Math.min((result.bmi / 40) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Underweight</span><span>Normal</span><span>Overweight</span><span>Obese</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
