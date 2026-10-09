// The runner's local config (runner/runner.config.json, never committed): which projects this machine
// offers, where each one lives, and which profile - engine + account - runs it.
//
// The work / personal separation is enforced here, not only labelled: every profile lists the folders it
// may work in (allowedRoots), the roots of different profiles may not overlap, each project must lie inside
// its own profile's roots, and two profiles of the same engine must use different account folders. A job
// from the cloud only names a project key - so it can only ever run a work project with the work profile,
// and no folder outside the config becomes an agent's work folder.
// This limits where an agent works and which account runs it - not what an agent can read on this disk
// (the Codex sandbox, for one, may read everywhere). Full isolation needs a separate Windows user per profile.

import path from 'node:path';
import os from 'node:os';
import { readFile } from 'node:fs/promises';
import { isAgentProjectKey } from '../src/js/agent-model.js';
import { defaultStateDir, isPathInside } from './paths.js';

export const ENGINES = Object.freeze(['claude', 'codex']);
export const CLOUD_REPORT_MODES = Object.freeze(['minimal', 'full']);
export const ISOLATION_MODES = Object.freeze(['worktree', 'none']);
// bypassPermissions is left out on purpose: an agent driven from the cloud must keep its permission checks.
export const CLAUDE_PERMISSION_MODES = Object.freeze(['acceptEdits', 'auto', 'dontAsk', 'plan', 'manual']);
// danger-full-access is left out on purpose, for the same reason.
export const CODEX_SANDBOX_MODES = Object.freeze(['read-only', 'workspace-write']);
export const DEFAULT_DISALLOWED_TOOLS = Object.freeze(['Bash(git push *)']);

const PROFILE_NAME_PATTERN = /^[a-z][a-z0-9_-]{0,29}$/;
const MODEL_PATTERN = /^[A-Za-z0-9._:[\]-]{1,80}$/;
const BRANCH_PATTERN = /^[A-Za-z0-9._/-]{1,100}$/;
// Tool rules reach the agent CLI as command-line arguments; characters a Windows shell would expand are refused.
const TOOL_RULE_PATTERN = /^[^"%!^\r\n]{1,200}$/;

const LIMITS = Object.freeze({ maxParallelJobs: [1, 8], jobTimeoutMinutes: [1, 480], projects: 50, profiles: 10 });

function isAbsolutePath(value, pathModule) {
  return typeof value === 'string' && value.trim() !== '' && pathModule.isAbsolute(value);
}

function integerInRange(value, [min, max], fallback) {
  if (value === undefined) return fallback;
  return Number.isInteger(value) && value >= min && value <= max ? value : null;
}

/**
 * Checks a parsed config and fills in defaults. Returns { config, errors } - errors is a list of English
 * messages (the runner prints them in the console); config is only usable when errors is empty.
 */
export function validateConfig(raw, { pathModule = path, env = process.env, platform = process.platform, homeDir = os.homedir() } = {}) {
  const errors = [];
  const fail = message => errors.push(message);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { config: null, errors: ['The config file must contain a JSON object'] };

  const runnerName = typeof raw.runnerName === 'string' && raw.runnerName.trim() ? raw.runnerName.trim() : os.hostname();
  if (runnerName.length > 60) fail('runnerName must be at most 60 characters');

  const maxParallelJobs = integerInRange(raw.maxParallelJobs, LIMITS.maxParallelJobs, 2);
  if (maxParallelJobs === null) fail(`maxParallelJobs must be a whole number between ${LIMITS.maxParallelJobs.join(' and ')}`);
  const jobTimeoutMinutes = integerInRange(raw.jobTimeoutMinutes, LIMITS.jobTimeoutMinutes, 60);
  if (jobTimeoutMinutes === null) fail(`jobTimeoutMinutes must be a whole number between ${LIMITS.jobTimeoutMinutes.join(' and ')}`);

  if (raw.stateDir !== undefined && !isAbsolutePath(raw.stateDir, pathModule)) fail('stateDir must be an absolute folder path');
  const stateDir = raw.stateDir ?? defaultStateDir({ env, platform, homeDir });

  const supabaseUrl = typeof raw.supabaseUrl === 'string' ? raw.supabaseUrl.trim().replace(/\/+$/, '') : '';
  const supabaseAnonKey = typeof raw.supabaseAnonKey === 'string' ? raw.supabaseAnonKey.trim() : '';
  if (supabaseUrl && !/^https:\/\/[a-z0-9.-]+$/i.test(supabaseUrl)) fail('supabaseUrl must look like https://<project>.supabase.co');

  const profiles = {};
  const rawProfiles = raw.profiles && typeof raw.profiles === 'object' && !Array.isArray(raw.profiles) ? raw.profiles : null;
  if (!rawProfiles || Object.keys(rawProfiles).length === 0) fail('profiles must define at least one profile (for example "work" and "personal")');
  else if (Object.keys(rawProfiles).length > LIMITS.profiles) fail(`At most ${LIMITS.profiles} profiles are supported`);
  for (const [name, rawProfile] of Object.entries(rawProfiles ?? {})) {
    if (!PROFILE_NAME_PATTERN.test(name)) {
      fail(`Profile name "${name}" must be lowercase letters, digits, "-" or "_"`);
      continue;
    }
    const profile = validateProfile(name, rawProfile, { pathModule, stateDir, fail });
    if (profile) profiles[name] = profile;
  }

  // The separation itself: no folder may belong to two profiles, and a profile's work folders
  // (worktreesDir) may not sit inside another profile's folders.
  const profileNames = Object.keys(profiles);
  for (let first = 0; first < profileNames.length; first += 1) {
    for (let second = first + 1; second < profileNames.length; second += 1) {
      for (const rootA of profiles[profileNames[first]].allowedRoots) {
        for (const rootB of profiles[profileNames[second]].allowedRoots) {
          if (isPathInside(rootA, rootB, pathModule) || isPathInside(rootB, rootA, pathModule)) {
            fail(`Profiles "${profileNames[first]}" and "${profileNames[second]}" share folders (${rootA} / ${rootB}). Each folder may belong to one profile only.`);
          }
        }
      }
    }
  }
  for (const name of profileNames) {
    for (const otherName of profileNames.filter(other => other !== name)) {
      if (profiles[otherName].allowedRoots.some(root => isPathInside(profiles[name].worktreesDir, root, pathModule))) {
        fail(`Profile "${name}": worktreesDir is inside the folders of profile "${otherName}"`);
      }
    }
  }
  // Two profiles of the same engine with the same (or the default) account folder would be one account.
  const accountOf = profile => (profile.engine === 'claude' ? profile.claudeConfigDir : profile.codexHome);
  for (let first = 0; first < profileNames.length; first += 1) {
    for (let second = first + 1; second < profileNames.length; second += 1) {
      const [a, b] = [profiles[profileNames[first]], profiles[profileNames[second]]];
      if (a.engine !== b.engine) continue;
      if (!accountOf(a) || !accountOf(b)
        || isPathInside(accountOf(a), accountOf(b), pathModule) || isPathInside(accountOf(b), accountOf(a), pathModule)) {
        fail(`Profiles "${a.name}" and "${b.name}" both use ${a.engine}: each needs its own account folder (${a.engine === 'claude' ? 'claudeConfigDir' : 'codexHome'}), otherwise both run with the same account`);
      }
    }
  }

  const projects = [];
  if (!Array.isArray(raw.projects) || raw.projects.length === 0) fail('projects must list at least one project');
  else if (raw.projects.length > LIMITS.projects) fail(`At most ${LIMITS.projects} projects are supported`);
  for (const [index, rawProject] of (Array.isArray(raw.projects) ? raw.projects : []).entries()) {
    const project = validateProject(rawProject, index, { profiles, pathModule, fail });
    if (!project) continue;
    if (projects.some(item => item.key === project.key)) fail(`Project key "${project.key}" is used twice`);
    else projects.push(project);
  }

  return {
    config: errors.length > 0 ? null : {
      runnerName, maxParallelJobs, jobTimeoutMinutes, stateDir, supabaseUrl, supabaseAnonKey, profiles, projects,
    },
    errors,
  };
}

function validateStringList(value, label, fail, fallback = []) {
  if (value === undefined) return [...fallback];
  if (!Array.isArray(value) || !value.every(item => typeof item === 'string' && TOOL_RULE_PATTERN.test(item))) {
    fail(`${label} must be a list of tool rules such as "Bash(npm test *)" (no quotes, %, ! or ^)`);
    return [];
  }
  return [...value];
}

function validateProfile(name, raw, { pathModule, stateDir, fail }) {
  if (!raw || typeof raw !== 'object') {
    fail(`Profile "${name}" must be an object`);
    return null;
  }
  const where = `Profile "${name}"`;
  if (!ENGINES.includes(raw.engine)) fail(`${where}: engine must be one of ${ENGINES.join(', ')}`);

  const allowedRoots = Array.isArray(raw.allowedRoots) ? raw.allowedRoots : [];
  if (allowedRoots.length === 0 || !allowedRoots.every(root => isAbsolutePath(root, pathModule))) {
    fail(`${where}: allowedRoots must list at least one absolute folder - the only folders this profile may work in`);
  }
  const cloudReport = raw.cloudReport ?? 'minimal';
  if (!CLOUD_REPORT_MODES.includes(cloudReport)) fail(`${where}: cloudReport must be "minimal" or "full"`);
  if (raw.model !== undefined && !(typeof raw.model === 'string' && MODEL_PATTERN.test(raw.model))) fail(`${where}: model is not a valid model name`);
  if (raw.command !== undefined && !(typeof raw.command === 'string' && raw.command.trim() && !/["%!^\r\n]/.test(raw.command))) {
    fail(`${where}: command must be a program name or a full path`);
  }
  if (raw.worktreesDir !== undefined && !isAbsolutePath(raw.worktreesDir, pathModule)) fail(`${where}: worktreesDir must be an absolute folder path`);

  const profile = {
    name,
    label: typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim().slice(0, 30) : name,
    engine: raw.engine,
    command: raw.command?.trim() || raw.engine,
    model: raw.model ?? null,
    cloudReport,
    allowedRoots: allowedRoots.map(root => pathModule.resolve(root)),
    worktreesDir: raw.worktreesDir ? pathModule.resolve(raw.worktreesDir) : pathModule.join(stateDir, 'worktrees', name),
  };

  if (raw.engine === 'claude') {
    if (raw.claudeConfigDir !== undefined && raw.claudeConfigDir !== '' && !isAbsolutePath(raw.claudeConfigDir, pathModule)) {
      fail(`${where}: claudeConfigDir must be an absolute folder (the CLAUDE_CONFIG_DIR of this account)`);
    }
    const permissionMode = raw.permissionMode ?? 'acceptEdits';
    if (!CLAUDE_PERMISSION_MODES.includes(permissionMode)) {
      fail(`${where}: permissionMode must be one of ${CLAUDE_PERMISSION_MODES.join(', ')} (bypassPermissions is not allowed)`);
    }
    return {
      ...profile,
      claudeConfigDir: raw.claudeConfigDir ? pathModule.resolve(raw.claudeConfigDir) : null,
      permissionMode,
      allowedTools: validateStringList(raw.allowedTools, `${where}: allowedTools`, fail),
      disallowedTools: validateStringList(raw.disallowedTools, `${where}: disallowedTools`, fail, DEFAULT_DISALLOWED_TOOLS),
    };
  }
  if (raw.engine === 'codex') {
    if (raw.codexHome !== undefined && raw.codexHome !== '' && !isAbsolutePath(raw.codexHome, pathModule)) {
      fail(`${where}: codexHome must be an absolute folder (the CODEX_HOME of this account)`);
    }
    const sandbox = raw.sandbox ?? 'workspace-write';
    if (!CODEX_SANDBOX_MODES.includes(sandbox)) fail(`${where}: sandbox must be one of ${CODEX_SANDBOX_MODES.join(', ')} (danger-full-access is not allowed)`);
    return { ...profile, codexHome: raw.codexHome ? pathModule.resolve(raw.codexHome) : null, sandbox };
  }
  return null;
}

function validateProject(raw, index, { profiles, pathModule, fail }) {
  const where = `Project #${index + 1}`;
  if (!raw || typeof raw !== 'object') {
    fail(`${where} must be an object`);
    return null;
  }
  if (!isAgentProjectKey(raw.key)) {
    fail(`${where}: key must be 1-40 lowercase letters, digits, "-" or "_" (it is what the board stores)`);
    return null;
  }
  const label = `Project "${raw.key}"`;
  const profile = profiles[raw.profile];
  if (!profile) {
    fail(`${label}: profile "${raw.profile}" is not defined (or is invalid)`);
    return null;
  }
  if (!isAbsolutePath(raw.path, pathModule)) {
    fail(`${label}: path must be the absolute folder of the project`);
    return null;
  }
  const projectPath = pathModule.resolve(raw.path);
  if (!profile.allowedRoots.some(root => isPathInside(projectPath, root, pathModule))) {
    fail(`${label}: ${projectPath} is not inside the allowedRoots of profile "${profile.name}". Move it to the right profile or fix the roots.`);
    return null;
  }
  const isolation = raw.isolation ?? 'worktree';
  if (!ISOLATION_MODES.includes(isolation)) fail(`${label}: isolation must be "worktree" or "none"`);
  if (raw.baseBranch !== undefined && !(typeof raw.baseBranch === 'string' && BRANCH_PATTERN.test(raw.baseBranch) && !raw.baseBranch.includes('..'))) {
    fail(`${label}: baseBranch is not a valid branch name`);
  }
  const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim().slice(0, 60) : raw.key;
  return { key: raw.key, name, profile: profile.name, path: projectPath, isolation, baseBranch: raw.baseBranch ?? null };
}

/** Reads and validates the config file. Throws an Error whose message lists every problem. */
export async function loadConfig(configPath, options = {}) {
  let text;
  try {
    text = await readFile(configPath, 'utf8');
  } catch (error) {
    throw new Error(error.code === 'ENOENT'
      ? `Config file not found: ${configPath}. Copy runner/runner.config.example.json to runner/runner.config.json and edit it.`
      : `Cannot read the config file ${configPath}: ${error.message}`);
  }
  let raw;
  try {
    raw = JSON.parse(text.replace(/^﻿/, ''));
  } catch (error) {
    throw new Error(`The config file is not valid JSON: ${error.message}`);
  }
  const { config, errors } = validateConfig(raw, options);
  if (errors.length > 0) throw new Error(`The config file has problems:\n- ${errors.join('\n- ')}`);
  return config;
}

/** Reads SUPABASE_URL / SUPABASE_ANON_KEY from the site's src/config.js (same values the board uses). */
export function parseSiteConfig(text) {
  const read = name => {
    const match = new RegExp(`export\\s+const\\s+${name}\\s*=\\s*(['"])([^'"]*)\\1`).exec(text ?? '');
    return match ? match[2].trim() : '';
  };
  return { url: read('SUPABASE_URL').replace(/\/+$/, ''), key: read('SUPABASE_ANON_KEY') };
}
