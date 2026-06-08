import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export const DEFAULT_CONFIG = {
  segments: ["model", "fivehour", "sevenday", "context", "git", "cost"],
  color: true,
  barWidth: 8,
  thresholds: { warn: 50, crit: 80 },
  showProjection: true,
};

export function configDir() {
  return process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
}

export function configPath() {
  return join(configDir(), "cclimit.json");
}

export function mergeConfig(base, user) {
  if (!user || typeof user !== "object") return { ...base };
  return {
    ...base,
    ...user,
    thresholds: { ...base.thresholds, ...(user.thresholds || {}) },
    segments: Array.isArray(user.segments) ? user.segments : base.segments,
  };
}

export function loadConfig(path = configPath(), reader = readFileSync) {
  let user = {};
  try {
    user = JSON.parse(reader(path, "utf8"));
  } catch {
    user = {};
  }
  return mergeConfig(DEFAULT_CONFIG, user);
}
