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

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'כל הסטטוסים' },
  ...STATUS_ORDER.map(key => ({ value: key, label: STATUSES[key].label })),
];

const SORT_OPTIONS = [
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
      selectElement(STATUS_FILTER_OPTIONS, filters.status, { action: 'filter-status', focusKey: 'filter-status' }, 'סינון לפי סטטוס'),
      selectElement(SORT_OPTIONS, filters.sort, { action: 'filter-sort', focusKey: 'filter-sort' }, 'מיון'),
      h('label', { class: 'toggle' },
        h('input', { type: 'checkbox', checked: filters.showDone, dataset: { action: 'filter-show-done', focusKey: 'filter-show-done' } }),
        `הצגת משימות שהושלמו (${doneCount})`),
      h('div', { class: 'filters-tools' },
        isFiltered && h('button', { type: 'button', class: 'btn btn-link', dataset: { action: 'filter-reset' } }, 'ניקוי סינון'),
        iconButton('chevrons-down', 'פתיחת כל המשימות', { action: 'expand-all' }),
        iconButton('chevrons-up', 'כיווץ כל המשימות', { action: 'collapse-all' }))),
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
// Backup reminder banner
// ---------------------------------------------------------------------------

export function renderBackupBanner(container, state, now, isDismissed) {
  const reminder = isDismissed ? null : getBackupReminder(state, now);
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
// Task list
// ---------------------------------------------------------------------------

export function renderTaskList(container, state, filters, expandedTaskIds, now) {
  if (state.tasks.length === 0) {
    container.replaceChildren(emptyState(
      'אין עדיין משימות',
      'אפשר להתחיל עם "משימה חדשה" ולהוסיף לה תתי משימות. לכל משימה ולכל תת-משימה יש סטטוס משלה.',
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
  container.replaceChildren(...visibleTasks.map(task => renderTaskCard(
    task, categoriesById.get(task.categoryId) ?? null, expandedTaskIds.has(task.id), now)));
}

function renderTaskCard(task, category, isExpanded, now) {
  const color = category?.color ?? UNCATEGORIZED_COLOR;
  const summary = summarizeSubtasks(task);
  const ids = { taskId: task.id };
  const bodyId = `task-body-${task.id}`;

  return h('article', {
    class: ['task-card', task.status === 'done' && 'is-done'],
    cssVars: { '--cat-color': color },
    'aria-label': task.title,
  },
  h('div', { class: 'task-head' },
    h('button', {
      type: 'button', class: 'icon-btn expand-btn',
      dataset: { action: 'toggle-expand', ...ids },
      'aria-expanded': String(isExpanded), 'aria-controls': bodyId,
      title: isExpanded ? 'כיווץ' : 'פתיחה',
    }, icon('chevron-down')),
    h('div', { class: 'task-main' },
      inlineInput(task.title, { action: 'edit-task-title', focusKey: `task-title-${task.id}`, ...ids }, 'task-title', 'כותרת המשימה'),
      h('div', { class: 'task-meta' },
        h('span', { class: 'cat-chip', cssVars: { '--chip-color': color } },
          h('span', { class: 'dot', 'aria-hidden': 'true' }), category?.name ?? 'ללא קטגוריה'),
        summary.total > 0 && progressIndicator(summary),
        sinceLabel(task, now))),
    h('div', { class: 'task-actions' },
      statusControl(task.status, { action: 'set-task-status', focusKey: `task-status-${task.id}`, ...ids }),
      iconButton('edit', 'עריכת משימה', { action: 'edit-task', ...ids }),
      iconButton('trash', 'מחיקת משימה', { action: 'delete-task', ...ids }, 'danger'))),
  isExpanded && h('div', { class: 'task-body', id: bodyId },
    task.description && h('p', { class: 'task-description' }, task.description),
    summary.total > 0
      ? h('ul', { class: 'subtasks' }, ...task.subtasks.map(subtask => renderSubtask(task, subtask, now)))
      : h('p', { class: 'muted small no-subtasks' }, 'אין עדיין תתי משימות.'),
    addSubtaskRow(task.id)));
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
      inlineInput(subtask.title, { action: 'edit-subtask-title', focusKey: `sub-title-${subtask.id}`, ...ids }, 'subtask-title', 'כותרת תת-המשימה')),
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
// Small building blocks
// ---------------------------------------------------------------------------

function statusControl(status, dataset) {
  return h('span', { class: 'status-chip', dataset: { status } },
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

function inlineInput(value, dataset, className, label) {
  return h('input', {
    type: 'text', class: ['inline-edit', className], value, maxlength: LIMITS.title,
    'aria-label': label, dataset: { ...dataset, original: value },
  });
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
