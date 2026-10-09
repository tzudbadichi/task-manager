// Running the agents: Claude Code (claude -p) and Codex (codex exec), headless, in a job's work folder.
//
// The message always goes in through stdin - never on the command line - so its text cannot be read as
// options or reach a shell. Each profile's account is picked with an environment variable:
// CLAUDE_CONFIG_DIR for Claude Code, CODEX_HOME for Codex (empty = the default account of this Windows user).
// The agent's environment is cleaned first (agentEnvironment), so a variable set globally on the machine
// cannot quietly switch a profile to another account.

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { readFile, rm } from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_TAIL_BYTES = 4 * 1024 * 1024;
const STDERR_TAIL_BYTES = 64 * 1024;
const KILL_GRACE_MS = 5000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Arguments that pass through a Windows shell (only when the agent CLI is a .cmd without a known target).
const SHELL_UNSAFE = /["%!^\r\n]/;

// The variable that picks each engine's account folder, and the credentials each engine reads directly.
const ACCOUNT_FOLDER_VARIABLE = Object.freeze({ claude: 'CLAUDE_CONFIG_DIR', codex: 'CODEX_HOME' });
export const CREDENTIAL_VARIABLES = Object.freeze({
  claude: Object.freeze(['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_OAUTH_TOKEN']),
  codex: Object.freeze(['OPENAI_API_KEY', 'CODEX_API_KEY']),
});

/**
 * The environment an agent runs with: the machine's environment without the other engine's account and
 * credentials, and with this engine's account folder set only from the profile (a global CLAUDE_CONFIG_DIR or
 * CODEX_HOME is removed). Names are compared case-insensitively - Windows does not tell Path from PATH.
 */
export function agentEnvironment(profile, baseEnv = process.env) {
  const otherEngine = profile.engine === 'claude' ? 'codex' : 'claude';
  const removed = new Set([
    ACCOUNT_FOLDER_VARIABLE.claude, ACCOUNT_FOLDER_VARIABLE.codex, ...CREDENTIAL_VARIABLES[otherEngine],
  ]);
  const env = {};
  for (const [name, value] of Object.entries(baseEnv)) {
    if (!removed.has(name.toUpperCase())) env[name] = value;
  }
  const accountFolder = profile.engine === 'claude' ? profile.claudeConfigDir : profile.codexHome;
  if (accountFolder) env[ACCOUNT_FOLDER_VARIABLE[profile.engine]] = accountFolder;
  return env;
}

/** Credentials of a profile's own engine that are set on the machine - they would win over its account folder. */
export function overridingCredentials(profile, baseEnv = process.env) {
  const names = new Set(Object.keys(baseEnv).filter(name => baseEnv[name]).map(name => name.toUpperCase()));
  return CREDENTIAL_VARIABLES[profile.engine].filter(name => names.has(name));
}

// ---------------------------------------------------------------------------
// Command lines
// ---------------------------------------------------------------------------

/** claude -p: first message with a session id chosen here, later ones resume it. */
export function claudeInvocation({ profile, sessionId, isNewConversation }) {
  if (!UUID_PATTERN.test(sessionId ?? '')) throw new Error('Invalid Claude session id');
  const args = [
    '-p', '--output-format', 'json',
    '--permission-mode', profile.permissionMode,
    // Nobody sits at this machine to answer: anything that would ask for permission is refused.
    '--permission-prompts', 'none',
    ...(isNewConversation ? ['--session-id', sessionId] : ['--resume', sessionId]),
    ...(profile.model ? ['--model', profile.model] : []),
    ...(profile.allowedTools.length > 0 ? ['--allowedTools', ...profile.allowedTools] : []),
    ...(profile.disallowedTools.length > 0 ? ['--disallowedTools', ...profile.disallowedTools] : []),
  ];
  return { args, env: agentEnvironment(profile) };
}

/** codex exec (new thread) or codex exec resume <thread> - the message is read from stdin ("-"). */
export function codexInvocation({ profile, threadId, lastMessageFile, skipGitRepoCheck = false }) {
  if (threadId !== null && !UUID_PATTERN.test(threadId ?? '')) throw new Error('Invalid Codex thread id');
  const common = [
    '--json', '-o', lastMessageFile,
    // resume has no --sandbox option; config overrides work for both. Nobody can approve anything here.
    '-c', `sandbox_mode=${profile.sandbox}`,
    '-c', 'approval_policy=never',
    ...(profile.model ? ['-m', profile.model] : []),
    ...(skipGitRepoCheck ? ['--skip-git-repo-check'] : []),
  ];
  const args = threadId ? ['exec', 'resume', ...common, threadId, '-'] : ['exec', ...common, '-'];
  return { args, env: agentEnvironment(profile) };
}

// ---------------------------------------------------------------------------
// Output parsing
// ---------------------------------------------------------------------------

/** The result of claude -p --output-format json: the last JSON object it printed. */
export function parseClaudeOutput(stdout) {
  const lines = String(stdout ?? '').split(/\r?\n/).map(line => line.trim()).filter(line => line.startsWith('{'));
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    let result;
    try {
      result = JSON.parse(lines[index]);
    } catch {
      continue;
    }
    if (!result || typeof result !== 'object') continue;
    const text = typeof result.result === 'string' ? result.result : '';
    const isError = result.is_error === true || (typeof result.subtype === 'string' && result.subtype !== 'success');
    return {
      ok: !isError,
      text,
      sessionId: typeof result.session_id === 'string' ? result.session_id : null,
      error: isError ? (text || `Claude Code stopped (${result.subtype ?? 'error'})`) : null,
      costUsd: Number.isFinite(result.total_cost_usd) ? result.total_cost_usd : null,
    };
  }
  return { ok: false, text: '', sessionId: null, error: 'Claude Code did not return a result', costUsd: null };
}

/**
 * Reads codex exec --json events line by line: the thread id, the last agent message, the last error, and
 * whether the turn failed. An "error" event alone is not a failure - Codex also reports retries (reconnecting)
 * that way and then finishes the turn; only turn.failed (or a non-zero exit code) is.
 */
export function createCodexEventReader() {
  let threadId = null;
  let lastAgentMessage = '';
  let lastError = null;
  let turnFailed = false;
  return {
    push(line) {
      let event;
      try {
        event = JSON.parse(line);
      } catch {
        return;
      }
      if (!event || typeof event !== 'object') return;
      const id = event.thread_id ?? event.session_id ?? null;
      if (!threadId && typeof id === 'string' && UUID_PATTERN.test(id)) threadId = id;
      const item = event.item;
      if (event.type === 'item.completed' && item?.type === 'agent_message' && typeof item.text === 'string') lastAgentMessage = item.text;
      if (event.type === 'turn.failed') {
        turnFailed = true;
        lastError = event.error?.message ?? 'Codex turn failed';
      }
      if (event.type === 'error' && typeof event.message === 'string') lastError = event.message;
    },
    result: () => ({ threadId, lastAgentMessage, lastError, turnFailed }),
  };
}

// ---------------------------------------------------------------------------
// Finding and starting the CLI
// ---------------------------------------------------------------------------

/**
 * How to start a command without a shell. On Windows the npm-installed CLIs are .cmd wrappers; their
 * real target (claude.exe, codex.js) is read from the wrapper and started directly. Only when that fails
 * does it fall back to a shell, with every argument checked and quoted. A bare name that is not found in
 * PATH gives file: null - starting it anyway would let Windows pick a same-named program in the work folder.
 * Returns { file, prefixArgs, shell }.
 */
export function resolveCommand(command, { platform = process.platform, env = process.env, fileExists = existsSync, readText = file => readFileSync(file, 'utf8') } = {}) {
  if (platform !== 'win32') return { file: command, prefixArgs: [], shell: false };
  const pathModule = path.win32;
  const fromFile = file => {
    const extension = pathModule.extname(file).toLowerCase();
    if (extension === '.js' || extension === '.mjs') return { file: process.execPath, prefixArgs: [file], shell: false };
    if (extension === '.cmd' || extension === '.bat') return npmShimTarget(file, { fileExists, readText }) ?? { file, prefixArgs: [], shell: true };
    return { file, prefixArgs: [], shell: false };
  };
  if (/[\\/]/.test(command)) return fromFile(command);
  const extensions = (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean);
  const hasExtension = pathModule.extname(command) !== '';
  for (const folder of (env.PATH ?? env.Path ?? '').split(';').filter(Boolean)) {
    for (const extension of hasExtension ? [''] : extensions) {
      const candidate = pathModule.join(folder, `${command}${extension.toLowerCase()}`);
      if (fileExists(candidate)) return fromFile(candidate);
    }
  }
  return { file: null, prefixArgs: [], shell: false };
}

// npm writes wrappers like:  "%dp0%\node_modules\@anthropic-ai\claude-code\bin\claude.exe"   %*
// (a wrapper of a .js package also mentions "%dp0%\node.exe" first - only the node_modules target counts).
function npmShimTarget(shimFile, { fileExists, readText }) {
  let text;
  try {
    text = readText(shimFile);
  } catch {
    return null;
  }
  const relativeTarget = [...text.matchAll(/"%dp0%\\([^"]+\.(?:exe|js))"/gi)].map(match => match[1]).find(item => /^node_modules\\/i.test(item));
  if (!relativeTarget) return null;
  const target = path.win32.join(path.win32.dirname(shimFile), relativeTarget);
  if (!fileExists(target)) return null;
  return target.toLowerCase().endsWith('.js')
    ? { file: process.execPath, prefixArgs: [target], shell: false }
    : { file: target, prefixArgs: [], shell: false };
}

/** Quotes one argument for cmd.exe. Refuses characters cmd would expand even inside quotes. */
export function quoteForWindowsShell(arg) {
  if (SHELL_UNSAFE.test(arg)) throw new Error(`Argument not allowed through the Windows shell: ${arg}`);
  return `"${arg}"`;
}

function killTree(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }).on('error', () => {});
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
    setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        // Already gone.
      }
    }, KILL_GRACE_MS).unref();
  }
}

function appendTail(current, chunk, limit) {
  const next = current + chunk;
  return next.length > limit ? next.slice(next.length - limit) : next;
}

/**
 * Starts a process, writes input to its stdin, and waits for it to end - or for the timeout, or for the
 * abort signal (then the whole process tree is killed). Every output line also goes to log (a writable).
 * env is the complete environment of the process (agentEnvironment for agents).
 * Resolves { exitCode, stdout (tail), stderr (tail), timedOut, cancelled, startError }.
 */
export function runProcess({ command, args, env = process.env, cwd, input, timeoutMs, signal, log = null, onStdoutLine = null }) {
  return new Promise(resolve => {
    const resolved = resolveCommand(command);
    if (!resolved.file) {
      resolve({ exitCode: null, stdout: '', stderr: '', timedOut: false, cancelled: false, startError: `"${command}" was not found in PATH` });
      return;
    }
    const fullArgs = [...resolved.prefixArgs, ...args];
    let child;
    try {
      child = resolved.shell
        ? spawn([quoteForWindowsShell(resolved.file), ...fullArgs.map(quoteForWindowsShell)].join(' '), {
          cwd, env, shell: true, windowsHide: true,
        })
        : spawn(resolved.file, fullArgs, {
          cwd, env, windowsHide: true, detached: process.platform !== 'win32',
        });
    } catch (error) {
      resolve({ exitCode: null, stdout: '', stderr: '', timedOut: false, cancelled: false, startError: error.message });
      return;
    }

    let stdout = '';
    let stderr = '';
    let pendingLine = '';
    let timedOut = false;
    let cancelled = false;
    let settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      resolve(result);
    };
    const onAbort = () => {
      cancelled = true;
      killTree(child);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      killTree(child);
    }, timeoutMs);
    if (signal?.aborted) onAbort();
    else signal?.addEventListener('abort', onAbort, { once: true });

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdout = appendTail(stdout, chunk, OUTPUT_TAIL_BYTES);
      log?.write(chunk);
      if (!onStdoutLine) return;
      const lines = (pendingLine + chunk).split(/\r?\n/);
      pendingLine = lines.pop();
      for (const line of lines) if (line.trim()) onStdoutLine(line);
    });
    child.stderr.on('data', chunk => {
      stderr = appendTail(stderr, chunk, STDERR_TAIL_BYTES);
      log?.write(chunk);
    });
    child.on('error', error => finish({ exitCode: null, stdout, stderr, timedOut, cancelled, startError: error.message }));
    child.on('close', exitCode => {
      if (onStdoutLine && pendingLine.trim()) onStdoutLine(pendingLine);
      finish({ exitCode, stdout, stderr, timedOut, cancelled, startError: null });
    });

    child.stdin.on('error', () => {}); // the process may exit before reading everything
    child.stdin.end(input ?? '');
  });
}

function lastLines(text, count = 12) {
  return String(text ?? '').trim().split(/\r?\n/).slice(-count).join('\n');
}

function processFailure(run, engineLabel, timeoutMs) {
  if (run.cancelled) return 'הריצה בוטלה לפי בקשה';
  if (run.timedOut) return `האייג'נט לא סיים תוך ${Math.round(timeoutMs / 60000)} דקות, והריצה נעצרה`;
  if (run.startError) return `${engineLabel} לא הופעל: ${run.startError}`;
  return null;
}

// ---------------------------------------------------------------------------
// One message to one agent
// ---------------------------------------------------------------------------

/**
 * Sends one message to the agent of a conversation and waits for its answer.
 * conversation: { engine, sessionId (claude: chosen in advance; codex: null until its first answer), started }.
 * Resolves { ok, text, sessionId, error, cancelled, timedOut } - never throws for agent failures.
 */
export async function runAgent({ profile, conversation, prompt, cwd, timeoutMs, signal, log, tmpDir, jobId, skipGitRepoCheck = false }) {
  if (profile.engine === 'claude') {
    const { args, env } = claudeInvocation({ profile, sessionId: conversation.sessionId, isNewConversation: !conversation.started });
    const run = await runProcess({ command: profile.command, args, env, cwd, input: prompt, timeoutMs, signal, log });
    const failure = processFailure(run, 'Claude Code', timeoutMs);
    if (failure) return { ok: false, text: '', sessionId: null, error: failure, cancelled: run.cancelled, timedOut: run.timedOut };
    const parsed = parseClaudeOutput(run.stdout);
    if (!parsed.ok && !parsed.text) parsed.error = lastLines(run.stderr) || parsed.error;
    return { ...parsed, cancelled: false, timedOut: false };
  }

  const lastMessageFile = path.join(tmpDir, `${jobId}.last-message.txt`);
  const reader = createCodexEventReader();
  const { args, env } = codexInvocation({ profile, threadId: conversation.sessionId, lastMessageFile, skipGitRepoCheck });
  const run = await runProcess({ command: profile.command, args, env, cwd, input: prompt, timeoutMs, signal, log, onStdoutLine: reader.push });
  const events = reader.result();
  let text = events.lastAgentMessage;
  try {
    text = (await readFile(lastMessageFile, 'utf8')).trim() || text;
  } catch {
    // No file: keep the message seen in the events.
  }
  await rm(lastMessageFile, { force: true });
  const sessionId = events.threadId ?? conversation.sessionId;
  const failure = processFailure(run, 'Codex', timeoutMs);
  if (failure) return { ok: false, text, sessionId, error: failure, cancelled: run.cancelled, timedOut: run.timedOut };
  if (run.exitCode !== 0 || events.turnFailed) {
    return { ok: false, text, sessionId, error: events.lastError ?? (lastLines(run.stderr) || `Codex exited with code ${run.exitCode}`), cancelled: false, timedOut: false };
  }
  return { ok: true, text, sessionId, error: null, cancelled: false, timedOut: false };
}
