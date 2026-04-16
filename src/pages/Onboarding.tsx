import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";

const dietaryRestrictions = [
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free",
  "Keto", "Halal", "Kosher", "Nut-Free",
];

export default function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const [age, setAge] = useState("25");
  const [weight, setWeight] = useState("70");
  const [height, setHeight] = useState("170");
  const [gender, setGender] = useState("male");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [dietGoal, setDietGoal] = useState("weight-loss");
  const [restrictions, setRestrictions] = useState<string[]>([]);

  const toggleRestriction = (r: string) => {
    setRestrictions((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const { error } = await supabase.from("profiles").update({
      name: user.user_metadata?.full_name || null,
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      gender,
      activity_level: activityLevel,
      diet_goal: dietGoal,
      restrictions,
    }).eq("user_id", user.id);

    if (error) {
      toast({ title: t("onboarding.error_saving"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("onboarding.profile_saved"), description: t("onboarding.welcome") });
      navigate("/");
    }
    setLoading(false);
  };

  const bmi = weight && height
    ? (parseFloat(weight) / ((parseFloat(height) / 100) ** 2)).toFixed(1)
    : null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="glass-card p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">{t("onboarding.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("onboarding.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="age">{t("onboarding.age")}</Label>
              <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} min={10} max={120} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">{t("onboarding.weight")}</Label>
              <Input id="weight" type="number" value={weight} onChange={(e) => setWeight(e.target.value)} min={20} max={300} step="0.1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">{t("onboarding.height")}</Label>
              <Input id="height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} min={100} max={250} step="0.1" required />
            </div>
          </div>

          {bmi && !isNaN(Number(bmi)) && (
            <div className="bg-secondary/50 rounded-lg p-3 text-center">
              <span className="text-xs text-muted-foreground">{t("onboarding.your_bmi")}</span>
              <p className="font-display text-xl font-bold text-foreground">{bmi}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label>{t("onboarding.gender")}</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{t("onboarding.male")}</SelectItem>
                <SelectItem value="female">{t("onboarding.female")}</SelectItem>
                <SelectItem value="other">{t("onboarding.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("onboarding.activity_level")}</Label>
            <Select value={activityLevel} onValueChange={setActivityLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sedentary">{t("onboarding.sedentary")}</SelectItem>
                <SelectItem value="light">{t("onboarding.light")}</SelectItem>
                <SelectItem value="moderate">{t("onboarding.moderate")}</SelectItem>
                <SelectItem value="active">{t("onboarding.active")}</SelectItem>
                <SelectItem value="extreme">{t("onboarding.extreme")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("onboarding.diet_goal")}</Label>
            <Select value={dietGoal} onValueChange={setDietGoal}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weight-loss">{t("onboarding.weight_loss")}</SelectItem>
                <SelectItem value="muscle-gain">{t("onboarding.muscle_gain")}</SelectItem>
                <SelectItem value="maintenance">{t("onboarding.maintenance")}</SelectItem>
                <SelectItem value="healthy-eating">{t("onboarding.healthy_eating")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>{t("onboarding.restrictions")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {dietaryRestrictions.map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={restrictions.includes(r)}
                    onCheckedChange={() => toggleRestriction(r)}
                  />
                  {r}
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("onboarding.saving") : t("onboarding.get_started")}
          </Button>
        </form>
      </div>
    </div>
  );
}
