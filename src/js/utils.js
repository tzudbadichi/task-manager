// Pure helpers shared by the store, selectors and UI.
// No DOM access here, so the unit tests can import this module in Node.

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Trims and length-limits user text.
 * Single-line text also collapses inner whitespace (tabs, pasted newlines) into single spaces.
 */
export function cleanText(value, maxLength, { multiline = false } = {}) {
  if (typeof value !== 'string') return '';
  const normalized = multiline ? value.replace(/\r\n?/g, '\n') : value.replace(/\s+/g, ' ');
  return normalized.trim().slice(0, maxLength);
}

export function isHexColor(value) {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value);
}

export function toTimestamp(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Short Hebrew duration, e.g. "12 דק'", "שעתיים", "3 ימים". */
export function formatElapsed(elapsedMs) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < MINUTE_MS) return 'פחות מדקה';
  if (elapsedMs < HOUR_MS) {
    const minutes = Math.floor(elapsedMs / MINUTE_MS);
    return minutes === 1 ? 'דקה' : `${minutes} דק'`;
  }
  if (elapsedMs < DAY_MS) {
    const hours = Math.floor(elapsedMs / HOUR_MS);
    if (hours === 1) return 'שעה';
    return hours === 2 ? 'שעתיים' : `${hours} שעות`;
  }
  const days = Math.floor(elapsedMs / DAY_MS);
  if (days === 1) return 'יום';
  return days === 2 ? 'יומיים' : `${days} ימים`;
}

/** Local date as YYYY-MM-DD (used in backup file names). */
export function dateStamp(date) {
  const pad = number => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
