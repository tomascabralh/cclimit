import { countdown } from "../format.js";

const FIVE_HOUR_SECONDS = 5 * 3600;

// data: five_hour { used_percentage, resets_at }; now: epoch seconds
// returns "! limit ~<countdown>" when current pace blows the 5h limit before
// reset, else null. Pure linear estimate from the payload — no stored history.
export function projectionSegment(data, now) {
  if (!data || !data.used_percentage || data.resets_at == null) return null;
  const remaining = data.resets_at - now;
  if (remaining <= 0) return null;
  const elapsed = FIVE_HOUR_SECONDS - remaining;
  if (elapsed <= 0) return null;
  const ratePerSec = data.used_percentage / elapsed;
  if (ratePerSec <= 0) return null;
  const timeTo100 = (100 - data.used_percentage) / ratePerSec;
  if (timeTo100 >= remaining) return null;
  return `! limit ~${countdown(timeTo100)}`;
}
