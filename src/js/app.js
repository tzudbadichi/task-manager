// Entry point: connects the store to the DOM, handles all user events (delegated), the task
// grid with drag-and-drop, dialogs, backup import/export, and - when Supabase is configured -
// login and cloud sync.

import { STORAGE_KEY, createInitialState, createStore } from './store.js';
import { NO_CATEGORY, selectVisibleTasks } from './selectors.js';
import { DEFAULT_FILTERS, loadUiPrefs, saveUiPrefs } from './ui-prefs.js';
import {
  ONLY_SUBTASK_MESSAGE, fillCategorySelect, fillStatusSelect, renderBackupBanner, renderCategoriesList, renderDashboard,
  renderFilters, renderSwatches, renderSyncStatus, renderTaskDetail, renderTaskGrid, suggestCategoryColor,
} from './render.js';
import { hydrateIcons } from './icons.js';
import { h } from './dom.js';
import { createId, dateStamp } from './utils.js';
import { createCloud, loadCloudConfig } from './cloud.js';
import { createAuthView } from './auth-view.js';
import { enableGridDrag } from './drag.js';
import { clearAccountCopies, createSync, loadSyncMeta } from './sync.js';

const TICK_INTERVAL_MS = 30_000;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_VISIBLE_TOASTS = 3;

const els = {
  dashboard: byId('dashboard'),
  filters: byId('filters'),
  backupBanner: byId('backup-banner'),
  taskList: byId('task-list'),
  toastRegion: byId('toast-region'),
  syncStatus: byId('sync-status'),
  loadingScreen: byId('loading-screen'),
  loadingMessage: byId('loading-message'),
  taskDialog: byId('task-dialog'),
  taskForm: byId('task-form'),
  detailDialog: byId('detail-dialog'),
  detailBody: byId('detail-body'),
  categoriesDialog: byId('categories-dialog'),
  categoriesList: byId('categories-list'),
  categoryForm: byId('category-form'),
  newCategoryName: byId('new-category-name'),
  newCategoryColor: byId('new-category-color'),
  categorySwatches: byId('category-swatches'),
  settingsDialog: byId('settings-dialog'),
  settingsForm: byId('settings-form'),
  accountSection: byId('account-section'),
  accountEmail: byId('account-email'),
  storageNote: byId('storage-note'),
  storageSummary: byId('storage-summary'),
  lastExportLabel: byId('last-export-label'),
  importInput: byId('import-input'),
};

const storage = getLocalStorage();
const store = createStore({
  storage,
  onPersistError: () => showToast('השמירה בדפדפן נכשלה - מומלץ לייצא גיבוי עכשיו', { tone: 'error', durationMs: 12000 }),
});
const ui = loadUiPrefs(storage);
const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
const finePointerQuery = window.matchMedia('(pointer: fine)');

let isBackupBannerDismissed = false;
let detailTaskId = null;
let paletteCategoryId = null; // category whose color palette is open in the categories dialog
let hasPendingStorageReload = false;
let isRenderDeferred = false;
let isDragging = false;

// Cloud mode
let mode = 'local'; // 'local' | 'cloud'
let cloud = null;
let authView = null;
let sync = null;
let isSyncReady = false;
let currentUser = null;
let isSignOutRequested = false;
// Arriving from a password-reset link: stay on the "new password" form until it is saved.
let isRecoveringPassword = window.location.hash.includes('type=recovery');

function byId(id) {
  return document.getElementById(id);
}

function getLocalStorage() {
  try {
    const localStorageRef = window.localStorage;
    const probeKey = '__taskManager_probe__';
    localStorageRef.setItem(probeKey, '1');
    localStorageRef.removeItem(probeKey);
    return localStorageRef;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function render() {
  // Never rebuild the grid under a tile that is being dragged; catch up on drop.
  if (isDragging) {
    isRenderDeferred = true;
    return;
  }
  isRenderDeferred = false;
  const state = store.getState();
  const now = Date.now();
  const focusSnapshot = captureFocus();
  pruneCategoryFilter(state);
  applyTheme(state.settings.theme);
  renderDashboard(els.dashboard, state, ui.filters);
  renderFilters(els.filters, state, ui.filters);
  renderBackupBanner(els.backupBanner, state, now, isBackupBannerDismissed || mode === 'cloud');
  renderTaskGrid(els.taskList, state, ui.filters, now);
  if (els.categoriesDialog.open) renderCategoriesList(els.categoriesList, state, paletteCategoryId);
  if (els.detailDialog.open && !renderTaskDetail(els.detailBody, state, detailTaskId, now)) els.detailDialog.close();
  restoreFocus(focusSnapshot);
}

// Changes from another device must not wipe text the user is typing - those wait until the field is left.
function onStoreChange(state, change) {
  if (change?.kind === 'remote' && isEditingUnsavedText()) {
    isRenderDeferred = true;
    return;
  }
  render();
}

// Re-rendering replaces elements, so remember which field had focus (by data-focus-key) and restore it.
function captureFocus() {
  const active = document.activeElement;
  const focusKey = active?.dataset?.focusKey;
  if (!focusKey) return null;
  let selection = null;
  try {
    if (typeof active.selectionStart === 'number') selection = [active.selectionStart, active.selectionEnd];
  } catch {
    // Some input types (color, checkbox) do not support selection.
  }
  return { focusKey, selection };
}

function restoreFocus(snapshot) {
  if (!snapshot) return;
  const target = document.querySelector(`[data-focus-key="${CSS.escape(snapshot.focusKey)}"]`);
  if (!target || target === document.activeElement) return;
  target.focus({ preventScroll: true });
  if (snapshot.selection) {
    try {
      target.setSelectionRange(...snapshot.selection);
    } catch {
      // Not a text field anymore - focus alone is enough.
    }
  }
}

// A deleted category must not stay in the filter, otherwise the grid could look empty for no visible reason.
function pruneCategoryFilter(state) {
  const categoryIds = new Set(state.categories.map(category => category.id));
  const kept = ui.filters.categoryIds.filter(id => id === NO_CATEGORY || categoryIds.has(id));
  if (kept.length !== ui.filters.categoryIds.length) {
    ui.filters.categoryIds = kept;
    persistUi();
  }
}

function persistUi() {
  saveUiPrefs(storage, ui);
}

function setFilters(changes) {
  Object.assign(ui.filters, changes);
  persistUi();
  render();
}

function applyTheme(theme) {
  const effectiveTheme = theme === 'auto' ? (darkSchemeQuery.matches ? 'dark' : 'light') : theme;
  if (document.documentElement.dataset.theme !== effectiveTheme) document.documentElement.dataset.theme = effectiveTheme;
}

/** 'loading' | 'auth' | 'app' - CSS shows the matching screen. */
function setView(view) {
  document.body.dataset.view = view;
  els.loadingScreen.hidden = view !== 'loading';
}

function setSyncStatus(status) {
  renderSyncStatus(els.syncStatus, status);
}

// ---------------------------------------------------------------------------
// Drag and drop (drag.js: mouse, and long press on touch screens)
// ---------------------------------------------------------------------------

function setupDragAndDrop() {
  enableGridDrag(els.taskList, {
    itemSelector: '.task-tile',
    ignoreSelector: '.no-drag',
    idOf: tile => tile.dataset.taskId,
    onDragStart: () => {
      isDragging = true;
    },
    onDragEnd: ({ changed }) => {
      isDragging = false;
      if (!changed) render(); // also puts a cancelled drag back and applies renders that waited
    },
    // Dragging always means "my order": the order on screen (with the move) becomes the manual order.
    onReorder: orderedIds => {
      const switchedToManual = ui.filters.sort !== 'manual';
      if (switchedToManual) {
        ui.filters.sort = 'manual';
        persistUi();
      }
      if (!store.dispatch({ type: 'tasks/reorder', orderedIds })) render();
      if (switchedToManual) showToast('הסידור נשמר, והמיון עבר ל"הסדר שלי"');
    },
  });
}

// ---------------------------------------------------------------------------
// Event handlers (delegated - render.js tags elements with data-action)
// ---------------------------------------------------------------------------

const clickActions = {
  'open-new-task': () => openTaskDialog(),
  'open-task': ({ taskId }) => openTaskDetail(taskId),
  'delete-task': ({ taskId }) => {
    if (els.detailDialog.open && detailTaskId === taskId) els.detailDialog.close();
    deleteWithUndo({ type: 'task/delete', taskId }, 'המשימה נמחקה');
  },
  'toggle-subtask-done': ({ taskId, subtaskId }) => {
    const subtask = store.getState().tasks.find(task => task.id === taskId)?.subtasks.find(item => item.id === subtaskId);
    if (subtask) store.dispatch({ type: 'subtask/setStatus', taskId, subtaskId, status: subtask.status === 'done' ? 'todo' : 'done' });
  },
  'delete-subtask': ({ taskId, subtaskId }) => {
    // The store refuses to remove a task's last subtask; say why instead of silently doing nothing.
    if (store.getState().tasks.find(task => task.id === taskId)?.subtasks.length === 1) {
      showToast(ONLY_SUBTASK_MESSAGE, { tone: 'warning' });
      return;
    }
    deleteWithUndo({ type: 'subtask/delete', taskId, subtaskId }, 'תת-המשימה נמחקה');
  },
  'add-subtask-button': (_, element) => addSubtaskFromInput(element.closest('.add-subtask').querySelector('.add-subtask-input')),
  'dashboard-filter': ({ filter }) => setFilters({ status: ui.filters.status === filter ? 'all' : filter }),
  'filter-category': ({ categoryId }) => toggleCategoryFilter(categoryId),
  'filter-reset': () => setFilters({ search: '', categoryIds: [], status: DEFAULT_FILTERS.status }),
  'open-categories': () => openCategoriesDialog(),
  'delete-category': ({ categoryId }) => deleteWithUndo({ type: 'category/delete', categoryId }, 'הקטגוריה נמחקה. המשימות שלה נשארו, ללא קטגוריה.'),
  'toggle-category-palette': ({ categoryId }) => {
    paletteCategoryId = paletteCategoryId === categoryId ? null : categoryId;
    render();
  },
  'set-category-color': ({ categoryId, color }) => store.dispatch({ type: 'category/update', categoryId, changes: { color } }),
  'pick-swatch': ({ color }) => {
    els.newCategoryColor.value = color;
    renderSwatches(els.categorySwatches, color);
  },
  'open-settings': () => openSettingsDialog(),
  'toggle-theme': () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    store.dispatch({ type: 'settings/update', changes: { theme: nextTheme } });
  },
  'export-backup': () => exportBackup(),
  'import-backup': () => els.importInput.click(),
  'dismiss-backup-banner': () => {
    isBackupBannerDismissed = true;
    render();
  },
  'close-dialog': (_, element) => element.closest('dialog')?.close(),
  'sync-retry': () => {
    if (!sync) return;
    sync.saveNow();
    sync.refresh();
  },
  'sign-out': () => signOut(),
};

const changeActions = {
  'set-task-category': ({ taskId }, element) =>
    store.dispatch({ type: 'task/update', taskId, changes: { categoryId: element.value || null } }),
  'set-subtask-status': ({ taskId, subtaskId }, element) =>
    store.dispatch({ type: 'subtask/setStatus', taskId, subtaskId, status: element.value }),
  'edit-task-title': ({ taskId }, element) =>
    commitInlineEdit(element, { type: 'task/update', taskId, changes: { title: element.value } }),
  'edit-task-description': ({ taskId }, element) =>
    commitInlineEdit(element, { type: 'task/update', taskId, changes: { description: element.value } }),
  'edit-subtask-title': ({ taskId, subtaskId }, element) =>
    commitInlineEdit(element, { type: 'subtask/update', taskId, subtaskId, changes: { title: element.value } }),
  'filter-status': (_, element) => setFilters({ status: element.value }),
  'filter-sort': (_, element) => setFilters({ sort: element.value }),
  'filter-show-done': (_, element) => setFilters({ showDone: element.checked }),
  'category-name': ({ categoryId }, element) => {
    if (!store.dispatch({ type: 'category/update', categoryId, changes: { name: element.value } })) {
      element.value = element.dataset.original ?? '';
      if (element.value.trim() !== '') showToast('שם ריק או קטגוריה בשם הזה כבר קיימת', { tone: 'warning' });
    }
  },
  'category-color': ({ categoryId }, element) => store.dispatch({ type: 'category/update', categoryId, changes: { color: element.value } }),
  'setting-theme': (_, element) => {
    store.dispatch({ type: 'settings/update', changes: { theme: element.value } });
    syncSettingsForm();
  },
  'import-file': (_, element) => importBackup(element),
};

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  const handler = target && clickActions[target.dataset.action];
  if (!handler) return;
  event.preventDefault();
  handler(target.dataset, target);
});

document.addEventListener('change', event => {
  const target = event.target;
  const handler = changeActions[target.dataset?.action];
  if (handler) handler(target.dataset, target);
});

document.addEventListener('input', event => {
  if (event.target.dataset?.action === 'filter-search') setFilters({ search: event.target.value });
});

document.addEventListener('keydown', event => {
  const target = event.target;
  if (event.isComposing) return;

  if (target instanceof HTMLInputElement) {
    if (target.dataset.action === 'add-subtask' && event.key === 'Enter') {
      event.preventDefault();
      addSubtaskFromInput(target);
    } else if (target.classList.contains('inline-edit') && event.key === 'Enter') {
      event.preventDefault();
      target.blur(); // blur fires "change", which commits the edit
    } else if (target.classList.contains('inline-edit') && event.key === 'Escape') {
      event.preventDefault(); // also keeps an open dialog from closing
      target.value = target.dataset.original ?? '';
      target.blur();
    }
    return;
  }

  // "N" opens a new task (event.code works on a Hebrew keyboard layout too).
  const isTypingElsewhere = target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
  const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
  if (event.code === 'KeyN' && !hasModifier && !isTypingElsewhere && document.body.dataset.view === 'app'
    && !document.querySelector('dialog[open]')) {
    event.preventDefault();
    openTaskDialog();
  }
});

// Leaving a field is the moment to apply anything that waited for the typing to end.
document.addEventListener('focusout', () => {
  setTimeout(() => {
    if (isEditingUnsavedText()) return;
    if (hasPendingStorageReload) applyStorageReload();
    else if (isRenderDeferred) render();
  }, 0);
});

/**
 * Saves an inline text edit without re-rendering: the field already shows the new text,
 * and re-rendering here would swallow a click the user is making on another element.
 */
function commitInlineEdit(element, action) {
  if (store.dispatch(action, { notify: false })) element.dataset.original = element.value;
  else element.value = element.dataset.original ?? '';
}

function addSubtaskFromInput(input) {
  if (!input || input.value.trim() === '') return;
  // render() rebuilds the row with an empty input and puts focus back on it, ready for the next subtask.
  store.dispatch({ type: 'subtask/add', taskId: input.dataset.taskId, title: input.value });
}

function toggleCategoryFilter(categoryId) {
  if (!categoryId) {
    setFilters({ categoryIds: [] });
    return;
  }
  const selected = new Set(ui.filters.categoryIds);
  if (!selected.delete(categoryId)) selected.add(categoryId);
  setFilters({ categoryIds: [...selected] });
}

function deleteWithUndo(action, message) {
  if (!store.dispatch(action, { undoable: true })) return;
  showToast(message, {
    actionLabel: 'ביטול',
    durationMs: 8000,
    onAction: () => {
      if (!store.undo()) showToast('כבר אי אפשר לבטל - בוצע שינוי נוסף מאז', { tone: 'warning' });
    },
  });
}

// ---------------------------------------------------------------------------
// New task dialog and task detail dialog
// ---------------------------------------------------------------------------

function openTaskDialog() {
  const state = store.getState();
  const fields = els.taskForm.elements;
  els.taskForm.reset();
  fields.title.setCustomValidity('');
  fields.subtaskTitle.setCustomValidity('');
  fillCategorySelect(fields.categoryId, state.categories, defaultCategoryForNewTask(state));
  fillStatusSelect(fields.status, 'todo');
  els.taskDialog.showModal();
  fields.title.focus();
}

// New tasks land in the category currently filtered on (if exactly one), otherwise the first category.
function defaultCategoryForNewTask(state) {
  const [onlySelected, ...others] = ui.filters.categoryIds;
  if (onlySelected && others.length === 0 && state.categories.some(category => category.id === onlySelected)) return onlySelected;
  return state.categories[0]?.id ?? null;
}

els.taskForm.addEventListener('submit', event => {
  event.preventDefault();
  const fields = els.taskForm.elements;
  const title = fields.title.value.trim();
  if (!title) {
    fields.title.setCustomValidity('צריך לתת למשימה כותרת');
    fields.title.reportValidity();
    return;
  }
  const subtaskTitle = fields.subtaskTitle.value.trim();
  if (!subtaskTitle) {
    fields.subtaskTitle.setCustomValidity('לכל משימה צריכה להיות לפחות תת-משימה אחת');
    fields.subtaskTitle.reportValidity();
    return;
  }
  const taskId = createId();
  const isAdded = store.dispatch({
    type: 'task/add',
    id: taskId,
    title,
    description: fields.description.value,
    categoryId: fields.categoryId.value || null,
    subtasks: [{ title: subtaskTitle, status: fields.status.value }],
  });
  els.taskDialog.close();
  if (!isAdded) return;
  warnIfHiddenByFilters(taskId);
  // Straight into the new task, ready for more subtasks.
  openTaskDetail(taskId, { focusAddSubtask: true });
});

for (const field of [els.taskForm.elements.title, els.taskForm.elements.subtaskTitle]) {
  field.addEventListener('input', event => event.target.setCustomValidity(''));
}

function warnIfHiddenByFilters(taskId) {
  const isVisible = selectVisibleTasks(store.getState(), ui.filters).some(task => task.id === taskId);
  if (isVisible) return;
  showToast('המשימה נוספה, אבל הסינון הנוכחי מסתיר אותה', {
    actionLabel: 'ניקוי סינון',
    onAction: () => setFilters({ search: '', categoryIds: [], status: DEFAULT_FILTERS.status, showDone: true }),
  });
}

function openTaskDetail(taskId, { focusAddSubtask = false } = {}) {
  detailTaskId = taskId;
  if (!renderTaskDetail(els.detailBody, store.getState(), taskId, Date.now())) return;
  if (!els.detailDialog.open) els.detailDialog.showModal();
  // On touch screens this would pop up the keyboard uninvited.
  if (focusAddSubtask && finePointerQuery.matches) els.detailBody.querySelector('.add-subtask-input')?.focus();
}

els.detailDialog.addEventListener('close', () => {
  detailTaskId = null;
  render(); // titles edited in the dialog are saved silently; refresh the tiles behind it
});

// ---------------------------------------------------------------------------
// Categories dialog
// ---------------------------------------------------------------------------

function openCategoriesDialog() {
  const state = store.getState();
  paletteCategoryId = null;
  renderCategoriesList(els.categoriesList, state, paletteCategoryId);
  els.newCategoryName.value = '';
  els.newCategoryColor.value = suggestCategoryColor(state.categories);
  renderSwatches(els.categorySwatches, els.newCategoryColor.value);
  els.categoriesDialog.showModal();
}

els.categoryForm.addEventListener('submit', event => {
  event.preventDefault();
  const name = els.newCategoryName.value.trim();
  if (!name) return;
  if (!store.dispatch({ type: 'category/add', name, color: els.newCategoryColor.value })) {
    showToast('קטגוריה בשם הזה כבר קיימת', { tone: 'warning' });
    return;
  }
  els.newCategoryName.value = '';
  els.newCategoryColor.value = suggestCategoryColor(store.getState().categories);
  renderSwatches(els.categorySwatches, els.newCategoryColor.value);
  els.newCategoryName.focus();
});

els.newCategoryColor.addEventListener('input', () => renderSwatches(els.categorySwatches, els.newCategoryColor.value));

// The new-task dialog can open the categories dialog on top of it - refresh its category list afterwards.
els.categoriesDialog.addEventListener('close', () => {
  if (!els.taskDialog.open) return;
  const select = els.taskForm.elements.categoryId;
  fillCategorySelect(select, store.getState().categories, select.value || null);
});

// ---------------------------------------------------------------------------
// Settings dialog and backup
// ---------------------------------------------------------------------------

function openSettingsDialog() {
  syncSettingsForm();
  els.settingsDialog.showModal();
}

function syncSettingsForm() {
  const state = store.getState();
  const { settings } = state;
  els.settingsForm.elements.theme.value = settings.theme;
  els.accountSection.hidden = mode !== 'cloud' || !currentUser;
  els.accountEmail.textContent = currentUser?.email ?? '';
  els.storageNote.textContent = mode === 'cloud'
    ? 'המשימות נשמרות בחשבון ומסונכרנות בין כל המכשירים שמחוברים אליו. עותק מקומי נשמר בדפדפן, כך שאפשר לעבוד גם בלי רשת.'
    : 'הנתונים נשמרים רק בדפדפן הזה ולא נשלחים לשום שרת. כדי לא לאבד אותם, או כדי להעביר אותם למחשב אחר, מייצאים קובץ גיבוי ומייבאים אותו.';
  const subtaskCount = state.tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
  els.storageSummary.textContent = `שמורים כרגע: ${state.tasks.length} משימות, ${subtaskCount} תתי משימות, ${state.categories.length} קטגוריות.`;
  els.lastExportLabel.textContent = settings.lastExportAt
    ? `גיבוי אחרון: ${new Date(settings.lastExportAt).toLocaleString('he-IL')}`
    : 'עדיין לא נעשה גיבוי לקובץ.';
}

els.settingsForm.addEventListener('submit', event => event.preventDefault());

function exportBackup() {
  const state = store.getState();
  const payload = JSON.stringify({ app: 'task-manager', exportedAt: new Date().toISOString(), ...state }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const link = h('a', { href: url, download: `task-manager-backup-${dateStamp(new Date())}.json` });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  store.dispatch({ type: 'settings/update', changes: { lastExportAt: Date.now() } });
  if (els.settingsDialog.open) syncSettingsForm();
  showToast('קובץ הגיבוי ירד למחשב', { tone: 'success' });
}

async function importBackup(input) {
  const file = input.files?.[0];
  input.value = ''; // allow choosing the same file again later
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    showToast('הקובץ גדול מדי לגיבוי של האפליקציה', { tone: 'error' });
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    showToast('הקובץ אינו קובץ JSON תקין', { tone: 'error' });
    return;
  }
  const taskCount = Array.isArray(parsed?.tasks) ? parsed.tasks.length : 0;
  if (!window.confirm(`לייבא את הגיבוי (${taskCount} משימות)? הנתונים הנוכחיים יוחלפו. אפשר לבטל מיד אחרי הייבוא.`)) return;
  try {
    store.replaceState(parsed, { undoable: true });
  } catch (error) {
    showToast(`הייבוא נכשל: ${error.message}`, { tone: 'error' });
    return;
  }
  if (els.settingsDialog.open) syncSettingsForm();
  showToast('הגיבוי יובא בהצלחה', {
    tone: 'success',
    actionLabel: 'ביטול',
    durationMs: 10000,
    onAction: () => {
      if (store.undo() && els.settingsDialog.open) syncSettingsForm();
    },
  });
}

// ---------------------------------------------------------------------------
// Cloud mode: login and sync
// ---------------------------------------------------------------------------

function startCloudMode() {
  mode = 'cloud';
  setSyncStatus('connecting');
  authView = createAuthView({
    cloud,
    onPasswordUpdated: () => {
      isRecoveringPassword = false;
      showToast('הסיסמה עודכנה', { tone: 'success' });
      if (currentUser) {
        authView.hide();
        if (isSyncReady) setView('app');
        else enterApp(currentUser);
      }
    },
  });
  // The first event (INITIAL_SESSION) tells whether this device is already logged in.
  cloud.onAuthChange(handleAuthChange);
}

function handleAuthChange(event, session) {
  if (event === 'PASSWORD_RECOVERY') {
    isRecoveringPassword = true;
    currentUser = session?.user ?? currentUser;
    setView('auth');
    authView.show('new-password');
    return;
  }
  if (event === 'SIGNED_OUT') {
    onSignedOut();
    return;
  }
  if (!session?.user) {
    if (event === 'INITIAL_SESSION') {
      setView('auth');
      authView.show('signin');
    }
    return;
  }
  if (isRecoveringPassword) {
    currentUser = session.user;
    setView('auth');
    authView.show('new-password');
    return;
  }
  enterApp(session.user);
}

async function enterApp(user) {
  currentUser = user;
  authView.hide();
  if (sync?.userId === user.id) {
    if (isSyncReady) setView('app');
    return;
  }
  sync?.stop();
  isSyncReady = false;
  // If this device's copy belongs to nobody or someone else, keep it hidden until the account's tasks arrive.
  const isOwnCopy = loadSyncMeta(storage).userId === user.id;
  els.loadingMessage.textContent = 'טוען את המשימות שלך...';
  setView(isOwnCopy ? 'app' : 'loading');
  render();

  const activeSync = createSync({
    store,
    remote: cloud.createRemote(user.id),
    storage,
    userId: user.id,
    onStatus: setSyncStatus,
    confirmMerge: async taskCount => window.confirm(
      `במכשיר הזה יש ${taskCount} משימות שנוצרו לפני ההתחברות. להוסיף אותן לחשבון?\n\n`
      + 'אישור - הן יתווספו למשימות שכבר בחשבון.\nביטול - יוצגו רק המשימות שבחשבון (עותק של המקומיות יישמר בדפדפן).'),
  });
  sync = activeSync;
  const loadedRightAway = await activeSync.start();
  if (sync !== activeSync) return; // signed out (or switched user) while loading
  if (!loadedRightAway && !isOwnCopy) {
    // Never fall back to showing this device's copy - it is not this account's. Keep retrying.
    els.loadingMessage.textContent = 'אין חיבור לחשבון כרגע. ממשיכים לנסות...';
    if (!(await activeSync.ready) || sync !== activeSync) return;
  }
  isSyncReady = true;
  if (!isRecoveringPassword) setView('app');
}

function onSignedOut() {
  sync?.stop();
  sync = null;
  isSyncReady = false;
  currentUser = null;
  if (isSignOutRequested) {
    isSignOutRequested = false;
    clearLocalData();
  }
  // Otherwise the session simply expired: the local copy and any unsynced changes wait for the next login.
  for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
  setSyncStatus('connecting');
  setView('auth');
  authView.show('signin');
}

// Explicit sign-out removes the account's tasks, sync data and backup copies from this device.
function clearLocalData() {
  clearAccountCopies(storage);
  store.applyRemote(createInitialState());
}

async function signOut() {
  if (sync?.hasPending()) await sync.flush();
  if (sync?.hasPending()
    && !window.confirm('יש שינויים שעוד לא נשמרו בחשבון, והם יימחקו מהמכשיר הזה. להתנתק בכל זאת?')) return;
  isSignOutRequested = true;
  els.settingsDialog.close();
  await cloud.signOut();
  if (currentUser) onSignedOut(); // in case no SIGNED_OUT event arrives (for example, offline)
}

// ---------------------------------------------------------------------------
// Local-only mode
// ---------------------------------------------------------------------------

function startLocalMode() {
  mode = 'local';
  setSyncStatus('local');
  setView('app');
  if (!storage) {
    showToast('הדפדפן חוסם שמירה מקומית - הנתונים לא יישמרו אחרי סגירת הלשונית', { tone: 'error', durationMs: 15000 });
  } else if (store.loadWarning) {
    showToast(store.loadWarning, { tone: 'warning', durationMs: 20000 });
  }
  window.addEventListener('storage', onStorageChanged);
}

// Another tab saved data. Apply it now, or - if the user is mid-typing here - once they leave the field.
function applyStorageReload() {
  hasPendingStorageReload = false;
  const warning = store.reloadFromStorage();
  if (warning) {
    showToast(warning, { tone: 'warning', durationMs: 15000, actionLabel: 'ייצוא גיבוי', onAction: exportBackup });
  }
}

function onStorageChanged(event) {
  if (event.key !== STORAGE_KEY) return;
  if (isEditingUnsavedText()) {
    hasPendingStorageReload = true;
    showToast('הנתונים עודכנו בלשונית אחרת - התצוגה תתעדכן כשהעריכה תסתיים', { durationMs: 6000 });
    return;
  }
  applyStorageReload();
}

// ---------------------------------------------------------------------------
// Toasts and dialogs plumbing
// ---------------------------------------------------------------------------

// A modal dialog makes the rest of the page inert, so toasts live inside the top open dialog while one is open.
function placeToastRegion() {
  const openDialogs = document.querySelectorAll('dialog[open]');
  const host = openDialogs.length > 0 ? openDialogs[openDialogs.length - 1] : document.body;
  if (els.toastRegion.parentElement !== host) host.append(els.toastRegion);
}

function showToast(message, { tone = 'info', actionLabel = null, onAction = null, durationMs = 5000 } = {}) {
  placeToastRegion();
  const actionButton = actionLabel ? h('button', { type: 'button', class: 'toast-action' }, actionLabel) : null;
  const toast = h('div', { class: ['toast', `toast-${tone}`], role: tone === 'error' ? 'alert' : 'status' },
    h('span', { class: 'toast-message' }, message), actionButton);
  const dismiss = () => toast.remove();
  actionButton?.addEventListener('click', () => {
    dismiss();
    onAction?.();
  });
  els.toastRegion.append(toast);
  while (els.toastRegion.children.length > MAX_VISIBLE_TOASTS) els.toastRegion.firstElementChild.remove();
  setTimeout(dismiss, durationMs);
}

for (const dialog of document.querySelectorAll('dialog')) {
  // Close on a click on the backdrop, but not when a text selection drag merely ends there.
  let pressStartedOnBackdrop = false;
  dialog.addEventListener('pointerdown', event => {
    pressStartedOnBackdrop = event.target === dialog;
  });
  dialog.addEventListener('click', event => {
    if (pressStartedOnBackdrop && event.target === dialog) dialog.close();
    pressStartedOnBackdrop = false;
  });
  dialog.addEventListener('close', placeToastRegion);
}

// ---------------------------------------------------------------------------
// Timer and startup
// ---------------------------------------------------------------------------

// Skip the periodic re-render while the user is typing into a field whose text is not saved yet.
function isEditingUnsavedText() {
  const active = document.activeElement;
  if (active instanceof HTMLTextAreaElement) return true;
  if (!(active instanceof HTMLInputElement)) return false;
  if (active.dataset.action === 'filter-search') return false; // its value lives in ui.filters
  return ['text', 'search', 'email', 'password'].includes(active.type);
}

function onTick() {
  if (isEditingUnsavedText()) return;
  if (hasPendingStorageReload) applyStorageReload();
  else render();
}

async function start() {
  hydrateIcons();
  setupDragAndDrop();
  store.subscribe(onStoreChange);
  render();

  const config = await loadCloudConfig();
  if (config) {
    try {
      cloud = await createCloud(config);
    } catch {
      els.loadingMessage.textContent = 'טעינת רכיב ההתחברות נכשלה. כדאי לרענן את הדף.';
      setView('loading');
      return;
    }
    startCloudMode();
  } else {
    startLocalMode();
  }

  setInterval(onTick, TICK_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    onTick();
    sync?.refresh();
  });
  window.addEventListener('online', () => {
    sync?.saveNow();
    sync?.refresh();
  });
  window.addEventListener('offline', () => {
    if (sync) setSyncStatus('offline');
  });
  darkSchemeQuery.addEventListener('change', () => applyTheme(store.getState().settings.theme));
}

start();
