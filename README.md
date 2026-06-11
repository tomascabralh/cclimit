# cclimit

A credential-free Claude Code status line that shows how close you are to your
**plan limits** -- the 5-hour and 7-day windows -- plus context, git branch, and
session cost.

```
Opus 4.8 | 5h ███████░ 85% 2h53m | 7d █░░░░░░░ 8% 6d18h | ctx 13% | main* | $5.26
```

## Why cclimit

- **Zero credential access.** Other usage monitors read your OAuth token from the
  Keychain and poll Anthropic's API. cclimit reads **only** the JSON that Claude
  Code already pipes to a status-line command -- no token, no Keychain, no network.
- **Lightweight and local.** A single zero-dependency Node CLI. It reads nothing
  but the status-line payload and your own config file.

Requires Claude Code v2.1+ on a **Pro/Max** plan (the plan-limit fields are only
present then; with an API key the line shows `(no plan data)`).

## Install

```bash
npx @tomascabralh/cclimit install
```

This adds a `statusLine` entry to `~/.claude/settings.json` (existing settings are
backed up to `settings.json.bak`). Open a new Claude Code session to see it. The
installed command is just `cclimit`.

Remove it with `npx @tomascabralh/cclimit uninstall`.

## Configuration

Optional `~/.claude/cclimit.json` (honors `CLAUDE_CONFIG_DIR`):

```json
{
  "segments": ["model", "fivehour", "sevenday", "context", "git", "cost"],
  "color": true,
  "barWidth": 8,
  "barStyle": "blocks",
  "thresholds": { "warn": 50, "crit": 80 }
}
```

- `barStyle`: `"blocks"` (default, `███░░░`), `"ascii"` (`[###---]`), or `"dots"` (`●●●○○○`).
- `segments`: which segments to show, and in what order.
- Set `color: false` (or the `NO_COLOR` env var) to disable ANSI colors.

## What it reads

cclimit consumes these fields from the status-line payload, all provided by Claude
Code: `model.display_name`, `context_window.used_percentage`,
`cost.total_cost_usd`, and `rate_limits.{five_hour,seven_day}.{used_percentage,resets_at}`.
Nothing else. No files are read except your own `cclimit.json` config.

## FAQ

### Why is the percentage slightly behind `/usage`?

The two numbers come from different sources. Claude Code builds the status-line
payload from rate-limit headers cached from your session's **most recent API
request**, while `/usage` does a **live fetch** from the claude.ai usage endpoint
the moment you open it. By then you've usually consumed a bit more -- the turn
that rendered the status line, plus any other sessions or claude.ai chat -- so
`/usage` can read up to ~1% higher. The gap closes on the next response, when
fresh headers arrive.

cclimit renders the payload faithfully and can't fetch the live number: that
would require calling Anthropic's API with your credentials, which is exactly
what cclimit promises never to do.

## License

MIT
