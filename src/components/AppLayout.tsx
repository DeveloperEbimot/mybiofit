import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Camera, UtensilsCrossed, ShoppingCart, Dumbbell, MessageCircle, Calculator, BarChart3, LogIn, LogOut, Menu, X, Sun, Moon, Globe, Settings as SettingsIcon, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { languages } from "@/i18n";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatar, setAvatar] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("");

  const navItems = [
    { to: "/", icon: Home, label: t("nav.home") },
    { to: "/scan", icon: Camera, label: t("nav.scan") },
    { to: "/recipes", icon: UtensilsCrossed, label: t("nav.recipes") },
    { to: "/grocery", icon: ShoppingCart, label: t("nav.grocery") },
    { to: "/fitness", icon: Dumbbell, label: t("nav.fitness") },
    { to: "/bmi", icon: Calculator, label: t("nav.bmi") },
    { to: "/chat", icon: MessageCircle, label: t("nav.chat") },
    { to: "/stats", icon: BarChart3, label: t("nav.stats") },
  ];

  // Redirect to language select on first visit
  useEffect(() => {
    const hasLang = localStorage.getItem("biofit-language");
    const langPages = ["/language"];
    if (!hasLang && !langPages.includes(location.pathname)) {
      navigate("/language");
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user || loading) return;
    const authPages = ["/signin", "/signup", "/onboarding", "/language"];
    if (authPages.includes(location.pathname)) return;

    supabase
      .from("profiles")
      .select("age, weight, height, language, name, avatar")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        // Sync language from DB if set
        if (data?.language && data.language !== i18n.language) {
          i18n.changeLanguage(data.language);
          localStorage.setItem("biofit-language", data.language);
        }
        if (data?.avatar) setAvatar(data.avatar);
        if (data?.name) setProfileName(data.name);
        if (data && data.age === 25 && Number(data.weight) === 70 && Number(data.height) === 170) {
          const created = new Date(user.created_at).getTime();
          if (Date.now() - created < 5 * 60 * 1000) {
            navigate("/onboarding");
          }
        }
      });
  }, [user, loading, location.pathname, navigate, i18n]);

  const changeLanguage = async (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("biofit-language", code);
    if (user) {
      await supabase.from("profiles").update({ language: code }).eq("user_id", user.id);
    }
  };

  const currentLang = languages.find((l) => l.code === i18n.language);
  const displayName = profileName || (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "U";

  return (
    <div className="min-h-screen bg-background transition-colors duration-300" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-2xl border-b border-border/30">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="font-display font-bold text-primary-foreground text-sm">B</span>
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-foreground">BioFit</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-0.5">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === to
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl" aria-label={t("language.change")}>
                  <span className="text-lg">{currentLang?.flag || "🌐"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl max-h-80 overflow-y-auto">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={i18n.language === lang.code ? "bg-primary/10 text-primary" : ""}
                  >
                    <span className="mr-2 text-lg">{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {!loading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-xl">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs font-semibold">
                          {avatar || displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/settings")}>
                      <SettingsIcon className="w-4 h-4 mr-2" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/language")}>
                      <Globe className="w-4 h-4 mr-2" /> {t("language.change")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" /> {t("auth.sign_out")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="default" size="sm" className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                  <Link to="/signin">
                    <LogIn className="w-4 h-4" /> {t("auth.sign_in")}
                  </Link>
                </Button>
              )
            )}
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-2xl">
            <div className="container py-2 flex flex-col gap-0.5">
              {navItems.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    location.pathname === to
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="container py-6">{children}</main>
    </div>
  );
}
