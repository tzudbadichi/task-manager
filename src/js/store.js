// Application state: a pure reducer plus a small store that persists to localStorage.
// No DOM access here - the unit tests run this module in Node with an in-memory storage.

import { DEFAULT_STATUS, LEGACY_STATUS_MAP, deriveTaskStatus, isValidStatus } from './statuses.js';
import { cleanText, createId, isDateStamp, isHexColor, toTimestamp } from './utils.js';

// Version 3: every task has subtasks, and a task's status is derived from them.
export const SCHEMA_VERSION = 3;
// The key name is kept from version 1 so existing saved data keeps loading.
export const STORAGE_KEY = 'taskManager.state.v1';

export const LIMITS = Object.freeze({
  title: 200,
  description: 4000,
  categoryName: 40,
  categories: 50,
  tasks: 2000,
  subtasksPerTask: 300,
  // Open (not done) subtasks that can be picked for the same day in "my day".
  myDay: 3,
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
//
// Actions are replayable: "add" actions carry their new id (store.dispatch fills it in), and
// adding an id that already exists is a no-op. Cloud sync relies on this to replay pending
// changes on top of a newer cloud copy without duplicating anything.
//
// Every task has at least one subtask, and only subtasks have a settable status. The task's
// status is recomputed (deriveTaskStatus) whenever its subtasks change. The app never sets a
// task's status; task/setStatus is only replayed from changes recorded by version 2 (see below).
// ---------------------------------------------------------------------------

// Actions that create an item and therefore need an id assigned before they are reduced.
export const ID_ACTIONS = new Set(['task/add', 'subtask/add', 'category/add']);

const needsId = item => Boolean(item) && typeof item === 'object' && !(typeof item.id === 'string' && item.id);

/** Fills in the ids of the items an add action creates (including a new task's subtasks), so it replays identically. */
function withNewIds(action, makeId) {
  if (!ID_ACTIONS.has(action?.type)) return action;
  let next = action.id ? action : { ...action, id: makeId() };
  if (Array.isArray(action.subtasks) && action.subtasks.some(needsId)) {
    next = { ...next, subtasks: action.subtasks.map(subtask => (needsId(subtask) ? { ...subtask, id: makeId() } : subtask)) };
  }
  return next;
}

export function reduce(state, action, { now, makeId = createId }) {
  switch (action?.type) {
    case 'task/add':
      return addTask(state, action, now, makeId);
    case 'task/update':
      return mapTask(state, action.taskId, task => updateTaskFields(state, task, action.changes, now));
    case 'task/setStatus':
      return mapTask(state, action.taskId, task => applyLegacyTaskStatus(task, action.status, now));
    case 'task/complete':
      return mapTask(state, action.taskId, task => setAllSubtaskStatuses(task, 'done', now, action.subtaskIds));
    case 'task/touch':
      return mapTask(state, action.taskId, task => (now > task.updatedAt ? { ...task, updatedAt: now } : task));
    case 'task/delete':
      return removeTask(state, action.taskId);
    case 'tasks/reorder':
      return reorderTasks(state, action.orderedIds);
    case 'subtask/add':
      return mapTask(state, action.taskId, task => addSubtask(task, action, now, makeId));
    case 'subtask/update':
      return mapSubtask(state, action.taskId, action.subtaskId, now,
        subtask => applyTextChanges(subtask, action.changes, SUBTASK_TEXT_FIELDS, now));
    case 'subtask/setStatus':
      return mapSubtask(state, action.taskId, action.subtaskId, now,
        subtask => keepMyDayLimit(state, subtask, withStatus(subtask, action.status, now)));
    case 'subtask/setMyDay':
      return setSubtaskMyDay(state, action, now);
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

function newItemId(action, makeId) {
  return typeof action.id === 'string' && action.id ? action.id : makeId();
}

function newItemBase(id, title, status, now) {
  return {
    id,
    title,
    status: isValidStatus(status) ? status : DEFAULT_STATUS,
    statusChangedAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * The id of the subtask created from a task's own title when it has none. Derived from the task id
 * (not random) so replaying the same add, or migrating the same old data on two devices, gives the same id.
 */
function firstSubtaskId(taskId) {
  return `${taskId}:1`;
}

// action.subtasks: [{ id, title, status }]. Without any valid one, the task's own title (and
// action.status) becomes its first subtask, so a task never exists without subtasks.
function initialSubtasks(action, taskId, taskTitle, now, makeId) {
  const subtasks = [];
  for (const rawSubtask of Array.isArray(action.subtasks) ? action.subtasks : []) {
    if (subtasks.length >= LIMITS.subtasksPerTask) break;
    if (!rawSubtask || typeof rawSubtask !== 'object') continue;
    const title = cleanText(rawSubtask.title, LIMITS.title);
    const id = newItemId(rawSubtask, makeId);
    if (!title || subtasks.some(subtask => subtask.id === id)) continue;
    subtasks.push(newItemBase(id, title, rawSubtask.status, now));
  }
  return subtasks.length > 0 ? subtasks : [newItemBase(firstSubtaskId(taskId), taskTitle, action.status, now)];
}

function addTask(state, action, now, makeId) {
  const title = cleanText(action.title, LIMITS.title);
  const id = newItemId(action, makeId);
  if (!title || state.tasks.length >= LIMITS.tasks || state.tasks.some(task => task.id === id)) return state;
  const subtasks = initialSubtasks(action, id, title, now, makeId);
  const task = {
    ...newItemBase(id, title, deriveTaskStatus(subtasks), now),
    description: cleanText(action.description, LIMITS.description, { multiline: true }),
    categoryId: resolveCategoryId(state, action.categoryId),
    subtasks,
  };
  return { ...state, tasks: [task, ...state.tasks] };
}

function addSubtask(task, action, now, makeId) {
  const title = cleanText(action.title, LIMITS.title);
  const id = newItemId(action, makeId);
  if (!title || task.subtasks.length >= LIMITS.subtasksPerTask || task.subtasks.some(subtask => subtask.id === id)) return task;
  const subtask = newItemBase(id, title, action.status, now);
  return withDerivedStatus({ ...task, subtasks: [...task.subtasks, subtask], updatedAt: now }, now);
}

function removeTask(state, taskId) {
  const tasks = state.tasks.filter(task => task.id !== taskId);
  return tasks.length === state.tasks.length ? state : { ...state, tasks };
}

/**
 * Applies a drag-and-drop order. orderedIds is the new order of the tasks that were visible
 * (possibly filtered): those tasks swap among the positions they already occupied, and every
 * hidden task keeps its exact place.
 */
function reorderTasks(state, orderedIds) {
  if (!Array.isArray(orderedIds)) return state;
  const tasksById = new Map(state.tasks.map(task => [task.id, task]));
  const seen = new Set();
  const movedTasks = [];
  for (const id of orderedIds) {
    if (typeof id !== 'string' || seen.has(id) || !tasksById.has(id)) continue;
    seen.add(id);
    movedTasks.push(tasksById.get(id));
  }
  let nextMoved = 0;
  const tasks = state.tasks.map(task => (seen.has(task.id) ? movedTasks[nextMoved++] : task));
  return tasks.every((task, index) => task === state.tasks[index]) ? state : { ...state, tasks };
}

// The last subtask cannot be removed: a task always keeps at least one (to drop it, delete the task).
function removeSubtask(task, subtaskId, now) {
  const subtasks = task.subtasks.filter(subtask => subtask.id !== subtaskId);
  if (subtasks.length === task.subtasks.length || subtasks.length === 0) return task;
  return withDerivedStatus({ ...task, subtasks, updatedAt: now }, now);
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

// Updates one subtask; when something changed, bumps the parent's updatedAt and re-derives its status.
function mapSubtask(state, taskId, subtaskId, now, updater) {
  return mapTask(state, taskId, task => {
    let changed = false;
    const subtasks = task.subtasks.map(subtask => {
      if (subtask.id !== subtaskId) return subtask;
      const next = updater(subtask);
      if (next !== subtask) changed = true;
      return next;
    });
    return changed ? withDerivedStatus({ ...task, subtasks, updatedAt: now }, now) : task;
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

/**
 * Version 2 let a task's own status be set, and such a change may still wait in the sync queue (made
 * offline before the upgrade). Instead of losing it, it is applied to the subtasks: "done" closes every
 * open subtask; any other status goes to the subtask only when there is exactly one.
 */
function applyLegacyTaskStatus(task, status, now) {
  if (status !== 'done' && task.subtasks.length !== 1) return task;
  return setAllSubtaskStatuses(task, status, now);
}

/**
 * Also task/complete: "close the whole task" (offered for a task nobody touched in weeks) marks its subtasks done.
 * onlyIds: the subtasks the user saw when closing it, so a replay on a newer cloud copy does not also close
 * subtasks another device added since. Without it (or for the legacy action), every subtask.
 */
function setAllSubtaskStatuses(task, status, now, onlyIds = null) {
  const selected = Array.isArray(onlyIds) ? new Set(onlyIds) : null;
  const subtasks = task.subtasks.map(subtask => (selected && !selected.has(subtask.id) ? subtask : withStatus(subtask, status, now)));
  if (subtasks.every((subtask, index) => subtask === task.subtasks[index])) return task;
  return withDerivedStatus({ ...task, subtasks, updatedAt: now }, now);
}

/** Open subtasks picked for that day, optionally not counting one of them (the one being changed). */
export function countOpenMyDay(state, date, exceptSubtaskId = null) {
  let count = 0;
  for (const task of state.tasks) {
    for (const subtask of task.subtasks) {
      if (subtask.myDay === date && subtask.status !== 'done' && subtask.id !== exceptSubtaskId) count += 1;
    }
  }
  return count;
}

// Reopening a finished "my day" pick must not push that day over its limit: then it leaves the list.
function keepMyDayLimit(state, before, after) {
  if (after === before || !after.myDay || before.status !== 'done' || after.status === 'done') return after;
  if (countOpenMyDay(state, after.myDay, after.id) < LIMITS.myDay) return after;
  const { myDay: _dropped, ...rest } = after;
  return rest;
}

/**
 * "My day": action.date is the local day (YYYY-MM-DD) the subtask is picked for, or null to unpick it.
 * A pick from an earlier day simply stops counting the next morning, so nothing has to reset it.
 * Picking beyond LIMITS.myDay open subtasks for that day is a no-op (the app explains it first).
 */
function setSubtaskMyDay(state, action, now) {
  const { date } = action;
  if (date !== null && !isDateStamp(date)) return state;
  if (date !== null && countOpenMyDay(state, date, action.subtaskId) >= LIMITS.myDay) return state;
  return mapSubtask(state, action.taskId, action.subtaskId, now, subtask => {
    if ((subtask.myDay ?? null) === date) return subtask;
    const { myDay: _previous, ...rest } = subtask;
    return date === null ? { ...rest, updatedAt: now } : { ...rest, myDay: date, updatedAt: now };
  });
}

// Re-derives a task's status from its subtasks; the task's clock restarts only when the derived status changes.
function withDerivedStatus(task, now) {
  const status = deriveTaskStatus(task.subtasks);
  return status === task.status ? task : { ...task, status, statusChangedAt: now };
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
  const id = newItemId(action, makeId);
  if (!name || state.categories.length >= LIMITS.categories || hasCategoryName(state.categories, name)
    || state.categories.some(category => category.id === id)) return state;
  const color = isHexColor(action.color) ? action.color.toLowerCase() : FALLBACK_CATEGORY_COLOR;
  return { ...state, categories: [...state.categories, { id, name, color }] };
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
  const isOlderFormat = !(raw.schemaVersion >= SCHEMA_VERSION);

  // Same caps as the reducer, so an oversized or hostile file cannot freeze the page.
  const tasks = [];
  for (const rawTask of raw.tasks) {
    if (tasks.length >= LIMITS.tasks) break;
    const base = normalizeItemBase(rawTask, uniqueId, now);
    if (!base) continue;
    const storedSubtasks = Array.isArray(rawTask.subtasks)
      ? rawTask.subtasks.map(rawSubtask => normalizeSubtask(rawSubtask, uniqueId, now)).filter(Boolean).slice(0, LIMITS.subtasksPerTask)
      : [];
    const subtasks = migrateTaskSubtasks(base, storedSubtasks, uniqueId, isOlderFormat);
    const description = cleanText(rawTask.description, LIMITS.description, { multiline: true });
    const contact = legacyContactOf(rawTask);
    tasks.push({
      ...base,
      ...derivedStatusOf(base, subtasks),
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
  if (!base) return null;
  const contact = legacyContactOf(raw);
  const subtask = contact ? { ...base, title: cleanText(`${base.title} - ${contact}`, LIMITS.title) } : base;
  // myDay is optional: only a subtask picked for "my day" carries it. Picks of long-gone days are dropped.
  return isRecentMyDay(raw.myDay, now) ? { ...subtask, myDay: raw.myDay } : subtask;
}

// A "my day" pick is kept for MY_DAY_KEEP_DAYS after its day, then it is only clutter in the document.
const MY_DAY_KEEP_DAYS = 30;
function isRecentMyDay(value, now) {
  if (!isDateStamp(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const pickedDay = new Date(year, month - 1, day);
  if (pickedDay.getMonth() !== month - 1 || pickedDay.getDate() !== day) return false; // not a real date (2026-02-31)
  return now - pickedDay.getTime() < MY_DAY_KEEP_DAYS * 24 * 60 * 60 * 1000;
}

/**
 * Before version 3 a task had a status of its own and could have no subtasks. Data of an older format
 * keeps showing what it showed before:
 * - a closed task closes its open subtasks (closing a task used to close its subtasks);
 * - an open task whose own status its subtasks do not produce (say, "in progress" over to-do subtasks)
 *   gets a first subtask that carries it.
 * In any format, a task without (valid) subtasks gets that subtask, so no task is left without one.
 * That subtask is made of the task's title, status and times, with a stable id (same on every device).
 */
function migrateTaskSubtasks(task, subtasks, uniqueId, isOlderFormat) {
  const ownStatusSubtask = () => {
    const { title, status, statusChangedAt, createdAt, updatedAt } = task;
    return { id: uniqueId(firstSubtaskId(task.id)), title, status, statusChangedAt, createdAt, updatedAt };
  };
  if (subtasks.length === 0) return [ownStatusSubtask()];
  if (!isOlderFormat) return subtasks;
  if (task.status === 'done') {
    return subtasks.map(subtask => (subtask.status === 'done'
      ? subtask
      : { ...subtask, status: 'done', statusChangedAt: Math.max(task.statusChangedAt, subtask.statusChangedAt) }));
  }
  const isOwnStatusShown = deriveTaskStatus([...subtasks, task]) === deriveTaskStatus(subtasks);
  return isOwnStatusShown || subtasks.length >= LIMITS.subtasksPerTask ? subtasks : [ownStatusSubtask(), ...subtasks];
}

/**
 * The stored task status is never trusted - it is derived again from the subtasks. When it differs,
 * the clock starts when the subtasks entered it: the earliest of them, or the last one for "done".
 */
function derivedStatusOf(task, subtasks) {
  const status = deriveTaskStatus(subtasks);
  if (status === task.status) return { status, statusChangedAt: task.statusChangedAt };
  const times = subtasks.filter(subtask => subtask.status === status).map(subtask => subtask.statusChangedAt);
  return { status, statusChangedAt: status === 'done' ? Math.max(...times) : Math.min(...times) };
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
  const commitListeners = new Set();

  const persist = () => {
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      onPersistError(error);
    }
  };

  const notifyListeners = (change = null) => {
    for (const listener of listeners) listener(state, change);
  };

  // change: { kind: 'action', action, now } | { kind: 'replace', state } | { kind: 'remote' }
  const commit = (next, change, { notify = true } = {}) => {
    state = next;
    persist();
    if (notify) notifyListeners(change);
    for (const listener of commitListeners) listener(change);
  };

  // Save a brand-new state right away so generated category ids stay stable across reloads,
  // and save migrated data right away so storage holds the current format.
  if (loaded.fresh || loaded.migrated) persist();

  return {
    loadWarning: loaded.warning,
    getState: () => state,
    /** Re-render listeners: listener(state, change). Skipped when a change is dispatched with notify: false. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    /** Called after EVERY committed change, with what caused it (used by cloud sync). */
    onCommit(listener) {
      commitListeners.add(listener);
      return () => commitListeners.delete(listener);
    },
    /**
     * Applies an action. Returns false when nothing changed.
     * undoable: keep the previous state so undo() can restore it (any later change discards it).
     * notify: false skips re-render listeners (used when the DOM already shows the new value).
     */
    dispatch(action, { undoable = false, notify = true } = {}) {
      const now = clock();
      const replayableAction = withNewIds(action, makeId);
      const next = reduce(state, replayableAction, { now, makeId });
      if (next === state) return false;
      undoSnapshot = undoable ? state : null;
      commit(next, { kind: 'action', action: replayableAction, now }, { notify });
      return true;
    },
    /** Replaces everything (backup import). Throws on invalid data. */
    replaceState(rawState, { undoable = false } = {}) {
      const next = normalizeState(rawState, { now: clock(), makeId });
      undoSnapshot = undoable ? state : null;
      commit(next, { kind: 'replace', state: next });
    },
    /** Adopts a state that came from the cloud (already normalized). Not recorded as a local change. */
    applyRemote(next) {
      undoSnapshot = null;
      commit(next, { kind: 'remote' });
    },
    canUndo: () => undoSnapshot !== null,
    undo() {
      if (!undoSnapshot) return false;
      const previous = undoSnapshot;
      undoSnapshot = null;
      commit(previous, { kind: 'replace', state: previous });
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
