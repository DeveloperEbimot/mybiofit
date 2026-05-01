// Preset sporty avatar emojis. Stored as the emoji character itself in profiles.avatar.
export const PRESET_AVATARS = [
  "💪", "🏋️", "🏃", "🤸", "🚴", "🧘",
  "🥊", "🏊", "⛹️", "🤾", "🏌️", "🏄",
  "🦁", "🐯", "🐺", "🦅", "⚡", "🔥",
  "🌟", "🎯",
];

export function getInitial(name?: string | null, email?: string | null): string {
  const source = name || email || "U";
  return source.charAt(0).toUpperCase();
}