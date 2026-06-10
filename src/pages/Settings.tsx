import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Sun, Moon, Globe, LogOut, Save, User as UserIcon, Loader2, AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { PRESET_AVATARS, getInitial } from "@/lib/avatars";
import { toast } from "sonner";

export default function Settings() {
  const { user, signOut, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/signin"); return; }

    supabase.from("profiles").select("name, avatar").eq("user_id", user.id).single()
      .then(({ data }) => {
        setName(data?.name || (user.user_metadata?.full_name as string) || "");
        setAvatar(data?.avatar || "");
        setLoaded(true);
      });
  }, [user, loading, navigate]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: name.trim() || null,
      avatar: avatar || null,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Couldn't save settings");
    else toast.success("Settings saved!");
  };

  const reportUrl = `mailto:biofit096@gmail.com?subject=${encodeURIComponent("BioFit Problem Report")}&body=${encodeURIComponent("Hi BioFit team,\n\nI encountered the following problem:\n\n")}`;

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const displayInitial = getInitial(name, user?.email);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" /> Settings
        </h1>
        <p className="text-muted-foreground">Manage your profile and preferences.</p>
      </motion.div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserIcon className="w-5 h-5 text-primary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/30">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-2xl">
                {avatar || displayInitial}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <p className="font-medium text-sm break-all">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={40}
            />
          </div>

          <div className="space-y-2">
            <Label>Choose an avatar</Label>
            <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
              <button
                type="button"
                onClick={() => setAvatar("")}
                className={`aspect-square rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-all ${
                  !avatar ? "border-primary bg-primary/10 scale-105" : "border-border hover:border-primary/50"
                }`}
                aria-label="No avatar"
              >
                {displayInitial}
              </button>
              {PRESET_AVATARS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`aspect-square rounded-xl border-2 flex items-center justify-center text-2xl transition-all ${
                    avatar === emoji ? "border-primary bg-primary/10 scale-105" : "border-border hover:border-primary/50"
                  }`}
                  aria-label={`Avatar ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={save} disabled={saving} className="w-full gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
              <div>
                <p className="font-medium text-sm">Theme</p>
                <p className="text-xs text-muted-foreground capitalize">{theme} mode</p>
              </div>
            </div>
            <Button variant="outline" onClick={toggleTheme} className="gap-2">
              Switch to {theme === "dark" ? "light" : "dark"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Language</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => navigate("/language")} className="gap-2 w-full">
            <Globe className="w-4 h-4" /> {t("language.change")}
          </Button>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={signOut} className="gap-2 w-full">
            <LogOut className="w-4 h-4" /> {t("auth.sign_out")}
          </Button>
        </CardContent>
      </Card>

      {/* Report a problem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-primary" /> Report a problem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Found a bug or have feedback? Send us an email and we’ll get back to you.
          </p>
          <a href={reportUrl} className="block">
            <Button className="w-full gap-2">
              <Mail className="w-4 h-4" />
              Send email to support
            </Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}