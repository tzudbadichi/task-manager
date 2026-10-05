import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore, normalizeState, STORAGE_KEY } from '../src/js/store.js';
import {
  BEFORE_LOGIN_KEY, MAX_PENDING_OPS, SYNC_META_KEY, UNSYNCED_KEY_PREFIX, clearAccountCopies, createSync, loadSyncMeta,
  mergeLocalIntoRemote, replayOperations,
} from '../src/js/sync.js';
import { UI_PREFS_KEY } from '../src/js/ui-prefs.js';
import { createMemoryStorage, sequentialIds } from './fixtures/memory-storage.js';
import { createFakeRemote } from './fixtures/fake-remote.js';

const USER = 'user-1';
const T0 = Date.UTC(2026, 9, 5, 8, 0, 0);

/** Timers that never fire on their own - tests drive saves explicitly with flush(). */
function manualTimers() {
  const scheduled = new Map();
  let nextId = 1;
  return {
    setTimeout(callback, delay) {
      const id = nextId++;
      scheduled.set(id, { callback, delay });
      return id;
    },
    clearTimeout(id) {
      scheduled.delete(id);
    },
    pendingCount: () => scheduled.size,
    /** Runs everything scheduled so far (like time passing). */
    async runAll() {
      const due = [...scheduled.values()];
      scheduled.clear();
      for (const { callback } of due) await callback();
    },
  };
}

function setup({ storage = createMemoryStorage(), remote = createFakeRemote(), confirmMerge = async () => true, online = true, userId = USER } = {}) {
  let now = T0;
  const clock = () => now;
  const store = createStore({ storage, clock, makeId: sequentialIds('local') });
  const statuses = [];
  const timers = manualTimers();
  const sync = createSync({
    store, remote, storage, userId, clock, timers,
    makeId: sequentialIds('sync'),
    isOnline: () => online,
    onStatus: status => statuses.push(status),
    confirmMerge,
  });
  return { storage, remote, store, sync, statuses, timers, advance: ms => { now += ms; } };
}

const titles = state => state.tasks.map(task => task.title);

describe('replayOperations', () => {
  test('re-applies actions with their original ids and is idempotent for adds', () => {
    const { store } = setup();
    const base = store.getState();
    const operations = [
      { kind: 'action', action: { type: 'task/add', id: 'task-a', title: 'A' }, now: T0 },
      { kind: 'action', action: { type: 'subtask/add', id: 'sub-a', taskId: 'task-a', title: 'A1' }, now: T0 },
    ];
    const once = replayOperations(base, operations);
    const twice = replayOperations(once, operations);
    assert.deepEqual(titles(once), ['A']);
    assert.equal(once.tasks[0].subtasks[0].id, 'sub-a');
    assert.deepEqual(twice, once);
  });

  test('a replace operation resets the state to its snapshot', () => {
    const { store } = setup();
    const snapshot = normalizeState({ categories: [], tasks: [{ id: 'x', title: 'snapshot' }] }, { now: T0 });
    const result = replayOperations(store.getState(), [{ kind: 'replace', state: snapshot, now: T0 }]);
    assert.deepEqual(titles(result), ['snapshot']);
  });
});

describe('mergeLocalIntoRemote', () => {
  test('adds local tasks, maps categories by name and skips tasks already in the cloud', () => {
    const remote = normalizeState({
      categories: [{ id: 'r-dev', name: 'פיתוח', color: '#2563eb' }],
      tasks: [{ id: 'shared', title: 'in both' }],
    }, { now: T0 });
    const local = normalizeState({
      categories: [{ id: 'l-dev', name: 'פיתוח', color: '#000000' }, { id: 'l-new', name: 'לקוחות', color: '#ea580c' }],
      tasks: [
        { id: 'shared', title: 'in both (local copy)' },
        { id: 'l1', title: 'local dev task', categoryId: 'l-dev' },
        { id: 'l2', title: 'local client task', categoryId: 'l-new' },
      ],
    }, { now: T0 });
    const merged = mergeLocalIntoRemote(remote, local);
    assert.deepEqual(titles(merged), ['in both', 'local dev task', 'local client task']);
    assert.deepEqual(merged.categories.map(category => category.name), ['פיתוח', 'לקוחות']);
    assert.equal(merged.tasks[1].categoryId, 'r-dev');
    assert.equal(merged.tasks[2].categoryId, 'l-new');
  });
});

describe('createSync - first login on a device', () => {
  test('empty cloud: pre-login tasks on this device are uploaded', async () => {
    const { store, sync, remote, storage } = setup();
    store.dispatch({ type: 'task/add', title: 'made before login' });
    await sync.start();
    assert.deepEqual(titles(remote.document.data), ['made before login']);
    assert.equal(remote.document.version, 1);
    assert.equal(loadSyncMeta(storage).userId, USER);
    assert.equal(sync.status, 'synced');
    assert.equal(sync.hasPending(), false);
  });

  test('cloud has tasks and this device is empty: the cloud copy is shown', async () => {
    const remote = createFakeRemote({ categories: [], tasks: [{ id: 'c1', title: 'from the cloud' }] });
    const { store, sync } = setup({ remote });
    await sync.start();
    assert.deepEqual(titles(store.getState()), ['from the cloud']);
    assert.equal(remote.writes, 0);
  });

  test('both have tasks: the user is asked; yes merges and uploads', async () => {
    const remote = createFakeRemote({ categories: [], tasks: [{ id: 'c1', title: 'cloud task' }] });
    let askedWith = null;
    const { store, sync } = setup({ remote, confirmMerge: async count => { askedWith = count; return true; } });
    store.dispatch({ type: 'task/add', title: 'device task' });
    await sync.start();
    assert.equal(askedWith, 1);
    assert.deepEqual(titles(store.getState()), ['cloud task', 'device task']);
    assert.deepEqual(titles(remote.document.data), ['cloud task', 'device task']);
  });

  test('both have tasks and the user declines: cloud only, local copy kept aside once', async () => {
    const remote = createFakeRemote({ categories: [], tasks: [{ id: 'c1', title: 'cloud task' }] });
    const { store, sync, storage } = setup({ remote, confirmMerge: async () => false });
    store.dispatch({ type: 'task/add', title: 'device task' });
    await sync.start();
    assert.deepEqual(titles(store.getState()), ['cloud task']);
    assert.deepEqual(titles(JSON.parse(storage.getItem(BEFORE_LOGIN_KEY))), ['device task']);
    assert.equal(remote.writes, 0);
  });

  test("another account's leftovers on this device are never uploaded or offered for merge", async () => {
    const storage = createMemoryStorage({ [SYNC_META_KEY]: JSON.stringify({ userId: 'someone-else', baseVersion: 3, pending: [] }) });
    let asked = false;
    const { store, sync, remote } = setup({ storage, confirmMerge: async () => { asked = true; return true; } });
    store.dispatch({ type: 'task/add', title: 'private task of someone else' });
    await sync.start();
    assert.equal(asked, false);
    assert.deepEqual(titles(store.getState()), []);
    assert.deepEqual(titles(remote.document.data), []);
  });
});

describe('createSync - saving', () => {
  test('changes are recorded, debounced, and saved against the last known version', async () => {
    const { store, sync, remote, timers } = setup();
    await sync.start();
    store.dispatch({ type: 'task/add', title: 'one' });
    store.dispatch({ type: 'task/add', title: 'two' });
    assert.equal(sync.hasPending(), true);
    assert.equal(timers.pendingCount(), 1); // one debounced save, not two
    await sync.flush();
    assert.deepEqual(titles(remote.document.data), ['two', 'one']);
    assert.equal(remote.document.version, 2);
    assert.equal(sync.hasPending(), false);
  });

  test('silent edits (notify: false) are synced too', async () => {
    const { store, sync, remote } = setup();
    await sync.start();
    store.dispatch({ type: 'task/add', id: 't', title: 'draft' });
    await sync.flush();
    store.dispatch({ type: 'task/update', taskId: 't', changes: { title: 'final' } }, { notify: false });
    await sync.flush();
    assert.deepEqual(titles(remote.document.data), ['final']);
  });

  test('conflict: another device saved first - its change is kept and ours is replayed on top', async () => {
    const { store, sync, remote } = setup();
    await sync.start();
    store.dispatch({ type: 'task/add', id: 'shared', title: 'shared task' });
    await sync.flush();

    // Another device adds a task and changes the shared one.
    remote.simulateOtherDevice(data => ({
      ...data,
      tasks: [{ ...data.tasks[0], title: 'renamed elsewhere' }, ...data.tasks.slice(1), { ...data.tasks[0], id: 'other', title: 'from phone' }],
    }));
    store.dispatch({ type: 'subtask/add', taskId: 'shared', title: 'added here' });
    await sync.flush();
    await sync.flush(); // the retry after the conflict

    const saved = remote.document.data;
    assert.deepEqual(titles(saved), ['renamed elsewhere', 'from phone']);
    assert.deepEqual(saved.tasks[0].subtasks.map(subtask => subtask.title), ['added here']);
    assert.deepEqual(store.getState(), normalizeState(saved, { now: T0 }));
    assert.equal(sync.hasPending(), false);
  });

  test('a lost response does not duplicate anything when the save is retried', async () => {
    const { store, sync, remote } = setup();
    await sync.start();
    remote.loseNextResponse(); // the update reaches the database, but the reply never arrives
    store.dispatch({ type: 'task/add', title: 'only once' });
    await sync.flush();
    assert.equal(sync.status, 'error');
    await sync.flush(); // conflict (version moved) -> replay is a no-op -> save
    await sync.flush();
    assert.deepEqual(titles(remote.document.data), ['only once']);
    assert.equal(sync.hasPending(), false);
  });

  test('offline: changes stay pending (and survive a reload), then go out when back online', async () => {
    const storage = createMemoryStorage();
    const remote = createFakeRemote();
    const first = setup({ storage, remote, online: false });
    await first.sync.start();
    remote.failWith(new Error('Failed to fetch'));
    first.store.dispatch({ type: 'task/add', title: 'written offline' });
    await first.sync.flush();
    assert.equal(first.sync.status, 'offline');
    assert.equal(first.sync.hasPending(), true);
    first.sync.stop();

    // The page is reloaded later, with the network back.
    remote.failWith(null);
    const second = setup({ storage, remote });
    assert.deepEqual(titles(second.store.getState()), ['written offline']);
    await second.sync.start();
    assert.deepEqual(titles(remote.document.data), ['written offline']);
    assert.equal(second.sync.hasPending(), false);
  });

  test('changes made while a save is in flight are kept for the next save', async () => {
    const { store, sync, remote } = setup();
    await sync.start();
    store.dispatch({ type: 'task/add', title: 'first' });
    remote.beforeNextWrite(() => store.dispatch({ type: 'task/add', title: 'during save' }));
    await sync.flush();
    assert.equal(sync.hasPending(), true);
    await sync.flush();
    assert.deepEqual(titles(remote.document.data), ['during save', 'first']);
    assert.equal(sync.hasPending(), false);
  });

  test('undo and import are pushed as full replacements, which supersede earlier pending changes', async () => {
    const { store, sync, storage } = setup();
    await sync.start();
    store.dispatch({ type: 'task/add', title: 'a' });
    store.replaceState({ categories: [], tasks: [{ title: 'imported' }] }, { undoable: true });
    const { pending } = loadSyncMeta(storage);
    assert.equal(pending.length, 1);
    assert.equal(pending[0].kind, 'replace');
  });

  test('a very long offline session collapses into a single snapshot', async () => {
    const { store, sync, storage } = setup({ online: false });
    await sync.start();
    for (let index = 0; index <= MAX_PENDING_OPS; index += 1) store.dispatch({ type: 'task/add', title: `task ${index}` });
    const { pending } = loadSyncMeta(storage);
    assert.equal(pending.length, 1);
    assert.equal(pending[0].kind, 'replace');
    assert.equal(pending[0].state.tasks.length, MAX_PENDING_OPS + 1);
  });
});

describe('createSync - changes from other devices', () => {
  test('a realtime notice brings in the newer cloud copy', async () => {
    const { store, sync, remote } = setup();
    await sync.start();
    remote.simulateOtherDevice(data => ({ ...data, tasks: [{ id: 'p', title: 'added on the phone' }] }));
    await remote.notifySubscribers();
    assert.deepEqual(titles(store.getState()), ['added on the phone']);
  });

  test('the echo of our own save does not trigger a reload', async () => {
    const { store, sync, remote } = setup();
    await sync.start();
    store.dispatch({ type: 'task/add', title: 'mine' });
    await sync.flush();
    const fetchesBefore = remote.fetches;
    await remote.notifySubscribers();
    assert.equal(remote.fetches, fetchesBefore);
  });

  test('stop() detaches from the store and the cloud', async () => {
    const { store, sync, storage } = setup();
    await sync.start();
    sync.stop();
    store.dispatch({ type: 'task/add', title: 'after stop' });
    assert.equal(loadSyncMeta(storage).pending.length, 0);
    assert.ok(storage.getItem(STORAGE_KEY).includes('after stop')); // still cached locally
  });
});

describe('createSync - switching accounts and failures (review fixes)', () => {
  test("first load fails with another account's copy on the device: nothing is shown or saved until it succeeds", async () => {
    const storage = createMemoryStorage({ [SYNC_META_KEY]: JSON.stringify({ userId: 'previous-user', baseVersion: 2, nextSeq: 1, pending: [] }) });
    const remote = createFakeRemote({ categories: [], tasks: [{ id: 'mine', title: 'my cloud task' }] });
    remote.failWith(new Error('Failed to fetch'));
    const { store, sync, timers } = setup({ storage, remote });
    store.dispatch({ type: 'task/add', title: "previous account's task" });

    let readyValue = 'pending';
    sync.ready.then(value => { readyValue = value; });
    assert.equal(await sync.start(), false);
    assert.equal(remote.writes, 0);
    assert.equal(readyValue, 'pending');

    remote.failWith(null);
    await timers.runAll(); // the retry
    await Promise.resolve();
    assert.equal(readyValue, true);
    assert.deepEqual(titles(store.getState()), ['my cloud task']);
    assert.equal(remote.writes, 0);
  });

  test("a previous account's unsaved changes are set aside, never uploaded to the new account, and replayed when it returns", async () => {
    const storage = createMemoryStorage();
    const remoteA = createFakeRemote({ categories: [], tasks: [{ id: 'a1', title: 'A task' }] });
    const remoteB = createFakeRemote({ categories: [], tasks: [{ id: 'b1', title: 'B task' }] });

    // Account A works offline, then its session ends without a sign-out.
    const a = setup({ storage, remote: remoteA, userId: 'user-a' });
    await a.sync.start();
    remoteA.failWith(new Error('Failed to fetch'));
    a.store.dispatch({ type: 'task/setStatus', taskId: 'a1', status: 'in_progress' });
    await a.sync.flush();
    assert.equal(a.sync.hasPending(), true);
    a.sync.stop();

    // Account B logs in on the same device.
    const b = setup({ storage, remote: remoteB, userId: 'user-b' });
    await b.sync.start();
    assert.deepEqual(titles(b.store.getState()), ['B task']);
    assert.deepEqual(titles(remoteB.document.data), ['B task']);
    assert.ok(storage.getItem(`${UNSYNCED_KEY_PREFIX}user-a`));
    b.sync.stop();

    // Account A comes back: its set-aside change is replayed and saved to A's cloud copy.
    remoteA.failWith(null);
    const aAgain = setup({ storage, remote: remoteA, userId: 'user-a' });
    await aAgain.sync.start();
    assert.equal(aAgain.store.getState().tasks[0].status, 'in_progress');
    assert.equal(remoteA.document.data.tasks[0].status, 'in_progress');
    assert.equal(storage.getItem(`${UNSYNCED_KEY_PREFIX}user-a`), null);
  });

  test('a change made on another device during the first load is picked up right after it', async () => {
    const remote = createFakeRemote({ categories: [], tasks: [{ id: 'x', title: 'before' }] });
    const { store, sync } = setup({ remote });
    remote.afterNextRead(async () => {
      remote.simulateOtherDevice(data => ({ ...data, tasks: [{ ...data.tasks[0], title: 'changed meanwhile' }] }));
      await remote.notifySubscribers();
    });
    await sync.start();
    assert.deepEqual(titles(store.getState()), ['changed meanwhile']);
  });

  test('explicit sign-out cleanup removes sync data and backup copies, keeps view preferences and other accounts', () => {
    const storage = createMemoryStorage({
      [SYNC_META_KEY]: '{}',
      [BEFORE_LOGIN_KEY]: '{}',
      [`${STORAGE_KEY}.before-schema-2`]: '{}',
      [`${STORAGE_KEY}.corrupt-123`]: '{}',
      [STORAGE_KEY]: '{"main":true}',
      [UI_PREFS_KEY]: '{}',
      [`${UNSYNCED_KEY_PREFIX}someone-else`]: '{}',
    });
    clearAccountCopies(storage);
    assert.deepEqual(storage.keys().sort(), [STORAGE_KEY, `${UNSYNCED_KEY_PREFIX}someone-else`, UI_PREFS_KEY].sort());
  });
});
