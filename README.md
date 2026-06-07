# cclimit

A credential-free Claude Code status line that shows how close you are to your
**plan limits** -- 5-hour and 7-day windows -- with a **burn-rate projection** that
warns before you hit the wall.

```
Opus 4.8 | 5h [#######-] 85% 2h53m | 7d [#-------] 8% 6d18h | ctx 13% | main* | $5.26
```

## Why cclimit

- **Zero credential access.** Other usage monitors read your OAuth token from the
  Keychain and poll Anthropic's API. cclimit reads **only** the JSON that Claude
  Code already pipes to a status-line command -- no token, no Keychain, no network.
- **Burn-rate projection.** When your current 5-hour pace will exhaust the limit
  before it resets, the line appends `! limit ~40m`. It's a linear estimate from
  the payload, not a guess about your future.

Requires Claude Code v2.1+ on a **Pro/Max** plan (the plan-limit fields are only
present then; with an API key the line shows `(no plan data)`).

## Install

```bash
npx cclimit install
```

This adds a `statusLine` entry to `~/.claude/settings.json` (existing settings are
backed up to `settings.json.bak`). Open a new Claude Code session to see it.

Remove it with `npx cclimit uninstall`.

## Configuration

Optional `~/.claude/cclimit.json` (honors `CLAUDE_CONFIG_DIR`):

```json
{
  "segments": ["model", "fivehour", "sevenday", "context", "git", "cost"],
  "color": true,
  "barWidth": 8,
  "thresholds": { "warn": 50, "crit": 80 },
  "showProjection": true
}
```

Set `color: false` (or the `NO_COLOR` env var) to disable ANSI colors.

## What it reads

cclimit consumes these fields from the status-line payload, all provided by Claude
Code: `model.display_name`, `context_window.used_percentage`,
`cost.total_cost_usd`, and `rate_limits.{five_hour,seven_day}.{used_percentage,resets_at}`.
Nothing else. No files are read except your own `cclimit.json` config.

## License

MIT
