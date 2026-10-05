import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITS, PRE_MIGRATION_KEY, STORAGE_KEY, createInitialState, createStore, normalizeState, reduce,
} from '../src/js/store.js';
import { createFailingStorage, createMemoryStorage, sequentialIds } from './fixtures/memory-storage.js';

const T0 = Date.UTC(2026, 9, 4, 9, 0, 0);
const MINUTE = 60_000;

/** Runs reducer actions against an evolving state with a controllable clock. */
function createHarness() {
  const makeId = sequentialIds();
  let state = createInitialState({ makeId });
  let now = T0;
  return {
    get state() { return state; },
    run(action) {
      state = reduce(state, action, { now, makeId });
      return state;
    },
    advance(ms) { now += ms; },
    get categoryIds() { return state.categories.map(category => category.id); },
  };
}

describe('createInitialState', () => {
  test('starts with the three default colored categories and no tasks', () => {
    const state = createInitialState({ makeId: sequentialIds() });
    assert.deepEqual(state.categories.map(category => category.name), ['פיתוח', 'HR', 'אישי']);
    assert.ok(state.categories.every(category => /^#[0-9a-f]{6}$/.test(category.color)));
    assert.deepEqual(state.tasks, []);
    assert.deepEqual(state.settings, { theme: 'auto', lastExportAt: null });
  });
});

describe('tasks', () => {
  test('task/add cleans the title, defaults to todo and puts the new task first', () => {
    const harness = createHarness();
    harness.run({ type: 'task/add', title: 'first', categoryId: harness.categoryIds[0] });
    harness.run({ type: 'task/add', title: '   second \n task  ', categoryId: harness.categoryIds[1] });
    const [newest, oldest] = harness.state.tasks;
    assert.equal(newest.title, 'second task');
    assert.equal(newest.status, 'todo');
    assert.equal(newest.categoryId, harness.categoryIds[1]);
    assert.equal(newest.statusChangedAt, T0);
    assert.deepEqual(newest.subtasks, []);
    assert.equal(oldest.title, 'first');
  });

  test('task/add ignores an empty title and keeps the same state object', () => {
    const harness = createHarness();
    const before = harness.state;
    assert.equal(harness.run({ type: 'task/add', title: '   ' }), before);
  });

  test('task/add with an unknown category or invalid status falls back safely', () => {
    const harness = createHarness();
    harness.run({ type: 'task/add', title: 'x', categoryId: 'missing', status: 'claude_running' });
    assert.equal(harness.state.tasks[0].categoryId, null);
    assert.equal(harness.state.tasks[0].status, 'todo');
  });

  test('task/add truncates over-long text', () => {
    const harness = createHarness();
    harness.run({ type: 'task/add', title: 'a'.repeat(500), description: 'b'.repeat(9000) });
    assert.equal(harness.state.tasks[0].title.length, LIMITS.title);
    assert.equal(harness.state.tasks[0].description.length, LIMITS.description);
  });

  test('task/update ignores an empty title but applies the other fields', () => {
    const harness = createHarness();
    harness.run({ type: 'task/add', title: 'keep me' });
    const taskId = harness.state.tasks[0].id;
    harness.advance(MINUTE);
    harness.run({
      type: 'task/update', taskId,
      changes: { title: ' ', description: 'line 1\nline 2', categoryId: harness.categoryIds[2] },
    });
    const task = harness.state.tasks[0];
    assert.equal(task.title, 'keep me');
    assert.equal(task.description, 'line 1\nline 2');
    assert.equal(task.categoryId, harness.categoryIds[2]);
    assert.equal(task.updatedAt, T0 + MINUTE);
  });

  test('task/update with identical values is a no-op', () => {
    const harness = createHarness();
    harness.run({ type: 'task/add', title: 'same' });
    const before = harness.state;
    assert.equal(harness.run({ type: 'task/update', taskId: before.tasks[0].id, changes: { title: 'same ' } }), before);
  });

  test('task/setStatus records when the status changed', () => {
    const harness = createHarness();
    harness.run({ type: 'task/add', title: 'build' });
    const taskId = harness.state.tasks[0].id;
    harness.advance(10 * MINUTE);
    harness.run({ type: 'task/setStatus', taskId, status: 'in_progress' });
    const task = harness.state.tasks[0];
    assert.equal(task.status, 'in_progress');
    assert.equal(task.statusChangedAt, T0 + 10 * MINUTE);
    assert.equal(task.updatedAt, T0 + 10 * MINUTE);

    // Switching between the two in-progress variants restarts the "how long" clock.
    harness.advance(5 * MINUTE);
    harness.run({ type: 'task/setStatus', taskId, status: 'waiting' });
    assert.equal(harness.state.tasks[0].status, 'waiting');
    assert.equal(harness.state.tasks[0].statusChangedAt, T0 + 15 * MINUTE);
    assert.equal(normalizeState(harness.state, { now: T0 + 15 * MINUTE }).tasks[0].status, 'waiting');
  });

  test('setting the same status or an invalid status returns the same state', () => {
    const harness = createHarness();
    harness.run({ type: 'task/add', title: 'x' });
    const before = harness.state;
    const taskId = before.tasks[0].id;
    assert.equal(harness.run({ type: 'task/setStatus', taskId, status: 'todo' }), before);
    assert.equal(harness.run({ type: 'task/setStatus', taskId, status: 'waiting_email' }), before);
  });

  test('task/delete removes the task; unknown id is a no-op', () => {
    const harness = createHarness();
    harness.run({ type: 'task/add', title: 'x' });
    const before = harness.state;
    assert.equal(harness.run({ type: 'task/delete', taskId: 'missing' }), before);
    harness.run({ type: 'task/delete', taskId: before.tasks[0].id });
    assert.equal(harness.state.tasks.length, 0);
  });
});

describe('subtasks', () => {
  function withTask() {
    const harness = createHarness();
    harness.run({ type: 'task/add', title: 'parent' });
    return { harness, taskId: harness.state.tasks[0].id };
  }

  test('subtask/add appends in order and bumps the parent updatedAt', () => {
    const { harness, taskId } = withTask();
    harness.advance(MINUTE);
    harness.run({ type: 'subtask/add', taskId, title: 'one' });
    harness.run({ type: 'subtask/add', taskId, title: 'two', status: 'in_progress' });
    const task = harness.state.tasks[0];
    assert.deepEqual(task.subtasks.map(subtask => subtask.title), ['one', 'two']);
    assert.equal(task.subtasks[1].status, 'in_progress');
    assert.equal(task.updatedAt, T0 + MINUTE);
  });

  test('subtask/add ignores empty titles and unknown tasks', () => {
    const { harness, taskId } = withTask();
    const before = harness.state;
    assert.equal(harness.run({ type: 'subtask/add', taskId, title: '' }), before);
    assert.equal(harness.run({ type: 'subtask/add', taskId: 'missing', title: 'x' }), before);
  });

  test('subtask title edit, status change and delete', () => {
    const { harness, taskId } = withTask();
    harness.run({ type: 'subtask/add', taskId, title: 'ask for approval' });
    const subtaskId = harness.state.tasks[0].subtasks[0].id;

    harness.advance(MINUTE);
    harness.run({ type: 'subtask/setStatus', taskId, subtaskId, status: 'done' });
    harness.run({ type: 'subtask/update', taskId, subtaskId, changes: { title: '  approval received  ' } });
    const subtask = harness.state.tasks[0].subtasks[0];
    assert.equal(subtask.status, 'done');
    assert.equal(subtask.statusChangedAt, T0 + MINUTE);
    assert.equal(subtask.title, 'approval received');
    assert.equal(harness.state.tasks[0].updatedAt, T0 + MINUTE);

    harness.run({ type: 'subtask/delete', taskId, subtaskId });
    assert.equal(harness.state.tasks[0].subtasks.length, 0);
  });
});

describe('categories', () => {
  test('category/add rejects duplicate names (case-insensitive) and replaces invalid colors', () => {
    const harness = createHarness();
    harness.run({ type: 'category/add', name: 'Clients', color: '#ABCDEF' });
    const before = harness.state;
    assert.equal(harness.run({ type: 'category/add', name: 'clients', color: '#000000' }), before);
    harness.run({ type: 'category/add', name: 'Bad color', color: 'red; background:url(x)' });
    const [clients, badColor] = harness.state.categories.slice(-2);
    assert.equal(clients.color, '#abcdef');
    assert.equal(badColor.color, '#64748b');
  });

  test('category/update renames and recolors, ignoring invalid values', () => {
    const harness = createHarness();
    const [devId] = harness.categoryIds;
    harness.run({ type: 'category/update', categoryId: devId, changes: { name: 'Development', color: '#112233' } });
    assert.equal(harness.state.categories[0].name, 'Development');
    assert.equal(harness.state.categories[0].color, '#112233');
    const before = harness.state;
    assert.equal(harness.run({ type: 'category/update', categoryId: devId, changes: { name: 'HR', color: 'blue' } }), before);
    assert.equal(harness.run({ type: 'category/update', categoryId: devId, changes: null }), before);
  });

  test('category/delete keeps the tasks and makes them uncategorized', () => {
    const harness = createHarness();
    const [devId, hrId] = harness.categoryIds;
    harness.run({ type: 'task/add', title: 'dev task', categoryId: devId });
    harness.run({ type: 'task/add', title: 'hr task', categoryId: hrId });
    harness.run({ type: 'category/delete', categoryId: devId });
    assert.equal(harness.state.categories.length, 2);
    const byTitle = Object.fromEntries(harness.state.tasks.map(task => [task.title, task.categoryId]));
    assert.deepEqual(byTitle, { 'dev task': null, 'hr task': hrId });
  });
});

describe('settings', () => {
  test('settings/update accepts known themes only and ignores unknown keys', () => {
    const harness = createHarness();
    harness.run({ type: 'settings/update', changes: { theme: 'dark', claudeCheckMinutes: 5 } });
    assert.deepEqual(harness.state.settings, { theme: 'dark', lastExportAt: null });
    const before = harness.state;
    assert.equal(harness.run({ type: 'settings/update', changes: { theme: 'dark' } }), before);
    harness.run({ type: 'settings/update', changes: { theme: 'neon' } });
    assert.equal(harness.state.settings.theme, 'auto');
  });
});

describe('normalizeState', () => {
  test('rejects data without task and category arrays', () => {
    assert.throws(() => normalizeState(null), /מבנה הנתונים/);
    assert.throws(() => normalizeState({ tasks: [] }), /מבנה הנתונים/);
    assert.throws(() => normalizeState('[]'), /מבנה הנתונים/);
  });

  test('repairs statuses, category references, duplicate ids, colors and timestamps', () => {
    const raw = {
      categories: [
        { id: 'c1', name: 'Dev', color: '#FF0000' },
        { id: 'c1', name: 'Dup id', color: 'nope' },
        { id: 'c3', name: 'dev', color: '#00ff00' }, // duplicate name, dropped
      ],
      tasks: [
        {
          id: 't1', title: 'ok', status: 'in_progress', categoryId: 'c1', createdAt: 1000, updatedAt: 2000,
          subtasks: [{ id: 't1', title: 'dup id', status: 'hacked' }, { title: '' }, 'garbage'],
        },
        { id: 't2', title: 'no category', categoryId: 'ghost', createdAt: 'yesterday', status: '__proto__' },
        { title: '   ' },
      ],
      settings: { theme: 'sepia' },
    };
    const state = normalizeState(raw, { now: T0, makeId: sequentialIds('new') });

    assert.deepEqual(state.categories.map(category => [category.id, category.name, category.color]), [
      ['c1', 'Dev', '#ff0000'],
      ['new-1', 'Dup id', '#64748b'],
    ]);
    assert.equal(state.tasks.length, 2);
    const [first, second] = state.tasks;
    assert.equal(first.categoryId, 'c1');
    assert.equal(first.statusChangedAt, 2000);
    assert.equal(first.subtasks.length, 1);
    assert.notEqual(first.subtasks[0].id, 't1');
    assert.equal(first.subtasks[0].status, 'todo');
    assert.equal(second.categoryId, null);
    assert.equal(second.status, 'todo');
    assert.equal(second.createdAt, T0);
    assert.equal(state.settings.theme, 'auto');
  });

  test('round-trips a valid state unchanged', () => {
    const harness = createHarness();
    harness.run({ type: 'task/add', title: 'x', categoryId: harness.categoryIds[0], status: 'in_progress' });
    harness.run({ type: 'subtask/add', taskId: harness.state.tasks[0].id, title: 'y' });
    const roundTripped = normalizeState(JSON.parse(JSON.stringify(harness.state)), { now: T0 + 1 });
    assert.deepEqual(roundTripped, harness.state);
  });
});

describe('migration of version 1 data', () => {
  test('old Claude / email statuses map onto the current statuses', () => {
    const state = normalizeState({
      categories: [],
      tasks: [
        { title: 'a', status: 'claude_running' },
        { title: 'b', status: 'waiting_email' },
        { title: 'c', status: 'email_received', subtasks: [{ title: 'd', status: 'claude_running' }] },
      ],
    }, { now: T0 });
    assert.deepEqual(state.tasks.map(task => task.status), ['in_progress', 'waiting', 'todo']);
    assert.equal(state.tasks[2].subtasks[0].status, 'in_progress');
  });

  test('the old contact field is kept as text and the old fields are dropped', () => {
    const state = normalizeState({
      categories: [],
      tasks: [
        {
          title: 'quarterly report', description: 'numbers for Q3', contact: 'Dana', lastCheckedAt: T0,
          subtasks: [{ title: 'approval', contact: 'Infra team' }, { title: 'no contact', contact: '  ' }],
        },
        { title: 'no description', contact: 'Yossi' },
      ],
      settings: { theme: 'dark', claudeCheckMinutes: 30, waitingFollowUpDays: 2, notificationsEnabled: true },
    }, { now: T0 });
    const [report, noDescription] = state.tasks;
    assert.equal(report.description, 'numbers for Q3\nאיש קשר: Dana');
    assert.deepEqual(report.subtasks.map(subtask => subtask.title), ['approval - Infra team', 'no contact']);
    assert.equal(noDescription.description, 'איש קשר: Yossi');
    for (const item of [report, ...report.subtasks]) {
      assert.equal('contact' in item, false);
      assert.equal('lastCheckedAt' in item, false);
    }
    assert.deepEqual(state.settings, { theme: 'dark', lastExportAt: null });
  });
});

describe('createStore', () => {
  test('a fresh store saves its initial state right away so category ids stay stable', () => {
    const storage = createMemoryStorage();
    const first = createStore({ storage, makeId: sequentialIds('a') });
    const second = createStore({ storage, makeId: sequentialIds('b') });
    assert.deepEqual(
      second.getState().categories.map(category => category.id),
      first.getState().categories.map(category => category.id));
  });

  test('persists every change and reloads it', () => {
    const storage = createMemoryStorage();
    const store = createStore({ storage, clock: () => T0 });
    assert.equal(store.dispatch({ type: 'task/add', title: 'persist me' }), true);
    const reloaded = createStore({ storage });
    assert.equal(reloaded.getState().tasks[0].title, 'persist me');
    assert.ok(storage.getItem(STORAGE_KEY).includes('persist me'));
  });

  test('notifies listeners, unless notify is false; no-op dispatch returns false', () => {
    const store = createStore({ storage: createMemoryStorage() });
    let calls = 0;
    store.subscribe(() => { calls += 1; });
    store.dispatch({ type: 'task/add', title: 'a' });
    store.dispatch({ type: 'task/update', taskId: store.getState().tasks[0].id, changes: { title: 'b' } }, { notify: false });
    assert.equal(store.dispatch({ type: 'task/add', title: '' }), false);
    assert.equal(calls, 1);
    assert.equal(store.getState().tasks[0].title, 'b');
  });

  test('undo restores the state before an undoable action; any later change discards it', () => {
    const store = createStore({ storage: createMemoryStorage() });
    store.dispatch({ type: 'task/add', title: 'keep' });
    const taskId = store.getState().tasks[0].id;

    store.dispatch({ type: 'task/delete', taskId }, { undoable: true });
    assert.equal(store.canUndo(), true);
    assert.equal(store.undo(), true);
    assert.equal(store.getState().tasks[0].title, 'keep');
    assert.equal(store.undo(), false);

    store.dispatch({ type: 'task/delete', taskId }, { undoable: true });
    store.dispatch({ type: 'task/add', title: 'later change' });
    assert.equal(store.canUndo(), false);
  });

  test('replaceState validates input and supports undo', () => {
    const store = createStore({ storage: createMemoryStorage() });
    store.dispatch({ type: 'task/add', title: 'original' });
    assert.throws(() => store.replaceState({ nope: true }, { undoable: true }));
    assert.equal(store.getState().tasks[0].title, 'original');

    store.replaceState({ categories: [], tasks: [{ title: 'imported' }] }, { undoable: true });
    assert.equal(store.getState().tasks[0].title, 'imported');
    store.undo();
    assert.equal(store.getState().tasks[0].title, 'original');
  });

  test('version 1 data in storage is migrated, saved right away, and the original is kept once', () => {
    const original = JSON.stringify({ schemaVersion: 1, categories: [], tasks: [{ title: 'old', status: 'email_received', contact: 'Dana' }] });
    const storage = createMemoryStorage({ [STORAGE_KEY]: original });
    const store = createStore({ storage, clock: () => T0 });
    const [task] = store.getState().tasks;
    assert.equal(task.status, 'todo');
    assert.equal(task.description, 'איש קשר: Dana');

    const stored = JSON.parse(storage.getItem(STORAGE_KEY));
    assert.equal(stored.schemaVersion, 2);
    assert.equal(stored.tasks[0].status, 'todo');
    assert.equal(storage.getItem(PRE_MIGRATION_KEY), original);

    // A later load of current-format data neither rewrites nor replaces the kept original.
    createStore({ storage });
    assert.equal(storage.getItem(PRE_MIGRATION_KEY), original);
  });

  test('corrupt saved data is kept under a backup key and a warning is exposed', () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: '{not json' });
    const store = createStore({ storage, clock: () => T0 });
    assert.match(store.loadWarning, /פגומים/);
    assert.equal(storage.getItem(`${STORAGE_KEY}.corrupt-${T0}`), '{not json');
    assert.equal(store.getState().categories.length, 3);
  });

  test('write failures are reported to onPersistError instead of throwing', () => {
    const errors = [];
    const store = createStore({ storage: createFailingStorage(), onPersistError: error => errors.push(error) });
    errors.length = 0; // ignore the initial save of the fresh state
    assert.doesNotThrow(() => store.dispatch({ type: 'task/add', title: 'x' }));
    assert.equal(errors.length, 1);
    assert.equal(store.getState().tasks.length, 1);
  });

  test('reloadFromStorage picks up changes written by another tab', () => {
    const storage = createMemoryStorage();
    const tabA = createStore({ storage });
    const tabB = createStore({ storage });
    tabA.dispatch({ type: 'task/add', title: 'from tab A' });
    let notified = false;
    tabB.subscribe(() => { notified = true; });
    assert.equal(tabB.reloadFromStorage(), null);
    assert.equal(tabB.getState().tasks[0].title, 'from tab A');
    assert.equal(notified, true);
  });

  test('reloadFromStorage keeps the current state when the stored data was removed or corrupted', () => {
    const storage = createMemoryStorage();
    const store = createStore({ storage });
    store.dispatch({ type: 'task/add', title: 'still here' });

    storage.removeItem(STORAGE_KEY);
    assert.match(store.reloadFromStorage(), /נמחקו/);
    assert.equal(store.getState().tasks[0].title, 'still here');

    storage.setItem(STORAGE_KEY, '{broken');
    assert.match(store.reloadFromStorage(), /פגומים/);
    assert.equal(store.getState().tasks[0].title, 'still here');
  });
});

describe('limits and timestamps from untrusted data', () => {
  test('future timestamps are clamped to now', () => {
    const future = T0 + 365 * 24 * 60 * MINUTE;
    const state = normalizeState({
      categories: [],
      tasks: [{ title: 'x', status: 'in_progress', createdAt: future, updatedAt: future, statusChangedAt: future }],
      settings: { lastExportAt: future },
    }, { now: T0 });
    const [task] = state.tasks;
    assert.equal(task.createdAt, T0);
    assert.equal(task.statusChangedAt, T0);
    assert.equal(state.settings.lastExportAt, T0);
  });

  test('task and subtask counts are capped on import and on add', () => {
    const manySubtasks = Array.from({ length: LIMITS.subtasksPerTask + 5 }, (_, index) => ({ title: `s${index}` }));
    const manyTasks = Array.from({ length: LIMITS.tasks + 5 }, (_, index) => ({ title: `t${index}` }));
    manyTasks[0].subtasks = manySubtasks;
    const state = normalizeState({ categories: [], tasks: manyTasks }, { now: T0, makeId: sequentialIds() });
    assert.equal(state.tasks.length, LIMITS.tasks);
    assert.equal(state.tasks[0].subtasks.length, LIMITS.subtasksPerTask);

    const makeId = sequentialIds('n');
    assert.equal(reduce(state, { type: 'task/add', title: 'one too many' }, { now: T0, makeId }), state);
    const taskId = state.tasks[0].id;
    assert.equal(reduce(state, { type: 'subtask/add', taskId, title: 'one too many' }, { now: T0, makeId }), state);
  });
});

describe('replayable actions and manual order', () => {
  test('dispatch assigns ids to add actions; adding an existing id again is a no-op', () => {
    const changes = [];
    const store = createStore({ storage: createMemoryStorage(), makeId: sequentialIds('gen') });
    store.onCommit(change => changes.push(change));
    store.dispatch({ type: 'task/add', title: 'a' });
    const [change] = changes;
    assert.equal(change.kind, 'action');
    assert.equal(change.action.id, store.getState().tasks[0].id);
    assert.equal(store.dispatch(change.action), false);

    store.dispatch({ type: 'subtask/add', id: 'sub-fixed', taskId: change.action.id, title: 's' });
    assert.equal(store.dispatch({ type: 'subtask/add', id: 'sub-fixed', taskId: change.action.id, title: 's' }), false);
    store.dispatch({ type: 'category/add', id: 'cat-fixed', name: 'X' });
    assert.equal(store.dispatch({ type: 'category/add', id: 'cat-fixed', name: 'Y' }), false);
  });

  test('tasks/reorder moves visible tasks among their own positions and keeps hidden ones in place', () => {
    const harness = createHarness();
    for (const title of ['d', 'c', 'b', 'a']) harness.run({ type: 'task/add', id: title, title });
    // Order is a, b, c, d. Only a, c, d are visible (b is filtered out); the user drags d to the front.
    harness.run({ type: 'tasks/reorder', orderedIds: ['d', 'a', 'c'] });
    assert.deepEqual(harness.state.tasks.map(task => task.id), ['d', 'b', 'a', 'c']);
  });

  test('tasks/reorder ignores unknown and duplicate ids, and the same order is a no-op', () => {
    const harness = createHarness();
    for (const title of ['b', 'a']) harness.run({ type: 'task/add', id: title, title });
    const before = harness.state;
    assert.equal(harness.run({ type: 'tasks/reorder', orderedIds: ['a', 'b'] }), before);
    assert.equal(harness.run({ type: 'tasks/reorder', orderedIds: 'nope' }), before);
    harness.run({ type: 'tasks/reorder', orderedIds: ['b', 'ghost', 'b', 'a'] });
    assert.deepEqual(harness.state.tasks.map(task => task.id), ['b', 'a']);
  });

  test('onCommit reports actions, replacements and remote updates; applyRemote is not a local change', () => {
    const kinds = [];
    const renders = [];
    const store = createStore({ storage: createMemoryStorage() });
    store.onCommit(change => kinds.push(change.kind));
    store.subscribe((state, change) => renders.push(change?.kind));
    store.dispatch({ type: 'task/add', title: 'a' });
    store.replaceState({ categories: [], tasks: [] }, { undoable: true });
    store.undo();
    store.applyRemote(normalizeState({ categories: [], tasks: [{ title: 'from cloud' }] }, { now: T0 }));
    assert.deepEqual(kinds, ['action', 'replace', 'replace', 'remote']);
    assert.deepEqual(renders, ['action', 'replace', 'replace', 'remote']);
    assert.equal(store.canUndo(), false);
  });
});
