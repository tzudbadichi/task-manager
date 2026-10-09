import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { branchNameFor, countChangedFiles, prepareWorktree, taskSlug } from '../runner/git.js';

function createFakeGit(responses = {}) {
  const calls = [];
  const git = async (args, { cwd }) => {
    calls.push({ args, cwd });
    const key = args.slice(0, 2).join(' ');
    const response = responses[key];
    if (response instanceof Error) throw response;
    return typeof response === 'function' ? response(args) : (response ?? '');
  };
  return { git, calls };
}

describe('taskSlug and branch names', () => {
  test('stable, short and safe for git, also for odd task ids', () => {
    assert.equal(taskSlug('Task-ABC:1/xyz'), taskSlug('Task-ABC:1/xyz'));
    assert.notEqual(taskSlug('a:1'), taskSlug('a-1'), 'ids that clean up the same still differ');
    assert.match(taskSlug('5f0c7a2e-1b3d-4c5e-8f9a-0b1c2d3e4f5a'), /^[a-z0-9]{1,10}-[a-z0-9]+$/);
    assert.match(taskSlug('!!!'), /^task-[a-z0-9]+$/);
    assert.match(branchNameFor('portal', 't1'), /^agent\/portal-t1-[a-z0-9]+$/);
  });
});

describe('prepareWorktree', () => {
  const project = { key: 'portal', path: '/work/portal', baseBranch: 'main' };

  test('a new task gets a new branch from the base branch, in its own folder outside the project', async () => {
    const { git, calls } = createFakeGit({ 'rev-parse --verify': new Error('not found'), 'rev-parse HEAD': 'abc123\n' });
    const result = await prepareWorktree({ project, taskId: 't1', worktreesDir: path.join('/tmp', 'wt-test-new'), git, pathExists: () => false, makeDir: async () => {} });
    assert.equal(result.branch, branchNameFor('portal', 't1'));
    assert.equal(result.worktreePath, path.join('/tmp', 'wt-test-new', 'portal', taskSlug('t1')));
    assert.equal(result.baseCommit, 'abc123');
    assert.deepEqual(calls.map(call => call.args), [
      ['worktree', 'prune'],
      ['rev-parse', '--verify', '--quiet', `refs/heads/${result.branch}`],
      ['worktree', 'add', '-b', result.branch, result.worktreePath, 'main'],
      ['rev-parse', 'HEAD'],
    ]);
    assert.equal(calls[2].cwd, '/work/portal');
  });

  test('an existing branch is reused; an existing folder is used as is', async () => {
    const reuseBranch = createFakeGit({ 'rev-parse --verify': 'sha\n', 'rev-parse HEAD': 'def456\n' });
    const result = await prepareWorktree({ project, taskId: 't1', worktreesDir: path.join('/tmp', 'wt-test-reuse'), git: reuseBranch.git, pathExists: () => false, makeDir: async () => {} });
    assert.deepEqual(reuseBranch.calls[2].args, ['worktree', 'add', result.worktreePath, result.branch]);

    const existing = createFakeGit({ 'rev-parse HEAD': 'def456\n' });
    await prepareWorktree({ project, taskId: 't1', worktreesDir: '/tmp/x', git: existing.git, pathExists: () => true });
    assert.deepEqual(existing.calls.map(call => call.args), [['rev-parse', 'HEAD']]);
  });
});

describe('countChangedFiles', () => {
  test('counts files changed since the base commit plus new files, once each', async () => {
    const { git } = createFakeGit({ 'diff --name-only': 'a.js\nb.js\n', 'ls-files --others': 'b.js\nnew.txt\n' });
    assert.equal(await countChangedFiles({ folder: '/wt', baseCommit: 'abc', git }), 3);
  });

  test('without a base commit, uses the working tree status', async () => {
    const { git } = createFakeGit({ 'status --porcelain': ' M a.js\n?? c.txt\n', 'ls-files --others': 'c.txt\n' });
    assert.equal(await countChangedFiles({ folder: '/p', baseCommit: null, git }), 2);
  });
});
