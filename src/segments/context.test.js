import { describe, it, expect } from "vitest";
import { contextSegment } from "./context.js";

describe("contextSegment", () => {
  it("renders context percentage", () =>
    expect(contextSegment({ context_window: { used_percentage: 13 } })).toBe("ctx 13%"));
  it("rounds a floating-point percentage", () =>
    expect(contextSegment({ context_window: { used_percentage: 28.9999 } })).toBe("ctx 29%"));
  it("returns null when absent", () => {
    expect(contextSegment({})).toBeNull();
    expect(contextSegment({ context_window: {} })).toBeNull();
  });
});
