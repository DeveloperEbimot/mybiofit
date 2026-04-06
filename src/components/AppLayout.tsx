import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Camera, UtensilsCrossed, ShoppingCart, Dumbbell, MessageCircle, Calculator, BarChart3, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/scan", icon: Camera, label: "Scan" },
  { to: "/recipes", icon: UtensilsCrossed, label: "Recipes" },
  { to: "/grocery", icon: ShoppingCart, label: "Grocery" },
  { to: "/fitness", icon: Dumbbell, label: "Fitness" },
  { to: "/bmi", icon: Calculator, label: "BMI" },
  { to: "/chat", icon: MessageCircle, label: "Chat" },
  { to: "/stats", icon: BarChart3, label: "Stats" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();

  // Redirect new users to onboarding after first sign-in
  useEffect(() => {
    if (!user || loading) return;
    const authPages = ["/signin", "/signup", "/onboarding"];
    if (authPages.includes(location.pathname)) return;

    supabase
      .from("profiles")
      .select("age, weight, height")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        // If profile has default values, redirect to onboarding
        if (data && data.age === 25 && Number(data.weight) === 70 && Number(data.height) === 170) {
          // Check if this is a brand-new user (created in last 5 min)
          const created = new Date(user.created_at).getTime();
          if (Date.now() - created < 5 * 60 * 1000) {
            navigate("/onboarding");
          }
        }
      });
  }, [user, loading, location.pathname, navigate]);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "U";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-card border-b border-border/50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display font-bold text-primary-foreground text-sm">B</span>
            </div>
            <span className="font-display font-bold text-xl text-foreground">BioFit</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === to
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!loading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-xs text-muted-foreground" disabled>
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={signOut}>
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button asChild variant="outline" size="sm" className="gap-2">
                  <Link to="/signin">
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                </Button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="container py-6 pb-24 md:pb-6">{children}</main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-2 py-1 text-xs transition-colors ${
                location.pathname === to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
