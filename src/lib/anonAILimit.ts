// Anonymous AI usage limiter. Signed-in users bypass via the hook.
const KEY_PREFIX = "biofit_anon_ai_";
const ANON_ID_KEY = "biofit_anon_id";
export const ANON_LIMIT = 2;

export function getAnonId(): string {
  let id = localStorage.getItem(ANON_ID_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem(ANON_ID_KEY, id);
  }
  return id;
}

export function getAnonUsage(feature: string): number {
  const v = parseInt(localStorage.getItem(KEY_PREFIX + feature) || "0", 10);
  return Number.isFinite(v) ? v : 0;
}

export function incrementAnonUsage(feature: string): number {
  const next = getAnonUsage(feature) + 1;
  localStorage.setItem(KEY_PREFIX + feature, String(next));
  return next;
}

export function anonRemaining(feature: string): number {
  return Math.max(0, ANON_LIMIT - getAnonUsage(feature));
}