// Builds the DOM from state. Render functions only create elements and tag them with
// data-action / data-* attributes; app.js handles every event through delegation.

import { h } from './dom.js';
import { icon } from './icons.js';
import { CONTACT_STATUSES, STATUSES, STATUS_ORDER, TIMED_STATUSES } from './statuses.js';
import { LIMITS } from './store.js';
import {
  ATTENTION, NO_CATEGORY, countSubtaskAttention, getAttention, getBackupReminder,
  getDashboardCounts, selectVisibleTasks, summarizeSubtasks, timerStart,
} from './selectors.js';
import { formatElapsed } from './utils.js';

export const UNCATEGORIZED_COLOR = '#94a3b8';
export const CATEGORY_SWATCHES = Object.freeze([
  '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
  '#ca8a04', '#16a34a', '#0d9488', '#0891b2', '#475569',
]);

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'כל הסטטוסים' },
  { value: 'attention', label: 'דורש אותי עכשיו' },
  { value: 'open', label: 'פתוח (לביצוע / בעבודה)' },
  ...STATUS_ORDER.map(key => ({ value: key, label: STATUSES[key].label })),
];

const SORT_OPTIONS = [
  { value: 'attention', label: 'מיון: דחוף קודם' },
  { value: 'updated', label: 'מיון: עודכן לאחרונה' },
  { value: 'created', label: 'מיון: נוצר לאחרונה' },
  { value: 'category', label: 'מיון: לפי קטגוריה' },
];

const CHECK_BUTTON = Object.freeze({
  claude_running: { label: 'בדקתי - עדיין רץ', title: 'מאפס את הטיימר עד הבדיקה הבאה' },
  waiting_email: { label: 'שלחתי תזכורת', title: 'מאפס את הטיימר עד התזכורת הבאה' },
});

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export function renderDashboard(container, state, filters, now) {
  const counts = getDashboardCounts(state, now);
  const cards = [
    {
      filter: 'email_received', iconName: 'inbox', title: 'התקבל מייל - לטיפולי',
      value: counts.emailReceived, urgent: counts.emailReceived > 0,
      sub: counts.emailReceived > 0 ? 'מחכה לטיפול שלך' : 'אין כרגע',
    },
    {
      filter: 'claude_running', iconName: 'terminal', title: 'קלוד רץ ברקע',
      value: counts.claudeRunning, urgent: counts.claudeOverdue > 0,
      sub: counts.claudeOverdue > 0 ? `${counts.claudeOverdue} לבדוק עכשיו`
        : counts.claudeRunning > 0 ? 'עוד לא הגיע זמן בדיקה' : 'אין תהליכים פעילים',
    },
    {
      filter: 'waiting_email', iconName: 'mail', title: 'ממתין למייל',
      value: counts.waitingEmail, urgent: false,
      sub: counts.waitingFollowUp > 0 ? `${counts.waitingFollowUp} כדאי לתזכר` : 'לא בטיפולך כרגע',
    },
    {
      filter: 'open', iconName: 'list', title: 'לביצוע / בעבודה',
      value: counts.open, urgent: false,
      sub: `${counts.inProgress} בעבודה, ${counts.todo} לביצוע`,
    },
  ];
  // The 'open' card borrows the in-progress color.
  const toneOf = filter => (filter === 'open' ? 'in_progress' : filter);

  container.replaceChildren(...cards.map(card => {
    const isActive = filters.status === card.filter;
    return h('button', {
      type: 'button',
      class: ['dash-card', isActive && 'is-active', card.urgent && 'is-urgent'],
      dataset: { action: 'dashboard-filter', filter: card.filter, status: toneOf(card.filter) },
      'aria-pressed': String(isActive),
      title: isActive ? 'לחיצה נוספת מבטלת את הסינון' : 'לחיצה מסננת את הרשימה',
    },
    h('span', { class: 'dash-icon' }, icon(card.iconName)),
    h('span', { class: 'dash-text' },
      h('span', { class: 'dash-title' }, card.title),
      h('span', { class: 'dash-sub' }, card.sub)),
    h('span', { class: 'dash-value' }, String(card.value)));
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
          placeholder: 'חיפוש במשימות, תתי משימות ואנשי קשר',
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
  const visibleTasks = selectVisibleTasks(state, filters, now);
  if (visibleTasks.length === 0) {
    container.replaceChildren(emptyState(
      'אין משימות שמתאימות לסינון',
      '',
      h('button', { type: 'button', class: 'btn btn-soft', dataset: { action: 'filter-reset' } }, 'ניקוי סינון')));
    return;
  }
  const categoriesById = new Map(state.categories.map(category => [category.id, category]));
  container.replaceChildren(...visibleTasks.map(task => renderTaskCard(
    task, categoriesById.get(task.categoryId) ?? null, state.settings, expandedTaskIds.has(task.id), now)));
}

function renderTaskCard(task, category, settings, isExpanded, now) {
  const color = category?.color ?? UNCATEGORIZED_COLOR;
  const isDone = task.status === 'done';
  const summary = summarizeSubtasks(task);
  const ownAttention = getAttention(task, settings, now);
  const subtaskAttention = countSubtaskAttention(task, settings, now);
  const ids = { taskId: task.id };
  const bodyId = `task-body-${task.id}`;

  let highlight = null;
  if (!isDone && (ownAttention === ATTENTION.action || subtaskAttention.action > 0)) highlight = 'attn-action';
  else if (!isDone && (ownAttention === ATTENTION.check || subtaskAttention.check > 0)) highlight = 'attn-check';

  return h('article', {
    class: ['task-card', isDone && 'is-done', highlight],
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
        task.contact && contactChip(task.contact),
        !isDone && sinceLabel(task, now),
        !isDone && isTimedEscalation(ownAttention) && attentionBadge(ownAttention),
        !isDone && subtaskAttentionBadges(subtaskAttention))),
    h('div', { class: 'task-actions' },
      statusControl(task.status, { action: 'set-task-status', focusKey: `task-status-${task.id}`, ...ids }),
      checkButton(task, ownAttention, ids),
      iconButton('edit', 'עריכת משימה', { action: 'edit-task', ...ids }),
      iconButton('trash', 'מחיקת משימה', { action: 'delete-task', ...ids }, 'danger'))),
  isExpanded && h('div', { class: 'task-body', id: bodyId },
    task.description && h('p', { class: 'task-description' }, task.description),
    summary.total > 0
      ? h('ul', { class: 'subtasks' }, ...task.subtasks.map(subtask => renderSubtask(task, subtask, settings, now)))
      : h('p', { class: 'muted small no-subtasks' }, 'אין עדיין תתי משימות.'),
    addSubtaskRow(task.id)));
}

function renderSubtask(task, subtask, settings, now) {
  const ids = { taskId: task.id, subtaskId: subtask.id };
  const attention = getAttention(subtask, settings, now);
  const isDone = subtask.status === 'done';
  const showContact = CONTACT_STATUSES.has(subtask.status) || subtask.contact !== '';

  return h('li', { class: ['subtask', attention && `attn-${attention.level}`], dataset: { status: subtask.status } },
    h('button', {
      type: 'button',
      class: ['done-toggle', isDone && 'is-checked'],
      dataset: { action: 'toggle-subtask-done', ...ids },
      'aria-pressed': String(isDone),
      title: isDone ? 'החזרה לביצוע' : 'סימון כהושלם',
      'aria-label': isDone ? 'החזרה לביצוע' : 'סימון כהושלם',
    }, icon('check', { size: 14 })),
    h('div', { class: 'subtask-main' },
      inlineInput(subtask.title, { action: 'edit-subtask-title', focusKey: `sub-title-${subtask.id}`, ...ids }, 'subtask-title', 'כותרת תת-המשימה'),
      showContact && h('label', { class: 'contact-field' },
        icon('user', { size: 14 }),
        h('input', {
          type: 'text', class: 'inline-edit contact-input', value: subtask.contact, maxlength: LIMITS.contact,
          placeholder: subtask.status === 'email_received' ? 'ממי הגיע המייל?' : 'ממי מחכים לתשובה?',
          'aria-label': 'איש קשר',
          dataset: { action: 'edit-subtask-contact', focusKey: `sub-contact-${subtask.id}`, original: subtask.contact, ...ids },
        }))),
    h('div', { class: 'subtask-side' },
      !isDone && sinceLabel(subtask, now),
      isTimedEscalation(attention) && attentionBadge(attention),
      statusControl(subtask.status, { action: 'set-subtask-status', focusKey: `sub-status-${subtask.id}`, ...ids }),
      checkButton(subtask, attention, ids),
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

function isTimedEscalation(attention) {
  return attention === ATTENTION.check || attention === ATTENTION.followup;
}

function statusControl(status, dataset) {
  return h('span', { class: 'status-chip', dataset: { status } },
    h('span', { class: 'dot', 'aria-hidden': 'true' }),
    h('select', {
      class: 'status-select', value: status, 'aria-label': 'סטטוס', title: STATUSES[status].hint, dataset,
    }, ...STATUS_ORDER.map(key => h('option', { value: key, title: STATUSES[key].hint }, STATUSES[key].label))));
}

function checkButton(item, attention, dataset) {
  const isRelevant = item.status === 'claude_running' || (item.status === 'waiting_email' && attention === ATTENTION.followup);
  if (!isRelevant) return null;
  const { label, title } = CHECK_BUTTON[item.status];
  return h('button', {
    type: 'button', class: 'btn btn-soft btn-xs', title,
    dataset: { action: 'mark-checked', ...dataset },
  }, icon('refresh', { size: 13 }), label);
}

function sinceLabel(item, now) {
  if (item.status === 'todo' || item.status === 'done') return null;
  const isTimed = TIMED_STATUSES.has(item.status);
  const elapsed = formatElapsed(now - (isTimed ? timerStart(item) : item.statusChangedAt));
  const title = isTimed && item.lastCheckedAt
    ? `עברו ${elapsed} מאז הבדיקה האחרונה`
    : `בסטטוס "${STATUSES[item.status].label}" כבר ${elapsed}`;
  return h('span', { class: 'since', title }, icon('clock', { size: 13 }), elapsed);
}

function attentionBadge(attention, text = attention.label, iconName = null) {
  const isStrong = attention === ATTENTION.action || attention === ATTENTION.check;
  return h('span', { class: ['badge', isStrong && 'is-strong'], dataset: { status: attention.status } },
    iconName && icon(iconName, { size: 13 }), text);
}

function subtaskAttentionBadges(counts) {
  return [
    counts.action > 0 && attentionBadge(ATTENTION.action, `לטיפולי: ${counts.action}`, 'inbox'),
    counts.check > 0 && attentionBadge(ATTENTION.check, `לבדוק: ${counts.check}`, 'terminal'),
    counts.running > 0 && attentionBadge(ATTENTION.running, `רץ ברקע: ${counts.running}`, 'terminal'),
    counts.followup > 0 && attentionBadge(ATTENTION.followup, `לתזכר: ${counts.followup}`, 'mail'),
  ];
}

function progressIndicator({ total, done }) {
  const percent = Math.round((done / total) * 100);
  return h('span', { class: 'progress', title: `${done} מתוך ${total} תתי משימות הושלמו` },
    h('span', { class: 'progress-bar', 'aria-hidden': 'true' },
      h('span', { class: 'progress-fill', cssVars: { '--pct': `${percent}%` } })),
    h('span', { dir: 'ltr' }, `${done}/${total}`));
}

function contactChip(contact) {
  return h('span', { class: 'contact-chip', title: 'איש קשר' }, icon('user', { size: 13 }), contact);
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
