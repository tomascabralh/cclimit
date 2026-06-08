import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const BIN = join(dirname(fileURLToPath(import.meta.url)), "cclimit.js");

function run(args, input) {
  return execFileSync(process.execPath, [BIN, ...args], {
    input: input ?? "",
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
}

describe("cclimit cli", () => {
  it("prints the version", () => {
    expect(run(["--version"]).trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("renders a status line from a piped payload", () => {
    const payload = JSON.stringify({
      model: { display_name: "Opus 4.8" },
      context_window: { used_percentage: 13 },
      rate_limits: {
        five_hour: { used_percentage: 85, resets_at: Math.floor(Date.now() / 1000) + 3600 },
      },
    });
    const out = run(["statusline"], payload);
    expect(out).toContain("Opus 4.8");
    expect(out).toContain("5h ");
    expect(out).toContain("85%");
  });

  it("does not throw on empty stdin", () => {
    expect(() => run(["statusline"], "")).not.toThrow();
  });

  it("prints help for an unknown command", () => {
    // unknown command exits non-zero; execFileSync throws, but stdout/stderr carry help
    try {
      run(["wat"]);
    } catch (e) {
      expect(String(e.stdout) + String(e.stderr)).toContain("Usage:");
      return;
    }
    throw new Error("expected non-zero exit");
  });
});
