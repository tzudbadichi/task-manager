// Agent farm runner: runs on a dev machine, takes the jobs the board sends to this machine, runs Claude Code
// or Codex in the project's work folder, and reports back. See Kingdom_of_Claudes_Beloved_MDs/AGENT_FARM.md
// and the setup guide html/agent-farm-setup-guide.html.
//
//   node runner/runner.js           start (the default): wait for jobs and run them, until Ctrl+C
//   node runner/runner.js login     sign in with the board's account (the password itself is not stored)
//   node runner/runner.js logout    forget the sign-in on this machine
//   node runner/runner.js check     check the config, the agent CLIs and the sign-in, then exit
//
// Option: --config <file>   (default: runner/runner.config.json, or the TASK_MANAGER_RUNNER_CONFIG variable)

import { createWriteStream, existsSync, rmSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { loadConfig, parseSiteConfig } from './config.js';
import { createConsoleLog } from './console-log.js';
import { agentEnvironment, overridingCredentials, resolveCommand, runAgent, runProcess } from './engines.js';
import { countChangedFiles, isGitFolder, prepareWorktree } from './git.js';
import { loadLocalState } from './local-state.js';
import { createRunnerRemote } from './remote.js';
import { createRunnerSupabase } from './supabase-node.js';
import { createWorker } from './worker.js';

const RUNNER_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG_FILE = path.join(RUNNER_DIR, 'runner.config.json');
const SITE_CONFIG_FILE = path.join(RUNNER_DIR, '..', 'src', 'config.js');
const COMMANDS = Object.freeze(['start', 'login', 'logout', 'check']);
const KEEP_JOB_LOGS_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_ATTEMPTS = 20;
const SESSION_RETRY_MS = 30_000;

function parseArguments(argv) {
  let command = 'start';
  let configFile = process.env.TASK_MANAGER_RUNNER_CONFIG || DEFAULT_CONFIG_FILE;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--config') configFile = argv[++index] ?? configFile;
    else command = argv[index];
  }
  return { command, configFile: path.resolve(configFile) };
}

/** The board's Supabase project: from the runner config, else from the site's src/config.js (same values). */
async function resolveSupabaseSettings(config) {
  if (config.supabaseUrl && config.supabaseAnonKey) return { url: config.supabaseUrl, key: config.supabaseAnonKey };
  const site = parseSiteConfig(await readFile(SITE_CONFIG_FILE, 'utf8').catch(() => ''));
  if (site.url && site.key) return site;
  throw new Error('Supabase is not configured. Set supabaseUrl and supabaseAnonKey in the runner config (the same values the board uses).');
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, answer => {
    rl.close();
    resolve(answer);
  }));
}

/** Reads a line without showing it (the password). */
function askHidden(question) {
  const input = process.stdin;
  if (!input.isTTY) return ask(question);
  return new Promise((resolve, reject) => {
    process.stdout.write(question);
    let value = '';
    const cleanup = () => {
      input.off('data', onData);
      input.setRawMode(false);
      input.pause();
      process.stdout.write('\n');
    };
    const onData = chunk => {
      for (const character of chunk) {
        if (character === '\r' || character === '\n') {
          cleanup();
          resolve(value);
          return;
        }
        if (character === '\u0003') {
          cleanup();
          reject(new Error('Cancelled'));
          return;
        }
        if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
        else value += character;
      }
    };
    input.setRawMode(true);
    input.setEncoding('utf8');
    input.resume();
    input.on('data', onData);
  });
}

async function login(client, log) {
  log.info('Sign in with the same account you use on the board. The password is not stored - only the session.');
  const email = (await ask('Email: ')).trim();
  const password = await askHidden('Password: ');
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    log.error(`Sign-in failed: ${error.message}`);
    return 1;
  }
  log.success(`Signed in as ${data.user.email}. Start the runner with: npm run runner`);
  return 0;
}

async function logout(client, log) {
  await client.auth.signOut({ scope: 'local' });
  log.success('Signed out on this machine');
  return 0;
}

async function check(config, client, log) {
  let problems = 0;
  log.info(`Runner "${config.runnerName}" - state folder: ${config.stateDir}`);
  for (const profile of Object.values(config.profiles)) {
    const account = profile.engine === 'claude' ? (profile.claudeConfigDir ?? 'default ~/.claude') : (profile.codexHome ?? 'default ~/.codex');
    log.info(`Profile "${profile.name}": ${profile.engine}, account folder ${account}, cloud report ${profile.cloudReport}`);
    log.info(`  may work in: ${profile.allowedRoots.join(', ')}`);
    const resolved = resolveCommand(profile.command);
    const version = await runProcess({
      command: profile.command, args: ['--version'], env: agentEnvironment(profile), cwd: RUNNER_DIR, input: '', timeoutMs: 30_000,
    });
    if (version.exitCode === 0) log.success(`  ${profile.command}: ${version.stdout.trim().split(/\r?\n/)[0]} (${resolved.file})`);
    else {
      problems += 1;
      log.error(`  ${profile.command} did not run: ${version.startError ?? (version.stderr.trim() || `exit code ${version.exitCode}`)}`);
    }
    for (const name of overridingCredentials(profile)) {
      problems += 1;
      log.warning(`  ${name} is set on this machine: ${profile.engine} would use it instead of the account folder of profile "${profile.name}". Remove it, or make sure it belongs to that account.`);
    }
  }
  for (const project of config.projects) {
    if (!existsSync(project.path)) {
      problems += 1;
      log.error(`Project "${project.key}": folder not found: ${project.path}`);
      continue;
    }
    const isGit = await isGitFolder(project.path);
    if (project.isolation === 'worktree' && !isGit) {
      problems += 1;
      log.error(`Project "${project.key}": not a git repository - use "isolation": "none" or init git`);
      continue;
    }
    log.success(`Project "${project.key}" -> profile "${project.profile}", ${project.isolation}${isGit ? ', git' : ''}`);
  }
  const { data } = await client.auth.getSession();
  if (data.session) log.success(`Signed in as ${data.session.user.email}`);
  else {
    problems += 1;
    log.warning('Not signed in on this machine yet. Run: npm run runner:login');
  }
  if (problems === 0) log.success('All checks passed');
  else log.warning(`${problems} problem(s) found`);
  return problems === 0 ? 0 : 1;
}

async function removeOldJobLogs(logsDir) {
  const cutoff = Date.now() - KEEP_JOB_LOGS_DAYS * DAY_MS;
  for (const name of await readdir(logsDir).catch(() => [])) {
    const file = path.join(logsDir, name);
    const info = await stat(file).catch(() => null);
    if (info?.isFile() && info.mtimeMs < cutoff) await rm(file, { force: true });
  }
}

/**
 * The saved sign-in. When the session needs a refresh and the network is not up yet (say, right after logging
 * in to Windows), it keeps trying for a while instead of giving up.
 */
async function waitForSession(client, log) {
  for (let attempt = 1; ; attempt += 1) {
    const { data, error } = await client.auth.getSession();
    if (data.session) return data.session;
    if (!error || attempt >= SESSION_ATTEMPTS) return null;
    log.warning(`Could not reach Supabase to restore the sign-in (${error.message}) - retrying in ${SESSION_RETRY_MS / 1000} seconds`);
    await new Promise(resolve => setTimeout(resolve, SESSION_RETRY_MS));
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM'; // exists, but belongs to someone else
  }
}

/**
 * One runner per state folder: two would close each other's running jobs and share state.json and the work
 * folders. The lock holds the process id; a lock left by a runner that did not exit cleanly is taken over.
 */
async function acquireRunnerLock(lockFile) {
  try {
    await writeFile(lockFile, String(process.pid), { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const ownerPid = Number.parseInt(await readFile(lockFile, 'utf8').catch(() => ''), 10);
    if (Number.isInteger(ownerPid) && ownerPid !== process.pid && isProcessAlive(ownerPid)) return ownerPid;
    await writeFile(lockFile, String(process.pid));
  }
  process.on('exit', () => {
    try {
      rmSync(lockFile, { force: true });
    } catch {
      // Nothing to do while exiting.
    }
  });
  return null;
}

async function start(config, client, log) {
  const lockOwner = await acquireRunnerLock(path.join(config.stateDir, 'runner.lock'));
  if (lockOwner !== null) {
    log.error(`Another runner is already running with this state folder (process ${lockOwner}). Stop it first.`);
    return 1;
  }
  const session = await waitForSession(client, log);
  if (!session) {
    log.warning('Not signed in on this machine. Run first: npm run runner:login');
    return 1;
  }
  client.auth.startAutoRefresh();

  const localState = loadLocalState(path.join(config.stateDir, 'state.json'));
  await localState.save();
  const logsDir = path.join(config.stateDir, 'logs');
  const tmpDir = path.join(config.stateDir, 'tmp');
  await mkdir(logsDir, { recursive: true });
  await mkdir(tmpDir, { recursive: true });
  await removeOldJobLogs(logsDir);

  const worker = createWorker({
    config,
    remote: createRunnerRemote(client, { runnerId: localState.runnerId }),
    localState,
    log,
    runAgent,
    prepareWorktree,
    countChangedFiles,
    isGitFolder,
    openJobLog: async jobId => {
      const stream = createWriteStream(path.join(logsDir, `${jobId}.log`), { flags: 'a', encoding: 'utf8' });
      stream.on('error', error => log.warning(`Job log ${jobId}.log could not be written: ${error.message}`));
      return stream;
    },
    tmpDir,
  });

  log.info(`Runner "${config.runnerName}" starting as ${session.user.email}: ${config.projects.length} project(s), up to ${config.maxParallelJobs} job(s) at once`);
  for (const project of config.projects) {
    const profile = config.profiles[project.profile];
    log.info(`  ${project.key} -> profile "${profile.name}" (${profile.engine}, cloud report ${profile.cloudReport})`);
  }
  await worker.start();
  log.success(`Runner is up. Job logs: ${logsDir}. Waiting for jobs from the board (Ctrl+C to stop).`);

  let isStopping = false;
  const shutdown = async signalName => {
    if (isStopping) return;
    isStopping = true;
    log.warning(`Stopping (${signalName}) - running agents are stopped and reported...`);
    await worker.stop();
    log.info('Runner stopped');
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('Ctrl+C'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  return null; // keeps running
}

async function main() {
  const { command, configFile } = parseArguments(process.argv.slice(2));
  const bootLog = createConsoleLog();
  if (!COMMANDS.includes(command)) {
    bootLog.error(`Unknown command "${command}". Use one of: ${COMMANDS.join(', ')}`);
    return 1;
  }
  let config;
  try {
    config = await loadConfig(configFile);
  } catch (error) {
    bootLog.error(error.message);
    return 1;
  }
  await mkdir(config.stateDir, { recursive: true });
  const log = createConsoleLog({ logFile: path.join(config.stateDir, 'runner.log') });
  process.on('unhandledRejection', error => log.error(`Unexpected error: ${error?.stack ?? error}`));

  let client;
  try {
    client = createRunnerSupabase({ ...(await resolveSupabaseSettings(config)), authFile: path.join(config.stateDir, 'auth.json') });
  } catch (error) {
    log.error(error.message);
    return 1;
  }
  if (command === 'login') return login(client, log);
  if (command === 'logout') return logout(client, log);
  if (command === 'check') return check(config, client, log);
  try {
    return await start(config, client, log);
  } catch (error) {
    log.error(error.message);
    return 1;
  }
}

main().then(exitCode => {
  if (exitCode !== null) process.exit(exitCode);
});
