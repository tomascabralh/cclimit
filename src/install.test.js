import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install, uninstall } from "./install.js";

let dir, settings;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "cclimit-"));
  settings = join(dir, "settings.json");
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const CMD = "/usr/bin/node /x/bin/cclimit.js statusline";

describe("install", () => {
  it("creates statusLine in a fresh settings file", () => {
    const res = install({ settings, command: CMD });
    expect(res.ok).toBe(true);
    const json = JSON.parse(readFileSync(settings, "utf8"));
    expect(json.statusLine).toEqual({ type: "command", command: CMD, padding: 0 });
  });

  it("preserves existing keys and writes a backup", () => {
    writeFileSync(settings, JSON.stringify({ model: "opus" }));
    const res = install({ settings, command: CMD });
    expect(res.ok).toBe(true);
    const json = JSON.parse(readFileSync(settings, "utf8"));
    expect(json.model).toBe("opus");
    expect(json.statusLine.command).toBe(CMD);
    expect(existsSync(settings + ".bak")).toBe(true);
  });

  it("is idempotent for the same command", () => {
    install({ settings, command: CMD });
    const res = install({ settings, command: CMD });
    expect(res.ok).toBe(true);
  });

  it("refuses to overwrite a different statusLine without force", () => {
    writeFileSync(settings, JSON.stringify({ statusLine: { type: "command", command: "other" } }));
    const res = install({ settings, command: CMD });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe("exists");
  });

  it("overwrites a different statusLine with force", () => {
    writeFileSync(settings, JSON.stringify({ statusLine: { type: "command", command: "other" } }));
    const res = install({ settings, command: CMD, force: true });
    expect(res.ok).toBe(true);
    expect(JSON.parse(readFileSync(settings, "utf8")).statusLine.command).toBe(CMD);
  });
});

describe("uninstall", () => {
  it("removes the statusLine block", () => {
    writeFileSync(settings, JSON.stringify({ model: "opus", statusLine: { command: CMD } }));
    const res = uninstall({ settings });
    expect(res.removed).toBe(true);
    const json = JSON.parse(readFileSync(settings, "utf8"));
    expect(json.statusLine).toBeUndefined();
    expect(json.model).toBe("opus");
  });

  it("is a no-op when there is no settings file", () => {
    expect(uninstall({ settings }).removed).toBe(false);
  });
});
