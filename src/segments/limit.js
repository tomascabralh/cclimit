import { bar, countdown, colorize, severity } from "../format.js";

// label: "5h" | "7d"
// data: { used_percentage, resets_at } | undefined
// opts: { now (epoch seconds), barWidth, barStyle, thresholds, color }
export function limitSegment(label, data, { now, barWidth = 8, barStyle = "blocks", thresholds, color = true }) {
  if (!data || data.used_percentage == null) return null;
  const pct = data.used_percentage;
  const b = bar(pct, barWidth, barStyle);
  const pctStr = colorize(`${pct}%`, severity(pct, thresholds), color);
  const reset =
    data.resets_at != null ? " " + countdown(data.resets_at - now) : "";
  return `${label} ${b} ${pctStr}${reset}`;
}
