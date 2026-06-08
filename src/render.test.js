import { describe, it, expect } from "vitest";
import { render } from "./render.js";
import { DEFAULT_CONFIG } from "./config.js";

const NOW = 1_000_000_000;

function fullPayload() {
  return {
    model: { display_name: "Opus 4.8" },
    context_window: { used_percentage: 13 },
    cost: { total_cost_usd: 5.256 },
    rate_limits: {
      five_hour: { used_percentage: 85, resets_at: NOW + 10380 }, // 2h53m
      seven_day: { used_percentage: 8, resets_at: NOW + 583200 }, // 6d18h
    },
  };
}

const cfg = (over = {}) => ({ ...DEFAULT_CONFIG, color: false, showProjection: false, ...over });
const deps = { gitSegment: () => "main*" };

describe("render", () => {
  it("composes the full default line", () => {
    const out = render(fullPayload(), cfg(), NOW, deps);
    expect(out).toBe(
      "Opus 4.8 | 5h [#######-] 85% 2h53m | 7d [#-------] 8% 6d18h | ctx 13% | main* | $5.26"
    );
  });

  it("appends projection warning when enabled and triggered", () => {
    const p = fullPayload();
    p.rate_limits.five_hour = { used_percentage: 85, resets_at: NOW + 14400 }; // elapsed 1h
    const out = render(p, cfg({ showProjection: true }), NOW, deps);
    expect(out).toContain("! limit ~");
  });

  it("shows a single no-plan note when rate_limits is absent", () => {
    const p = fullPayload();
    delete p.rate_limits;
    const out = render(p, cfg(), NOW, deps);
    expect(out).toContain("(no plan data - Pro/Max only)");
    expect(out).toContain("Opus 4.8");
    expect(out).toContain("ctx 13%");
    expect(out).not.toContain("5h [");
  });

  it("honors segment selection and order", () => {
    const out = render(fullPayload(), cfg({ segments: ["cost", "context"] }), NOW, deps);
    expect(out).toBe("$5.26 | ctx 13%");
  });

  it("does not throw on an empty payload", () => {
    expect(() => render({}, cfg(), NOW, deps)).not.toThrow();
  });
});
