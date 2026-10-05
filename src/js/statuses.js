// Status catalogue shared by general tasks and subtasks.
// rank drives the "urgent first" sort (lower = needs me sooner).
// Time-based escalations (Claude check overdue, email follow-up) are computed in selectors.js.

export const STATUSES = Object.freeze({
  todo: { key: 'todo', label: 'לביצוע', hint: 'פתוח, עוד לא התחלתי', rank: 4 },
  in_progress: { key: 'in_progress', label: 'בעבודה', hint: 'בטיפול פעיל כרגע', rank: 3 },
  claude_running: { key: 'claude_running', label: 'קלוד רץ', hint: 'תהליך רץ ברקע - לבדוק עוד מעט', rank: 2 },
  email_received: { key: 'email_received', label: 'התקבל מייל', hint: 'הגיעה תשובה - מחכה לטיפולי', rank: 0 },
  waiting_email: { key: 'waiting_email', label: 'ממתין למייל', hint: 'מחכה לתשובה ממישהו - לא בטיפולי כרגע', rank: 6 },
  done: { key: 'done', label: 'הושלם', hint: 'סגור', rank: 9 },
});

// Order shown in every status dropdown.
export const STATUS_ORDER = Object.freeze(['todo', 'in_progress', 'claude_running', 'waiting_email', 'email_received', 'done']);

export const DEFAULT_STATUS = 'todo';

// Statuses that involve another person, so a contact field is relevant.
export const CONTACT_STATUSES = new Set(['waiting_email', 'email_received']);

// Statuses with a timer that can be reset ("checked Claude" / "sent a reminder").
export const TIMED_STATUSES = new Set(['claude_running', 'waiting_email']);

export function isValidStatus(status) {
  return typeof status === 'string' && Object.hasOwn(STATUSES, status);
}
