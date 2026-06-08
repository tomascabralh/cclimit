import { describe, it, expect } from "vitest";
import { bar, countdown, colorize, severity } from "./format.js";

describe("bar", () => {
  it("renders empty at 0%", () => expect(bar(0, 8)).toBe("░░░░░░░░"));
  it("renders full at 100%", () => expect(bar(100, 8)).toBe("████████"));
  it("rounds 85% of 8 to 7 fills", () => expect(bar(85, 8)).toBe("███████░"));
  it("rounds 8% of 8 to 1 fill", () => expect(bar(8, 8)).toBe("█░░░░░░░"));
  it("clamps out-of-range and null", () => {
    expect(bar(150, 8)).toBe("████████");
    expect(bar(null, 8)).toBe("░░░░░░░░");
  });
  it("supports the ascii style", () => {
    expect(bar(85, 8, "ascii")).toBe("[#######-]");
    expect(bar(0, 8, "ascii")).toBe("[--------]");
  });
  it("falls back to blocks for an unknown style", () =>
    expect(bar(100, 8, "nope")).toBe("████████"));
});

describe("countdown", () => {
  it("formats minutes", () => expect(countdown(90)).toBe("1m"));
  it("formats hours+minutes", () => expect(countdown(3780)).toBe("1h3m"));
  it("formats days+hours", () => expect(countdown(583200)).toBe("6d18h"));
  it("returns now for past/zero", () => {
    expect(countdown(0)).toBe("now");
    expect(countdown(-5)).toBe("now");
  });
  it("returns empty for null", () => expect(countdown(null)).toBe(""));
});

describe("severity", () => {
  it("green below warn", () => expect(severity(10)).toBe("green"));
  it("yellow at/above warn", () => expect(severity(50)).toBe("yellow"));
  it("red at/above crit", () => expect(severity(80)).toBe("red"));
  it("respects custom thresholds", () =>
    expect(severity(30, { warn: 25, crit: 60 })).toBe("yellow"));
});

describe("colorize", () => {
  it("wraps when enabled", () =>
    expect(colorize("hi", "red", true)).toBe("\x1b[31mhi\x1b[0m"));
  it("passes through when disabled", () =>
    expect(colorize("hi", "red", false)).toBe("hi"));
  it("passes through unknown color", () =>
    expect(colorize("hi", "puce", true)).toBe("hi"));
});
