# cclimit — design spec

**Date:** 2026-06-07
**Status:** approved (design phase)

## Summary

`cclimit` is a zero-dependency, single-file Node CLI that renders a Claude Code
**status line** showing **plan-limit usage** (5-hour and 7-day rolling windows),
plus context, git branch, and session cost — with a **burn-rate projection** that
warns when the current pace will exhaust the 5-hour limit before it resets.

It reads **only** the JSON payload Claude Code pipes to a status-line command on
stdin. It never reads the OAuth token, never touches the macOS Keychain, and
makes **no network calls**. That zero-credential property is the project's main
trust differentiator over menu-bar usage monitors.

Distribution target: an npm package installable via `npx cclimit install`, which
wires the tool into the user's `~/.claude/settings.json`.

## Why this exists

- Checking `/usage` repeatedly is friction; the data should be ambient.
- Existing in-terminal tools (ccusage, ccstatusline) focus on **cost from local
  logs**, not the subscription **limit %** that `/usage` reports.
- Existing menu-bar apps (Claude God, Claude Meter, etc.) show limit %, but
  obtain it by reading the OAuth token from the Keychain and polling Anthropic's
  API — a trust cost some users (this one) won't pay.
- Claude Code v2.1.x+ pipes `rate_limits.five_hour` and `.seven_day` directly
  into the status-line payload for Pro/Max accounts. That makes a
  **credential-free** limit display possible. cclimit is the clean tool built on
  that fact.

## Non-goals (v1)

- War-room / multi-tab aggregate view (deferred to v2).
- Daily/historical cost (requires parsing `~/.claude` JSONL logs; v1 shows only
  the session cost already present in the payload).
- Themes beyond color on/off.
- API-key auth support: when authed with an API key the `rate_limits` fields are
  empty; cclimit shows a clear `(no plan data)` fallback rather than inventing a
  workaround.

## Input contract (status-line payload)

Claude Code pipes a JSON object to stdin on each render. Fields cclimit consumes
(confirmed against v2.1.168):

```json
{
  "model": { "display_name": "Opus 4.8" },
  "context_window": { "used_percentage": 13 },
  "cost": { "total_cost_usd": 5.256, "total_lines_added": 66, "total_lines_removed": 14 },
  "rate_limits": {
    "five_hour": { "used_percentage": 85, "resets_at": 1780875000 },
    "seven_day": { "used_percentage": 8, "resets_at": 1781449200 }
  }
}
```

- `resets_at` is a Unix epoch in **seconds**.
- `rate_limits` (and its sub-objects) may be **absent or empty** (API-key auth,
  older versions). Every field access must be defensive.

## Output: the status line

ASCII only — **no emojis**, no box-drawing characters. Segments joined by ` | `.

Default layout:

```
Opus 4.8 | 5h [#######-] 85% 2h53m | 7d [#-------] 8% 6d18h | ctx 13% | main* | $5.26
```

Segment specs:

| Segment | Format | Source |
|---|---|---|
| model | `Opus 4.8` | `model.display_name` |
| 5h limit | `5h [bar] NN% <reset>` | `rate_limits.five_hour` |
| 7d limit | `7d [bar] NN% <reset>` | `rate_limits.seven_day` |
| projection | `! limit ~40m` (only when triggered) | derived (see below) |
| context | `ctx NN%` | `context_window.used_percentage` |
| git | `branch` + `*` if dirty | `git` subprocess |
| cost | `$N.NN` | `cost.total_cost_usd` |

- **Bar:** fixed width (default 8), `#` filled vs `-` empty, proportional to
  `used_percentage`.
- **Reset countdown:** `resets_at - now`, formatted compactly: `6d18h`, `2h53m`,
  `40m`, or `now`.
- **Color:** ANSI by severity on the percentage — green `< warn`, yellow
  `>= warn`, red `>= crit` (defaults warn=50, crit=80). Color is not an emoji and
  stays on by default. Claude Code renders ANSI from the status-line command, so
  color is NOT suppressed on a non-TTY stdout (that is the normal case here); it
  is disabled only via the config `color: false` or the `NO_COLOR` env var.
- **Fallback:** if `rate_limits` is absent/empty, the 5h/7d/projection segments
  collapse to a single dim `(no plan data - Pro/Max only)`.

### Burn-rate projection (the differentiator)

Computed purely from the payload, no stored history:

```
window      = 5h (the five_hour window length)
remaining   = resets_at - now          # seconds until reset
elapsed     = window - remaining        # seconds into the current window
rate        = used_percentage / elapsed # %/sec
time_to_100 = (100 - used_percentage) / rate
```

If `time_to_100 < remaining`, the pace will blow the limit before reset → show
`! limit ~<time_to_100>`. Guard against `elapsed <= 0` and `used_percentage == 0`
(no projection in those cases). This is a linear estimate; it is intentionally
simple and labeled as an estimate in the README.

## Configuration

File: `~/.claude/cclimit.json` (honors `CLAUDE_CONFIG_DIR`). All keys optional;
defaults make zero-config work.

```jsonc
{
  "segments": ["model", "fivehour", "sevenday", "context", "git", "cost"],
  "color": true,
  "barWidth": 8,
  "thresholds": { "warn": 50, "crit": 80 },
  "showProjection": true
}
```

- `segments` controls presence and order. Projection is attached to the 5h
  segment, gated by `showProjection`.
- Unknown keys are ignored; malformed file → fall back to defaults (never crash
  the status line).

## Commands

- `cclimit statusline` — read stdin JSON, write one line to stdout. Default
  behavior; this is what `settings.json` calls.
- `cclimit install` — locate the node binary + cclimit entry, **back up**
  `~/.claude/settings.json` to `settings.json.bak`, set
  `statusLine.command`. Idempotent. If a different `statusLine` already exists,
  print it and require `--force` to overwrite (the backup is always written).
- `cclimit uninstall` — remove the `statusLine` block cclimit added (restore is
  manual via the `.bak` if needed).
- `cclimit --help`, `cclimit --version`.

## Architecture

Small, single-purpose units; pure where possible so the core is unit-testable
without IO.

```
bin/cclimit.js        # arg routing only (statusline | install | uninstall | help | version)
src/render.js         # pure: (payload, config, now) -> string   <-- the heart
src/segments/
  limit.js            # pure: builds a 5h/7d segment (bar, %, reset, color)
  projection.js       # pure: burn-rate estimate -> optional warning string
  context.js          # pure
  cost.js             # pure
  git.js              # impure: shells out to `git` for branch + dirty flag
src/format.js         # pure helpers: bar(), countdown(), colorize()
src/config.js         # load + merge config over defaults
src/install.js        # settings.json read / modify / backup
```

Data flow (statusline): stdin JSON -> parse -> `config.load()` ->
`render(payload, config, Date.now())` -> stdout. `render` calls each enabled
segment; `git.js` is the only segment allowed a subprocess, and its failure
degrades to an empty segment (never throws).

## Error handling

- Invalid/empty stdin JSON -> render the fallback line, exit 0. A status line
  must never error out or block the prompt.
- Missing `rate_limits` -> `(no plan data)` fallback.
- `git` not present / not a repo -> git segment omitted silently.
- Malformed config -> defaults.
- `install` on unreadable/locked settings.json -> clear error message, non-zero
  exit (this is the one command where failing loudly is correct).

## Testing

Vitest (matches the other repos in this workspace). Pure modules get the bulk of
coverage:

- `render` — full-payload snapshot, fallback path, segment ordering/toggles.
- `projection` — triggers when pace exceeds reset; silent when safe, at 0%, or
  with non-positive elapsed.
- `format` — bar fill rounding, countdown formatting boundaries
  (seconds/minutes/hours/days, past = `now`).
- `config` — default merge, malformed file falls back, unknown keys ignored.
- `install` — settings.json round-trip on a temp dir: fresh install, idempotent
  re-install, existing-statusLine guard, backup written.

`git.js` is integration-light (smoke test in a temp repo) since it is the only
impure unit.

## Repo & distribution

- New repo at `projects/cclimit`, branch `main`, remote
  `github.com/tomascabralh/cclimit`. MIT license.
- `package.json` with `"bin": { "cclimit": "bin/cclimit.js" }` so `npx cclimit`
  works; `engines.node >= 18`; zero runtime dependencies.
- README leads with the two hooks: **zero credential access** and **burn-rate
  projection**, with an animated/example line and a one-command install.

## v2 ideas (not now)

- War-room: aggregate live usage across all running Claude Code tabs in one view.
- Historical/daily cost via log parsing (or optional ccusage hand-off).
- Configurable segment templates / custom separators.
