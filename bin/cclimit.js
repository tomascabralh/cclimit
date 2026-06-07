#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { render } from "../src/render.js";
import { loadConfig } from "../src/config.js";
import { install, uninstall, settingsPath } from "../src/install.js";

const require = createRequire(import.meta.url);
const { version: VERSION } = require("../package.json");
const BIN = fileURLToPath(import.meta.url);

// the exact command cclimit writes into settings.json
function statuslineCommand() {
  return `${process.execPath} ${BIN} statusline`;
}

const HELP = `cclimit - credential-free Claude Code plan-limit status line

Usage:
  cclimit install [--force]   Wire cclimit into ~/.claude/settings.json
  cclimit uninstall           Remove cclimit from settings
  cclimit statusline          Render a line from stdin JSON (called by Claude Code)
  cclimit --version
`;

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const cmd = process.argv[2] || "statusline";

  if (cmd === "--version" || cmd === "-v") return void console.log(VERSION);
  if (cmd === "--help" || cmd === "-h" || cmd === "help") return void console.log(HELP);

  if (cmd === "install") {
    const res = install({ command: statuslineCommand(), force: process.argv.includes("--force") });
    if (!res.ok && res.reason === "exists") {
      console.error(
        `A different statusLine is already set:\n  ${res.existing}\n` +
          `Re-run with --force to overwrite (a backup is written to settings.json.bak).`
      );
      process.exit(1);
    }
    console.log(`cclimit installed. Open a new Claude Code session to see it.\nSettings: ${settingsPath()}`);
    return;
  }

  if (cmd === "uninstall") {
    const res = uninstall({ command: statuslineCommand() });
    console.log(res.removed ? "cclimit removed from settings." : "Nothing to remove.");
    return;
  }

  if (cmd === "statusline") {
    let payload = {};
    try {
      payload = JSON.parse(await readStdin());
    } catch {
      payload = {};
    }
    const config = loadConfig();
    if (process.env.NO_COLOR) config.color = false;
    process.stdout.write(render(payload, config, Date.now() / 1000));
    return;
  }

  console.log(HELP);
  process.exit(1);
}

main();
