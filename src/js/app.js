// Entry point: connects the store to the DOM, handles all user events (delegated),
// the periodic timer (elapsed times, Claude check reminders), dialogs and backup import/export.

import { createStore, STORAGE_KEY } from './store.js';
import { NO_CATEGORY, countAttentionItems, listOverdueClaudeItems, selectVisibleTasks } from './selectors.js';
import { DEFAULT_FILTERS, loadUiPrefs, saveUiPrefs } from './ui-prefs.js';
import {
  fillCategorySelect, fillStatusSelect, renderBackupBanner, renderCategoriesList, renderDashboard,
  renderFilters, renderSwatches, renderTaskList, suggestCategoryColor,
} from './render.js';
import { hydrateIcons } from './icons.js';
import { h } from './dom.js';
import { dateStamp } from './utils.js';

const APP_TITLE = 'ניהול משימות';
const TICK_INTERVAL_MS = 30_000;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_VISIBLE_TOASTS = 3;

const els = {
  dashboard: byId('dashboard'),
  filters: byId('filters'),
  backupBanner: byId('backup-banner'),
  taskList: byId('task-list'),
  toastRegion: byId('toast-region'),
  taskDialog: byId('task-dialog'),
  taskDialogTitle: byId('task-dialog-title'),
  taskDialogDelete: byId('task-dialog-delete'),
  taskForm: byId('task-form'),
  categoriesDialog: byId('categories-dialog'),
  categoriesList: byId('categories-list'),
  categoryForm: byId('category-form'),
  newCategoryName: byId('new-category-name'),
  newCategoryColor: byId('new-category-color'),
  categorySwatches: byId('category-swatches'),
  settingsDialog: byId('settings-dialog'),
  settingsForm: byId('settings-form'),
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
const notifiedClaudeKeys = new Set();
const darkSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
let isBackupBannerDismissed = false;
let editingTaskId = null;
let hasPendingStorageReload = false;

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
  const state = store.getState();
  const now = Date.now();
  const focusSnapshot = captureFocus();
  pruneCategoryFilter(state);
  applyTheme(state.settings.theme);
  renderDashboard(els.dashboard, state, ui.filters, now);
  renderFilters(els.filters, state, ui.filters);
  renderBackupBanner(els.backupBanner, state, now, isBackupBannerDismissed);
  renderTaskList(els.taskList, state, ui.filters, ui.expandedTaskIds, now);
  if (els.categoriesDialog.open) renderCategoriesList(els.categoriesList, state);
  const attentionCount = countAttentionItems(state, now);
  document.title = attentionCount > 0 ? `(${attentionCount}) ${APP_TITLE}` : APP_TITLE;
  restoreFocus(focusSnapshot);
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

// A deleted category must not stay in the filter, otherwise the list could look empty for no visible reason.
function pruneCategoryFilter(state) {
  const categoryIds = new Set(state.categories.map(category => category.id));
  const kept = ui.filters.categoryIds.filter(id => id === NO_CATEGORY || categoryIds.has(id));
  if (kept.length !== ui.filters.categoryIds.length) {
    ui.filters.categoryIds = kept;
    persistUi();
  }
}

function pruneExpandedTasks(state) {
  const taskIds = new Set(state.tasks.map(task => task.id));
  for (const id of ui.expandedTaskIds) {
    if (!taskIds.has(id)) ui.expandedTaskIds.delete(id);
  }
  persistUi();
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

// ---------------------------------------------------------------------------
// Event handlers (delegated - render.js tags elements with data-action)
// ---------------------------------------------------------------------------

const clickActions = {
  'open-new-task': () => openTaskDialog(null),
  'edit-task': ({ taskId }) => openTaskDialog(taskId),
  'delete-task': ({ taskId }) => deleteWithUndo({ type: 'task/delete', taskId }, 'המשימה נמחקה'),
  'delete-task-from-dialog': () => {
    const taskId = editingTaskId;
    els.taskDialog.close();
    if (taskId) deleteWithUndo({ type: 'task/delete', taskId }, 'המשימה נמחקה');
  },
  'toggle-expand': ({ taskId }) => {
    if (!ui.expandedTaskIds.delete(taskId)) ui.expandedTaskIds.add(taskId);
    persistUi();
    render();
  },
  'expand-all': () => {
    for (const task of store.getState().tasks) ui.expandedTaskIds.add(task.id);
    persistUi();
    render();
  },
  'collapse-all': () => {
    ui.expandedTaskIds.clear();
    persistUi();
    render();
  },
  'mark-checked': ({ taskId, subtaskId }) => store.dispatch(subtaskId
    ? { type: 'subtask/markChecked', taskId, subtaskId }
    : { type: 'task/markChecked', taskId }),
  'toggle-subtask-done': ({ taskId, subtaskId }) => {
    const subtask = store.getState().tasks.find(task => task.id === taskId)?.subtasks.find(item => item.id === subtaskId);
    if (subtask) store.dispatch({ type: 'subtask/setStatus', taskId, subtaskId, status: subtask.status === 'done' ? 'todo' : 'done' });
  },
  'delete-subtask': ({ taskId, subtaskId }) => deleteWithUndo({ type: 'subtask/delete', taskId, subtaskId }, 'תת-המשימה נמחקה'),
  'add-subtask-button': (_, element) => addSubtaskFromInput(element.closest('.add-subtask').querySelector('.add-subtask-input')),
  'dashboard-filter': ({ filter }) => setFilters({ status: ui.filters.status === filter ? 'all' : filter }),
  'filter-category': ({ categoryId }) => toggleCategoryFilter(categoryId),
  'filter-reset': () => setFilters({ search: '', categoryIds: [], status: DEFAULT_FILTERS.status }),
  'open-categories': () => openCategoriesDialog(),
  'delete-category': ({ categoryId }) => deleteWithUndo({ type: 'category/delete', categoryId }, 'הקטגוריה נמחקה. המשימות שלה נשארו, ללא קטגוריה.'),
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
};

const changeActions = {
  'set-task-status': ({ taskId }, element) => store.dispatch({ type: 'task/setStatus', taskId, status: element.value }),
  'set-subtask-status': ({ taskId, subtaskId }, element) =>
    store.dispatch({ type: 'subtask/setStatus', taskId, subtaskId, status: element.value }),
  'edit-task-title': ({ taskId }, element) =>
    commitInlineEdit(element, { type: 'task/update', taskId, changes: { title: element.value } }),
  'edit-subtask-title': ({ taskId, subtaskId }, element) =>
    commitInlineEdit(element, { type: 'subtask/update', taskId, subtaskId, changes: { title: element.value } }),
  'edit-subtask-contact': ({ taskId, subtaskId }, element) =>
    commitInlineEdit(element, { type: 'subtask/update', taskId, subtaskId, changes: { contact: element.value } }),
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
  'setting-claude-minutes': (_, element) => updateSettings({ claudeCheckMinutes: element.value }),
  'setting-followup-days': (_, element) => updateSettings({ waitingFollowUpDays: element.value }),
  'setting-theme': (_, element) => updateSettings({ theme: element.value }),
  'setting-notifications': (_, element) => setNotifications(element.checked),
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
  if (event.code === 'KeyN' && !hasModifier && !isTypingElsewhere && !document.querySelector('dialog[open]')) {
    event.preventDefault();
    openTaskDialog(null);
  }
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
// Task dialog
// ---------------------------------------------------------------------------

function openTaskDialog(taskId) {
  const state = store.getState();
  const task = taskId ? state.tasks.find(item => item.id === taskId) : null;
  if (taskId && !task) return;
  editingTaskId = task?.id ?? null;

  const fields = els.taskForm.elements;
  els.taskForm.reset();
  fields.title.setCustomValidity('');
  els.taskDialogTitle.textContent = task ? 'עריכת משימה' : 'משימה חדשה';
  fillCategorySelect(fields.categoryId, state.categories, task ? task.categoryId : defaultCategoryForNewTask(state));
  fillStatusSelect(fields.status, task?.status ?? 'todo');
  fields.title.value = task?.title ?? '';
  fields.contact.value = task?.contact ?? '';
  fields.description.value = task?.description ?? '';
  els.taskDialogDelete.hidden = !task;

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
  const values = {
    title,
    description: fields.description.value,
    categoryId: fields.categoryId.value || null,
    contact: fields.contact.value,
  };
  const status = fields.status.value;

  if (editingTaskId) {
    store.dispatch({ type: 'task/update', taskId: editingTaskId, changes: values });
    store.dispatch({ type: 'task/setStatus', taskId: editingTaskId, status });
  } else if (store.dispatch({ type: 'task/add', ...values, status })) {
    const newTask = store.getState().tasks[0];
    ui.expandedTaskIds.add(newTask.id);
    persistUi();
    render();
    warnIfHiddenByFilters(newTask.id);
  }
  els.taskDialog.close();
});

els.taskForm.elements.title.addEventListener('input', event => event.target.setCustomValidity(''));

function warnIfHiddenByFilters(taskId) {
  const isVisible = selectVisibleTasks(store.getState(), ui.filters, Date.now()).some(task => task.id === taskId);
  if (isVisible) return;
  showToast('המשימה נוספה, אבל הסינון הנוכחי מסתיר אותה', {
    actionLabel: 'ניקוי סינון',
    onAction: () => setFilters({ search: '', categoryIds: [], status: DEFAULT_FILTERS.status, showDone: true }),
  });
}

// ---------------------------------------------------------------------------
// Categories dialog
// ---------------------------------------------------------------------------

function openCategoriesDialog() {
  const state = store.getState();
  renderCategoriesList(els.categoriesList, state);
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

// The task dialog can open the categories dialog on top of it - refresh its category list afterwards.
els.categoriesDialog.addEventListener('close', () => {
  if (!els.taskDialog.open) return;
  const select = els.taskForm.elements.categoryId;
  fillCategorySelect(select, store.getState().categories, select.value || null);
});

// ---------------------------------------------------------------------------
// Settings dialog, notifications, backup
// ---------------------------------------------------------------------------

function openSettingsDialog() {
  syncSettingsForm();
  els.settingsDialog.showModal();
}

function syncSettingsForm() {
  const state = store.getState();
  const { settings } = state;
  const fields = els.settingsForm.elements;
  fields.claudeCheckMinutes.value = settings.claudeCheckMinutes;
  fields.waitingFollowUpDays.value = settings.waitingFollowUpDays;
  fields.theme.value = settings.theme;
  fields.notificationsEnabled.checked = settings.notificationsEnabled && notificationPermission() === 'granted';
  const subtaskCount = state.tasks.reduce((sum, task) => sum + task.subtasks.length, 0);
  els.storageSummary.textContent = `שמורים כרגע: ${state.tasks.length} משימות, ${subtaskCount} תתי משימות, ${state.categories.length} קטגוריות.`;
  els.lastExportLabel.textContent = settings.lastExportAt
    ? `גיבוי אחרון: ${new Date(settings.lastExportAt).toLocaleString('he-IL')}`
    : 'עדיין לא נעשה גיבוי.';
}

function updateSettings(changes) {
  store.dispatch({ type: 'settings/update', changes });
  syncSettingsForm(); // shows the clamped / normalized values
}

els.settingsForm.addEventListener('submit', event => event.preventDefault());

function notificationPermission() {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

async function setNotifications(isEnabled) {
  if (!isEnabled) {
    updateSettings({ notificationsEnabled: false });
    return;
  }
  if (notificationPermission() === 'unsupported') {
    showToast('הדפדפן הזה לא תומך בהתראות', { tone: 'warning' });
    updateSettings({ notificationsEnabled: false });
    return;
  }
  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') {
    showToast('ההרשאה להתראות לא אושרה בדפדפן', { tone: 'warning' });
    updateSettings({ notificationsEnabled: false });
    return;
  }
  updateSettings({ notificationsEnabled: true });
  showToast('התראות הופעלו. הן מופיעות כל עוד הלשונית של האפליקציה פתוחה.', { tone: 'success' });
}

// Notifies once per Claude item each time its check time passes (the key changes after every "checked" click).
function notifyOverdueClaude({ silent = false } = {}) {
  const state = store.getState();
  const canNotify = !silent && state.settings.notificationsEnabled && notificationPermission() === 'granted';
  for (const item of listOverdueClaudeItems(state, Date.now())) {
    if (notifiedClaudeKeys.has(item.key)) continue;
    notifiedClaudeKeys.add(item.key);
    if (!canNotify) continue;
    try {
      new Notification('קלוד - הגיע הזמן לבדוק', {
        body: item.context ? `${item.title} (${item.context})` : item.title,
        tag: item.key,
      });
    } catch {
      // Some mobile browsers only allow notifications from a service worker.
    }
  }
}

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
  return ['text', 'search', 'number'].includes(active.type);
}

function onTick() {
  if (!isEditingUnsavedText()) {
    if (hasPendingStorageReload) applyStorageReload();
    else render();
  }
  notifyOverdueClaude();
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

document.addEventListener('focusout', () => {
  // Wait for focus to settle on the next element before deciding the user stopped editing.
  if (hasPendingStorageReload) setTimeout(() => { if (hasPendingStorageReload && !isEditingUnsavedText()) applyStorageReload(); }, 0);
});

hydrateIcons();
pruneExpandedTasks(store.getState());
store.subscribe(render);
render();
notifyOverdueClaude({ silent: true }); // items already overdue on load are visible on screen - no notification burst

if (!storage) {
  showToast('הדפדפן חוסם שמירה מקומית - הנתונים לא יישמרו אחרי סגירת הלשונית', { tone: 'error', durationMs: 15000 });
} else if (store.loadWarning) {
  showToast(store.loadWarning, { tone: 'warning', durationMs: 20000 });
}

setInterval(onTick, TICK_INTERVAL_MS);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') onTick();
});
window.addEventListener('storage', onStorageChanged);
darkSchemeQuery.addEventListener('change', () => applyTheme(store.getState().settings.theme));
