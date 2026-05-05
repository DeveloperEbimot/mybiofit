import { useAuth } from "@/hooks/useAuth";
import { ANON_LIMIT, anonRemaining, getAnonId, incrementAnonUsage } from "@/lib/anonAILimit";
import { toast } from "sonner";

/**
 * Gates AI usage for anonymous users (2 uses per feature).
 * Signed-in users have unlimited access.
 */
export function useAIGate(feature: string) {
  const { user } = useAuth();
  const isAuthed = !!user;
  const remaining = isAuthed ? Infinity : anonRemaining(feature);

  const tryConsume = (): boolean => {
    if (isAuthed) return true;
    if (anonRemaining(feature) <= 0) {
      toast.error(`You've used your ${ANON_LIMIT} free tries. Sign up free to continue.`);
      return false;
    }
    incrementAnonUsage(feature);
    return true;
  };

  // Header to send with edge function calls so the server can correlate anon callers.
  const anonHeaders = isAuthed ? {} : { "x-biofit-anon-id": getAnonId() };

  return { isAuthed, remaining, tryConsume, anonHeaders, limit: ANON_LIMIT };
}