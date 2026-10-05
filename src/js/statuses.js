// Status catalogue shared by general tasks and subtasks.
// "In progress" has two variants: waiting for my action (in_progress) or for someone else's reply (waiting).
// rank drives the "by status" sort: in progress first, then waiting, then to-do, then done.
// since (when set) is the prefix of the "how long in this status" label on tiles and subtasks.

export const STATUSES = Object.freeze({
  todo: { key: 'todo', label: 'לביצוע', hint: 'פתוח, עוד לא התחלתי', rank: 2, since: null },
  in_progress: { key: 'in_progress', label: 'בעבודה אצלי', hint: 'מחכה לפעולה שלי', rank: 0, since: 'בעבודה כבר' },
  waiting: { key: 'waiting', label: 'ממתין לתגובה', hint: 'מחכה לתגובה ממישהו אחר', rank: 1, since: 'ממתין כבר' },
  done: { key: 'done', label: 'הושלם', hint: 'סגור', rank: 3, since: null },
});

// Order shown in every status dropdown and on the dashboard.
export const STATUS_ORDER = Object.freeze(['todo', 'in_progress', 'waiting', 'done']);

export const DEFAULT_STATUS = 'todo';

// Statuses from the app's first version, mapped when older saved data or backups are loaded.
export const LEGACY_STATUS_MAP = Object.freeze({
  claude_running: 'in_progress',
  waiting_email: 'waiting',
  email_received: 'todo',
});

export function isValidStatus(status) {
  return typeof status === 'string' && Object.hasOwn(STATUSES, status);
}
