import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { languages } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function LanguageSelect() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState(i18n.language);

  const handleContinue = async () => {
    i18n.changeLanguage(selected);
    localStorage.setItem("biofit-language", selected);

    if (user) {
      await supabase.from("profiles").update({ language: selected }).eq("user_id", user.id);
    }

    navigate("/");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="glass-card p-8 w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
            <Globe className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Choose Your Language</h1>
          <p className="text-sm text-muted-foreground mt-1">Select your preferred language</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setSelected(lang.code)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                selected === lang.code
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                  : "border-border/50 bg-card hover:border-primary/30 hover:bg-muted/50"
              }`}
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium text-sm text-foreground">{lang.label}</span>
            </button>
          ))}
        </div>

        <Button onClick={handleContinue} className="w-full rounded-2xl h-12 font-bold uppercase tracking-wide">
          Continue
        </Button>
      </div>
    </div>
  );
}
