# claude-peek

A little mascot peeks down from the top of your screen whenever **Claude Code** finishes a task — then slides back up. That's it.

It hooks into Claude Code's `Stop` event, so the popup fires every time Claude stops working. The window never steals focus, so it won't interrupt your typing.

> **Windows & macOS.** On Windows the popup is drawn with PowerShell + WPF; on macOS with AppKit via `osascript` (JXA). Nothing to compile on either OS — both runtimes ship with the system.

## Install

```sh
npx -y github:aeeengsungwoo/claude-peek install
```

That copies the runtime into `~/.claude/claude-peek/` and adds the `Stop` hook to your `~/.claude/settings.json` (existing hooks are preserved).

Try it right away:

```sh
npx -y github:aeeengsungwoo/claude-peek test
```

## Use your own character

The character is a single PNG:

```
~/.claude/claude-peek/claude.png
```

Replace that file with **any transparent PNG** and you're done — the popup keeps its image's aspect ratio automatically. Pixel art looks best (it's scaled crisp, no blur).

## Uninstall

```sh
npx -y github:aeeengsungwoo/claude-peek uninstall
```

Removes the `Stop` hook and the `~/.claude/claude-peek/` folder. Other hooks are left untouched.

## Tweak the motion

Open `~/.claude/claude-peek/peek.ps1` (Windows) or `~/.claude/claude-peek/peek.js` (macOS) and edit the values at the top:

| Variable      | Meaning                                  | Default |
| ------------- | ---------------------------------------- | ------- |
| `$charWidth`  | on-screen width in px (height follows)   | `200`   |
| `$durationMs` | slide time each way (smaller = faster)   | `340`   |
| `$peek`       | how far below the top edge it stops      | `12`    |

## How it works

- `npx -y github:aeeengsungwoo/claude-peek install` writes a `Stop` hook like:
  ```json
  { "type": "command", "command": "powershell -NoProfile -ExecutionPolicy Bypass -File \"<...>/peek.ps1\"", "async": true }
  ```
  On macOS the command is `osascript -l JavaScript "<...>/peek.js"` instead.
- When Claude Code stops, it runs the platform script, which shows a borderless, top-most, transparent, click-through window at the top-center of the primary screen and animates the character down and back up.

## Requirements

- Windows 10/11 (PowerShell 5.1+, WPF — both ship with Windows) **or** macOS 12+ (`osascript` ships with macOS)
- [Claude Code](https://claude.com/claude-code)
- Node.js 16+ (to run the installer)

## License

MIT
