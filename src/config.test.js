import { describe, it, expect } from "vitest";
import { DEFAULT_CONFIG, mergeConfig, loadConfig } from "./config.js";

describe("mergeConfig", () => {
  it("returns defaults for empty user config", () => {
    expect(mergeConfig(DEFAULT_CONFIG, {})).toEqual(DEFAULT_CONFIG);
  });
  it("overrides scalar keys", () => {
    expect(mergeConfig(DEFAULT_CONFIG, { color: false }).color).toBe(false);
  });
  it("deep-merges thresholds", () => {
    const m = mergeConfig(DEFAULT_CONFIG, { thresholds: { crit: 95 } });
    expect(m.thresholds).toEqual({ warn: 50, crit: 95 });
  });
  it("replaces the segments array", () => {
    expect(mergeConfig(DEFAULT_CONFIG, { segments: ["cost"] }).segments).toEqual(["cost"]);
  });
  it("ignores a non-array segments value", () => {
    expect(mergeConfig(DEFAULT_CONFIG, { segments: "nope" }).segments).toEqual(
      DEFAULT_CONFIG.segments
    );
  });
});

describe("loadConfig", () => {
  it("falls back to defaults when the file is unreadable", () => {
    const reader = () => {
      throw new Error("ENOENT");
    };
    expect(loadConfig("/nope.json", reader)).toEqual(DEFAULT_CONFIG);
  });
  it("merges a valid config file", () => {
    const reader = () => JSON.stringify({ barWidth: 12 });
    expect(loadConfig("/x.json", reader).barWidth).toBe(12);
  });
  it("falls back to defaults on malformed JSON", () => {
    const reader = () => "{ not json";
    expect(loadConfig("/x.json", reader)).toEqual(DEFAULT_CONFIG);
  });
});
