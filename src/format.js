const COLORS = { green: 32, yellow: 33, red: 31, dim: 2, bold: 1 };

export function bar(percent, width = 8) {
  const p = Math.max(0, Math.min(100, percent ?? 0));
  const filled = Math.round((p / 100) * width);
  return "[" + "#".repeat(filled) + "-".repeat(width - filled) + "]";
}

export function countdown(secondsUntil) {
  if (secondsUntil == null) return "";
  let d = Math.floor(secondsUntil);
  if (d <= 0) return "now";
  const day = Math.floor(d / 86400);
  d -= day * 86400;
  const hr = Math.floor(d / 3600);
  d -= hr * 3600;
  const min = Math.floor(d / 60);
  if (day > 0) return `${day}d${hr}h`;
  if (hr > 0) return `${hr}h${min}m`;
  return `${min}m`;
}

export function severity(percent, thresholds = { warn: 50, crit: 80 }) {
  if (percent == null) return "green";
  if (percent >= thresholds.crit) return "red";
  if (percent >= thresholds.warn) return "yellow";
  return "green";
}

export function colorize(text, color, enabled = true) {
  if (!enabled || !color || !(color in COLORS)) return text;
  return `\x1b[${COLORS[color]}m${text}\x1b[0m`;
}
