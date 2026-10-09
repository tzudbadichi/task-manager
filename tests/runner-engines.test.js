import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  agentEnvironment, claudeInvocation, codexInvocation, createCodexEventReader, overridingCredentials, parseClaudeOutput,
  quoteForWindowsShell, resolveCommand, runProcess,
} from '../runner/engines.js';
import { buildAgentPrompt, shapeError, shapeSummary, SUMMARY_LIMITS } from '../runner/outcome.js';

const SESSION = '5f0c7a2e-1b3d-4c5e-8f9a-0b1c2d3e4f5a';

const claudeProfile = {
  engine: 'claude', permissionMode: 'acceptEdits', model: null, claudeConfigDir: 'C:\\Users\\me\\.claude-work',
  allowedTools: ['Bash(npm test *)'], disallowedTools: ['Bash(git push *)'],
};
const codexProfile = { engine: 'codex', sandbox: 'workspace-write', model: 'gpt-5', codexHome: 'C:\\Users\\me\\.codex-personal' };

describe('agent command lines', () => {
  test('claude: a new conversation uses the chosen session id, a later one resumes it; the account comes from CLAUDE_CONFIG_DIR', () => {
    const first = claudeInvocation({ profile: claudeProfile, sessionId: SESSION, isNewConversation: true });
    assert.deepEqual(first.args, [
      '-p', '--output-format', 'json', '--permission-mode', 'acceptEdits', '--permission-prompts', 'none',
      '--session-id', SESSION, '--allowedTools', 'Bash(npm test *)', '--disallowedTools', 'Bash(git push *)',
    ]);
    assert.equal(first.env.CLAUDE_CONFIG_DIR, 'C:\\Users\\me\\.claude-work');
    const later = claudeInvocation({ profile: { ...claudeProfile, allowedTools: [], claudeConfigDir: null }, sessionId: SESSION, isNewConversation: false });
    assert.ok(later.args.includes('--resume'));
    assert.ok(!later.args.includes('--allowedTools'));
    assert.equal(Object.hasOwn(later.env, 'CLAUDE_CONFIG_DIR'), false);
    assert.throws(() => claudeInvocation({ profile: claudeProfile, sessionId: '--dangerously-skip-permissions', isNewConversation: true }));
  });

  test('codex: exec for a new thread, exec resume for a known one; the message comes from stdin; the account from CODEX_HOME', () => {
    const first = codexInvocation({ profile: codexProfile, threadId: null, lastMessageFile: 'C:\\tmp\\j1.txt' });
    assert.deepEqual(first.args, [
      'exec', '--json', '-o', 'C:\\tmp\\j1.txt', '-c', 'sandbox_mode=workspace-write', '-c', 'approval_policy=never', '-m', 'gpt-5', '-',
    ]);
    assert.equal(first.env.CODEX_HOME, 'C:\\Users\\me\\.codex-personal');
    const later = codexInvocation({ profile: { ...codexProfile, model: null }, threadId: SESSION, lastMessageFile: 'f', skipGitRepoCheck: true });
    assert.deepEqual(later.args.slice(0, 2), ['exec', 'resume']);
    assert.deepEqual(later.args.slice(-3), ['--skip-git-repo-check', SESSION, '-']);
    assert.throws(() => codexInvocation({ profile: codexProfile, threadId: 'not-a-uuid', lastMessageFile: 'f' }));
  });

  test('the agent environment cannot be switched to another account from outside the profile', () => {
    const machine = {
      Path: 'C:\\tools', claude_config_dir: 'C:\\Users\\me\\.claude-personal', CODEX_HOME: 'C:\\x',
      OPENAI_API_KEY: 'sk-other', ANTHROPIC_API_KEY: 'sk-ant',
    };
    const forClaude = agentEnvironment(claudeProfile, machine);
    assert.equal(forClaude.CLAUDE_CONFIG_DIR, 'C:\\Users\\me\\.claude-work');
    assert.equal(Object.hasOwn(forClaude, 'claude_config_dir'), false, 'names compare case-insensitively');
    assert.equal(Object.hasOwn(forClaude, 'CODEX_HOME'), false);
    assert.equal(Object.hasOwn(forClaude, 'OPENAI_API_KEY'), false, 'the other engine\'s credentials never reach it');
    assert.equal(forClaude.Path, 'C:\\tools');
    const forCodex = agentEnvironment({ ...codexProfile, codexHome: null }, machine);
    assert.equal(Object.hasOwn(forCodex, 'CODEX_HOME'), false, 'a global CODEX_HOME is dropped: the default account is used');
    assert.equal(Object.hasOwn(forCodex, 'ANTHROPIC_API_KEY'), false);
    assert.deepEqual(overridingCredentials(claudeProfile, machine), ['ANTHROPIC_API_KEY']);
    assert.deepEqual(overridingCredentials(codexProfile, { PATH: 'x' }), []);
  });
});

describe('agent output', () => {
  test('parseClaudeOutput reads the final JSON result', () => {
    const ok = parseClaudeOutput(`noise\n${JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: 'Fixed it', session_id: SESSION, total_cost_usd: 0.12 })}\n`);
    assert.deepEqual(ok, { ok: true, text: 'Fixed it', sessionId: SESSION, error: null, costUsd: 0.12 });
    const failed = parseClaudeOutput(JSON.stringify({ type: 'result', subtype: 'error_max_turns', is_error: true, session_id: SESSION }));
    assert.equal(failed.ok, false);
    assert.match(failed.error, /error_max_turns/);
    assert.equal(parseClaudeOutput('not json at all').ok, false);
  });

  test('the codex event reader finds the thread, the last agent message and errors', () => {
    const reader = createCodexEventReader();
    reader.push(JSON.stringify({ type: 'thread.started', thread_id: SESSION }));
    reader.push('garbage');
    reader.push(JSON.stringify({ type: 'item.completed', item: { type: 'reasoning', text: 'thinking' } }));
    reader.push(JSON.stringify({ type: 'item.completed', item: { type: 'agent_message', text: 'Done: 2 files' } }));
    assert.deepEqual(reader.result(), { threadId: SESSION, lastAgentMessage: 'Done: 2 files', lastError: null, turnFailed: false });
    reader.push(JSON.stringify({ type: 'error', message: 'Reconnecting... 1/5' }));
    assert.equal(reader.result().turnFailed, false, 'a retry message alone is not a failure');
    reader.push(JSON.stringify({ type: 'turn.failed', error: { message: 'usage limit' } }));
    assert.deepEqual([reader.result().turnFailed, reader.result().lastError], [true, 'usage limit']);
  });
});

describe('finding the CLI on Windows', () => {
  const files = new Map([
    ['C:\\npm\\claude.cmd', '@ECHO off\r\n"%dp0%\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe"   %*\r\n'],
    ['C:\\npm\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe', ''],
    ['C:\\npm\\codex.cmd', 'IF EXIST "%dp0%\\node.exe" (\r\n"%_prog%"  "%dp0%\\node_modules\\@openai\\codex\\bin\\codex.js" %*\r\n'],
    ['C:\\npm\\node_modules\\@openai\\codex\\bin\\codex.js', ''],
    ['C:\\npm\\odd.cmd', '@echo off\r\nsomething else %*'],
    ['C:\\tools\\git.exe', ''],
  ]);
  const env = { PATH: 'C:\\tools;C:\\npm', PATHEXT: '.COM;.EXE;.BAT;.CMD' };
  const fs = { platform: 'win32', env, fileExists: file => files.has(file), readText: file => files.get(file) };

  test('npm wrappers are resolved to their real target, so no shell is involved', () => {
    assert.deepEqual(resolveCommand('claude', fs), {
      file: 'C:\\npm\\node_modules\\@anthropic-ai\\claude-code\\bin\\claude.exe', prefixArgs: [], shell: false,
    });
    assert.deepEqual(resolveCommand('codex', fs), {
      file: process.execPath, prefixArgs: ['C:\\npm\\node_modules\\@openai\\codex\\bin\\codex.js'], shell: false,
    });
    assert.deepEqual(resolveCommand('git', fs), { file: 'C:\\tools\\git.exe', prefixArgs: [], shell: false });
  });

  test('an unknown .cmd falls back to the shell; a name not in PATH is not started at all; other systems use the name as is', () => {
    assert.deepEqual(resolveCommand('odd', fs), { file: 'C:\\npm\\odd.cmd', prefixArgs: [], shell: true });
    assert.equal(resolveCommand('missing-tool', fs).file, null);
    assert.deepEqual(resolveCommand('claude', { platform: 'linux' }), { file: 'claude', prefixArgs: [], shell: false });
  });

  test('arguments for the shell fallback are quoted, and characters cmd.exe expands are refused', () => {
    assert.equal(quoteForWindowsShell('Bash(npm test *)'), '"Bash(npm test *)"');
    for (const unsafe of ['%PATH%', 'a"b', 'hi!', 'x^y', 'line\nbreak']) assert.throws(() => quoteForWindowsShell(unsafe));
  });
});

describe('runProcess', () => {
  const node = process.execPath;

  test('passes the message through stdin and collects stdout lines', async () => {
    const lines = [];
    const result = await runProcess({
      command: node, args: ['-e', 'process.stdin.on("data", d => process.stdout.write("got:" + d + "\\nsecond line\\n"))'],
      input: 'hello', timeoutMs: 20_000, onStdoutLine: line => lines.push(line),
    });
    assert.equal(result.exitCode, 0);
    assert.deepEqual(lines, ['got:hello', 'second line']);
  });

  test('an abort stops the process and reports it as cancelled', async () => {
    const controller = new AbortController();
    const running = runProcess({ command: node, args: ['-e', 'setTimeout(() => {}, 60000)'], input: '', timeoutMs: 60_000, signal: controller.signal });
    setTimeout(() => controller.abort(), 200);
    const result = await running;
    assert.equal(result.cancelled, true);
    assert.equal(result.timedOut, false);
  });

  test('a process that runs too long is stopped', async () => {
    const result = await runProcess({ command: node, args: ['-e', 'setTimeout(() => {}, 60000)'], input: '', timeoutMs: 300 });
    assert.equal(result.timedOut, true);
  });

  test('a missing program is reported, not thrown', async () => {
    const result = await runProcess({ command: 'definitely-not-a-real-program-xyz', args: [], input: '', timeoutMs: 5000 });
    assert.ok(result.startError);
  });
});

describe('what goes to the agent and back to the cloud', () => {
  test('the first message of a conversation carries the reporting instructions (minimal: also "no code")', () => {
    const minimal = buildAgentPrompt('Fix the login', { isNewConversation: true, cloudReport: 'minimal' });
    assert.ok(minimal.startsWith('Fix the login\n\n---\n'));
    assert.match(minimal, /אל תכלול בו קוד/);
    assert.doesNotMatch(buildAgentPrompt('x', { isNewConversation: true, cloudReport: 'full' }), /אל תכלול בו קוד/);
    assert.equal(buildAgentPrompt('yes, go on', { isNewConversation: false, cloudReport: 'minimal' }), 'yes, go on');
  });

  test('minimal summaries lose code blocks and are cut short; full ones keep them', () => {
    const answer = `Fixed the bug.\n\`\`\`js\nconst secret = 1;\n\`\`\`\nAlso: \`${'x'.repeat(70)}\`\nDone.`;
    const minimal = shapeSummary(answer, 'minimal');
    assert.doesNotMatch(minimal, /const secret/);
    assert.doesNotMatch(minimal, /x{70}/);
    assert.match(minimal, /Fixed the bug\./);
    assert.match(shapeSummary(answer, 'full'), /const secret/);
    assert.ok(shapeSummary('a'.repeat(5000), 'minimal').length <= SUMMARY_LIMITS.minimal);
    assert.ok(shapeSummary('a'.repeat(20000), 'full').length <= SUMMARY_LIMITS.full);
    assert.equal(shapeSummary('   ', 'full'), null);
    assert.match(shapeSummary('open block ```js\nconst a = 1;', 'minimal'), /^open block \[קוד הושמט/);
  });

  test('errors are shortened (more so in minimal mode)', () => {
    assert.ok(shapeError('e'.repeat(5000), 'minimal').length <= 500);
    assert.ok(shapeError('e'.repeat(5000), 'full').length <= 1000);
    assert.equal(shapeError('', 'full'), 'הריצה נכשלה');
  });
});
