import { colorize } from "./format.js";
import { limitSegment } from "./segments/limit.js";
import { projectionSegment } from "./segments/projection.js";
import { contextSegment } from "./segments/context.js";
import { costSegment } from "./segments/cost.js";
import { gitSegment as realGit } from "./segments/git.js";

const SEP = " | ";
const NO_PLAN = "(no plan data - Pro/Max only)";

// payload: parsed status-line JSON; config: merged config;
// now: epoch seconds; deps.gitSegment injectable for tests.
export function render(payload, config, now, deps = {}) {
  const git = deps.gitSegment || realGit;
  const p = payload && typeof payload === "object" ? payload : {};
  const rl = p.rate_limits || {};
  const color = config.color;
  const hasLimits = !!(rl.five_hour || rl.seven_day);

  const builders = {
    model: () => {
      const name = p.model?.display_name;
      return name ? colorize(name, "bold", color) : null;
    },
    fivehour: () => {
      if (!rl.five_hour) return hasLimits ? null : colorize(NO_PLAN, "dim", color);
      let seg = limitSegment("5h", rl.five_hour, {
        now,
        barWidth: config.barWidth,
        thresholds: config.thresholds,
        color,
      });
      if (seg && config.showProjection) {
        const warn = projectionSegment(rl.five_hour, now);
        if (warn) seg += " " + colorize(warn, "red", color);
      }
      return seg;
    },
    sevenday: () =>
      limitSegment("7d", rl.seven_day, {
        now,
        barWidth: config.barWidth,
        thresholds: config.thresholds,
        color,
      }),
    context: () => contextSegment(p),
    git: () => git(p.workspace?.current_dir || process.cwd()),
    cost: () => costSegment(p),
  };

  const parts = [];
  for (const name of config.segments) {
    const build = builders[name];
    if (!build) continue;
    const out = build();
    if (out) parts.push(out);
  }
  return parts.join(SEP);
}
