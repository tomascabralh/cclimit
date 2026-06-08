import { describe, it, expect } from "vitest";
import { projectionSegment } from "./projection.js";

// window is 5h = 18000s. now = 0, so elapsed = 18000 - resets_at.
describe("projectionSegment", () => {
  it("warns when pace will exhaust before reset", () => {
    // elapsed = 3600s (resets_at 14400), used 85% -> ~10m to 100%, well before 4h reset
    const data = { used_percentage: 85, resets_at: 14400 };
    expect(projectionSegment(data, 0)).toBe("! limit ~10m");
  });

  it("is silent when usage will reset first", () => {
    // elapsed = 3600s, used 8% -> very slow, resets first
    const data = { used_percentage: 8, resets_at: 14400 };
    expect(projectionSegment(data, 0)).toBeNull();
  });

  it("is silent at 0% and with no data", () => {
    expect(projectionSegment({ used_percentage: 0, resets_at: 14400 }, 0)).toBeNull();
    expect(projectionSegment(null, 0)).toBeNull();
  });

  it("is silent when window just reset (elapsed <= 0)", () => {
    expect(projectionSegment({ used_percentage: 50, resets_at: 18000 }, 0)).toBeNull();
  });
});
