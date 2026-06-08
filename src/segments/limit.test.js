import { describe, it, expect } from "vitest";
import { limitSegment } from "./limit.js";

const opts = (over = {}) => ({ now: 0, barWidth: 8, color: false, ...over });

describe("limitSegment", () => {
  it("renders label, bar, percent and reset", () => {
    const data = { used_percentage: 85, resets_at: 10380 }; // 2h53m from now=0
    expect(limitSegment("5h", data, opts())).toBe("5h ███████░ 85% 2h53m");
  });

  it("omits reset when resets_at missing", () => {
    const data = { used_percentage: 8 };
    expect(limitSegment("7d", data, opts())).toBe("7d █░░░░░░░ 8%");
  });

  it("returns null when data missing or has no percentage", () => {
    expect(limitSegment("5h", null, opts())).toBeNull();
    expect(limitSegment("5h", { resets_at: 10 }, opts())).toBeNull();
  });

  it("applies ANSI color to the percent when enabled", () => {
    const data = { used_percentage: 85, resets_at: 10380 };
    expect(limitSegment("5h", data, opts({ color: true }))).toContain(
      "\x1b[31m85%\x1b[0m"
    );
  });
});
