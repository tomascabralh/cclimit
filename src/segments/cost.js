export function costSegment(payload) {
  const usd = payload?.cost?.total_cost_usd;
  if (usd == null) return null;
  return `$${usd.toFixed(2)}`;
}
