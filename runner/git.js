// Work folders of the agents. With isolation "worktree" (the default) every task gets its own git worktree
// and branch (agent/<project>-<task>), next to - never inside - the project folder: several agents can work
// on the same repository at once without touching each other or the folder you work in yourself.
// Open it in VS Code ("open in VS Code" in the agent window) to review, then merge the branch yourself.

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { hashString } from '../src/js/utils.js';

/** Runs git with arguments (no shell). Resolves stdout; rejects with git's own message. */
export function runGit(args, { cwd } = {}) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { cwd, windowsHide: true, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) reject(new Error(String(stderr || error.message).trim()));
      else resolve(String(stdout));
    });
  });
}

/** A short, stable folder / branch name for a task id (ids may be long or contain characters git dislikes). */
export function taskSlug(taskId) {
  const readable = String(taskId).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10);
  return `${readable || 'task'}-${hashString(String(taskId)).toString(36)}`;
}

export function branchNameFor(projectKey, taskId) {
  return `agent/${projectKey}-${taskSlug(taskId)}`;
}

/**
 * Makes sure the task's worktree exists and returns { worktreePath, branch, baseCommit }.
 * A new worktree starts from baseBranch (or the project's current HEAD); an existing branch is reused.
 */
export async function prepareWorktree({
  project, taskId, worktreesDir, git = runGit, pathExists = existsSync, makeDir = folder => mkdir(folder, { recursive: true }),
}) {
  const worktreePath = path.join(worktreesDir, project.key, taskSlug(taskId));
  const branch = branchNameFor(project.key, taskId);
  if (!pathExists(worktreePath)) {
    await makeDir(path.dirname(worktreePath));
    await git(['worktree', 'prune'], { cwd: project.path });
    const branchExists = await git(['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`], { cwd: project.path }).then(() => true, () => false);
    await git(branchExists
      ? ['worktree', 'add', worktreePath, branch]
      : ['worktree', 'add', '-b', branch, worktreePath, project.baseBranch ?? 'HEAD'], { cwd: project.path });
  }
  const baseCommit = (await git(['rev-parse', 'HEAD'], { cwd: worktreePath })).trim();
  return { worktreePath, branch, baseCommit };
}

/** Files changed in the work folder since baseCommit: committed, uncommitted and new ones. */
export async function countChangedFiles({ folder, baseCommit, git = runGit }) {
  const changed = new Set();
  const diff = baseCommit ? await git(['diff', '--name-only', baseCommit], { cwd: folder }) : '';
  const untracked = await git(['ls-files', '--others', '--exclude-standard'], { cwd: folder });
  const status = baseCommit ? '' : await git(['status', '--porcelain'], { cwd: folder });
  for (const line of `${diff}\n${untracked}`.split(/\r?\n/)) if (line.trim()) changed.add(line.trim());
  for (const line of status.split(/\r?\n/)) if (line.trim()) changed.add(line.slice(3).trim());
  return changed.size;
}

/** Whether a folder is inside a git repository. */
export async function isGitFolder(folder, git = runGit) {
  return git(['rev-parse', '--is-inside-work-tree'], { cwd: folder }).then(output => output.trim() === 'true', () => false);
}
