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
- **Runtime is serverless, per-platform, zero-compile.** Windows: a single
  `.ps1` (PowerShell + WPF). macOS: a single `.js` run by `osascript -l
  JavaScript` (JXA + AppKit). Each reads the PNG next to it; both runtimes ship
  with the OS, nothing to build or install.
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
  runtime/peek.ps1    WPF popup (Windows); reads claude.png beside it; slide down + back up
  runtime/peek.js     AppKit popup via JXA (macOS); same behavior
  assets/claude.png   bundled character (transparent PNG)
  README.md  LICENSE(MIT)  docs/DESIGN.md
```

## Runtime behavior

Borderless, top-most, transparent, non-activating window at top-center of the
primary screen. The character animates from above the screen down to a small
peek offset and back up, then the window closes itself. Image scaled
nearest-neighbor to stay crisp.

- **Windows:** WPF `TranslateTransform` + `DoubleAnimation` (`AutoReverse`).
- **macOS:** borderless `NSWindow` at screen-saver level (above the menu bar),
  `ignoresMouseEvents`, moved each frame by a run-loop-pumped ease-out/ease-in
  loop in JXA.

## Out of scope (YAGNI)

Custom-image processing, config files/UI, local server, Linux runtime, sound,
multi-monitor targeting beyond the primary screen.
