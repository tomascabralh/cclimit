import { describe, it, expect } from "vitest";
import { costSegment } from "./cost.js";

describe("costSegment", () => {
  it("formats session cost to two decimals", () =>
    expect(costSegment({ cost: { total_cost_usd: 5.256 } })).toBe("$5.26"));
  it("returns null when absent", () => {
    expect(costSegment({})).toBeNull();
    expect(costSegment({ cost: {} })).toBeNull();
  });
});
