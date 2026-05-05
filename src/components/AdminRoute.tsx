import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setIsAdmin(false);
      return;
    }
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user, loading]);

  if (loading || isAdmin === null) {
    return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">Checking access…</div>;
  }
  if (!user) return <Navigate to="/signin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}