// Builds the DOM from state. Render functions only create elements and tag them with
// data-action / data-* attributes; app.js handles every event through delegation.

import { h } from './dom.js';
import { icon } from './icons.js';
import { STATUSES, STATUS_ORDER } from './statuses.js';
import { LIMITS } from './store.js';
import {
  NO_CATEGORY, getBackupReminder, getDashboardCounts, getDustLevel, selectMyDay, selectVisibleTasks, summarizeSubtasks,
} from './selectors.js';
import { SEASONS, SEASON_KEYS } from './seasons.js';
import { createSeasonEmblem } from './art.js';
import { formatElapsed } from './utils.js';
import {
  AGENT_JOB_VIEW, ENGINE_LABELS, isJobActive, isRunnerOnline, subtaskKey, vscodeFolderLink,
} from './agent-model.js';

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

const DASHBOARD_ICONS = Object.freeze({ todo: 'list', in_progress: 'user', waiting: 'hourglass', done: 'check' });

export const ONLY_SUBTASK_MESSAGE = 'לכל משימה חייבת להיות לפחות תת-משימה אחת. כדי להסיר אותה, מוחקים את המשימה כולה.';

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
// Today bar: "my day" picks, plus the "what now?" and "status report" buttons
// ---------------------------------------------------------------------------

export function renderTodayBar(container, state, { today, showMyDay }) {
  const tools = h('div', { class: 'today-tools' },
    h('button', {
      type: 'button', class: 'btn btn-soft btn-sm', dataset: { action: 'open-next', focusKey: 'today-next' },
      title: 'הגרלה של תת-משימה פתוחה לעבוד עליה עכשיו',
    }, icon('dice', { size: 16 }), 'מה עכשיו?'),
    h('button', {
      type: 'button', class: 'btn btn-soft btn-sm', dataset: { action: 'open-report', focusKey: 'today-report' },
      title: 'סיכום מצב להעתקה ולשליחה בווטסאפ, במייל או ב-Teams',
    }, icon('clipboard', { size: 16 }), 'דוח מצב'));
  if (!showMyDay) {
    container.replaceChildren(h('div', { class: 'today-bar is-tools-only' }, tools));
    return;
  }

  const picks = selectMyDay(state, today);
  const openCount = picks.filter(({ subtask }) => subtask.status !== 'done').length;
  const categoriesById = new Map(state.categories.map(category => [category.id, category]));
  const content = picks.length > 0
    ? h('ul', { class: 'today-list' }, ...picks.map(({ task, subtask }) => todayItem(task, subtask, categoriesById.get(task.categoryId))))
    : h('p', { class: 'today-empty' },
      `עוד לא נבחר כלום להיום. אפשר לבחור עד ${LIMITS.myDay} תתי משימות - בסמל השמש שבחלון המשימה, או דרך "מה עכשיו?".`);

  container.replaceChildren(h('div', { class: 'today-bar' },
    h('div', { class: 'today-head' },
      h('span', { class: 'today-icon', 'aria-hidden': 'true' }, icon('sun')),
      h('h2', {}, 'היום שלי'),
      h('span', { class: 'today-count', title: `נבחרו ${openCount} דברים פתוחים מתוך ${LIMITS.myDay} אפשריים` },
        h('span', { dir: 'ltr' }, `${openCount}/${LIMITS.myDay}`))),
    content,
    tools));
}

function todayItem(task, subtask, category) {
  const ids = { taskId: task.id, subtaskId: subtask.id };
  const isDone = subtask.status === 'done';
  return h('li', {
    class: ['today-item', isDone && 'is-done'],
    cssVars: { '--chip-color': category?.color ?? UNCATEGORIZED_COLOR },
    dataset: { status: subtask.status },
  },
  h('button', {
    type: 'button',
    class: ['done-toggle', 'is-mini', isDone && 'is-checked'],
    dataset: { action: 'toggle-subtask-done', focusKey: `today-done-${subtask.id}`, ...ids },
    'aria-pressed': String(isDone),
    'aria-label': `${isDone ? 'החזרה לביצוע' : 'סימון כהושלם'}: ${subtask.title}`,
  }, icon('check', { size: 11 })),
  h('button', {
    type: 'button', class: 'today-item-open', title: 'פתיחת המשימה',
    dataset: { action: 'open-task', focusKey: `today-open-${subtask.id}`, taskId: task.id },
  },
    h('span', { class: 'dot', 'aria-hidden': 'true' }),
    h('span', { class: 'today-item-title' }, subtask.title),
    subtask.title !== task.title && h('span', { class: 'today-item-task' }, task.title)),
  h('button', {
    type: 'button', class: 'icon-btn today-item-remove', dataset: { action: 'my-day-toggle', focusKey: `today-remove-${subtask.id}`, ...ids },
    title: 'הסרה מהיום שלי', 'aria-label': `הסרה מהיום שלי: ${subtask.title}`,
  }, icon('x', { size: 14 })));
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
    h('button', {
      type: 'button', class: 'chip chip-edit', dataset: { action: 'open-categories' },
      title: 'הוספה, שינוי שם, שינוי צבע ומחיקה של קטגוריות',
    }, icon('edit', { size: 14 }), 'עריכה'),
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

/**
 * Shows the "no tasks yet" or "nothing matches the filters" message (shared by the tiles and the
 * people view). Returns true when it did, so there is nothing else to draw.
 */
export function renderTasksEmptyState(container, state, visibleCount) {
  if (state.tasks.length === 0) {
    container.replaceChildren(emptyState(
      'אין עדיין משימות',
      'אפשר להתחיל עם "משימה חדשה" ולהוסיף לה תתי משימות. את הריבועים אפשר לגרור ולסדר איך שנוח.',
      h('button', { type: 'button', class: 'btn btn-primary', dataset: { action: 'open-new-task' } }, icon('plus'), 'משימה חדשה')));
    return true;
  }
  if (visibleCount === 0) {
    container.replaceChildren(emptyState(
      'אין משימות שמתאימות לסינון',
      '',
      h('button', { type: 'button', class: 'btn btn-soft', dataset: { action: 'filter-reset' } }, 'ניקוי סינון')));
    return true;
  }
  return false;
}

/** today: the local date (YYYY-MM-DD) whose "my day" picks get a sun mark, or null to show none. */
export function renderTaskGrid(container, state, filters, now, { today = null } = {}) {
  const visibleTasks = selectVisibleTasks(state, filters);
  if (renderTasksEmptyState(container, state, visibleTasks.length)) return;
  const categoriesById = new Map(state.categories.map(category => [category.id, category]));
  container.replaceChildren(...visibleTasks.map(task => renderTaskTile(task, categoriesById.get(task.categoryId) ?? null, now, today)));
}

function renderTaskTile(task, category, now, today) {
  const color = category?.color ?? UNCATEGORIZED_COLOR;
  const summary = summarizeSubtasks(task);
  const preview = task.subtasks.slice(0, TILE_PREVIEW_COUNT);
  const hiddenCount = summary.total - preview.length;
  const ids = { taskId: task.id };
  const dustLevel = getDustLevel(task, now);

  // The top stripe takes the category color; data-status tints the rest of the tile by status.
  // data-dust (1-3) fades a task nobody touched for weeks and covers it with dust (and cobwebs).
  return h('article', {
    class: ['task-tile', task.status === 'done' && 'is-done'],
    cssVars: { '--cat-color': color },
    dataset: { taskId: task.id, status: task.status, dust: dustLevel || null },
  },
  dustLevel > 0 && h('span', { class: 'tile-dust', 'aria-hidden': 'true' }),
  dustLevel >= 2 && h('span', { class: 'tile-cobweb', 'aria-hidden': 'true' }),
  h('div', { class: 'tile-top' },
    h('span', { class: 'cat-chip', cssVars: { '--chip-color': color } },
      h('span', { class: 'dot', 'aria-hidden': 'true' }), category?.name ?? 'ללא קטגוריה'),
    task.agentProject && h('span', { class: 'tile-agent', title: `משימת אייג'נט - פרויקט ${task.agentProject}` }, icon('bot', { size: 14 })),
    h('span', { class: 'tile-grip', title: 'גרירה לסידור', 'aria-hidden': 'true' }, icon('grip', { size: 16 }))),
  // The title button stretches over the whole tile (CSS ::after), so a click anywhere opens the task.
  h('button', {
    type: 'button', class: 'tile-open', dataset: { action: 'open-task', ...ids },
    'aria-label': `פתיחת המשימה ${task.title}`,
  }, h('span', { class: 'tile-title' }, task.title)),
  h('ul', { class: 'tile-subtasks', 'aria-label': 'תתי משימות' },
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
        h('span', { class: 'tile-subtask-title' }, subtask.title),
        subtask.myDay === today && h('span', { class: 'tile-myday', title: 'ב"היום שלי"' }, icon('sun', { size: 12 })),
        tileAgentMark(subtask),
        miniStatusControl(subtask, { action: 'set-subtask-status', focusKey: `tile-status-${subtask.id}`, ...ids, subtaskId: subtask.id }));
    })),
  hiddenCount > 0 && h('span', { class: 'tile-more' }, `+${hiddenCount} נוספות`),
  h('div', { class: 'tile-bottom' },
    statusBadge(task.status),
    progressIndicator(summary),
    sinceLabel(task, now),
    dustLevel > 0 && dustLabel(task, now)));
}

// An open subtask the agent works on (pulsing) or has answered: a small robot next to its title.
function tileAgentMark(subtask) {
  const jobStatus = subtask.agentJob?.status;
  if (!jobStatus || subtask.status === 'done') return null;
  return h('span', { class: 'tile-agent-mark', dataset: { jobStatus }, title: `אייג'נט: ${AGENT_JOB_VIEW[jobStatus].label}` }, icon('bot', { size: 12 }));
}

function dustLabel(task, now) {
  const idle = formatElapsed(now - task.updatedAt);
  return h('span', { class: 'dust-label', title: `אף אחד לא נגע במשימה ${idle}` }, icon('wind', { size: 13 }), idle);
}

// ---------------------------------------------------------------------------
// Task detail (dialog content)
// ---------------------------------------------------------------------------

/**
 * Renders the detail view of one task. Returns false when the task no longer exists.
 * options: today (the date for "my day" sun buttons, or null to hide them), voice (show the dictation button),
 * agents (cloud mode: { status, projects, latestBySubtask } - the agent picker and a button per subtask; null hides them).
 */
export function renderTaskDetail(container, state, taskId, now, { today = null, voice = false, agents = null } = {}) {
  const task = state.tasks.find(item => item.id === taskId);
  if (!task) return false;
  const category = state.categories.find(item => item.id === task.categoryId) ?? null;
  const color = category?.color ?? UNCATEGORIZED_COLOR;
  const summary = summarizeSubtasks(task);
  const ids = { taskId: task.id };
  const dustLevel = getDustLevel(task, now);

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
        h('span', { class: 'field-label' }, 'קטגוריה',
          h('button', { type: 'button', class: 'btn btn-link btn-inline', dataset: { action: 'open-categories' } }, 'ניהול קטגוריות')),
        h('select', { class: 'select', value: task.categoryId ?? '', dataset: { action: 'set-task-category', focusKey: `detail-category-${task.id}`, ...ids } },
          ...state.categories.map(item => h('option', { value: item.id }, item.name)),
          h('option', { value: '' }, 'ללא קטגוריה'))),
      h('div', { class: 'field' },
        h('span', { class: 'field-label' }, 'סטטוס ', h('small', {}, '(לפי תתי המשימות)')),
        h('div', { class: 'field-value' }, statusBadge(task.status), sinceLabel(task, now))),
      showsAgentField(task, agents) && agentProjectField(task, agents.projects)),
    // replaceChildren (unlike h) would print a false as text, so a missing banner is left out of the list.
    ...(dustLevel > 0 ? [dustBanner(task, dustLevel, now)] : []),
    h('label', { class: 'field' },
      h('span', { class: 'field-label' }, 'תיאור ', h('small', {}, '(אופציונלי)')),
      h('textarea', {
        rows: 3, maxlength: LIMITS.description, value: task.description,
        dataset: { action: 'edit-task-description', focusKey: `detail-description-${task.id}`, original: task.description, ...ids },
      })),
    h('section', { class: 'detail-subtasks', 'aria-label': 'תתי משימות' },
      h('h3', {}, `תתי משימות (${summary.done}/${summary.total})`),
      h('ul', { class: 'subtasks' }, ...task.subtasks.map(subtask => renderSubtask(task, subtask, now, today, agents))),
      addSubtaskRow(task.id, voice)),
    h('footer', { class: 'dialog-foot' },
      h('button', { type: 'button', class: 'btn btn-danger-soft', dataset: { action: 'delete-task', ...ids } }, icon('trash', { size: 16 }), 'מחיקת המשימה'),
      h('span', { class: 'spacer' }),
      h('button', { type: 'button', class: 'btn btn-primary', dataset: { action: 'close-dialog' } }, 'סגירה')),
  );
  return true;
}

// An open task nobody touched for weeks: still relevant (shake off the dust), or close it.
function dustBanner(task, dustLevel, now) {
  const ids = { taskId: task.id };
  return h('div', { class: 'dust-banner', role: 'note', dataset: { dust: dustLevel } },
    icon('wind'),
    h('span', { class: 'dust-banner-text' }, `אף אחד לא נגע במשימה ${formatElapsed(now - task.updatedAt)}. היא עדיין רלוונטית?`),
    h('div', { class: 'dust-actions' },
      h('button', { type: 'button', class: 'btn btn-soft btn-sm', dataset: { action: 'dust-off', ...ids } }, icon('sparkles', { size: 16 }), 'כן, לנער את האבק'),
      h('button', { type: 'button', class: 'btn btn-soft btn-sm', dataset: { action: 'complete-task', ...ids } }, icon('check', { size: 16 }), 'לסגור את כולה')));
}

// The agent picker shows once the agent tables answer, and always for a task already linked to a project.
function showsAgentField(task, agents) {
  return Boolean(agents) && (agents.status === 'ready' || Boolean(task.agentProject));
}

function agentProjectField(task, projects) {
  const isKnown = projects.some(project => project.key === task.agentProject);
  return h('label', { class: 'field' },
    h('span', { class: 'field-label' }, 'אייג\'נט ', h('small', {}, '(למשימות פיתוח)')),
    h('select', {
      class: 'select', value: task.agentProject ?? '',
      title: 'פרויקט שהראנר במחשב הפיתוח מכיר. לכל תת-משימה יופיע כפתור לשליחה לאייג\'נט.',
      dataset: { action: 'set-task-agent', focusKey: `detail-agent-${task.id}`, taskId: task.id },
    },
    h('option', { value: '' }, 'בלי - משימה רגילה'),
    ...projects.map(project => h('option', { value: project.key }, agentProjectLabel(project))),
    task.agentProject && !isKnown && h('option', { value: task.agentProject }, `${task.agentProject} (אף מחשב לא מציע אותו כרגע)`)));
}

function agentProjectLabel(project) {
  const engine = ENGINE_LABELS[project.engine];
  return [project.name, engine, project.profile, !project.online && 'לא מחובר', project.isMismatched && 'הגדרות סותרות']
    .filter(Boolean).join(' · ');
}

// Opens the agent window of a subtask; its label shows where the agent is with it.
function agentButton(task, subtask, latestJob) {
  const jobStatus = latestJob?.status ?? subtask.agentJob?.status ?? null;
  const view = jobStatus ? AGENT_JOB_VIEW[jobStatus] : null;
  return h('button', {
    type: 'button',
    class: ['btn', 'btn-soft', 'btn-sm', 'agent-btn'],
    dataset: { action: 'open-agent', focusKey: `sub-agent-${subtask.id}`, jobStatus, taskId: task.id, subtaskId: subtask.id },
    title: view ? view.hint : 'פתיחת השיחה עם האייג\'נט של הפרויקט',
  }, icon('bot', { size: 15 }), h('span', { class: 'agent-btn-label' }, view ? view.label : 'לאייג\'נט'));
}

function renderSubtask(task, subtask, now, today, agents = null) {
  const ids = { taskId: task.id, subtaskId: subtask.id };
  const isDone = subtask.status === 'done';
  const toggleLabel = isDone ? 'החזרה לביצוע' : 'סימון כהושלם';
  // A task always keeps at least one subtask; the button stays clickable to explain why (see app.js).
  const isOnlySubtask = task.subtasks.length === 1;

  const isPickedToday = today !== null && subtask.myDay === today;
  // "My day" is for open work; a done subtask keeps its sun only so it can be taken off the list.
  const showMyDayButton = today !== null && (!isDone || isPickedToday);

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
      task.agentProject && agents && agentButton(task, subtask, agents.latestBySubtask.get(subtaskKey(task.id, subtask.id))),
      sinceLabel(subtask, now),
      statusControl(subtask.status, { action: 'set-subtask-status', focusKey: `sub-status-${subtask.id}`, ...ids }),
      showMyDayButton && iconButton('sun', isPickedToday ? 'הסרה מהיום שלי' : 'הוספה להיום שלי',
        { action: 'my-day-toggle', focusKey: `sub-myday-${subtask.id}`, ...ids }, ['my-day-btn', isPickedToday && 'is-on'],
        { 'aria-pressed': String(isPickedToday) }),
      isOnlySubtask
        ? iconButton('trash', ONLY_SUBTASK_MESSAGE, { action: 'delete-subtask', ...ids }, 'is-unavailable', { 'aria-disabled': 'true' })
        : iconButton('trash', 'מחיקת תת-משימה', { action: 'delete-subtask', ...ids }, 'danger')));
}

function addSubtaskRow(taskId, voice) {
  const focusKey = `add-subtask-${taskId}`;
  return h('div', { class: 'add-subtask' },
    h('input', {
      type: 'text', class: 'add-subtask-input', maxlength: LIMITS.title,
      placeholder: 'תת-משימה חדשה...',
      'aria-label': 'הוספת תת-משימה',
      dataset: { action: 'add-subtask', focusKey, taskId },
    }),
    voice && micButton(focusKey, 'הכתבה קולית של תת-משימה'),
    h('button', { type: 'button', class: 'btn btn-soft btn-sm', dataset: { action: 'add-subtask-button', taskId } },
      icon('plus', { size: 16 }), 'הוספה'));
}

/** Dictation button for a text field; voiceKey is the field's id or data-focus-key (app.js finds it by either). */
export function micButton(voiceKey, label) {
  return h('button', {
    type: 'button', class: 'icon-btn mic-btn', dataset: { action: 'dictate', voiceKey },
    title: label, 'aria-label': label, 'aria-pressed': 'false',
  }, icon('mic'));
}

// ---------------------------------------------------------------------------
// "What now?" dialog content
// ---------------------------------------------------------------------------

/**
 * view: { phase: 'empty' } | { phase: 'spinning', text } | { phase: 'result', task, subtask, category, isPickedToday, showMyDay }.
 * While spinning, app.js only swaps the text of .next-reel-text.
 */
export function renderNextPick(container, view) {
  const head = h('header', { class: 'dialog-head' },
    h('h2', { id: 'next-dialog-title' }, 'מה עכשיו?'),
    h('button', { type: 'button', class: 'icon-btn', dataset: { action: 'close-dialog' }, 'aria-label': 'סגירה' }, icon('x')));

  if (view.phase === 'empty') {
    container.replaceChildren(head,
      h('p', { class: 'next-empty' }, 'אין כרגע תתי משימות פתוחות (לביצוע או בעבודה אצלי) במשימות שמוצגות. אולי כדאי לנקות את הסינון?'),
      h('footer', { class: 'dialog-foot' }, h('span', { class: 'spacer' }),
        h('button', { type: 'button', class: 'btn btn-primary', dataset: { action: 'close-dialog' } }, 'סגירה')));
    return;
  }
  if (view.phase === 'spinning') {
    container.replaceChildren(head, h('div', { class: 'next-reel is-spinning' },
      h('span', { class: 'next-dice', 'aria-hidden': 'true' }, icon('dice', { size: 30 })),
      h('span', { class: 'next-reel-text' }, view.text)));
    return;
  }

  const { task, subtask, category, isPickedToday, showMyDay } = view;
  const ids = { taskId: task.id, subtaskId: subtask.id };
  const color = category?.color ?? UNCATEGORIZED_COLOR;
  const isInProgress = subtask.status === 'in_progress';
  container.replaceChildren(head,
    h('div', { class: 'next-result', role: 'status', cssVars: { '--cat-color': color } },
      h('span', { class: 'next-dice is-landed', 'aria-hidden': 'true' }, icon('dice', { size: 30 })),
      h('span', { class: 'next-kicker' }, 'הגורל בחר:'),
      h('strong', { class: 'next-subtask' }, subtask.title),
      subtask.title !== task.title && h('span', { class: 'next-task' }, `מתוך: ${task.title}`),
      h('span', { class: 'next-meta' },
        h('span', { class: 'cat-chip', cssVars: { '--chip-color': color } }, h('span', { class: 'dot', 'aria-hidden': 'true' }), category?.name ?? 'ללא קטגוריה'),
        statusBadge(subtask.status))),
    h('div', { class: 'next-actions' },
      h('button', { type: 'button', class: 'btn btn-primary', dataset: { action: 'next-start', ...ids } },
        icon('play', { size: 16 }), isInProgress ? 'ממשיכים!' : 'יאללה, מתחילים'),
      showMyDay && h('button', {
        type: 'button', class: ['btn', 'btn-soft', isPickedToday && 'is-on'], dataset: { action: 'next-my-day', ...ids }, 'aria-pressed': String(isPickedToday),
      }, icon('sun', { size: 16 }), isPickedToday ? 'ב"היום שלי"' : 'להיום שלי'),
      h('button', { type: 'button', class: 'btn btn-soft', dataset: { action: 'next-again' } }, icon('refresh', { size: 16 }), 'עוד סיבוב'),
      h('button', { type: 'button', class: 'btn btn-link', dataset: { action: 'next-open', taskId: task.id } }, 'פתיחת המשימה')));
}

// ---------------------------------------------------------------------------
// Seasonal theme: the badge in the top bar, and the options in the settings
// ---------------------------------------------------------------------------

export function renderSeasonBadge(element, seasonKey) {
  const season = seasonKey ? SEASONS[seasonKey] : null;
  element.hidden = !season;
  if (!season) {
    element.replaceChildren();
    return;
  }
  element.title = season.greeting;
  element.replaceChildren(createSeasonEmblem(seasonKey, { size: 24 }), h('span', { class: 'season-greeting' }, season.greeting));
}

export function fillSeasonSelect(select) {
  select.replaceChildren(
    h('option', { value: 'auto' }, 'אוטומטית לפי הלוח העברי'),
    h('option', { value: 'off' }, 'כבויה'),
    h('optgroup', { label: 'תצוגה מקדימה' }, ...SEASON_KEYS.map(key => h('option', { value: key }, SEASONS[key].label))));
}

// ---------------------------------------------------------------------------
// Agent window (one subtask's conversation with its agent) and the machines list in the settings
// ---------------------------------------------------------------------------

/**
 * Fills the re-rendered parts of the agent window; the message box below them is static (index.html),
 * so an update from the agent never wipes text being typed.
 * view: { task, subtask, project (a listAgentProjects entry or null), jobs (oldest first), now, hubStatus,
 *         onlineRunnerIds (Set of connected machines) }
 */
export function renderAgentPanel(contextElement, threadElement, { task, subtask, project, jobs, now, hubStatus, onlineRunnerIds }) {
  contextElement.replaceChildren(
    h('p', { class: 'agent-subject' },
      h('strong', {}, subtask.title),
      subtask.title !== task.title && h('span', { class: 'muted' }, ` · ${task.title}`)),
    agentProjectLine(task, project, hubStatus));
  threadElement.replaceChildren(...(jobs.length === 0
    ? [h('li', { class: 'agent-empty muted small' }, 'עוד לא נשלח כלום לאייג\'נט על תת-המשימה הזו.')]
    : jobs.map(job => agentTurn(job, now, onlineRunnerIds.has(job.runnerId)))));
}

function agentProjectLine(task, project, hubStatus) {
  if (hubStatus === 'unavailable') return agentNote('טבלאות האייג\'נטים עוד לא קיימות בענן. צריך להריץ פעם אחת את supabase/schema.sql המעודכן.');
  if (hubStatus === 'loading') return agentNote('טוען את רשימת המחשבים...', 'is-quiet');
  if (hubStatus === 'error') return agentNote('אין כרגע חיבור לרשימת המחשבים. ננסה שוב בעוד דקה.');
  if (!task.agentProject) return agentNote('המשימה לא משויכת לפרויקט אייג\'נט. בוחרים פרויקט בחלון המשימה.');
  if (!project) return agentNote(`אף מחשב לא מציע כרגע את הפרויקט "${task.agentProject}". אולי הוא הוסר מההגדרות של הראנר.`);
  if (project.isMismatched) {
    return agentNote(`הפרויקט "${project.key}" מוגדר במחשבים שונים עם מנוע או פרופיל שונה. לא נשלח אליו כלום עד שההגדרות של הראנרים יתאימו.`);
  }
  const machines = project.runners.map(runner => `${runner.name}${runner.online ? '' : ' (לא מחובר)'}`).join(', ');
  return h('p', { class: 'agent-project small' },
    h('span', { class: ['online-dot', project.online && 'is-online'], 'aria-hidden': 'true' }),
    h('span', {}, [project.name, ENGINE_LABELS[project.engine], project.profile, machines].filter(Boolean).join(' · ')));
}

function agentNote(text, variant = 'is-warning') {
  return h('p', { class: ['agent-note', 'small', variant] }, text);
}

/** One message and its answer. isRunnerConnected: whether the job's machine is connected (else a running job can be closed). */
function agentTurn(job, now, isRunnerConnected) {
  const isActive = isJobActive(job.status);
  const canClose = job.status === 'running' && !isRunnerConnected;
  const folderLink = vscodeFolderLink(job.worktreePath);
  const hasMeta = Boolean(job.branch) || job.changedFiles !== null || Boolean(folderLink);
  return h('li', { class: 'agent-turn', dataset: { jobStatus: job.status } },
    h('div', { class: 'agent-msg is-me' },
      h('span', { class: 'agent-msg-who' }, 'אני', h('span', { class: 'muted' }, ` · לפני ${formatElapsed(now - job.createdAt)}`)),
      h('p', { class: 'agent-msg-text' }, job.prompt)),
    h('div', { class: 'agent-msg is-agent' },
      h('span', { class: 'agent-msg-who' },
        icon('bot', { size: 14 }), 'האייג\'נט',
        h('span', { class: 'agent-state', dataset: { jobStatus: job.status }, title: AGENT_JOB_VIEW[job.status].hint },
          isActive && h('span', { class: 'agent-spinner', 'aria-hidden': 'true' }), AGENT_JOB_VIEW[job.status].label)),
      isActive && h('p', { class: 'muted small' }, canClose
        ? 'המחשב שמריץ את זה לא מחובר כרגע. אם הוא לא יחזור, אפשר לסגור את הריצה כאן.'
        : activeJobText(job, now)),
      job.summary && h('p', { class: 'agent-msg-text' }, job.summary),
      job.error && h('p', { class: 'agent-msg-error' }, job.error),
      hasMeta && h('div', { class: 'agent-meta' },
        job.branch && h('span', { class: 'agent-meta-item', title: 'הענף שהאייג\'נט עובד בו' },
          icon('git-branch', { size: 14 }), h('code', { dir: 'ltr' }, job.branch)),
        job.changedFiles !== null && h('span', { class: 'agent-meta-item' },
          icon('file', { size: 14 }), job.changedFiles === 1 ? 'קובץ אחד השתנה' : `${job.changedFiles} קבצים השתנו`),
        folderLink && h('a', { class: 'btn btn-soft btn-sm', href: folderLink, title: `פתיחת תיקיית העבודה ב-VS Code: ${job.worktreePath}` },
          icon('code', { size: 14 }), 'פתיחה ב-VS Code')),
      isActive && (!job.cancelRequested || canClose) && h('button', {
        type: 'button', class: 'btn btn-link agent-cancel',
        dataset: { action: 'agent-cancel', jobId: job.id, close: canClose ? 'true' : null, focusKey: `agent-cancel-${job.id}` },
      }, icon('stop', { size: 14 }), cancelLabel(job, canClose))));
}

function cancelLabel(job, canClose) {
  if (job.status === 'queued') return 'ביטול השליחה';
  return canClose ? 'סגירת הריצה' : 'לעצור את האייג\'נט';
}

function activeJobText(job, now) {
  if (job.cancelRequested) return 'ביקשנו מהאייג\'נט לעצור...';
  if (job.status === 'queued') return 'ממתין שהמחשב יתחיל לעבוד עליו...';
  return `עובד כבר ${formatElapsed(now - (job.startedAt ?? job.createdAt))}`;
}

/** Settings: the machines that run the runner, whether each is connected, and the projects it offers. */
export function renderAgentRunners(container, { status, runners, now }) {
  if (status === 'unavailable') {
    container.replaceChildren(agentNote('כדי להשתמש באייג\'נטים צריך להריץ פעם אחת את הקובץ supabase/schema.sql המעודכן ב-Supabase (SQL Editor).'));
    return;
  }
  if (status === 'loading' || (status === 'error' && runners.length === 0)) {
    container.replaceChildren(h('p', { class: 'muted small' }, status === 'loading' ? 'טוען...' : 'אין כרגע חיבור לרשימת המחשבים. ננסה שוב בעוד דקה.'));
    return;
  }
  if (runners.length === 0) {
    container.replaceChildren(h('p', { class: 'muted small' },
      'עוד לא חובר אף מחשב. במחשב הפיתוח מריצים את הראנר (npm run runner) - ההוראות במדריך ההתקנה (html/agent-farm-setup-guide.html).'));
    return;
  }
  container.replaceChildren(h('ul', { class: 'runners-list' }, ...runners.map(runner => {
    const isOnline = isRunnerOnline(runner, now);
    return h('li', { class: 'runner-row' },
      h('div', { class: 'runner-head' },
        h('span', { class: ['online-dot', isOnline && 'is-online'], 'aria-hidden': 'true' }),
        h('strong', {}, runner.name),
        h('span', { class: 'muted small' }, isOnline ? 'מחובר' : `נראה לאחרונה לפני ${formatElapsed(now - runner.lastSeenAt)}`)),
      runner.projects.length === 0
        ? h('p', { class: 'muted small' }, 'אין פרויקטים בהגדרות של הראנר.')
        : h('ul', { class: 'runner-projects small' }, ...runner.projects.map(project =>
          h('li', {}, [project.name, ENGINE_LABELS[project.engine], project.profile].filter(Boolean).join(' · ')))));
  })));
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

function statusOptions() {
  return STATUS_ORDER.map(key => h('option', { value: key, title: STATUSES[key].hint }, STATUSES[key].label));
}

function statusControl(status, dataset) {
  return h('span', { class: 'status-chip', dataset: { status } },
    h('span', { class: 'dot', 'aria-hidden': 'true' }),
    h('select', {
      class: 'status-select', value: status, 'aria-label': 'סטטוס', title: STATUSES[status].hint, dataset,
    }, ...statusOptions()));
}

// A subtask's status on a tile: a small colored button (dot + arrow). The native select is stretched
// over it, invisible, so a click opens the status list (a picker sheet on phones).
function miniStatusControl(subtask, dataset) {
  const { label } = STATUSES[subtask.status];
  return h('span', { class: 'status-mini no-drag', dataset: { status: subtask.status } },
    h('span', { class: 'dot', 'aria-hidden': 'true' }),
    icon('chevron-down', { size: 11 }),
    h('select', {
      class: 'status-mini-select', value: subtask.status, dataset,
      title: `${label} - לחיצה לשינוי הסטטוס`,
      'aria-label': `הסטטוס של ${subtask.title}: ${label}`,
    }, ...statusOptions()));
}

// A task's status pill: read-only, because it is derived from the subtasks.
function statusBadge(status) {
  return h('span', {
    class: 'status-chip is-readonly', dataset: { status },
    title: `${STATUSES[status].hint} - נקבע לפי תתי המשימות`,
  },
  h('span', { class: 'dot', 'aria-hidden': 'true' }),
  h('span', { class: 'status-label' }, STATUSES[status].label));
}

// How long an item has been in its current in-progress status (working on it, or waiting for a reply).
function sinceLabel(item, now) {
  const prefix = STATUSES[item.status].since;
  if (!prefix) return null;
  const elapsed = formatElapsed(now - item.statusChangedAt);
  return h('span', { class: 'since', title: `${prefix} ${elapsed}` },
    icon(item.status === 'waiting' ? 'hourglass' : 'clock', { size: 13 }), elapsed);
}

function progressIndicator({ total, done }) {
  const percent = Math.round((done / total) * 100);
  return h('span', { class: 'progress', title: `${done} מתוך ${total} תתי משימות הושלמו` },
    h('span', { class: 'progress-bar', 'aria-hidden': 'true' },
      h('span', { class: 'progress-fill', cssVars: { '--pct': `${percent}%` } })),
    h('span', { dir: 'ltr' }, `${done}/${total}`));
}

// variant: a class name, or a list of them.
function iconButton(iconName, label, dataset, variant = null, extraAttributes = {}) {
  return h('button', { type: 'button', class: ['icon-btn', ...[variant].flat()], dataset, title: label, 'aria-label': label, ...extraAttributes }, icon(iconName));
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

/**
 * Category rows: color button, editable name, task count, delete.
 * The row whose id is paletteCategoryId shows its color palette (swatches + a custom color picker).
 */
export function renderCategoriesList(container, state, paletteCategoryId = null) {
  const usage = new Map();
  for (const task of state.tasks) usage.set(task.categoryId, (usage.get(task.categoryId) ?? 0) + 1);

  if (state.categories.length === 0) {
    container.replaceChildren(h('li', { class: 'muted small' }, 'אין קטגוריות. אפשר להוסיף למטה.'));
    return;
  }
  container.replaceChildren(...state.categories.map(category => {
    const ids = { categoryId: category.id };
    const isPaletteOpen = category.id === paletteCategoryId;
    return h('li', { class: ['category-row', isPaletteOpen && 'is-palette-open'] },
      h('div', { class: 'category-main' },
        h('button', {
          type: 'button', class: 'swatch color-btn', cssVars: { '--swatch': category.color },
          title: 'שינוי צבע', 'aria-label': `שינוי הצבע של ${category.name}`, 'aria-expanded': String(isPaletteOpen),
          dataset: { action: 'toggle-category-palette', focusKey: `cat-color-${category.id}`, ...ids },
        }),
        h('input', {
          type: 'text', class: 'inline-edit category-name', value: category.name, maxlength: LIMITS.categoryName,
          'aria-label': 'שם הקטגוריה', title: 'לחיצה לשינוי השם',
          dataset: { action: 'category-name', focusKey: `cat-name-${category.id}`, original: category.name, ...ids },
        }),
        h('span', { class: 'muted small category-usage' }, `${usage.get(category.id) ?? 0} משימות`),
        iconButton('trash', `מחיקת הקטגוריה ${category.name}`, { action: 'delete-category', ...ids }, 'danger')),
      isPaletteOpen && h('div', { class: 'category-palette', role: 'group', 'aria-label': `צבעים לקטגוריה ${category.name}` },
        ...swatchButtons(category.color, color => ({
          action: 'set-category-color', color, focusKey: `cat-swatch-${category.id}-${color}`, ...ids,
        })),
        h('label', { class: 'custom-color' },
          h('input', {
            type: 'color', class: 'color-input', value: category.color,
            'aria-label': `צבע אחר לקטגוריה ${category.name}`,
            dataset: { action: 'category-color', focusKey: `cat-custom-color-${category.id}`, ...ids },
          }),
          'צבע אחר')));
  }));
}

export function renderSwatches(container, selectedColor) {
  container.replaceChildren(...swatchButtons(selectedColor, color => ({ action: 'pick-swatch', color })));
}

function swatchButtons(selectedColor, datasetFor) {
  const selected = selectedColor.toLowerCase();
  return CATEGORY_SWATCHES.map(color => h('button', {
    type: 'button',
    class: ['swatch', color === selected && 'is-selected'],
    cssVars: { '--swatch': color },
    dataset: datasetFor(color),
    'aria-label': `בחירת צבע ${color}`,
    'aria-pressed': String(color === selected),
  }));
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
  select.replaceChildren(...statusOptions());
  select.value = status;
}
