// Entry point: connects the store to the DOM, handles all user events (delegated), the task
// grid with drag-and-drop (or the animated people view), dialogs, "my day", "what now?", the status
// report, celebrations, seasonal themes, voice dictation, backup import/export, and - when Supabase
// is configured - login and cloud sync.

import { LIMITS, STORAGE_KEY, countOpenMyDay, createInitialState, createStore } from './store.js';
import { NO_CATEGORY, listNextCandidates, pickWeighted, selectVisibleTasks } from './selectors.js';
import { DEFAULT_FILTERS, DISPLAY_TOGGLE_KEYS, loadUiPrefs, saveUiPrefs } from './ui-prefs.js';
import {
  ONLY_SUBTASK_MESSAGE, fillCategorySelect, fillSeasonSelect, fillStatusSelect, renderBackupBanner, renderCategoriesList,
  renderDashboard, renderFilters, renderNextPick, renderSeasonBadge, renderSwatches, renderSyncStatus, renderTaskDetail,
  renderTaskGrid, renderTasksEmptyState, renderTodayBar, suggestCategoryColor,
} from './render.js';
import { hydrateIcons } from './icons.js';
import { h } from './dom.js';
import { createId, dateStamp, truncate } from './utils.js';
import { createCloud, loadCloudConfig } from './cloud.js';
import { createAuthView } from './auth-view.js';
import { enableGridDrag } from './drag.js';
import { clearAccountCopies, createSync, loadSyncMeta } from './sync.js';
import { buildStatusReport } from './report.js';
import { SEASONS, getSeasonForDate, resolveSeason } from './seasons.js';
import { buildPersona } from './people-model.js';
import { MAX_PEOPLE, createPeopleWorld } from './people-view.js';
import { burstConfetti, playChime, prefersReducedMotion } from './celebrate.js';
import { isVoiceSupported, startDictation, voiceErrorMessage } from './voice.js';

const TICK_INTERVAL_MS = 30_000;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_VISIBLE_TOASTS = 3;
// "What now?": how many names flash by before the pick lands.
const NEXT_SPIN_STEPS = 14;
const CHEERS = Object.freeze([
  title => `"${title}" הושלמה. כל הכבוד!`,
  title => `וי גדול על "${title}"!`,
  title => `"${title}" סגורה. איזה כיף!`,
]);
const DUST_COLORS = Object.freeze(['#a8a29e', '#d6d3d1', '#78716c']);
const VOICE_NOTICE = 'ההכתבה משתמשת בשירות זיהוי הדיבור של הדפדפן, והקול נשלח לעיבוד בשרתים של יצרן הדפדפן '
  + '(גוגל בכרום, מיקרוסופט באדג\', אפל בספארי).\n\nלא כדאי להכתיב מידע רגיש או סודי.\n\nלהמשיך?';
// Links longer than this (wa.me, mailto:) may be cut off by some apps; the report then suggests copying.
const MAX_SHARE_URL_LENGTH = 1800;

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
  seasonHint: byId('season-hint'),
  voiceNote: byId('voice-note'),
  todayBar: byId('today-bar'),
  peopleScene: byId('people-scene'),
  seasonBadge: byId('season-badge'),
  nextDialog: byId('next-dialog'),
  nextBody: byId('next-body'),
  reportDialog: byId('report-dialog'),
  reportForm: byId('report-form'),
  reportText: byId('report-text'),
  reportShare: byId('report-share'),
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
let currentSeason = null; // the holiday theme shown now (or null)
let lastPointer = null; // where the last press happened - a celebration starts there when its button is gone
let nextSpinTimer = null;
let dictation = null; // { key, session, isInterim } while a field is being dictated
let renderedDay = null; // the date the "my day" marks on screen were drawn for

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

// The people view's office: characters that roam, work, take breaks and chat (people-view.js).
const peopleWorld = createPeopleWorld(els.peopleScene, {
  getPersona: taskId => {
    const state = store.getState();
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) return null;
    const now = Date.now();
    return buildPersona(task, state.categories.find(category => category.id === task.categoryId) ?? null, { now, today: myDayDate(now) });
  },
  // Conversations only when turned on, on the app screen (not behind login or loading), and not behind a dialog.
  canTalk: () => ui.display.chatter && document.body.dataset.view === 'app' && !document.querySelector('dialog[open]'),
  getGreeting: () => (currentSeason ? SEASONS[currentSeason].greeting : null),
  reducedMotion: prefersReducedMotion,
});

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
  const today = myDayDate(now);
  renderedDay = dateStamp(new Date(now));
  const focusSnapshot = captureFocus();
  pruneCategoryFilter(state);
  applyTheme(state.settings.theme);
  applySeason(now);
  renderDashboard(els.dashboard, state, ui.filters);
  renderTodayBar(els.todayBar, state, { today: dateStamp(new Date(now)), showMyDay: ui.display.myDay });
  renderFilters(els.filters, state, ui.filters);
  renderBackupBanner(els.backupBanner, state, now, isBackupBannerDismissed || mode === 'cloud');
  renderTasks(state, now, today);
  if (els.categoriesDialog.open) renderCategoriesList(els.categoriesList, state, paletteCategoryId);
  if (els.detailDialog.open && !renderTaskDetail(els.detailBody, state, detailTaskId, now, detailOptions(today))) els.detailDialog.close();
  syncDictationButtons();
  restoreFocus(focusSnapshot);
}

/** The tiles, or - when chosen in the settings - the animated characters. */
function renderTasks(state, now, today) {
  if (ui.display.view !== 'people') {
    peopleWorld.clear();
    setPeopleFullscreen(false);
    els.peopleScene.hidden = true;
    els.peopleScene.replaceChildren();
    els.taskList.hidden = false;
    renderTaskGrid(els.taskList, state, ui.filters, now, { today });
    return;
  }
  els.taskList.hidden = true;
  els.taskList.replaceChildren();
  els.peopleScene.hidden = false;
  const visibleTasks = selectVisibleTasks(state, ui.filters);
  if (visibleTasks.length === 0) {
    peopleWorld.clear();
    setPeopleFullscreen(false);
    renderTasksEmptyState(els.peopleScene, state, 0);
    return;
  }
  const categoriesById = new Map(state.categories.map(category => [category.id, category]));
  const shownTasks = visibleTasks.slice(0, MAX_PEOPLE);
  const personas = shownTasks.map(task => buildPersona(task, categoriesById.get(task.categoryId) ?? null, { now, today }));
  peopleWorld.update(personas, { seasonKey: currentSeason, hiddenCount: visibleTasks.length - shownTasks.length, now });
}

/** The office over the whole screen (people view), or back in the page. */
function setPeopleFullscreen(isFullscreen) {
  if (els.peopleScene.classList.contains('is-fullscreen') === isFullscreen) return;
  els.peopleScene.classList.toggle('is-fullscreen', isFullscreen);
  peopleWorld.relayout();
}

/** Today's date for "my day" marks, or null while "my day" is turned off in the settings. */
function myDayDate(now = Date.now()) {
  return ui.display.myDay ? dateStamp(new Date(now)) : null;
}

function detailOptions(today) {
  return { today, voice: isVoiceAvailable() };
}

function isVoiceAvailable() {
  return ui.display.voice && isVoiceSupported();
}

/** Holiday theme (seasons.js): colors via html[data-season], plus the badge in the top bar. */
function applySeason(now) {
  const seasonKey = resolveSeason(ui.display.season, new Date(now));
  if (seasonKey === currentSeason) return;
  currentSeason = seasonKey;
  if (seasonKey) document.documentElement.dataset.season = seasonKey;
  else delete document.documentElement.dataset.season;
  renderSeasonBadge(els.seasonBadge, seasonKey);
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

/** Display preferences from the settings dialog (per device). */
function updateDisplay(changes) {
  Object.assign(ui.display, changes);
  persistUi();
  if (changes.voice === false) dictation?.session?.stop();
  render();
  syncSettingsForm();
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
  'toggle-subtask-done': ({ taskId, subtaskId }, element) => {
    const subtask = findTask(taskId)?.subtasks.find(item => item.id === subtaskId);
    if (subtask) setSubtaskStatus(taskId, subtaskId, subtask.status === 'done' ? 'todo' : 'done', element);
  },
  'my-day-toggle': ({ taskId, subtaskId }) => toggleMyDay(taskId, subtaskId),
  'dust-off': ({ taskId }, element) => dustOff(taskId, element),
  'complete-task': ({ taskId }, element) => completeTask(taskId, element),
  'open-next': () => openNextDialog(),
  'people-fullscreen': () => setPeopleFullscreen(!els.peopleScene.classList.contains('is-fullscreen')),
  'next-start': ({ taskId, subtaskId }, element) => startNextPick(taskId, subtaskId, element),
  'next-my-day': ({ taskId, subtaskId }) => {
    if (toggleMyDay(taskId, subtaskId)) showNextResult(taskId, subtaskId);
  },
  'next-again': () => spinNext(),
  'next-open': ({ taskId }) => {
    els.nextDialog.close();
    openTaskDetail(taskId);
  },
  'open-report': () => openReportDialog(),
  'report-copy': () => copyReport(),
  'report-share': () => shareReport(),
  'report-whatsapp': () => openReportLink(`https://wa.me/?text=${encodeURIComponent(els.reportText.value)}`),
  'report-email': () => openMailDraft(),
  dictate: ({ voiceKey }) => toggleDictation(voiceKey),
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
    setSubtaskStatus(taskId, subtaskId, element.value, element.closest('.status-mini, .status-chip') ?? element),
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
  'setting-view': (_, element) => updateDisplay({ view: element.value }),
  'setting-season': (_, element) => updateDisplay({ season: element.value }),
  'setting-toggle': ({ setting }, element) => {
    if (DISPLAY_TOGGLE_KEYS.includes(setting)) updateDisplay({ [setting]: element.checked });
  },
  'report-option': () => regenerateReport(),
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

  // Escape leaves the office's full screen (an open dialog handles its own Escape first).
  if (event.key === 'Escape' && els.peopleScene.classList.contains('is-fullscreen') && !document.querySelector('dialog[open]')) {
    event.preventDefault();
    setPeopleFullscreen(false);
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

// Remember where presses happen, so a celebration can start there even after its button was re-rendered.
document.addEventListener('pointerdown', event => {
  lastPointer = { x: event.clientX, y: event.clientY };
}, true);

// Hovering a character makes it say something about its task.
els.peopleScene.addEventListener('pointerover', event => {
  if (event.pointerType !== 'mouse' || !ui.display.chatter) return;
  const character = event.target.closest('.character');
  if (!character || character.contains(event.relatedTarget)) return;
  peopleWorld.sayAbout(character.dataset.taskId);
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

function findTask(taskId) {
  return store.getState().tasks.find(task => task.id === taskId) ?? null;
}

// ---------------------------------------------------------------------------
// Status changes and celebrations
// ---------------------------------------------------------------------------

/** Where an effect starts: the middle of the control that was used, else where the last press happened. */
function effectOrigin(element) {
  const rect = element?.isConnected ? element.getBoundingClientRect() : null;
  if (rect && rect.width > 0) return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  return lastPointer ?? { x: window.innerWidth / 2, y: window.innerHeight / 3 };
}

/** Every subtask status change made in this app goes through here, so finishing things can be celebrated. */
function setSubtaskStatus(taskId, subtaskId, status, originElement = null) {
  const taskBefore = findTask(taskId);
  const origin = effectOrigin(originElement); // measured now: the dispatch re-renders the control
  if (!taskBefore || !store.dispatch({ type: 'subtask/setStatus', taskId, subtaskId, status })) return false;
  celebrateProgress(taskBefore, origin, status === 'done');
  return true;
}

/**
 * "Close the whole task" marks many subtasks done at once (losing their previous statuses), so it can be undone.
 * The action lists the subtasks shown now, so a replay does not close ones another device added since.
 */
function completeTask(taskId, originElement) {
  const taskBefore = findTask(taskId);
  const origin = effectOrigin(originElement);
  const subtaskIds = taskBefore?.subtasks.map(subtask => subtask.id) ?? [];
  if (!taskBefore || !store.dispatch({ type: 'task/complete', taskId, subtaskIds }, { undoable: true })) return;
  celebrateProgress(taskBefore, origin, true, { announce: false });
  const title = truncate(taskBefore.title, 40);
  showToast(ui.display.celebrate ? CHEERS[Math.floor(Math.random() * CHEERS.length)](title) : `"${title}" נסגרה`, {
    tone: 'success',
    actionLabel: 'ביטול',
    durationMs: 8000,
    onAction: () => {
      if (!store.undo()) showToast('כבר אי אפשר לבטל - בוצע שינוי נוסף מאז', { tone: 'warning' });
    },
  });
}

/**
 * A whole task just finished: confetti, an optional chime and a cheer (announce: false when the caller
 * shows its own message). A single subtask: a small pop.
 */
function celebrateProgress(taskBefore, origin, isSubtaskClosed, { announce = true } = {}) {
  if (!ui.display.celebrate) return;
  const state = store.getState();
  const taskAfter = state.tasks.find(task => task.id === taskBefore.id);
  if (!taskAfter) return;
  const categoryColor = state.categories.find(category => category.id === taskAfter.categoryId)?.color ?? null;
  if (taskBefore.status !== 'done' && taskAfter.status === 'done') {
    burstConfetti({ ...origin, size: 'big', colors: [categoryColor, seasonAccent()] });
    if (ui.display.sound) playChime();
    peopleWorld.cheer(taskAfter.id);
    if (announce) showToast(CHEERS[Math.floor(Math.random() * CHEERS.length)](truncate(taskAfter.title, 40)), { tone: 'success' });
  } else if (isSubtaskClosed) {
    burstConfetti({ ...origin, size: 'small', colors: [categoryColor] });
  }
}

// During a holiday the confetti also takes the holiday's accent color.
function seasonAccent() {
  return currentSeason ? getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || null : null;
}

// An old task is still relevant: "touching" it clears the dust.
function dustOff(taskId, element) {
  const origin = effectOrigin(element);
  if (!store.dispatch({ type: 'task/touch', taskId })) return;
  if (ui.display.celebrate) burstConfetti({ ...origin, size: 'small', colors: DUST_COLORS });
  showToast('פוף! האבק נוער, והמשימה חזרה לחיים', { tone: 'success' });
}

// ---------------------------------------------------------------------------
// "My day" and "what now?"
// ---------------------------------------------------------------------------

/** Adds a subtask to today's picks or takes it off. Returns true when something changed. */
function toggleMyDay(taskId, subtaskId) {
  const state = store.getState();
  const subtask = state.tasks.find(task => task.id === taskId)?.subtasks.find(item => item.id === subtaskId);
  if (!subtask) return false;
  const today = dateStamp(new Date());
  // Right after midnight the screen may still show yesterday's picks (until the next render): a click on
  // such a sun means "take it off", like the screen says, not "pick it for the new day".
  if (subtask.myDay && (subtask.myDay === today || subtask.myDay === renderedDay)) {
    return store.dispatch({ type: 'subtask/setMyDay', taskId, subtaskId, date: null });
  }
  if (subtask.status === 'done') {
    showToast('תת-המשימה הזו כבר הושלמה', { tone: 'warning' });
    return false;
  }
  if (countOpenMyDay(state, today, subtaskId) >= LIMITS.myDay) {
    showToast(`ב"היום שלי" יש כבר ${LIMITS.myDay} דברים פתוחים. כדי להוסיף, מסיימים או מסירים אחד מהם.`, { tone: 'warning', durationMs: 7000 });
    return false;
  }
  const isAdded = store.dispatch({ type: 'subtask/setMyDay', taskId, subtaskId, date: today });
  if (isAdded) showToast('נוסף ל"היום שלי"', { tone: 'success', durationMs: 2500 });
  return isAdded;
}

function openNextDialog() {
  if (!els.nextDialog.open) els.nextDialog.showModal();
  spinNext();
}

/** Draws an open subtask of the visible tasks; the names flash by, slowing down, before it lands. */
function spinNext() {
  clearTimeout(nextSpinTimer);
  const candidates = listNextCandidates(store.getState(), ui.filters, myDayDate());
  if (candidates.length === 0) {
    showNextEmpty();
    return;
  }
  const pick = pickWeighted(candidates);
  if (prefersReducedMotion() || candidates.length === 1) {
    showNextResult(pick.task.id, pick.subtask.id);
    return;
  }
  renderNextPick(els.nextBody, { phase: 'spinning', text: pick.subtask.title });
  const reelText = els.nextBody.querySelector('.next-reel-text');
  let step = 0;
  const advance = () => {
    if (!els.nextDialog.open) return;
    step += 1;
    if (step >= NEXT_SPIN_STEPS) {
      showNextResult(pick.task.id, pick.subtask.id);
      return;
    }
    reelText.textContent = candidates[Math.floor(Math.random() * candidates.length)].subtask.title;
    nextSpinTimer = setTimeout(advance, 50 + step * step * 1.6);
  };
  advance();
}

function showNextResult(taskId, subtaskId) {
  const state = store.getState();
  const task = state.tasks.find(item => item.id === taskId);
  const subtask = task?.subtasks.find(item => item.id === subtaskId);
  if (!subtask) {
    showNextEmpty();
    return;
  }
  renderNextPick(els.nextBody, {
    phase: 'result', task, subtask,
    category: state.categories.find(category => category.id === task.categoryId) ?? null,
    isPickedToday: subtask.myDay === dateStamp(new Date()),
    showMyDay: ui.display.myDay,
  });
  els.nextBody.querySelector('[data-action="next-start"]')?.focus();
}

// The button that had focus was replaced; keep keyboard focus inside the dialog.
function showNextEmpty() {
  renderNextPick(els.nextBody, { phase: 'empty' });
  els.nextBody.querySelector('.dialog-foot [data-action="close-dialog"]')?.focus();
}

function startNextPick(taskId, subtaskId, element) {
  const subtask = findTask(taskId)?.subtasks.find(item => item.id === subtaskId);
  if (!subtask) return;
  if (subtask.status !== 'in_progress') setSubtaskStatus(taskId, subtaskId, 'in_progress', element);
  els.nextDialog.close();
  showToast(`יאללה! בהצלחה עם "${truncate(subtask.title, 40)}"`, { tone: 'success' });
}

els.nextDialog.addEventListener('close', () => clearTimeout(nextSpinTimer));

// ---------------------------------------------------------------------------
// Status report
// ---------------------------------------------------------------------------

function openReportDialog() {
  const scopeSelect = els.reportForm.elements.scope;
  const hasCategoryFilter = ui.filters.categoryIds.length > 0;
  scopeSelect.querySelector('option[value="filtered"]').disabled = !hasCategoryFilter;
  if (!hasCategoryFilter) scopeSelect.value = 'all';
  els.reportShare.hidden = typeof navigator.share !== 'function';
  regenerateReport();
  els.reportDialog.showModal();
}

function regenerateReport() {
  const fields = els.reportForm.elements;
  els.reportText.value = buildStatusReport(store.getState(), {
    now: Date.now(),
    period: fields.period.value,
    includeTodo: fields.includeTodo.checked,
    categoryIds: fields.scope.value === 'filtered' ? ui.filters.categoryIds : [],
  });
}

async function copyReport() {
  try {
    await navigator.clipboard.writeText(els.reportText.value);
  } catch {
    // No clipboard API (or it was refused): fall back to copying the selected text.
    els.reportText.select();
    if (!document.execCommand?.('copy')) {
      showToast('ההעתקה נחסמה. אפשר לסמן את הטקסט ולהעתיק ידנית.', { tone: 'warning' });
      return;
    }
  }
  showToast('הדוח הועתק', { tone: 'success', durationMs: 2500 });
}

async function shareReport() {
  try {
    await navigator.share({ title: 'עדכון סטטוס', text: els.reportText.value });
  } catch (error) {
    if (error?.name !== 'AbortError') showToast('השיתוף לא הצליח', { tone: 'warning' });
  }
}

function openMailDraft() {
  const href = `mailto:?subject=${encodeURIComponent('עדכון סטטוס')}&body=${encodeURIComponent(els.reportText.value)}`;
  warnIfLinkTooLong(href);
  const link = h('a', { href });
  els.reportDialog.append(link); // inside the open dialog: the rest of the page is inert
  link.click();
  link.remove();
}

function openReportLink(url) {
  warnIfLinkTooLong(url);
  window.open(url, '_blank', 'noopener,noreferrer');
}

function warnIfLinkTooLong(url) {
  if (url.length <= MAX_SHARE_URL_LENGTH) return;
  showToast('הדוח ארוך, ויש אפליקציות שחותכות טקסט ארוך כזה. אם הוא נחתך - עדיף "העתקה".', { tone: 'warning', durationMs: 8000 });
}

els.reportForm.addEventListener('submit', event => event.preventDefault());

// ---------------------------------------------------------------------------
// Voice dictation (voice.js)
// ---------------------------------------------------------------------------

// A dictation button names its field by id (static dialogs) or by data-focus-key (re-rendered fields).
function resolveVoiceTarget(key) {
  return document.getElementById(key) ?? document.querySelector(`[data-focus-key="${CSS.escape(key)}"]`);
}

function toggleDictation(key) {
  if (dictation) {
    dictation.session?.stop(); // a second click stops the recording
    return;
  }
  if (!isVoiceSupported()) {
    showToast('הדפדפן הזה לא תומך בהכתבה קולית. אפשר לנסות בכרום, באדג\' או בספארי.', { tone: 'warning' });
    return;
  }
  if (!ui.display.voiceConsent) {
    if (!window.confirm(VOICE_NOTICE)) return;
    ui.display.voiceConsent = true;
    persistUi();
  }
  const input = resolveVoiceTarget(key);
  if (!input) return;
  // Focus keeps the periodic re-render from replacing the field while it is being dictated.
  input.focus({ preventScroll: true });
  const baseText = input.value.trim();
  const maxLength = input.maxLength > 0 ? input.maxLength : Infinity;
  const write = (spokenText, isFinal) => {
    const target = resolveVoiceTarget(key);
    if (!target) return;
    target.value = (baseText ? `${baseText} ${spokenText}` : spokenText).slice(0, maxLength);
    if (dictation) dictation.isInterim = !isFinal;
    // Like typing: lets the form clear a "required" message it showed earlier.
    if (isFinal) target.dispatchEvent(new Event('input', { bubbles: true }));
  };
  dictation = { key, session: null, isInterim: false };
  const session = startDictation({
    onInterim: text => write(text, false),
    onFinal: text => write(text, true),
    onError: code => showToast(voiceErrorMessage(code), { tone: 'warning' }),
    onEnd: () => {
      // Recognition can end on words heard but never confirmed; they stay in the field as typed text.
      if (dictation?.isInterim) resolveVoiceTarget(key)?.dispatchEvent(new Event('input', { bubbles: true }));
      dictation = null;
      syncDictationButtons();
    },
  });
  if (session && dictation) dictation.session = session;
  syncDictationButtons();
}

function syncDictationButtons() {
  for (const button of document.querySelectorAll('[data-action="dictate"]')) {
    const isRecording = dictation?.key === button.dataset.voiceKey;
    button.classList.toggle('is-recording', isRecording);
    button.setAttribute('aria-pressed', String(isRecording));
  }
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
  for (const micButton of els.taskForm.querySelectorAll('.mic-btn')) micButton.hidden = !isVoiceAvailable();
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
  if (!renderTaskDetail(els.detailBody, store.getState(), taskId, Date.now(), detailOptions(myDayDate()))) return;
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
  const fields = els.settingsForm.elements;
  fields.theme.value = settings.theme;
  fields.view.value = ui.display.view;
  fields.season.value = ui.display.season;
  for (const key of DISPLAY_TOGGLE_KEYS) fields[key].checked = ui.display[key];
  fields.sound.disabled = !ui.display.celebrate;
  const voiceSupported = isVoiceSupported();
  fields.voice.disabled = !voiceSupported;
  els.voiceNote.textContent = voiceSupported
    ? 'ההכתבה עוברת דרך שירות זיהוי הדיבור של הדפדפן (בשרתים של גוגל, מיקרוסופט או אפל, לפי הדפדפן), ולכן לא כדאי להכתיב בה מידע רגיש.'
    : 'הדפדפן הזה לא תומך בהכתבה קולית. היא עובדת בכרום, באדג\' ובספארי.';
  const todaySeason = getSeasonForDate(new Date());
  els.seasonHint.textContent = todaySeason
    ? `לפי הלוח העברי, היום: ${SEASONS[todaySeason].label}.`
    : 'היום אין חג בלוח. ב"תצוגה מקדימה" אפשר לראות כל אחת מהערכות.';
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
  // Dictation belongs to a field in a dialog; closing the dialog ends it.
  dialog.addEventListener('close', () => dictation?.session?.stop());
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
  fillSeasonSelect(els.settingsForm.elements.season);
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
