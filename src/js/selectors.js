// Read-only derivations of the state: attention levels, filtering, sorting and dashboard counts.
// Pure functions (no DOM), covered by tests/selectors.test.js.

import { STATUSES } from './statuses.js';
import { DAY_MS, MINUTE_MS } from './utils.js';

// Category filter value for tasks without a category.
export const NO_CATEGORY = '__none__';

const BACKUP_REMINDER_DAYS = 7;
const BACKUP_REMINDER_MIN_ITEMS = 5;

// What an item asks of me right now. status is used for coloring the badge.
export const ATTENTION = Object.freeze({
  action: Object.freeze({ level: 'action', rank: 0, label: 'לטיפולי', status: 'email_received' }),
  check: Object.freeze({ level: 'check', rank: 1, label: 'לבדוק עכשיו', status: 'claude_running' }),
  running: Object.freeze({ level: 'running', rank: 2, label: 'רץ ברקע', status: 'claude_running' }),
  followup: Object.freeze({ level: 'followup', rank: 5, label: 'כדאי לתזכר', status: 'waiting_email' }),
});

/** Start of the current timer: the last "checked" click, otherwise when the status was set. */
export function timerStart(item) {
  return item.lastCheckedAt ?? item.statusChangedAt ?? item.createdAt;
}

export function getAttention(item, settings, now) {
  switch (item.status) {
    case 'email_received':
      return ATTENTION.action;
    case 'claude_running':
      return now - timerStart(item) >= settings.claudeCheckMinutes * MINUTE_MS ? ATTENTION.check : ATTENTION.running;
    case 'waiting_email':
      return now - timerStart(item) >= settings.waitingFollowUpDays * DAY_MS ? ATTENTION.followup : null;
    default:
      return null;
  }
}

function getItemRank(item, settings, now) {
  return getAttention(item, settings, now)?.rank ?? STATUSES[item.status]?.rank ?? STATUSES.done.rank;
}

function itemsOf(task) {
  return [task, ...task.subtasks];
}

/** A task is as urgent as its most urgent open item. A closed task sinks regardless of its subtasks. */
export function getTaskRank(task, settings, now) {
  if (task.status === 'done') return STATUSES.done.rank;
  return Math.min(...itemsOf(task).map(item => getItemRank(item, settings, now)));
}

export function summarizeSubtasks(task) {
  return {
    total: task.subtasks.length,
    done: task.subtasks.filter(subtask => subtask.status === 'done').length,
  };
}

/** Attention counts across a task's subtasks (shown as badges on the card, also when collapsed). */
export function countSubtaskAttention(task, settings, now) {
  const counts = { action: 0, check: 0, running: 0, followup: 0 };
  for (const subtask of task.subtasks) {
    const attention = getAttention(subtask, settings, now);
    if (attention) counts[attention.level] += 1;
  }
  return counts;
}

export function getDashboardCounts(state, now) {
  const counts = {
    emailReceived: 0, claudeRunning: 0, claudeOverdue: 0,
    waitingEmail: 0, waitingFollowUp: 0, inProgress: 0, todo: 0, open: 0,
  };
  for (const task of state.tasks) {
    if (task.status === 'done') continue; // a closed task closes its subtasks too
    for (const item of itemsOf(task)) {
      // A parent with subtasks that is plain "todo / in progress" is just a container - count its subtasks instead.
      const isPlainContainer = item === task && task.subtasks.length > 0
        && (task.status === 'todo' || task.status === 'in_progress');
      if (isPlainContainer) continue;
      const attention = getAttention(item, state.settings, now);
      switch (item.status) {
        case 'email_received': counts.emailReceived += 1; break;
        case 'claude_running':
          counts.claudeRunning += 1;
          if (attention === ATTENTION.check) counts.claudeOverdue += 1;
          break;
        case 'waiting_email':
          counts.waitingEmail += 1;
          if (attention === ATTENTION.followup) counts.waitingFollowUp += 1;
          break;
        case 'in_progress': counts.inProgress += 1; break;
        case 'todo': counts.todo += 1; break;
        default: break;
      }
    }
  }
  counts.open = counts.inProgress + counts.todo;
  return counts;
}

/** Items that need me now (shown in the browser tab title). */
export function countAttentionItems(state, now) {
  const counts = getDashboardCounts(state, now);
  return counts.emailReceived + counts.claudeOverdue;
}

function matchesStatusFilter(task, statusFilter, settings, now) {
  if (statusFilter === 'all') return true;
  const items = itemsOf(task);
  if (statusFilter === 'attention') {
    return items.some(item => {
      const attention = getAttention(item, settings, now);
      return attention === ATTENTION.action || attention === ATTENTION.check;
    });
  }
  if (statusFilter === 'open') return items.some(item => item.status === 'todo' || item.status === 'in_progress');
  return items.some(item => item.status === statusFilter);
}

function matchesSearch(task, query, categoryName) {
  const searchable = [
    task.title, task.description, task.contact, categoryName,
    ...task.subtasks.flatMap(subtask => [subtask.title, subtask.contact]),
  ];
  return searchable.join('\n').toLocaleLowerCase().includes(query);
}

const byCreatedDesc = (a, b) => b.task.createdAt - a.task.createdAt;
const SORT_COMPARATORS = {
  attention: (a, b) => a.rank - b.rank || byCreatedDesc(a, b),
  updated: (a, b) => b.task.updatedAt - a.task.updatedAt,
  created: byCreatedDesc,
  category: (a, b) => a.categoryOrder - b.categoryOrder || a.rank - b.rank || byCreatedDesc(a, b),
};

export function selectVisibleTasks(state, filters, now) {
  const { settings } = state;
  const query = (filters.search ?? '').trim().toLocaleLowerCase();
  const selectedCategories = new Set(filters.categoryIds ?? []);
  const statusFilter = filters.status ?? 'all';
  const showDone = filters.showDone === true || statusFilter === 'done';
  const categoryOrder = new Map(state.categories.map((category, index) => [category.id, index]));
  const categoryNames = new Map(state.categories.map(category => [category.id, category.name]));

  const visible = state.tasks.filter(task =>
    (showDone || task.status !== 'done')
    && (selectedCategories.size === 0 || selectedCategories.has(task.categoryId ?? NO_CATEGORY))
    && matchesStatusFilter(task, statusFilter, settings, now)
    && (!query || matchesSearch(task, query, categoryNames.get(task.categoryId) ?? '')));

  return visible
    .map(task => ({
      task,
      rank: getTaskRank(task, settings, now),
      categoryOrder: categoryOrder.get(task.categoryId) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort(SORT_COMPARATORS[filters.sort] ?? SORT_COMPARATORS.attention)
    .map(entry => entry.task);
}

/** Claude items whose check time has passed. key changes after every "checked" click, so each cycle notifies once. */
export function listOverdueClaudeItems(state, now) {
  const overdue = [];
  for (const task of state.tasks) {
    if (task.status === 'done') continue;
    if (getAttention(task, state.settings, now) === ATTENTION.check) {
      overdue.push({ key: `${task.id}@${timerStart(task)}`, title: task.title, context: '' });
    }
    for (const subtask of task.subtasks) {
      if (getAttention(subtask, state.settings, now) === ATTENTION.check) {
        overdue.push({ key: `${subtask.id}@${timerStart(subtask)}`, title: subtask.title, context: task.title });
      }
    }
  }
  return overdue;
}

/**
 * Data lives only in this browser, so nudge for a backup:
 * never exported and there is real content, or the last export is old and things changed since.
 */
export function getBackupReminder(state, now) {
  const { lastExportAt } = state.settings;
  const itemCount = state.tasks.reduce((sum, task) => sum + 1 + task.subtasks.length, 0);
  if (itemCount === 0) return null;
  if (lastExportAt === null) return itemCount >= BACKUP_REMINDER_MIN_ITEMS ? { lastExportAt: null } : null;
  const changedSinceExport = state.tasks.some(task => task.updatedAt > lastExportAt);
  return changedSinceExport && now - lastExportAt >= BACKUP_REMINDER_DAYS * DAY_MS ? { lastExportAt } : null;
}
