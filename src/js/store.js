// Application state: a pure reducer plus a small store that persists to localStorage.
// No DOM access here - the unit tests run this module in Node with an in-memory storage.

import { DEFAULT_STATUS, LEGACY_STATUS_MAP, isValidStatus } from './statuses.js';
import { cleanText, createId, isHexColor, toTimestamp } from './utils.js';

export const SCHEMA_VERSION = 2;
// The key name is kept from version 1 so existing saved data keeps loading.
export const STORAGE_KEY = 'taskManager.state.v1';

export const LIMITS = Object.freeze({
  title: 200,
  description: 4000,
  categoryName: 40,
  categories: 50,
  tasks: 2000,
  subtasksPerTask: 300,
});

export const FALLBACK_CATEGORY_COLOR = '#64748b';
export const THEMES = Object.freeze(['auto', 'light', 'dark']);

export const DEFAULT_SETTINGS = Object.freeze({
  theme: 'auto',
  lastExportAt: null,
});

const DEFAULT_CATEGORIES = Object.freeze([
  { name: 'פיתוח', color: '#2563eb' },
  { name: 'HR', color: '#db2777' },
  { name: 'אישי', color: '#16a34a' },
]);

// Editable text fields and their cleaning rules.
const TEXT_FIELD_RULES = Object.freeze({
  title: { maxLength: LIMITS.title, required: true },
  description: { maxLength: LIMITS.description, multiline: true },
});
const TASK_TEXT_FIELDS = ['title', 'description'];
const SUBTASK_TEXT_FIELDS = ['title'];

export function createInitialState({ makeId = createId } = {}) {
  return {
    schemaVersion: SCHEMA_VERSION,
    categories: DEFAULT_CATEGORIES.map(category => ({ id: makeId(), ...category })),
    tasks: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

// ---------------------------------------------------------------------------
// Reducer: returns the SAME state object when an action changes nothing,
// so callers can detect no-ops (and skip saving / re-rendering).
// ---------------------------------------------------------------------------

export function reduce(state, action, { now, makeId = createId }) {
  switch (action?.type) {
    case 'task/add':
      return addTask(state, action, now, makeId);
    case 'task/update':
      return mapTask(state, action.taskId, task => updateTaskFields(state, task, action.changes, now));
    case 'task/setStatus':
      return mapTask(state, action.taskId, task => withStatus(task, action.status, now));
    case 'task/delete':
      return removeTask(state, action.taskId);
    case 'subtask/add':
      return mapTask(state, action.taskId, task => addSubtask(task, action, now, makeId));
    case 'subtask/update':
      return mapSubtask(state, action.taskId, action.subtaskId, now,
        subtask => applyTextChanges(subtask, action.changes, SUBTASK_TEXT_FIELDS, now));
    case 'subtask/setStatus':
      return mapSubtask(state, action.taskId, action.subtaskId, now, subtask => withStatus(subtask, action.status, now));
    case 'subtask/delete':
      return mapTask(state, action.taskId, task => removeSubtask(task, action.subtaskId, now));
    case 'category/add':
      return addCategory(state, action, makeId);
    case 'category/update':
      return updateCategory(state, action.categoryId, action.changes);
    case 'category/delete':
      return removeCategory(state, action.categoryId);
    case 'settings/update':
      return updateSettings(state, action.changes, now);
    default:
      return state;
  }
}

function newItemBase(title, status, now, makeId) {
  return {
    id: makeId(),
    title,
    status: isValidStatus(status) ? status : DEFAULT_STATUS,
    statusChangedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

function addTask(state, action, now, makeId) {
  const title = cleanText(action.title, LIMITS.title);
  if (!title || state.tasks.length >= LIMITS.tasks) return state;
  const task = {
    ...newItemBase(title, action.status, now, makeId),
    description: cleanText(action.description, LIMITS.description, { multiline: true }),
    categoryId: resolveCategoryId(state, action.categoryId),
    subtasks: [],
  };
  return { ...state, tasks: [task, ...state.tasks] };
}

function addSubtask(task, action, now, makeId) {
  const title = cleanText(action.title, LIMITS.title);
  if (!title || task.subtasks.length >= LIMITS.subtasksPerTask) return task;
  const subtask = newItemBase(title, action.status, now, makeId);
  return { ...task, subtasks: [...task.subtasks, subtask], updatedAt: now };
}

function removeTask(state, taskId) {
  const tasks = state.tasks.filter(task => task.id !== taskId);
  return tasks.length === state.tasks.length ? state : { ...state, tasks };
}

function removeSubtask(task, subtaskId, now) {
  const subtasks = task.subtasks.filter(subtask => subtask.id !== subtaskId);
  return subtasks.length === task.subtasks.length ? task : { ...task, subtasks, updatedAt: now };
}

function mapTask(state, taskId, updater) {
  let changed = false;
  const tasks = state.tasks.map(task => {
    if (task.id !== taskId) return task;
    const next = updater(task);
    if (next !== task) changed = true;
    return next;
  });
  return changed ? { ...state, tasks } : state;
}

// Updates one subtask and bumps the parent's updatedAt when something changed.
function mapSubtask(state, taskId, subtaskId, now, updater) {
  return mapTask(state, taskId, task => {
    let changed = false;
    const subtasks = task.subtasks.map(subtask => {
      if (subtask.id !== subtaskId) return subtask;
      const next = updater(subtask);
      if (next !== subtask) changed = true;
      return next;
    });
    return changed ? { ...task, subtasks, updatedAt: now } : task;
  });
}

function applyTextChanges(item, changes, fields, now) {
  if (!changes || typeof changes !== 'object') return item;
  let next = item;
  for (const field of fields) {
    if (!Object.hasOwn(changes, field)) continue;
    const rule = TEXT_FIELD_RULES[field];
    const value = cleanText(changes[field], rule.maxLength, { multiline: rule.multiline });
    if ((rule.required && !value) || value === item[field]) continue;
    next = { ...next, [field]: value };
  }
  return next === item ? item : { ...next, updatedAt: now };
}

function updateTaskFields(state, task, changes, now) {
  const withText = applyTextChanges(task, changes, TASK_TEXT_FIELDS, now);
  if (!changes || typeof changes !== 'object' || !Object.hasOwn(changes, 'categoryId')) return withText;
  const categoryId = resolveCategoryId(state, changes.categoryId);
  return categoryId === withText.categoryId ? withText : { ...withText, categoryId, updatedAt: now };
}

// A status change restarts the "time in status" clock.
function withStatus(item, status, now) {
  if (!isValidStatus(status) || item.status === status) return item;
  return { ...item, status, statusChangedAt: now, updatedAt: now };
}

function resolveCategoryId(state, categoryId) {
  return state.categories.some(category => category.id === categoryId) ? categoryId : null;
}

function hasCategoryName(categories, name, exceptId = null) {
  const lowerName = name.toLocaleLowerCase();
  return categories.some(category => category.id !== exceptId && category.name.toLocaleLowerCase() === lowerName);
}

function addCategory(state, action, makeId) {
  const name = cleanText(action.name, LIMITS.categoryName);
  if (!name || state.categories.length >= LIMITS.categories || hasCategoryName(state.categories, name)) return state;
  const color = isHexColor(action.color) ? action.color.toLowerCase() : FALLBACK_CATEGORY_COLOR;
  return { ...state, categories: [...state.categories, { id: makeId(), name, color }] };
}

function updateCategory(state, categoryId, changes) {
  if (!changes || typeof changes !== 'object') return state;
  let changed = false;
  const categories = state.categories.map(category => {
    if (category.id !== categoryId) return category;
    let next = category;
    if (Object.hasOwn(changes, 'name')) {
      const name = cleanText(changes.name, LIMITS.categoryName);
      if (name && name !== category.name && !hasCategoryName(state.categories, name, categoryId)) next = { ...next, name };
    }
    if (Object.hasOwn(changes, 'color') && isHexColor(changes.color)) {
      const color = changes.color.toLowerCase();
      if (color !== category.color) next = { ...next, color };
    }
    if (next !== category) changed = true;
    return next;
  });
  return changed ? { ...state, categories } : state;
}

// Deleting a category keeps its tasks; they simply become uncategorized.
function removeCategory(state, categoryId) {
  if (!state.categories.some(category => category.id === categoryId)) return state;
  return {
    ...state,
    categories: state.categories.filter(category => category.id !== categoryId),
    tasks: state.tasks.map(task => (task.categoryId === categoryId ? { ...task, categoryId: null } : task)),
  };
}

function updateSettings(state, changes, now) {
  if (!changes || typeof changes !== 'object') return state;
  const settings = normalizeSettings({ ...state.settings, ...changes }, now);
  const changed = Object.keys(settings).some(key => settings[key] !== state.settings[key]);
  return changed ? { ...state, settings } : state;
}

// ---------------------------------------------------------------------------
// Normalization: everything loaded from storage or imported from a backup file
// is untrusted and gets rebuilt field by field.
// ---------------------------------------------------------------------------

export function normalizeSettings(raw, now = Date.now()) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    theme: THEMES.includes(source.theme) ? source.theme : DEFAULT_SETTINGS.theme,
    lastExportAt: pastTimestamp(source.lastExportAt, null, now),
  };
}

export function normalizeState(raw, { now = Date.now(), makeId = createId } = {}) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.tasks) || !Array.isArray(raw.categories)) {
    throw new Error('מבנה הנתונים לא תקין: חסרות רשימות משימות או קטגוריות');
  }

  // Ids must be unique across the whole document; duplicates or missing ids get fresh ones.
  const usedIds = new Set();
  const uniqueId = candidate => {
    let id = typeof candidate === 'string' && candidate ? candidate : makeId();
    while (usedIds.has(id)) id = makeId();
    usedIds.add(id);
    return id;
  };

  const categories = [];
  for (const rawCategory of raw.categories) {
    if (categories.length >= LIMITS.categories) break;
    if (!rawCategory || typeof rawCategory !== 'object') continue;
    const name = cleanText(rawCategory.name, LIMITS.categoryName);
    if (!name || hasCategoryName(categories, name)) continue;
    const color = isHexColor(rawCategory.color) ? rawCategory.color.toLowerCase() : FALLBACK_CATEGORY_COLOR;
    categories.push({ id: uniqueId(rawCategory.id), name, color });
  }
  const categoryIds = new Set(categories.map(category => category.id));

  // Same caps as the reducer, so an oversized or hostile file cannot freeze the page.
  const tasks = [];
  for (const rawTask of raw.tasks) {
    if (tasks.length >= LIMITS.tasks) break;
    const base = normalizeItemBase(rawTask, uniqueId, now);
    if (!base) continue;
    const subtasks = Array.isArray(rawTask.subtasks)
      ? rawTask.subtasks.map(rawSubtask => normalizeSubtask(rawSubtask, uniqueId, now)).filter(Boolean).slice(0, LIMITS.subtasksPerTask)
      : [];
    const description = cleanText(rawTask.description, LIMITS.description, { multiline: true });
    const contact = legacyContactOf(rawTask);
    tasks.push({
      ...base,
      description: contact
        ? cleanText(`${description}\nאיש קשר: ${contact}`, LIMITS.description, { multiline: true })
        : description,
      categoryId: categoryIds.has(rawTask.categoryId) ? rawTask.categoryId : null,
      subtasks,
    });
  }

  return { schemaVersion: SCHEMA_VERSION, categories, tasks, settings: normalizeSettings(raw.settings, now) };
}

// Stored or imported timestamps must not lie in the future (a "time in status" would go negative).
function pastTimestamp(value, fallback, now) {
  const timestamp = toTimestamp(value, fallback);
  return timestamp === null ? null : Math.min(timestamp, now);
}

function normalizeItemBase(raw, uniqueId, now) {
  if (!raw || typeof raw !== 'object') return null;
  const title = cleanText(raw.title, LIMITS.title);
  if (!title) return null;
  const createdAt = pastTimestamp(raw.createdAt, now, now);
  const updatedAt = pastTimestamp(raw.updatedAt, createdAt, now);
  return {
    id: uniqueId(raw.id),
    title,
    status: normalizeStatus(raw.status),
    statusChangedAt: pastTimestamp(raw.statusChangedAt, updatedAt, now),
    createdAt,
    updatedAt,
  };
}

function normalizeSubtask(raw, uniqueId, now) {
  const base = normalizeItemBase(raw, uniqueId, now);
  const contact = legacyContactOf(raw);
  return base && contact ? { ...base, title: cleanText(`${base.title} - ${contact}`, LIMITS.title) } : base;
}

function normalizeStatus(value) {
  if (isValidStatus(value)) return value;
  return typeof value === 'string' && Object.hasOwn(LEGACY_STATUS_MAP, value) ? LEGACY_STATUS_MAP[value] : DEFAULT_STATUS;
}

// Version 1 had a per-item "contact" field (who an email came from / was awaited from).
// It is no longer a field, so its text is kept: in the description of a task, or after a subtask's title.
function legacyContactOf(raw) {
  return raw && typeof raw === 'object' ? cleanText(raw.contact, LIMITS.title) : '';
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Reads the saved state. Never throws: corrupt data is copied to a backup key
 * (so nothing is silently lost) and the app starts fresh with a warning.
 */
export function loadState(storage, { now, makeId = createId }) {
  let raw = null;
  try {
    raw = storage ? storage.getItem(STORAGE_KEY) : null;
  } catch {
    return { state: createInitialState({ makeId }), warning: 'אין גישה לאחסון הדפדפן - השינויים לא יישמרו', fresh: true };
  }
  if (raw === null) return { state: createInitialState({ makeId }), warning: null, fresh: true };
  try {
    const parsed = JSON.parse(raw);
    const state = normalizeState(parsed, { now, makeId });
    const migrated = parsed.schemaVersion !== SCHEMA_VERSION;
    // Before an older format is rewritten, keep the original once under its own key.
    if (migrated) keepPreMigrationCopy(storage, raw);
    return { state, warning: null, fresh: false, migrated };
  } catch {
    const backupKey = `${STORAGE_KEY}.corrupt-${now}`;
    try {
      storage.setItem(backupKey, raw);
    } catch {
      // Nothing more we can do; the warning below still tells the user.
    }
    return {
      state: createInitialState({ makeId }),
      warning: `הנתונים השמורים היו פגומים ולכן התחלנו מחדש. עותק של הנתונים הישנים נשמר בדפדפן תחת המפתח ${backupKey}`,
      fresh: true,
    };
  }
}

export const PRE_MIGRATION_KEY = `${STORAGE_KEY}.before-schema-${SCHEMA_VERSION}`;

function keepPreMigrationCopy(storage, raw) {
  try {
    if (storage.getItem(PRE_MIGRATION_KEY) === null) storage.setItem(PRE_MIGRATION_KEY, raw);
  } catch {
    // Best effort only - the migrated data itself is still saved.
  }
}

export function createStore({ storage = null, clock = () => Date.now(), makeId = createId, onPersistError = () => {} } = {}) {
  const loaded = loadState(storage, { now: clock(), makeId });
  let state = loaded.state;
  let undoSnapshot = null;
  const listeners = new Set();

  const persist = () => {
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      onPersistError(error);
    }
  };

  const notifyListeners = () => {
    for (const listener of listeners) listener(state);
  };

  const commit = (next, { notify = true } = {}) => {
    state = next;
    persist();
    if (notify) notifyListeners();
  };

  // Save a brand-new state right away so generated category ids stay stable across reloads,
  // and save migrated data right away so storage holds the current format.
  if (loaded.fresh || loaded.migrated) persist();

  return {
    loadWarning: loaded.warning,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /**
     * Applies an action. Returns false when nothing changed.
     * undoable: keep the previous state so undo() can restore it (any later change discards it).
     * notify: false skips re-render listeners (used when the DOM already shows the new value).
     */
    dispatch(action, { undoable = false, notify = true } = {}) {
      const next = reduce(state, action, { now: clock(), makeId });
      if (next === state) return false;
      undoSnapshot = undoable ? state : null;
      commit(next, { notify });
      return true;
    },
    /** Replaces everything (backup import). Throws on invalid data. */
    replaceState(rawState, { undoable = false } = {}) {
      const next = normalizeState(rawState, { now: clock(), makeId });
      undoSnapshot = undoable ? state : null;
      commit(next);
    },
    canUndo: () => undoSnapshot !== null,
    undo() {
      if (!undoSnapshot) return false;
      const previous = undoSnapshot;
      undoSnapshot = null;
      commit(previous);
      return true;
    },
    /**
     * Picks up changes written by another browser tab. Returns a warning (and keeps the current
     * state) when the stored data is missing or unreadable, so a bad write never blanks this tab.
     */
    reloadFromStorage() {
      const loaded = loadState(storage, { now: clock(), makeId });
      if (loaded.fresh) return loaded.warning ?? 'הנתונים נמחקו מהאחסון בלשונית אחרת. הם עדיין מוצגים כאן - מומלץ לייצא גיבוי.';
      state = loaded.state;
      undoSnapshot = null;
      notifyListeners();
      return null;
    },
  };
}
