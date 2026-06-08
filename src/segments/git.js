import { execFileSync } from "node:child_process";

function defaultRunner(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
}

// cwd: directory to inspect; runner: injectable for tests
export function gitSegment(cwd = process.cwd(), runner = defaultRunner) {
  try {
    const branch = runner(["rev-parse", "--abbrev-ref", "HEAD"], cwd).trim();
    if (!branch) return null;
    const dirty = runner(["status", "--porcelain"], cwd).trim().length > 0 ? "*" : "";
    return `${branch}${dirty}`;
  } catch {
    return null;
  }
}
