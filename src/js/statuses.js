// Status catalogue shared by general tasks and subtasks.
// rank drives the "by status" sort: in progress first, then to-do, then done.

export const STATUSES = Object.freeze({
  todo: { key: 'todo', label: 'לביצוע', hint: 'פתוח, עוד לא התחלתי', rank: 1 },
  in_progress: { key: 'in_progress', label: 'בעבודה', hint: 'בטיפול כרגע', rank: 0 },
  done: { key: 'done', label: 'הושלם', hint: 'סגור', rank: 2 },
});

// Order shown in every status dropdown and on the dashboard.
export const STATUS_ORDER = Object.freeze(['todo', 'in_progress', 'done']);

export const DEFAULT_STATUS = 'todo';

// Statuses from the app's first version, mapped when older saved data or backups are loaded.
export const LEGACY_STATUS_MAP = Object.freeze({
  claude_running: 'in_progress',
  waiting_email: 'in_progress',
  email_received: 'todo',
});

export function isValidStatus(status) {
  return typeof status === 'string' && Object.hasOwn(STATUSES, status);
}
