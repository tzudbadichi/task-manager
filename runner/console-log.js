// Console output of the runner. English only - PowerShell consoles do not always show Hebrew correctly -
// and colored by kind: information cyan, success green, warning yellow, error red. Every line also goes,
// with a timestamp and without colors, to the runner's log file.

import { appendFileSync } from 'node:fs';

const COLORS = Object.freeze({ info: '\x1b[96m', success: '\x1b[92m', warning: '\x1b[93m', error: '\x1b[91m' });
const RESET = '\x1b[0m';

export function createConsoleLog({ logFile = null, stream = process.stdout, useColor = Boolean(stream.isTTY) } = {}) {
  const write = (kind, message) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    stream.write(useColor ? `${COLORS[kind]}[${time}] ${message}${RESET}\n` : `[${time}] ${message}\n`);
    if (!logFile) return;
    try {
      appendFileSync(logFile, `${new Date().toISOString()} ${kind.toUpperCase()} ${message}\n`);
    } catch {
      // The console line is enough.
    }
  };
  return {
    info: message => write('info', message),
    success: message => write('success', message),
    warning: message => write('warning', message),
    error: message => write('error', message),
  };
}
