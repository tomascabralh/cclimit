export function contextSegment(payload) {
  const pct = payload?.context_window?.used_percentage;
  if (pct == null) return null;
  return `ctx ${pct}%`;
}
