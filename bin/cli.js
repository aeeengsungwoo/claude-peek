#!/usr/bin/env node
'use strict';

// claude-peek CLI — install / test / uninstall
// Wires a Claude Code Stop hook that pops a mascot down from the top of the screen.
// Runtime: Windows (PowerShell + WPF) and macOS (osascript JXA + AppKit).
// The CLI itself runs anywhere.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const PKG_ROOT = path.resolve(__dirname, '..');

// Honor CLAUDE_CONFIG_DIR (same override Claude Code uses), else ~/.claude
const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const destDir = path.join(claudeDir, 'claude-peek');
const settingsPath = path.join(claudeDir, 'settings.json');
const peekPs1Path = path.join(destDir, 'peek.ps1');
const peekJsPath = path.join(destDir, 'peek.js');
const charPath = path.join(destDir, 'claude.png');

const isMac = process.platform === 'darwin';

function hookCommand() {
  if (isMac) {
    return `osascript -l JavaScript "${peekJsPath}"`;
  }
  return `powershell -NoProfile -ExecutionPolicy Bypass -File "${peekPs1Path}"`;
}

function readSettings() {
  let raw;
  try {
    raw = fs.readFileSync(settingsPath, 'utf8');
  } catch (e) {
    return {}; // no settings file yet — start fresh
  }
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // strip UTF-8 BOM
  raw = raw.trim();
  if (raw === '') return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    // The file exists but isn't valid JSON. Bail out rather than overwrite and
    // destroy the user's settings.
    console.error('Could not parse ' + settingsPath + ' (invalid JSON).');
    console.error('Aborting so your settings are not overwritten. Fix it and retry.');
    process.exit(1);
  }
}

function writeSettings(settings) {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
}

function copyRuntime() {
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(path.join(PKG_ROOT, 'runtime', 'peek.ps1'), peekPs1Path);
  fs.copyFileSync(path.join(PKG_ROOT, 'runtime', 'peek.js'), peekJsPath);
  fs.copyFileSync(path.join(PKG_ROOT, 'assets', 'claude.png'), charPath);
}

// True if a Stop-hook entry belongs to claude-peek (so we can dedupe / remove cleanly).
function isPeekHook(entry) {
  return (
    entry &&
    Array.isArray(entry.hooks) &&
    entry.hooks.some(
      (h) =>
        h &&
        typeof h.command === 'string' &&
        (h.command.toLowerCase().includes('peek.ps1') ||
          h.command.toLowerCase().includes('peek.js'))
    )
  );
}

function install() {
  if (process.platform !== 'win32' && !isMac) {
    console.warn(
      '! claude-peek shows its popup on Windows and macOS only.'
    );
    console.warn('  Installing the hook anyway; it just stays quiet on this OS.');
  }

  copyRuntime();

  const settings = readSettings();
  settings.hooks = settings.hooks || {};
  settings.hooks.Stop = Array.isArray(settings.hooks.Stop)
    ? settings.hooks.Stop
    : [];
  // Drop any previous claude-peek entry, then add a fresh one (preserves other hooks).
  settings.hooks.Stop = settings.hooks.Stop.filter((h) => !isPeekHook(h));
  settings.hooks.Stop.push({
    hooks: [{ type: 'command', command: hookCommand(), async: true }],
  });
  writeSettings(settings);

  console.log('claude-peek installed.');
  console.log('  Character : ' + charPath);
  console.log('  Your own  : replace that file with a transparent PNG.');
  console.log('  Try it    : npx -y github:aeeengsungwoo/claude-peek test');
}

function uninstall() {
  const settings = readSettings();
  if (settings.hooks && Array.isArray(settings.hooks.Stop)) {
    settings.hooks.Stop = settings.hooks.Stop.filter((h) => !isPeekHook(h));
    if (settings.hooks.Stop.length === 0) delete settings.hooks.Stop;
    if (settings.hooks && Object.keys(settings.hooks).length === 0)
      delete settings.hooks;
    writeSettings(settings);
  }
  try {
    fs.rmSync(destDir, { recursive: true, force: true });
  } catch (e) {
    /* ignore */
  }
  console.log('claude-peek uninstalled.');
}

function test() {
  if (process.platform !== 'win32' && !isMac) {
    console.warn('! Windows and macOS only — nothing to show on this OS.');
    return;
  }
  const runtimePath = isMac ? peekJsPath : peekPs1Path;
  if (!fs.existsSync(runtimePath)) {
    console.error('Not installed yet. Run: npx -y github:aeeengsungwoo/claude-peek install');
    process.exit(1);
  }
  const child = isMac
    ? spawn('osascript', ['-l', 'JavaScript', peekJsPath], {
        detached: true,
        stdio: 'ignore',
      })
    : spawn(
        'powershell',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', peekPs1Path],
        { detached: true, stdio: 'ignore' }
      );
  child.unref();
  console.log('peek!');
}

function help() {
  console.log('claude-peek — a mascot that peeks down when Claude Code finishes.');
  console.log('');
  console.log('Usage:');
  console.log('  npx -y github:aeeengsungwoo/claude-peek install     wire it into the Claude Code Stop hook');
  console.log('  npx -y github:aeeengsungwoo/claude-peek test        show the popup once');
  console.log('  npx -y github:aeeengsungwoo/claude-peek uninstall   remove the hook and files');
}

const commands = { install, uninstall, test, help };
const cmd = (process.argv[2] || 'help').toLowerCase();
(commands[cmd] ||
  (() => {
    console.error('Unknown command: ' + cmd);
    help();
    process.exit(1);
  }))();
