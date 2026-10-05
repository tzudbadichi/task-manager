// Builds the DOM from state. Render functions only create elements and tag them with
// data-action / data-* attributes; app.js handles every event through delegation.

import { h } from './dom.js';
import { icon } from './icons.js';
import { STATUSES, STATUS_ORDER } from './statuses.js';
import { LIMITS } from './store.js';
import { NO_CATEGORY, getBackupReminder, getDashboardCounts, selectVisibleTasks, summarizeSubtasks } from './selectors.js';
import { formatElapsed } from './utils.js';

export const UNCATEGORIZED_COLOR = '#94a3b8';
export const CATEGORY_SWATCHES = Object.freeze([
  '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
  '#ca8a04', '#16a34a', '#0d9488', '#0891b2', '#475569',
]);

// How many subtasks a tile previews (CSS shows fewer on small screens).
const TILE_PREVIEW_COUNT = 4;

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'כל הסטטוסים' },
  ...STATUS_ORDER.map(key => ({ value: key, label: STATUSES[key].label })),
];

const SORT_OPTIONS = [
  { value: 'manual', label: 'מיון: הסדר שלי' },
  { value: 'status', label: 'מיון: לפי סטטוס' },
  { value: 'updated', label: 'מיון: עודכן לאחרונה' },
  { value: 'created', label: 'מיון: נוצר לאחרונה' },
  { value: 'category', label: 'מיון: לפי קטגוריה' },
];

const DASHBOARD_ICONS = Object.freeze({ todo: 'list', in_progress: 'clock', done: 'check' });

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function renderDashboard(container, state, filters) {
  const counts = getDashboardCounts(state);
  container.replaceChildren(...STATUS_ORDER.map(status => {
    const isActive = filters.status === status;
    return h('button', {
      type: 'button',
      class: ['dash-card', isActive && 'is-active'],
      dataset: { action: 'dashboard-filter', filter: status, status },
      'aria-pressed': String(isActive),
      title: isActive ? 'לחיצה נוספת מבטלת את הסינון' : 'לחיצה מסננת את הרשימה',
    },
    h('span', { class: 'dash-icon' }, icon(DASHBOARD_ICONS[status])),
    h('span', { class: 'dash-text' },
      h('span', { class: 'dash-title' }, STATUSES[status].label),
      h('span', { class: 'dash-sub' }, STATUSES[status].hint)),
    h('span', { class: 'dash-value' }, String(counts[status])));
  }));
}

// ---------------------------------------------------------------------------
// Filters bar
// ---------------------------------------------------------------------------

export function renderFilters(container, state, filters) {
  const selectedCategories = new Set(filters.categoryIds);
  const hasUncategorized = state.tasks.some(task => task.categoryId === null);
  const doneCount = state.tasks.filter(task => task.status === 'done').length;
  const isFiltered = Boolean(filters.search) || selectedCategories.size > 0 || filters.status !== 'all';

  const chips = [
    h('button', {
      type: 'button',
      class: ['chip', selectedCategories.size === 0 && 'is-active'],
      dataset: { action: 'filter-category', categoryId: '' },
      'aria-pressed': String(selectedCategories.size === 0),
    }, 'הכל'),
    ...state.categories.map(category =>
      categoryChip(category.id, category.name, category.color, selectedCategories.has(category.id))),
    hasUncategorized && categoryChip(NO_CATEGORY, 'ללא קטגוריה', UNCATEGORIZED_COLOR, selectedCategories.has(NO_CATEGORY)),
  ];

  container.replaceChildren(
    h('div', { class: 'filters-row' },
      h('label', { class: 'search' },
        icon('search'),
        h('input', {
          type: 'search', value: filters.search, 'aria-label': 'חיפוש',
          placeholder: 'חיפוש במשימות ובתתי משימות',
          dataset: { action: 'filter-search', focusKey: 'filter-search' },
        })),
      h('div', { class: 'filters-selects' },
        selectElement(STATUS_FILTER_OPTIONS, filters.status, { action: 'filter-status', focusKey: 'filter-status' }, 'סינון לפי סטטוס'),
        selectElement(SORT_OPTIONS, filters.sort, { action: 'filter-sort', focusKey: 'filter-sort' }, 'מיון')),
      h('label', { class: 'toggle' },
        h('input', { type: 'checkbox', checked: filters.showDone, dataset: { action: 'filter-show-done', focusKey: 'filter-show-done' } }),
        `הצגת משימות שהושלמו (${doneCount})`),
      isFiltered && h('button', { type: 'button', class: 'btn btn-link filters-reset', dataset: { action: 'filter-reset' } }, 'ניקוי סינון')),
    h('div', { class: 'chips-row', role: 'group', 'aria-label': 'סינון לפי קטגוריה' }, ...chips),
  );
}

function categoryChip(categoryId, name, color, isActive) {
  return h('button', {
    type: 'button',
    class: ['chip', isActive && 'is-active'],
    cssVars: { '--chip-color': color },
    dataset: { action: 'filter-category', categoryId },
    'aria-pressed': String(isActive),
  }, h('span', { class: 'dot', 'aria-hidden': 'true' }), name);
}

// ---------------------------------------------------------------------------
// Backup reminder banner (local-only mode)
// ---------------------------------------------------------------------------

export function renderBackupBanner(container, state, now, isHidden) {
  const reminder = isHidden ? null : getBackupReminder(state, now);
  if (!reminder) {
    container.replaceChildren();
    return;
  }
  const message = reminder.lastExportAt
    ? `הגיבוי האחרון נעשה לפני ${formatElapsed(now - reminder.lastExportAt)}, ומאז היו שינויים.`
    : 'עדיין לא נעשה גיבוי. הנתונים שמורים רק בדפדפן הזה.';
  container.replaceChildren(h('div', { class: 'banner', role: 'note' },
    icon('shield'),
    h('span', { class: 'banner-text' }, message),
    h('button', { type: 'button', class: 'btn btn-primary btn-sm', dataset: { action: 'export-backup' } }, icon('download', { size: 16 }), 'ייצוא גיבוי'),
    h('button', { type: 'button', class: 'btn btn-link', dataset: { action: 'dismiss-backup-banner' } }, 'אחר כך')));
}

// ---------------------------------------------------------------------------
// Task grid (square tiles)
// ---------------------------------------------------------------------------

export function renderTaskGrid(container, state, filters, now) {
  if (state.tasks.length === 0) {
    container.replaceChildren(emptyState(
      'אין עדיין משימות',
      'אפשר להתחיל עם "משימה חדשה" ולהוסיף לה תתי משימות. את הריבועים אפשר לגרור ולסדר איך שנוח.',
      h('button', { type: 'button', class: 'btn btn-primary', dataset: { action: 'open-new-task' } }, icon('plus'), 'משימה חדשה')));
    return;
  }
  const visibleTasks = selectVisibleTasks(state, filters);
  if (visibleTasks.length === 0) {
    container.replaceChildren(emptyState(
      'אין משימות שמתאימות לסינון',
      '',
      h('button', { type: 'button', class: 'btn btn-soft', dataset: { action: 'filter-reset' } }, 'ניקוי סינון')));
    return;
  }
  const categoriesById = new Map(state.categories.map(category => [category.id, category]));
  container.replaceChildren(...visibleTasks.map(task => renderTaskTile(task, categoriesById.get(task.categoryId) ?? null, now)));
}

function renderTaskTile(task, category, now) {
  const color = category?.color ?? UNCATEGORIZED_COLOR;
  const summary = summarizeSubtasks(task);
  const preview = task.subtasks.slice(0, TILE_PREVIEW_COUNT);
  const hiddenCount = summary.total - preview.length;
  const ids = { taskId: task.id };

  return h('article', {
    class: ['task-tile', task.status === 'done' && 'is-done'],
    cssVars: { '--cat-color': color },
    dataset: { taskId: task.id },
  },
  h('div', { class: 'tile-top' },
    h('span', { class: 'cat-chip', cssVars: { '--chip-color': color } },
      h('span', { class: 'dot', 'aria-hidden': 'true' }), category?.name ?? 'ללא קטגוריה'),
    h('span', { class: 'tile-grip', title: 'גרירה לסידור', 'aria-hidden': 'true' }, icon('grip', { size: 16 }))),
  // The title button stretches over the whole tile (CSS ::after), so a click anywhere opens the task.
  h('button', {
    type: 'button', class: 'tile-open', dataset: { action: 'open-task', ...ids },
    'aria-label': `פתיחת המשימה ${task.title}`,
  }, h('span', { class: 'tile-title' }, task.title)),
  summary.total === 0 && task.description && h('p', { class: 'tile-description' }, task.description),
  summary.total > 0 && h('ul', { class: 'tile-subtasks', 'aria-label': 'תתי משימות' },
    ...preview.map(subtask => {
      const isDone = subtask.status === 'done';
      return h('li', { class: 'tile-subtask', dataset: { status: subtask.status } },
        h('button', {
          type: 'button',
          class: ['done-toggle', 'is-mini', 'no-drag', isDone && 'is-checked'],
          dataset: { action: 'toggle-subtask-done', ...ids, subtaskId: subtask.id },
          'aria-pressed': String(isDone),
          'aria-label': `${isDone ? 'החזרה לביצוע' : 'סימון כהושלם'}: ${subtask.title}`,
        }, icon('check', { size: 11 })),
        h('span', { class: 'tile-subtask-title' }, subtask.title));
    })),
  hiddenCount > 0 && h('span', { class: 'tile-more' }, `+${hiddenCount} נוספות`),
  h('div', { class: 'tile-bottom' },
    statusControl(task.status, { action: 'set-task-status', focusKey: `tile-status-${task.id}`, ...ids }, 'no-drag'),
    summary.total > 0 && progressIndicator(summary),
    sinceLabel(task, now)));
}

// ---------------------------------------------------------------------------
// Task detail (dialog content)
// ---------------------------------------------------------------------------

/** Renders the detail view of one task. Returns false when the task no longer exists. */
export function renderTaskDetail(container, state, taskId, now) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return false;
  const category = state.categories.find(item => item.id === task.categoryId) ?? null;
  const color = category?.color ?? UNCATEGORIZED_COLOR;
  const summary = summarizeSubtasks(task);
  const ids = { taskId: task.id };

  container.replaceChildren(
    h('header', { class: 'detail-head', cssVars: { '--cat-color': color } },
      h('span', { class: 'detail-color', 'aria-hidden': 'true' }),
      h('input', {
        type: 'text', class: 'inline-edit detail-title', value: task.title, maxlength: LIMITS.title,
        'aria-label': 'כותרת המשימה', id: 'detail-dialog-title',
        dataset: { action: 'edit-task-title', focusKey: `detail-title-${task.id}`, original: task.title, ...ids },
      }),
      h('button', { type: 'button', class: 'icon-btn', dataset: { action: 'close-dialog' }, 'aria-label': 'סגירה', autofocus: true }, icon('x'))),
    h('div', { class: 'field-row' },
      h('label', { class: 'field' },
        h('span', { class: 'field-label' }, 'קטגוריה'),
        h('select', { class: 'select', value: task.categoryId ?? '', dataset: { action: 'set-task-category', focusKey: `detail-category-${task.id}`, ...ids } },
          ...state.categories.map(item => h('option', { value: item.id }, item.name)),
          h('option', { value: '' }, 'ללא קטגוריה'))),
      h('label', { class: 'field' },
        h('span', { class: 'field-label' }, 'סטטוס'),
        h('select', { class: 'select', value: task.status, dataset: { action: 'set-task-status', focusKey: `detail-status-${task.id}`, ...ids } },
          ...STATUS_ORDER.map(key => h('option', { value: key }, STATUSES[key].label))))),
    h('label', { class: 'field' },
      h('span', { class: 'field-label' }, 'תיאור ', h('small', {}, '(אופציונלי)')),
      h('textarea', {
        rows: 3, maxlength: LIMITS.description, value: task.description,
        dataset: { action: 'edit-task-description', focusKey: `detail-description-${task.id}`, original: task.description, ...ids },
      })),
    h('section', { class: 'detail-subtasks', 'aria-label': 'תתי משימות' },
      h('h3', {}, summary.total > 0 ? `תתי משימות (${summary.done}/${summary.total})` : 'תתי משימות'),
      summary.total > 0
        ? h('ul', { class: 'subtasks' }, ...task.subtasks.map(subtask => renderSubtask(task, subtask, now)))
        : h('p', { class: 'muted small' }, 'אין עדיין תתי משימות.'),
      addSubtaskRow(task.id)),
    h('footer', { class: 'dialog-foot' },
      h('button', { type: 'button', class: 'btn btn-danger-soft', dataset: { action: 'delete-task', ...ids } }, icon('trash', { size: 16 }), 'מחיקת המשימה'),
      h('span', { class: 'spacer' }),
      h('button', { type: 'button', class: 'btn btn-primary', dataset: { action: 'close-dialog' } }, 'סגירה')),
  );
  return true;
}

function renderSubtask(task, subtask, now) {
  const ids = { taskId: task.id, subtaskId: subtask.id };
  const isDone = subtask.status === 'done';
  const toggleLabel = isDone ? 'החזרה לביצוע' : 'סימון כהושלם';

  return h('li', { class: 'subtask', dataset: { status: subtask.status } },
    h('button', {
      type: 'button',
      class: ['done-toggle', isDone && 'is-checked'],
      dataset: { action: 'toggle-subtask-done', ...ids },
      'aria-pressed': String(isDone),
      title: toggleLabel,
      'aria-label': toggleLabel,
    }, icon('check', { size: 14 })),
    h('div', { class: 'subtask-main' },
      h('input', {
        type: 'text', class: 'inline-edit subtask-title', value: subtask.title, maxlength: LIMITS.title,
        'aria-label': 'כותרת תת-המשימה',
        dataset: { action: 'edit-subtask-title', focusKey: `sub-title-${subtask.id}`, original: subtask.title, ...ids },
      })),
    h('div', { class: 'subtask-side' },
      sinceLabel(subtask, now),
      statusControl(subtask.status, { action: 'set-subtask-status', focusKey: `sub-status-${subtask.id}`, ...ids }),
      iconButton('trash', 'מחיקת תת-משימה', { action: 'delete-subtask', ...ids }, 'danger')));
}

function addSubtaskRow(taskId) {
  return h('div', { class: 'add-subtask' },
    h('input', {
      type: 'text', class: 'add-subtask-input', maxlength: LIMITS.title,
      placeholder: 'תת-משימה חדשה...',
      'aria-label': 'הוספת תת-משימה',
      dataset: { action: 'add-subtask', focusKey: `add-subtask-${taskId}`, taskId },
    }),
    h('button', { type: 'button', class: 'btn btn-soft btn-sm', dataset: { action: 'add-subtask-button', taskId } },
      icon('plus', { size: 16 }), 'הוספה'));
}

// ---------------------------------------------------------------------------
// Sync status pill (top bar)
// ---------------------------------------------------------------------------

const SYNC_STATUS_VIEW = Object.freeze({
  local: { iconName: 'monitor', label: 'שמור במכשיר בלבד', title: 'אין חיבור לחשבון - הנתונים נשמרים רק בדפדפן הזה' },
  connecting: { iconName: 'cloud', label: 'מתחבר...', title: 'טוען את המשימות מהחשבון' },
  saving: { iconName: 'cloud', label: 'שומר...', title: 'שומר את השינויים בחשבון' },
  synced: { iconName: 'cloud', label: 'מסונכרן', title: 'כל השינויים שמורים בחשבון' },
  offline: { iconName: 'cloud-off', label: 'לא מקוון', title: 'אין רשת - השינויים נשמרים במכשיר ויסונכרנו כשהרשת תחזור' },
  error: { iconName: 'refresh', label: 'שגיאת סנכרון', title: 'השמירה בחשבון נכשלה - לחיצה לניסיון חוזר' },
});

export function renderSyncStatus(element, status) {
  const view = SYNC_STATUS_VIEW[status] ?? SYNC_STATUS_VIEW.local;
  element.dataset.syncStatus = status;
  element.title = view.title;
  element.setAttribute('aria-label', `${view.label}. ${view.title}`);
  element.replaceChildren(icon(view.iconName, { size: 16 }), h('span', { class: 'sync-label' }, view.label));
}

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function statusControl(status, dataset, extraClass = null) {
  return h('span', { class: ['status-chip', extraClass], dataset: { status } },
    h('span', { class: 'dot', 'aria-hidden': 'true' }),
    h('select', {
      class: 'status-select', value: status, 'aria-label': 'סטטוס', title: STATUSES[status].hint, dataset,
    }, ...STATUS_ORDER.map(key => h('option', { value: key, title: STATUSES[key].hint }, STATUSES[key].label))));
}

// How long an item has been in progress.
function sinceLabel(item, now) {
  if (item.status !== 'in_progress') return null;
  const elapsed = formatElapsed(now - item.statusChangedAt);
  return h('span', { class: 'since', title: `בעבודה כבר ${elapsed}` }, icon('clock', { size: 13 }), elapsed);
}

function progressIndicator({ total, done }) {
  const percent = Math.round((done / total) * 100);
  return h('span', { class: 'progress', title: `${done} מתוך ${total} תתי משימות הושלמו` },
    h('span', { class: 'progress-bar', 'aria-hidden': 'true' },
      h('span', { class: 'progress-fill', cssVars: { '--pct': `${percent}%` } })),
    h('span', { dir: 'ltr' }, `${done}/${total}`));
}

function iconButton(iconName, label, dataset, variant = null) {
  return h('button', { type: 'button', class: ['icon-btn', variant], dataset, title: label, 'aria-label': label }, icon(iconName));
}

function selectElement(options, value, dataset, label) {
  return h('select', { class: 'select', value, dataset, 'aria-label': label },
    ...options.map(option => h('option', { value: option.value }, option.label)));
}

function emptyState(title, text, ...actions) {
  return h('div', { class: 'empty-state' },
    h('h2', {}, title),
    text && h('p', {}, text),
    h('div', { class: 'empty-actions' }, ...actions));
}

// ---------------------------------------------------------------------------
// Dialog helpers
// ---------------------------------------------------------------------------

export function renderCategoriesList(container, state) {
  const usage = new Map();
  for (const task of state.tasks) usage.set(task.categoryId, (usage.get(task.categoryId) ?? 0) + 1);

  if (state.categories.length === 0) {
    container.replaceChildren(h('li', { class: 'muted small' }, 'אין קטגוריות. אפשר להוסיף למטה.'));
    return;
  }
  container.replaceChildren(...state.categories.map(category => h('li', { class: 'category-row' },
    h('input', {
      type: 'color', class: 'color-input', value: category.color,
      'aria-label': `צבע לקטגוריה ${category.name}`,
      dataset: { action: 'category-color', categoryId: category.id, focusKey: `cat-color-${category.id}` },
    }),
    h('input', {
      type: 'text', class: 'inline-edit category-name', value: category.name, maxlength: LIMITS.categoryName,
      'aria-label': 'שם הקטגוריה',
      dataset: { action: 'category-name', categoryId: category.id, focusKey: `cat-name-${category.id}`, original: category.name },
    }),
    h('span', { class: 'muted small category-usage' }, `${usage.get(category.id) ?? 0} משימות`),
    iconButton('trash', 'מחיקת קטגוריה', { action: 'delete-category', categoryId: category.id }, 'danger'))));
}

export function renderSwatches(container, selectedColor) {
  const selected = selectedColor.toLowerCase();
  container.replaceChildren(...CATEGORY_SWATCHES.map(color => h('button', {
    type: 'button',
    class: ['swatch', color === selected && 'is-selected'],
    cssVars: { '--swatch': color },
    dataset: { action: 'pick-swatch', color },
    'aria-label': `בחירת צבע ${color}`,
    'aria-pressed': String(color === selected),
  })));
}

/** First palette color not used yet by any category. */
export function suggestCategoryColor(categories) {
  const used = new Set(categories.map(category => category.color));
  return CATEGORY_SWATCHES.find(color => !used.has(color)) ?? CATEGORY_SWATCHES[0];
}

export function fillCategorySelect(select, categories, selectedId) {
  select.replaceChildren(
    ...categories.map(category => h('option', { value: category.id }, category.name)),
    h('option', { value: '' }, 'ללא קטגוריה'));
  select.value = categories.some(category => category.id === selectedId) ? selectedId : '';
}

export function fillStatusSelect(select, status) {
  select.replaceChildren(...STATUS_ORDER.map(key => h('option', { value: key, title: STATUSES[key].hint }, STATUSES[key].label)));
  select.value = status;
}
