#!/usr/bin/env node
'use strict';

// Omar Albarghouthi's terminal business card.
// Zero dependencies so `npx` starts instantly.

const readline = require('readline');
const { spawn } = require('child_process');

const out = process.stdout;
const args = process.argv.slice(2);
const TTY = Boolean(out.isTTY);
const NO_COLOR = 'NO_COLOR' in process.env || args.includes('--no-color') || process.env.TERM === 'dumb' ||
  (!TTY && !('FORCE_COLOR' in process.env));
out.on('error', () => process.exit(0)); // e.g. piped into `head`
const STATIC = !TTY || args.includes('--static') || args.includes('--no-anim') || Boolean(process.env.CI);
const TRUECOLOR = /truecolor|24bit/i.test(process.env.COLORTERM || '') ||
  process.platform === 'win32' || /iTerm|vscode|WezTerm|Hyper|ghostty/i.test(process.env.TERM_PROGRAM || '');

// ---------- data ----------
const LINKS = {
  nicetable: 'https://nice-table.vercel.app',
  cleaniq: 'https://github.com/ThisisOmar-here/CleanIQ',
  github: 'https://github.com/ThisisOmar-here',
  linkedin: 'https://www.linkedin.com/in/omar-albarghouthi',
  email: 'omarbarghouti505@gmail.com',
  pr: 'https://github.com/open-webui/open-webui/pull/32289',
};

const PROJECTS = [
  ['NiceTable', 'Live product. Paste messy text, get a clean exportable table.', LINKS.nicetable],
  ['CleanIQ', 'Open source. A local LLM explains each file before you delete it.', LINKS.cleaniq],
  ['Open WebUI', 'Completed the Arabic localisation: 463 strings, PR #32289.', LINKS.pr],
  ['LLM Guardrails', 'Case study: safety layers under multi-turn pressure.', 'https://github.com/ThisisOmar-here/anatomy-of-llm-guardrails'],
  ['claude-usage-hack', 'Pin your Claude usage window to a set time of day.', 'https://github.com/ThisisOmar-here/claude-usage-hack'],
  ['SFA-Bench', 'In progress: benchmark for state-fabrication attacks on LLM agents.', null],
];

// ---------- color ----------
const PALETTE = {
  cobalt: [47, 91, 255], violet: [123, 92, 255], pink: [255, 111, 168],
  lime: [200, 245, 90], orange: [255, 138, 31], grey: [140, 146, 160], white: [240, 243, 246],
};

function rgbTo256(r, g, b) {
  const c = (v) => Math.round((v / 255) * 5);
  return 16 + 36 * c(r) + 6 * c(g) + c(b);
}
function fg([r, g, b], s) {
  if (NO_COLOR) return s;
  return TRUECOLOR ? `\x1b[38;2;${r};${g};${b}m${s}\x1b[39m` : `\x1b[38;5;${rgbTo256(r, g, b)}m${s}\x1b[39m`;
}
const bold = (s) => (NO_COLOR ? s : `\x1b[1m${s}\x1b[22m`);
const dim = (s) => (NO_COLOR ? s : `\x1b[2m${s}\x1b[22m`);
const c = Object.fromEntries(Object.entries(PALETTE).map(([k, v]) => [k, (s) => fg(v, s)]));

function lerp(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
function gradient(text, stops = [PALETTE.cobalt, PALETTE.violet, PALETTE.pink]) {
  if (NO_COLOR) return text;
  const chars = [...text];
  return chars.map((ch, i) => {
    const t = chars.length < 2 ? 0 : i / (chars.length - 1);
    const seg = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
    const local = t * (stops.length - 1) - seg;
    return fg(lerp(stops[seg], stops[seg + 1], local), ch);
  }).join('');
}

// visible width (strip ANSI)
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const width = (s) => [...strip(s)].length;
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - width(s)));

// ---------- terminal helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, STATIC ? 0 : ms));
const write = (s) => out.write(s);
const hideCursor = () => TTY && write('\x1b[?25l');
const showCursor = () => TTY && write('\x1b[?25h');
const clearLine = () => TTY && write('\r\x1b[2K');
const up = (n) => TTY && n > 0 && write(`\x1b[${n}A`);

process.on('exit', showCursor);
process.on('SIGINT', () => { showCursor(); write('\n'); process.exit(0); });

// ---------- card ----------
function cardLines() {
  const label = (s) => dim(pad(s, 10));
  const name = (s) => bold(pad(s, 13));
  return [
    { kind: 'name', text: 'Omar Albarghouthi' },
    '',
    c.white('AI Engineer') + dim('  ·  ') + 'LLM apps, RAG, agents & evaluation',
    c.lime('●') + ' ' + c.lime('Open to work') + dim('  ·  ') + 'Amman, Jordan  ·  Gulf  ·  Remote',
    '',
    label('Product') + name('NiceTable') + c.cobalt('nice-table.vercel.app'),
    label('Open src') + name('CleanIQ') + 'local-AI file assistant',
    label('') + name('Open WebUI') + '463 Arabic strings ' + c.orange('PR #32289'),
    label('Research') + name('SFA-Bench') + 'state-fabrication attacks on agents',
    '',
    label('GitHub') + c.violet('github.com/ThisisOmar-here'),
    label('LinkedIn') + c.cobalt('linkedin.com/in/omar-albarghouthi'),
    label('Email') + c.pink(LINKS.email),
    '',
    dim('Arabic & English  ·  B.Sc. Software Engineering, 2026'),
  ];
}

function renderLine(line, inner, nameText) {
  const body = typeof line === 'string' ? line : bold(gradient(nameText));
  return dim('│') + '  ' + pad(body, inner) + '  ' + dim('│');
}

async function drawCard() {
  const lines = cardLines();
  const NAME = 'Omar Albarghouthi';
  const inner = Math.max(...lines.map((l) => (typeof l === 'string' ? width(l) : NAME.length)));
  const top = dim('╭' + '─'.repeat(inner + 4) + '╮');
  const bottom = dim('╰' + '─'.repeat(inner + 4) + '╯');
  const cols = out.columns || 100;

  if (inner + 6 > cols) {
    // narrow terminal: no frame
    write('\n  ' + bold(gradient(NAME)) + '\n');
    for (const l of lines.slice(1)) write('  ' + (typeof l === 'string' ? l : '') + '\n');
    return;
  }

  write('\n' + top + '\n');
  if (STATIC) {
    for (const l of lines) write(renderLine(l, inner, NAME) + '\n');
    write(bottom + '\n');
    return;
  }
  // reserve the frame first, then type the name into it
  for (const l of lines) {
    write(renderLine(typeof l === 'string' ? '' : '', inner) + '\n');
    await sleep(14);
  }
  write(bottom + '\n');
  up(lines.length + 1);

  for (const l of lines) {
    if (typeof l === 'string') {
      clearLine();
      write(renderLine(l, inner) + '\n');
      await sleep(l ? 45 : 15);
    } else {
      for (let i = 1; i <= NAME.length; i++) {
        clearLine();
        const typed = NAME.slice(0, i);
        const cursor = i < NAME.length ? c.lime('▌') : '';
        write(dim('│') + '  ' + pad(bold(gradient(typed)) + cursor, inner) + '  ' + dim('│'));
        await sleep(38);
      }
      write('\n');
    }
  }
  // cursor now sits on the bottom border: redraw it and move past
  clearLine();
  write(bottom + '\n');
}

// ---------- boot ----------
async function boot() {
  if (STATIC) return;
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const steps = ['resolving profile', 'loading projects', 'checking open source', 'rendering card'];
  write('\n');
  for (const step of steps) {
    for (let f = 0; f < 6; f++) {
      clearLine();
      write('  ' + c.violet(frames[f % frames.length]) + ' ' + dim(step + '…'));
      await sleep(55);
    }
    clearLine();
    write('  ' + c.lime('✔') + ' ' + step + '\n');
  }
  await sleep(150);
  up(steps.length + 1);
  for (let i = 0; i < steps.length + 1; i++) { clearLine(); write('\n'); }
  up(steps.length + 1);
}

// ---------- actions ----------
function openUrl(url) {
  const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const argv = process.platform === 'win32' ? ['/c', 'start', '""', url.replace(/&/g, '^&')] : [url];
  try {
    const p = spawn(cmd, argv, { stdio: 'ignore', detached: true });
    p.on('error', () => {});
    p.unref();
  } catch (_) { /* no browser available */ }
}

function printProjects() {
  write('\n');
  for (const [title, desc, url] of PROJECTS) {
    write('  ' + bold(pad(title, 18)) + desc + '\n');
    if (url) write('  ' + ' '.repeat(18) + dim(url) + '\n');
  }
  write('\n');
}

const MENU = [
  { label: 'Open NiceTable', run: () => { openUrl(LINKS.nicetable); return 'Opening nice-table.vercel.app'; } },
  { label: 'Browse projects', run: () => { printProjects(); return null; } },
  { label: 'Email Omar', run: () => { openUrl('mailto:' + LINKS.email + '?subject=Hi%20Omar'); return 'Opening your mail app · ' + LINKS.email; } },
  { label: 'Open LinkedIn', run: () => { openUrl(LINKS.linkedin); return 'Opening LinkedIn'; } },
  { label: 'Open GitHub', run: () => { openUrl(LINKS.github); return 'Opening GitHub'; } },
  { label: 'Quit', run: () => 'quit' },
];

function menu() {
  return new Promise((resolve) => {
    let idx = 0;
    const draw = (first) => {
      if (!first) up(MENU.length + 1);
      clearLine();
      write(c.lime('?') + ' ' + bold('What would you like to do?') + dim('  ↑/↓ and enter') + '\n');
      MENU.forEach((m, i) => {
        clearLine();
        write(i === idx ? '  ' + c.pink('❯ ') + bold(gradient(m.label)) + '\n' : '    ' + dim(m.label) + '\n');
      });
    };
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    hideCursor();
    draw(true);
    // collapse the menu into a single answered line
    const collapse = (answer) => {
      up(MENU.length + 1);
      for (let i = 0; i < MENU.length + 1; i++) { clearLine(); write('\n'); }
      up(MENU.length + 1);
      clearLine();
      write(c.lime('?') + ' ' + bold('What would you like to do?') + ' ' + c.pink(answer) + '\n');
    };
    const quit = () => { cleanup(); collapse('Quit'); resolve('quit'); };
    const onKey = (_, key = {}) => {
      if (key.ctrl && key.name === 'c') { quit(); return; }
      if (key.name === 'up' || key.name === 'k') idx = (idx + MENU.length - 1) % MENU.length;
      else if (key.name === 'down' || key.name === 'j' || key.name === 'tab') idx = (idx + 1) % MENU.length;
      else if (key.name === 'q' || key.name === 'escape') { quit(); return; }
      else if (key.name === 'return' || key.name === 'enter') {
        cleanup();
        collapse(MENU[idx].label);
        resolve(MENU[idx].run());
        return;
      }
      draw(false);
    };
    const cleanup = () => {
      process.stdin.removeListener('keypress', onKey);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };
    process.stdin.on('keypress', onKey);
  });
}

// ---------- main ----------
(async () => {
  hideCursor();
  await boot();
  await drawCard();
  showCursor();

  if (STATIC || !process.stdin.isTTY) {
    write('\n  ' + dim('Hiring for an AI or software role? ') + c.pink(LINKS.email) + '\n\n');
    return;
  }

  write('\n');
  for (;;) {
    const result = await menu();
    if (result === 'quit') break;
    if (result) write('  ' + c.lime('✔') + ' ' + result + '\n\n');
  }
  write('\n  ' + gradient('Thanks for stopping by.') + dim('  Talk soon — Omar') + '\n\n');
  showCursor();
  process.exit(0);
})();
