// "Status report in one click": a plain-text summary of the work, ready to paste into WhatsApp,
// email or Teams. Pure (no DOM), covered by tests/report.test.js.

import { NO_CATEGORY } from './selectors.js';
import { DAY_MS, formatElapsed } from './utils.js';

export const REPORT_PERIODS = Object.freeze({
  today: { label: 'היום', doneHeading: 'הושלם היום' },
  week: { label: '7 הימים האחרונים', doneHeading: 'הושלם ב-7 הימים האחרונים', days: 7 },
  month: { label: '30 הימים האחרונים', doneHeading: 'הושלם ב-30 הימים האחרונים', days: 30 },
});

const SECTION_HEADINGS = Object.freeze({
  in_progress: 'בעבודה אצלי',
  waiting: 'ממתין לתגובה',
  todo: 'לביצוע',
});

export const EMPTY_REPORT_TEXT = 'אין מה לדווח לתקופה הזו.';

/** When the "done" section starts: local midnight for "today", otherwise N days back. */
export function reportPeriodStart(period, now) {
  const definition = REPORT_PERIODS[period] ?? REPORT_PERIODS.week;
  if (!definition.days) {
    const midnight = new Date(now);
    midnight.setHours(0, 0, 0, 0);
    return midnight.getTime();
  }
  return now - definition.days * DAY_MS;
}

/**
 * options: period ('today' | 'week' | 'month'), includeTodo (the to-do list can be long, so it is optional),
 * categoryIds (limit to these categories, NO_CATEGORY for uncategorized; empty = all).
 * Sections: in progress, waiting, done in the period, and optionally to-do. Within a section, one
 * line per task, listing its subtasks in that status (with how long, for the in-progress ones).
 */
export function buildStatusReport(state, { now, period = 'week', includeTodo = false, categoryIds = [] }) {
  const selectedCategories = new Set(categoryIds);
  const tasks = state.tasks.filter(task => selectedCategories.size === 0 || selectedCategories.has(task.categoryId ?? NO_CATEGORY));
  const categoryNames = new Map(state.categories.map(category => [category.id, category.name]));
  const doneSince = reportPeriodStart(period, now);
  const periodDefinition = REPORT_PERIODS[period] ?? REPORT_PERIODS.week;

  const sections = [
    { key: 'in_progress', heading: SECTION_HEADINGS.in_progress, matches: subtask => subtask.status === 'in_progress', showElapsed: true },
    { key: 'waiting', heading: SECTION_HEADINGS.waiting, matches: subtask => subtask.status === 'waiting', showElapsed: true },
    { key: 'done', heading: periodDefinition.doneHeading, matches: subtask => subtask.status === 'done' && subtask.statusChangedAt >= doneSince },
    includeTodo && { key: 'todo', heading: SECTION_HEADINGS.todo, matches: subtask => subtask.status === 'todo' },
  ].filter(Boolean);

  // The category is worth naming only when the report covers more than one.
  const usedCategories = new Set();
  const builtSections = sections.map(section => {
    const lines = [];
    for (const task of tasks) {
      const subtasks = task.subtasks.filter(section.matches);
      if (subtasks.length === 0) continue;
      usedCategories.add(task.categoryId);
      lines.push({ task, subtasks });
    }
    return { ...section, lines };
  }).filter(section => section.lines.length > 0);

  const showCategory = usedCategories.size > 1;
  const header = `עדכון סטטוס - ${formatReportDate(now)}`;
  if (builtSections.length === 0) return `${header}\n\n${EMPTY_REPORT_TEXT}`;

  const body = builtSections.map(section => [
    `${section.heading} (${section.lines.reduce((sum, line) => sum + line.subtasks.length, 0)}):`,
    ...section.lines.map(line => `• ${describeLine(line, section.showElapsed, now, showCategory ? categoryNames.get(line.task.categoryId) ?? 'ללא קטגוריה' : null)}`),
  ].join('\n'));
  return [header, ...body].join('\n\n');
}

function describeLine({ task, subtasks }, showElapsed, now, categoryName) {
  const describeSubtask = subtask => (showElapsed ? `${subtask.title} (${formatElapsed(now - subtask.statusChangedAt)})` : subtask.title);
  const prefix = categoryName ? `[${categoryName}] ` : '';
  // A task with a single subtask of the same name (the usual quick task) is written once.
  if (subtasks.length === 1 && task.subtasks.length === 1 && subtasks[0].title === task.title) {
    return `${prefix}${describeSubtask(subtasks[0])}`;
  }
  return `${prefix}${task.title}: ${subtasks.map(describeSubtask).join(', ')}`;
}

function formatReportDate(now) {
  try {
    return new Date(now).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return new Date(now).toISOString().slice(0, 10);
  }
}
