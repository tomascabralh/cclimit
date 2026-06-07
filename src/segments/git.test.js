import { describe, it, expect } from "vitest";
import { gitSegment } from "./git.js";

// fake runner: maps the git subcommand to canned stdout
function fakeRunner(map) {
  return (args) => {
    const key = args[0];
    if (!(key in map)) throw new Error("unexpected git call");
    return map[key];
  };
}

describe("gitSegment", () => {
  it("returns branch name when clean", () => {
    const run = fakeRunner({ "rev-parse": "main\n", status: "\n" });
    expect(gitSegment(".", run)).toBe("main");
  });

  it("appends * when dirty", () => {
    const run = fakeRunner({ "rev-parse": "feat/x\n", status: " M file.js\n" });
    expect(gitSegment(".", run)).toBe("feat/x*");
  });

  it("returns null when not a git repo (runner throws)", () => {
    const run = () => {
      throw new Error("not a repo");
    };
    expect(gitSegment(".", run)).toBeNull();
  });
});
