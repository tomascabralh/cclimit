# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`cclimit` is a zero-dependency Node CLI (ESM, Node >=18) that renders a Claude Code
**status line**. Claude Code pipes a JSON payload to a status-line command on every
turn; cclimit parses that JSON from stdin and writes one formatted line to stdout.
Published to npm as `@tomascabralh/cclimit`.

## The trust pitch is the spec

cclimit's entire selling point is that it **reads only the status-line payload (stdin)
and its own `cclimit.json` config** — no OAuth token, no Keychain, no network, no
reading other files. This is a hard constraint, not an implementation detail. Do not
add HTTP calls, credential/Keychain access, or reads of files other than the user's
own config. Any such change breaks the product's reason to exist.

The plan-limit fields (`rate_limits.five_hour` / `seven_day`) only appear on Pro/Max
plans with Claude Code v2.1+. With an API key they're absent, so the 5h segment
falls back to `(no plan data - Pro/Max only)`.

## Commands

```bash
npm test                          # vitest run (the whole suite)
npm run test:watch                # vitest watch mode
npx vitest run src/format.test.js # a single test file
npx vitest run -t "countdown"     # tests matching a name

# exercise the statusline locally by piping a payload to it
echo '{"model":{"display_name":"Opus 4.8"},"rate_limits":{"five_hour":{"used_percentage":85,"resets_at":9999999999}}}' | node bin/cclimit.js statusline
```

There is no build step or linter — it ships as plain source. `prepublishOnly` runs
the test suite, so tests must pass before `npm publish`.

## Architecture

A pure render pipeline with a thin CLI shell around it.

- **`bin/cclimit.js`** — the only entry point and the only place with side effects in
  the run path. Dispatches subcommands: `install`, `uninstall`, `statusline` (the
  default when no arg), `--version`, `help`. `statuslineCommand()` builds the exact
  command string written into settings — both node and script paths are quoted so
  Windows/space paths survive.
- **`src/render.js`** — `render(payload, config, now, deps)` is the heart. It holds a
  `builders` registry keyed by segment name; `config.segments` decides which run and
  in what order. Each builder returns a string or `null`; **`null` means omit the
  segment** and it's dropped from the ` | `-joined output.
- **`src/segments/*.js`** — one pure function per segment (`limit`, `context`, `cost`,
  `git`). They take the payload (or extracted data) and return a string or `null`.
  `limit.js` serves both the 5h and 7d segments.
- **`src/format.js`** — display primitives shared by segments: `bar` (with `blocks` /
  `ascii` / `dots` styles), `countdown`, `severity` (maps percent → green/yellow/red
  via thresholds), `colorize` (ANSI).
- **`src/config.js`** — `loadConfig` reads `~/.claude/cclimit.json` (honoring
  `CLAUDE_CONFIG_DIR`) and merges it over `DEFAULT_CONFIG`. Missing/malformed config
  silently falls back to defaults.
- **`src/install.js`** — edits `~/.claude/settings.json` to add/remove the
  `statusLine` entry, backing up to `settings.json.bak` first. `isCclimitCommand`
  lets an upgrade overwrite cclimit's own older entry without `--force`, while still
  refusing to clobber a genuinely different third-party status line.

### Dependency injection for testing

The code is written to be tested without touching the real filesystem, git, or clock.
Follow this pattern when adding code:

- `render(payload, config, now, deps)` takes `now` as an epoch-seconds argument (never
  call `Date.now()` inside the pipeline) and accepts `deps.gitSegment` to stub git.
- `gitSegment(cwd, runner)` takes an injectable `runner` instead of shelling out
  directly.
- `loadConfig(path, reader)` and `install`/`uninstall({ fs })` take injectable
  readers / fs objects.

Real I/O (the `realFs` object, `defaultRunner`, `readFileSync`) lives at the module
edges and is the default argument; tests pass fakes.

## Conventions

- ESM only (`"type": "module"`), `node:` import prefixes, `.js` extensions in imports.
- No emojis anywhere. The `blocks` bar style uses Unicode Block Elements (`█ ░`) —
  these are not emojis and render reliably; keep it that way.
- Every source file has a colocated `*.test.js`. `*.test.js` is gitignored from the
  npm package via `.npmignore` but committed to git.
