import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, normalizeState, reduce } from '../src/js/store.js';
import { replayOperations } from '../src/js/sync.js';
import { sequentialIds } from './fixtures/memory-storage.js';

const T0 = Date.UTC(2026, 9, 8, 9, 0, 0);
const MINUTE = 60_000;

function stateWithTask({ subtaskStatus = 'todo' } = {}) {
  const makeId = sequentialIds();
  const state = createInitialState({ makeId });
  return reduce(state, { type: 'task/add', id: 't', title: 'Login page', subtasks: [{ id: 's', title: 'Fix the crash', status: subtaskStatus }, { id: 's2', title: 'Docs' }] }, { now: T0, makeId });
}

const sync = (jobId, jobStatus, jobCreatedAt = T0) => ({ type: 'subtask/agentSync', taskId: 't', subtaskId: 's', jobId, jobStatus, jobCreatedAt });
const subtaskOf = state => state.tasks[0].subtasks.find(subtask => subtask.id === 's');

describe('task/update agentProject', () => {
  test('links a task to a project key, ignores invalid keys, and unlinks with null', () => {
    const makeId = sequentialIds();
    let state = stateWithTask();
    state = reduce(state, { type: 'task/update', taskId: 't', changes: { agentProject: 'portal' } }, { now: T0 + MINUTE, makeId });
    assert.equal(state.tasks[0].agentProject, 'portal');
    assert.equal(state.tasks[0].updatedAt, T0 + MINUTE);

    const same = reduce(state, { type: 'task/update', taskId: 't', changes: { agentProject: 'Not A Key!' } }, { now: T0 + 2 * MINUTE, makeId });
    assert.equal(same, state);

    state = reduce(state, { type: 'task/update', taskId: 't', changes: { agentProject: null } }, { now: T0 + 3 * MINUTE, makeId });
    assert.equal(Object.hasOwn(state.tasks[0], 'agentProject'), false);
    assert.equal(reduce(state, { type: 'task/update', taskId: 't', changes: { agentProject: '' } }, { now: T0, makeId }), state);
  });
});

describe('subtask/agentSync', () => {
  test('sending makes the subtask "waiting"; the agent finishing makes it "on me" again', () => {
    const makeId = sequentialIds();
    let state = stateWithTask();
    state = reduce(state, sync('j1', 'queued'), { now: T0 + MINUTE, makeId });
    assert.deepEqual(subtaskOf(state).agentJob, { id: 'j1', status: 'queued', createdAt: T0 });
    assert.equal(subtaskOf(state).status, 'waiting');
    assert.equal(state.tasks[0].status, 'waiting');

    state = reduce(state, sync('j1', 'running'), { now: T0 + 2 * MINUTE, makeId });
    assert.equal(subtaskOf(state).status, 'waiting');
    assert.equal(subtaskOf(state).statusChangedAt, T0 + MINUTE, 'the waiting clock keeps running');

    state = reduce(state, sync('j1', 'done'), { now: T0 + 5 * MINUTE, makeId });
    assert.equal(subtaskOf(state).status, 'in_progress');
    assert.equal(state.tasks[0].status, 'in_progress');
    assert.equal(subtaskOf(state).statusChangedAt, T0 + 5 * MINUTE);
  });

  test('stale news is a no-op: a state the job already passed, or an older job', () => {
    const makeId = sequentialIds();
    let state = stateWithTask();
    state = reduce(state, sync('j2', 'done', T0 + 10), { now: T0, makeId });
    assert.equal(reduce(state, sync('j2', 'running', T0 + 10), { now: T0 + MINUTE, makeId }), state);
    assert.equal(reduce(state, sync('j2', 'done', T0 + 10), { now: T0 + MINUTE, makeId }), state);
    assert.equal(reduce(state, sync('j1', 'done', T0), { now: T0 + MINUTE, makeId }), state);
  });

  test('a subtask marked done by hand is not reopened by the agent finishing, but sending again reopens it', () => {
    const makeId = sequentialIds();
    let state = stateWithTask();
    state = reduce(state, sync('j1', 'running'), { now: T0, makeId });
    state = reduce(state, { type: 'subtask/setStatus', taskId: 't', subtaskId: 's', status: 'done' }, { now: T0 + MINUTE, makeId });
    state = reduce(state, sync('j1', 'done'), { now: T0 + 2 * MINUTE, makeId });
    assert.equal(subtaskOf(state).status, 'done');
    assert.equal(subtaskOf(state).agentJob.status, 'done');

    state = reduce(state, sync('j2', 'queued', T0 + 3 * MINUTE), { now: T0 + 3 * MINUTE, makeId });
    assert.equal(subtaskOf(state).status, 'waiting');
  });

  test('invalid actions change nothing', () => {
    const makeId = sequentialIds();
    const state = stateWithTask();
    for (const action of [sync('', 'done'), sync('j1', 'exploded'), sync('j1', 'done', 'yesterday'), { ...sync('j1', 'done'), subtaskId: 'missing' }]) {
      assert.equal(reduce(state, action, { now: T0, makeId }), state);
    }
  });

  test('replays cleanly: the same sync applied twice (two devices, or a lost response) gives the same document', () => {
    const makeId = sequentialIds();
    const base = stateWithTask();
    const operations = [
      { kind: 'action', action: sync('j1', 'queued'), now: T0 + MINUTE },
      { kind: 'action', action: sync('j1', 'done'), now: T0 + 2 * MINUTE },
    ];
    const once = replayOperations(base, operations, { makeId });
    const twice = replayOperations(once, operations, { makeId });
    assert.deepEqual(twice, once);
  });
});

describe('normalizeState keeps the agent fields', () => {
  test('valid agentProject and agentJob survive a reload; invalid ones are dropped', () => {
    const makeId = sequentialIds();
    let state = stateWithTask();
    state = reduce(state, { type: 'task/update', taskId: 't', changes: { agentProject: 'portal' } }, { now: T0, makeId });
    state = reduce(state, sync('j1', 'done'), { now: T0, makeId });
    const reloaded = normalizeState(JSON.parse(JSON.stringify(state)), { now: T0 + MINUTE, makeId });
    assert.equal(reloaded.tasks[0].agentProject, 'portal');
    assert.deepEqual(subtaskOf(reloaded).agentJob, { id: 'j1', status: 'done', createdAt: T0 });

    const tampered = JSON.parse(JSON.stringify(state));
    tampered.tasks[0].agentProject = '../etc';
    tampered.tasks[0].subtasks[0].agentJob = { id: 'j1', status: 'pwned', createdAt: T0 };
    const cleaned = normalizeState(tampered, { now: T0 + MINUTE, makeId });
    assert.equal(Object.hasOwn(cleaned.tasks[0], 'agentProject'), false);
    assert.equal(Object.hasOwn(subtaskOf(cleaned), 'agentJob'), false);
  });
});
