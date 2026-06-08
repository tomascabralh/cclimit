import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { configDir } from "./config.js";

export function settingsPath() {
  return join(configDir(), "settings.json");
}

// True if a statusLine command is one cclimit wrote (any version/format).
// Lets us overwrite our own older entry on upgrade without forcing, while
// still guarding a genuinely different third-party statusLine.
export function isCclimitCommand(cmd) {
  return typeof cmd === "string" && /cclimit/i.test(cmd);
}

const realFs = {
  exists: existsSync,
  read: (p) => readFileSync(p, "utf8"),
  write: (p, c) => writeFileSync(p, c),
  copy: (a, b) => copyFileSync(a, b),
};

export function install({ settings = settingsPath(), command, force = false, fs = realFs }) {
  let current = {};
  let backedUp = false;
  if (fs.exists(settings)) {
    try {
      current = JSON.parse(fs.read(settings));
    } catch {
      throw new Error(`Cannot parse ${settings} - fix or remove it and retry.`);
    }
    fs.copy(settings, settings + ".bak");
    backedUp = true;
  }
  const existing = current.statusLine?.command;
  if (existing && existing !== command && !isCclimitCommand(existing) && !force) {
    return { ok: false, reason: "exists", existing };
  }
  current.statusLine = { type: "command", command, padding: 0 };
  fs.write(settings, JSON.stringify(current, null, 2) + "\n");
  return { ok: true, backedUp };
}

export function uninstall({ settings = settingsPath(), command, fs = realFs }) {
  if (!fs.exists(settings)) return { ok: true, removed: false };
  let current;
  try {
    current = JSON.parse(fs.read(settings));
  } catch {
    throw new Error(`Cannot parse ${settings} - fix or remove it and retry.`);
  }
  const existing = current.statusLine?.command;
  if (current.statusLine && (!command || existing === command || isCclimitCommand(existing))) {
    delete current.statusLine;
    fs.write(settings, JSON.stringify(current, null, 2) + "\n");
    return { ok: true, removed: true };
  }
  return { ok: true, removed: false };
}
