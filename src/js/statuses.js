// Status catalogue. Only subtasks have a status of their own; a task's status is derived from
// its subtasks (deriveTaskStatus below).
// "In progress" has two variants: waiting for my action (in_progress) or for someone else's reply (waiting).
// rank drives the "by status" sort: to-do first, then in progress, then waiting, then done.
// since (when set) is the prefix of the "how long in this status" label on tiles and subtasks.

export const STATUSES = Object.freeze({
  todo: { key: 'todo', label: 'לביצוע', hint: 'פתוח, עוד לא התחלתי', rank: 0, since: null },
  in_progress: { key: 'in_progress', label: 'בעבודה אצלי', hint: 'מחכה לפעולה שלי', rank: 1, since: 'בעבודה כבר' },
  waiting: { key: 'waiting', label: 'ממתין לתגובה', hint: 'מחכה לתגובה ממישהו אחר', rank: 2, since: 'ממתין כבר' },
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

// Which subtask status decides the task's status, strongest first. When no subtask is in any
// of these, every subtask is done and so is the task. (Also picks the subtask a task is "busy with".)
export const STATUS_PRECEDENCE = Object.freeze(['in_progress', 'waiting', 'todo']);

export function isValidStatus(status) {
  return typeof status === 'string' && Object.hasOwn(STATUSES, status);
}

/**
 * A task's status: in progress if any subtask is in progress; otherwise waiting if any is waiting;
 * otherwise to-do if any is to-do; done only when all of them are done.
 */
export function deriveTaskStatus(subtasks) {
  if (subtasks.length === 0) return DEFAULT_STATUS;
  return STATUS_PRECEDENCE.find(status => subtasks.some(subtask => subtask.status === status)) ?? 'done';
}
