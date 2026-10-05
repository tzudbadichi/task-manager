// Cloud sync between the local store and the user's single cloud document.
//
// Local-first: every change is applied and cached locally right away, recorded as a pending
// operation, and pushed to the cloud shortly after (debounced). The cloud row has a version
// number, and a save only succeeds against the version it was based on. When another device
// saved first, the newest cloud copy is fetched and the pending operations are replayed on
// top of it (store actions are replayable - see store.js), then the save is retried.
//
// No DOM access: the cloud is reached through an injected `remote` adapter (cloud.js in the
// browser, an in-memory fake in tests/sync.test.js).

import { LIMITS, STORAGE_KEY, createInitialState, normalizeState, reduce } from './store.js';
import { createId } from './utils.js';

export const SYNC_META_KEY = 'taskManager.sync.v1';
// Pre-login tasks the user chose not to add to the account are kept here once, just in case.
export const BEFORE_LOGIN_KEY = `${STORAGE_KEY}.before-login`;
// Unsaved changes of an account whose session ended before another account logged in on
// this device. They are replayed when that account logs in here again - never uploaded elsewhere.
export const UNSYNCED_KEY_PREFIX = `${SYNC_META_KEY}.unsynced-`;
export const MAX_PENDING_OPS = 300;

const SAVE_DEBOUNCE_MS = 700;
const RETRY_DELAYS_MS = [2000, 5000, 15000, 30000, 60000];
const MAX_CONFLICTS_IN_A_ROW = 5;

/** Rebuilds a state by applying pending operations to a base state (the newest cloud copy). */
export function replayOperations(baseState, operations, { makeId = createId } = {}) {
  return operations.reduce((state, operation) => (operation.kind === 'replace'
    ? normalizeState(operation.state, { now: operation.now, makeId })
    : reduce(state, operation.action, { now: operation.now, makeId })), baseState);
}

/**
 * Adds tasks created on this device before logging in to the account's cloud document.
 * Categories are matched by name; local tasks whose id already exists in the cloud are skipped.
 */
export function mergeLocalIntoRemote(remoteState, localState, { makeId = createId } = {}) {
  const categories = [...remoteState.categories];
  const categoryIdMap = new Map();
  for (const localCategory of localState.categories) {
    const lowerName = localCategory.name.toLocaleLowerCase();
    const match = categories.find(category => category.name.toLocaleLowerCase() === lowerName);
    if (match) {
      categoryIdMap.set(localCategory.id, match.id);
    } else if (categories.length < LIMITS.categories) {
      const id = categories.some(category => category.id === localCategory.id) ? makeId() : localCategory.id;
      categories.push({ ...localCategory, id });
      categoryIdMap.set(localCategory.id, id);
    }
  }
  const remoteIds = new Set(remoteState.tasks.flatMap(task => [task.id, ...task.subtasks.map(subtask => subtask.id)]));
  const addedTasks = localState.tasks
    .filter(task => !remoteIds.has(task.id))
    .map(task => ({ ...task, categoryId: categoryIdMap.get(task.categoryId) ?? null }));
  return normalizeState(
    { ...remoteState, categories, tasks: [...remoteState.tasks, ...addedTasks] },
    { makeId },
  );
}

function emptyMeta() {
  return { userId: null, baseVersion: null, nextSeq: 1, pending: [] };
}

function validOperations(value) {
  return Array.isArray(value)
    ? value.filter(op => op && typeof op === 'object' && Number.isInteger(op.seq) && (op.kind === 'action' || op.kind === 'replace'))
    : [];
}

export function loadSyncMeta(storage) {
  try {
    const raw = JSON.parse(storage?.getItem(SYNC_META_KEY) ?? 'null');
    if (!raw || typeof raw !== 'object') return emptyMeta();
    const pending = validOperations(raw.pending);
    return {
      userId: typeof raw.userId === 'string' ? raw.userId : null,
      baseVersion: Number.isInteger(raw.baseVersion) ? raw.baseVersion : null,
      nextSeq: Number.isInteger(raw.nextSeq) ? raw.nextSeq : Math.max(0, ...pending.map(op => op.seq)) + 1,
      pending,
    };
  } catch {
    return emptyMeta();
  }
}

function storageKeys(storage) {
  const keys = [];
  for (let index = 0; index < (storage?.length ?? 0); index += 1) keys.push(storage.key(index));
  return keys.filter(key => typeof key === 'string');
}

/**
 * Explicit sign-out: removes the signed-out account's copies from this device - sync metadata and
 * every backup copy of the task data (before-login, before-migration, corrupt). The caller resets
 * the main task cache. View preferences stay, and so do other accounts' set-aside unsaved changes.
 */
export function clearAccountCopies(storage) {
  for (const key of storageKeys(storage)) {
    if (key === SYNC_META_KEY || key.startsWith(`${STORAGE_KEY}.`)) {
      try {
        storage.removeItem(key);
      } catch {
        // Keep going with the other keys.
      }
    }
  }
}

/**
 * status values reported through onStatus:
 *   'connecting' | 'saving' | 'synced' | 'offline' | 'error'
 */
export function createSync({
  store,
  remote,
  storage,
  userId,
  makeId = createId,
  clock = () => Date.now(),
  timers = globalThis,
  isOnline = () => globalThis.navigator?.onLine !== false,
  onStatus = () => {},
  confirmMerge = async () => true,
  debounceMs = SAVE_DEBOUNCE_MS,
}) {
  let meta = loadSyncMeta(storage);
  let saveTimer = null;
  let reconcileTimer = null;
  let retryIndex = 0;
  let reconcileAttempts = 0;
  let conflictsInARow = 0;
  let saving = false;
  let saveRequested = false;
  let refreshRequested = false;
  // Until the first load from the cloud succeeds, nothing is saved or adopted: the local copy
  // may belong to another account.
  let isReconciled = false;
  let isReconciling = false;
  let stopped = false;
  let unsubscribeStore = null;
  let unsubscribeRemote = null;
  let status = null;
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });

  const setStatus = (next, error = null) => {
    status = next;
    onStatus(next, error);
  };

  const persistMeta = () => {
    try {
      storage?.setItem(SYNC_META_KEY, JSON.stringify(meta));
    } catch {
      // Storage full: pending operations stay in memory and are still pushed while the page is open.
    }
  };

  const pushOperation = operation => {
    const op = { ...operation, seq: meta.nextSeq++ };
    // A full replacement makes every earlier operation irrelevant.
    meta.pending = op.kind === 'replace' ? [op] : [...meta.pending, op];
    // A very long offline session collapses into one snapshot of the current state.
    if (meta.pending.length > MAX_PENDING_OPS) {
      meta.pending = [{ kind: 'replace', state: store.getState(), now: clock(), seq: meta.nextSeq++ }];
    }
    persistMeta();
  };

  const scheduleSave = delayMs => {
    if (stopped) return;
    if (saveTimer !== null) timers.clearTimeout(saveTimer);
    saveTimer = timers.setTimeout(() => {
      saveTimer = null;
      return saveNow();
    }, delayMs);
  };

  const retryDelay = attempt => RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)];

  const handleError = (error, { retrySave }) => {
    setStatus(isOnline() ? 'error' : 'offline', error);
    if (!retrySave) return;
    scheduleSave(retryDelay(retryIndex));
    retryIndex += 1;
  };

  // Adopts a cloud copy, keeping any local changes that were not saved yet.
  const adoptRemoteDocument = remoteDocument => {
    const remoteState = normalizeState(remoteDocument.data, { now: clock(), makeId });
    const next = meta.pending.length > 0 ? replayOperations(remoteState, meta.pending, { makeId }) : remoteState;
    store.applyRemote(next);
    meta.baseVersion = remoteDocument.version;
    persistMeta();
  };

  function stashPendingOf(previousMeta) {
    try {
      storage?.setItem(`${UNSYNCED_KEY_PREFIX}${previousMeta.userId}`, JSON.stringify({ pending: previousMeta.pending }));
    } catch {
      // Best effort only.
    }
  }

  function takeStashedPending() {
    const key = `${UNSYNCED_KEY_PREFIX}${userId}`;
    try {
      const raw = JSON.parse(storage?.getItem(key) ?? 'null');
      storage?.removeItem(key);
      return validOperations(raw?.pending);
    } catch {
      return [];
    }
  }

  function keepBeforeLoginCopy(localState) {
    try {
      if (storage && storage.getItem(BEFORE_LOGIN_KEY) === null) storage.setItem(BEFORE_LOGIN_KEY, JSON.stringify(localState));
    } catch {
      // Best effort only.
    }
  }

  /** First load from the cloud: decides what this device shows for this account. Throws on network errors. */
  async function reconcileOnStart() {
    const remoteDocument = await remote.fetch();
    if (stopped) return;

    if (meta.userId === userId) {
      if (!remoteDocument) {
        // The cloud row is gone (or was never created): upload what this device has.
        meta.baseVersion = null;
        if (meta.pending.length === 0) pushOperation({ kind: 'replace', state: store.getState(), now: clock() });
      } else if (meta.pending.length > 0 || remoteDocument.version !== meta.baseVersion) {
        adoptRemoteDocument(remoteDocument);
      }
      return;
    }

    // The local copy is not this account's synced copy: either tasks created before logging in
    // (meta.userId === null), or another account's leftovers - which are never shown or uploaded here.
    const local = store.getState();
    const hasPreLoginTasks = meta.userId === null && local.tasks.length > 0;
    if (meta.userId !== null && meta.pending.length > 0) stashPendingOf(meta);
    const stashed = takeStashedPending();
    const now = clock();

    let base;
    if (remoteDocument) {
      base = normalizeState(remoteDocument.data, { now, makeId });
      meta = { ...emptyMeta(), userId, baseVersion: remoteDocument.version };
    } else {
      base = hasPreLoginTasks ? local : createInitialState({ makeId });
      meta = { ...emptyMeta(), userId };
      pushOperation({ kind: 'replace', state: base, now });
    }
    // This account's own changes that were set aside on this device earlier.
    for (const { seq, ...operation } of stashed) pushOperation(operation);
    let next = stashed.length > 0 ? replayOperations(base, stashed, { makeId }) : base;

    if (remoteDocument && hasPreLoginTasks) {
      const shouldMerge = await confirmMerge(local.tasks.length);
      if (stopped) return;
      if (shouldMerge) {
        next = mergeLocalIntoRemote(next, local, { makeId });
        pushOperation({ kind: 'replace', state: next, now });
      } else {
        keepBeforeLoginCopy(local);
      }
    }
    store.applyRemote(next);
    persistMeta();
  }

  async function attemptReconcile() {
    if (stopped || isReconciled || isReconciling) return;
    if (reconcileTimer !== null) {
      timers.clearTimeout(reconcileTimer);
      reconcileTimer = null;
    }
    isReconciling = true;
    try {
      await reconcileOnStart();
    } catch (error) {
      isReconciling = false;
      if (stopped) return;
      handleError(error, { retrySave: false });
      reconcileTimer = timers.setTimeout(() => {
        reconcileTimer = null;
        return attemptReconcile();
      }, retryDelay(reconcileAttempts));
      reconcileAttempts += 1;
      return;
    }
    isReconciling = false;
    if (stopped) return;
    isReconciled = true;
    resolveReady(true);
    if (refreshRequested) {
      refreshRequested = false;
      await refresh();
    } else if (meta.pending.length > 0) {
      await saveNow();
    } else {
      setStatus('synced');
    }
  }

  async function saveNow() {
    if (saveTimer !== null) {
      timers.clearTimeout(saveTimer);
      saveTimer = null;
    }
    if (stopped) return;
    if (!isReconciled) {
      await attemptReconcile();
      return;
    }
    if (saving) {
      saveRequested = true;
      return;
    }
    if (meta.pending.length === 0) {
      setStatus('synced');
      return;
    }

    saving = true;
    setStatus('saving');
    const includedSeq = meta.pending[meta.pending.length - 1].seq;
    const snapshot = store.getState();
    let conflicted = false;
    try {
      const result = meta.baseVersion === null
        ? await remote.insert(snapshot)
        : await remote.update(snapshot, meta.baseVersion);
      if (stopped) return;
      if (result.conflict) {
        conflicted = true;
        conflictsInARow += 1;
        const latest = await remote.fetch();
        if (stopped) return;
        if (latest) adoptRemoteDocument(latest);
        else meta.baseVersion = null;
      } else {
        conflictsInARow = 0;
        retryIndex = 0;
        meta.baseVersion = result.version;
        meta.pending = meta.pending.filter(op => op.seq > includedSeq);
        persistMeta();
      }
    } catch (error) {
      saving = false;
      handleError(error, { retrySave: true });
      return;
    }
    saving = false;

    if (conflictsInARow >= MAX_CONFLICTS_IN_A_ROW) {
      conflictsInARow = 0;
      handleError(new Error('Too many save conflicts in a row'), { retrySave: true });
      return;
    }
    if (refreshRequested) {
      refreshRequested = false;
      await refresh();
      return;
    }
    if (conflicted || saveRequested || meta.pending.length > 0) {
      saveRequested = false;
      scheduleSave(conflicted ? 200 : 0);
    } else {
      setStatus('synced');
    }
  }

  /** Fetches the cloud copy and adopts it if another device changed it. */
  async function refresh() {
    if (stopped) return;
    if (!isReconciled) {
      if (isReconciling) refreshRequested = true;
      else await attemptReconcile();
      return;
    }
    if (saving) {
      refreshRequested = true;
      return;
    }
    try {
      const latest = await remote.fetch();
      if (stopped) return;
      if (!latest) {
        meta.baseVersion = null;
        if (meta.pending.length === 0) pushOperation({ kind: 'replace', state: store.getState(), now: clock() });
      } else if (latest.version !== meta.baseVersion) {
        adoptRemoteDocument(latest);
      }
      if (meta.pending.length > 0) await saveNow();
      else setStatus('synced');
    } catch (error) {
      handleError(error, { retrySave: meta.pending.length > 0 });
    }
  }

  return {
    get status() { return status; },
    get userId() { return userId; },
    /** Resolves true once this account's tasks are loaded (false if stopped first). */
    ready,
    /** Resolves true when the first load succeeded right away; otherwise it keeps retrying in the background. */
    async start() {
      setStatus('connecting');
      unsubscribeStore = store.onCommit(change => {
        if (stopped || (change.kind !== 'action' && change.kind !== 'replace')) return;
        pushOperation(change.kind === 'replace'
          ? { kind: 'replace', state: change.state, now: clock() }
          : { kind: 'action', action: change.action, now: change.now });
        scheduleSave(debounceMs);
      });
      // Listen before the first load, so a change made elsewhere in between is not missed.
      // The adapter also reports once when the live channel is connected (version null).
      unsubscribeRemote = remote.subscribe(version => {
        if (version === null || version === undefined || version !== meta.baseVersion) refresh();
      });
      await attemptReconcile();
      return isReconciled;
    },
    stop() {
      stopped = true;
      if (saveTimer !== null) timers.clearTimeout(saveTimer);
      if (reconcileTimer !== null) timers.clearTimeout(reconcileTimer);
      unsubscribeStore?.();
      unsubscribeRemote?.();
      resolveReady(false);
    },
    saveNow,
    refresh,
    /** Saves now and resolves when the cloud is up to date (or the attempt failed). */
    async flush() {
      await saveNow();
    },
    hasPending: () => meta.pending.length > 0,
  };
}
