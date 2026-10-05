// Read-only derivations of the state: filtering, sorting and dashboard counts.
// Pure functions (no DOM), covered by tests/selectors.test.js.

import { STATUSES } from './statuses.js';
import { DAY_MS } from './utils.js';

// Category filter value for tasks without a category.
export const NO_CATEGORY = '__none__';

const BACKUP_REMINDER_DAYS = 7;
const BACKUP_REMINDER_MIN_ITEMS = 5;

function itemsOf(task) {
  return [task, ...task.subtasks];
}

/** A task ranks by its most active item (in progress before to-do). A closed task sinks regardless of its subtasks. */
export function getTaskRank(task) {
  if (task.status === 'done') return STATUSES.done.rank;
  return Math.min(...itemsOf(task).map(item => STATUSES[item.status].rank));
}

export function summarizeSubtasks(task) {
  return {
    total: task.subtasks.length,
    done: task.subtasks.filter(subtask => subtask.status === 'done').length,
  };
}

/**
 * Work items per status. A task without subtasks counts itself; a task with subtasks counts its
 * subtasks (the parent is just a container). Closing a task closes its subtasks too.
 */
export function getDashboardCounts(state) {
  const counts = { todo: 0, in_progress: 0, done: 0 };
  for (const task of state.tasks) {
    const workItems = task.subtasks.length > 0 ? task.subtasks : [task];
    for (const item of workItems) counts[task.status === 'done' ? 'done' : item.status] += 1;
  }
  return counts;
}

function matchesStatusFilter(task, statusFilter) {
  return statusFilter === 'all' || itemsOf(task).some(item => item.status === statusFilter);
}

function matchesSearch(task, query, categoryName) {
  const searchable = [task.title, task.description, categoryName, ...task.subtasks.map(subtask => subtask.title)];
  return searchable.join('\n').toLocaleLowerCase().includes(query);
}

const byCreatedDesc = (a, b) => b.task.createdAt - a.task.createdAt;
const SORT_COMPARATORS = {
  manual: () => 0, // keep the drag-and-drop order (Array.prototype.sort is stable)
  status: (a, b) => a.rank - b.rank || byCreatedDesc(a, b),
  updated: (a, b) => b.task.updatedAt - a.task.updatedAt,
  created: byCreatedDesc,
  category: (a, b) => a.categoryOrder - b.categoryOrder || a.rank - b.rank || byCreatedDesc(a, b),
};

export function selectVisibleTasks(state, filters) {
  const query = (filters.search ?? '').trim().toLocaleLowerCase();
  const selectedCategories = new Set(filters.categoryIds ?? []);
  const statusFilter = filters.status ?? 'all';
  const showDone = filters.showDone === true || statusFilter === 'done';
  const categoryOrder = new Map(state.categories.map((category, index) => [category.id, index]));
  const categoryNames = new Map(state.categories.map(category => [category.id, category.name]));

  const visible = state.tasks.filter(task =>
    (showDone || task.status !== 'done')
    && (selectedCategories.size === 0 || selectedCategories.has(task.categoryId ?? NO_CATEGORY))
    && matchesStatusFilter(task, statusFilter)
    && (!query || matchesSearch(task, query, categoryNames.get(task.categoryId) ?? '')));

  return visible
    .map(task => ({
      task,
      rank: getTaskRank(task),
      categoryOrder: categoryOrder.get(task.categoryId) ?? Number.MAX_SAFE_INTEGER,
    }))
    .sort(SORT_COMPARATORS[filters.sort] ?? SORT_COMPARATORS.manual)
    .map(entry => entry.task);
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
