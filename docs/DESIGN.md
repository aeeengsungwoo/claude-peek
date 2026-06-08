# claude-peek — design

## Goal

A dead-simple, open-source way to get a mascot that peeks down from the top of
the screen when Claude Code finishes a task. One command to install on any PC,
minimal code, no server, no custom-image tooling.

## Decisions

- **Fixed character, swap-by-file.** Ships one bundled `claude.png`. To use a
  different character, the user replaces the file at a fixed path
  (`~/.claude/claude-peek/claude.png`). Documented in the README. No upload UI,
  no `set-char` command, no local server.
- **Install via npm/npx.** `npx claude-peek install|test|uninstall`. Runs from
  any shell. The CLI is plain Node (no dependencies); it does the
  `settings.json` merge because JSON editing is clean in Node.
- **Runtime is serverless PowerShell + WPF.** The popup is a single `.ps1` that
  reads the PNG next to it. Windows only.
- **Hook target: `Stop`.** Fires when Claude Code stops. `async: true` so it
  never blocks Claude.
- **Non-destructive settings merge.** Install removes any prior claude-peek
  `Stop` entry and re-adds a fresh one; other hooks are preserved. Uninstall
  removes only the claude-peek entry.

## Layout

```
claude-peek/
  package.json        bin: claude-peek
  bin/cli.js          install / test / uninstall (Node; merges settings.json)
  runtime/peek.ps1    WPF popup; reads claude.png beside it; slide down + back up
  assets/claude.png   bundled character (transparent PNG)
  README.md  LICENSE(MIT)  docs/DESIGN.md
```

## Runtime behavior

Borderless, top-most, transparent, non-activating window at top-center of the
primary screen. A `TranslateTransform` animates the character from above the
screen down to a small peek offset and back up (`AutoReverse`), then the window
closes itself. Image scaled with `NearestNeighbor` to stay crisp.

## Out of scope (YAGNI)

Custom-image processing, config files/UI, local server, cross-platform runtime,
sound, multi-monitor targeting beyond the primary screen.
