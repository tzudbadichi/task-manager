import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_REPORT_TEXT, buildStatusReport } from '../src/js/report.js';
import { NO_CATEGORY } from '../src/js/selectors.js';
import { deriveTaskStatus } from '../src/js/statuses.js';

const NOW = Date.UTC(2026, 9, 7, 12, 0, 0);
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

let idCounter = 0;
function subtask(title, status, statusChangedAt = NOW - MINUTE) {
  idCounter += 1;
  return { id: `s-${idCounter}`, title, status, statusChangedAt, createdAt: NOW - 10 * DAY, updatedAt: statusChangedAt };
}
function task(title, categoryId, subtasks) {
  idCounter += 1;
  return {
    id: `t-${idCounter}`, title, description: '', categoryId, status: deriveTaskStatus(subtasks), subtasks,
    statusChangedAt: NOW, createdAt: NOW - 10 * DAY, updatedAt: NOW,
  };
}
const categories = [{ id: 'dev', name: 'פיתוח', color: '#2563eb' }, { id: 'hr', name: 'HR', color: '#db2777' }];
const stateWith = tasks => ({ categories, tasks, settings: {} });

describe('buildStatusReport', () => {
  const sample = () => stateWith([
    task('הקמת סביבה', 'dev', [
      subtask('לבקש הרשאות', 'in_progress', NOW - 3 * DAY),
      subtask('להתקין שרת', 'waiting', NOW - 2 * DAY),
      subtask('לכתוב תיעוד', 'todo'),
      subtask('לפתוח פרויקט', 'done', NOW - 2 * DAY),
    ]),
    task('לחזור לספק', 'dev', [subtask('לחזור לספק', 'waiting', NOW - 5 * DAY)]),
    task('ישן', 'dev', [subtask('נסגר מזמן', 'done', NOW - 20 * DAY)]),
  ]);

  test('in progress, waiting and done this week - with how long, one line per task', () => {
    const report = buildStatusReport(sample(), { now: NOW });
    const sections = report.split('\n\n');
    assert.match(sections[0], /^עדכון סטטוס - /);
    assert.equal(sections[1], 'בעבודה אצלי (1):\n• הקמת סביבה: לבקש הרשאות (3 ימים)');
    assert.equal(sections[2], 'ממתין לתגובה (2):\n• הקמת סביבה: להתקין שרת (יומיים)\n• לחזור לספק (5 ימים)');
    assert.equal(sections[3], 'הושלם ב-7 הימים האחרונים (1):\n• הקמת סביבה: לפתוח פרויקט');
    assert.equal(sections.length, 4, 'no to-do section unless asked for');
    assert.equal(report.includes('נסגר מזמן'), false, 'done before the period is left out');
  });

  test('to-do on request; a longer period reaches older done work', () => {
    const report = buildStatusReport(sample(), { now: NOW, period: 'month', includeTodo: true });
    assert.match(report, /הושלם ב-30 הימים האחרונים \(2\):\n• הקמת סביבה: לפתוח פרויקט\n• ישן: נסגר מזמן/);
    assert.match(report, /לביצוע \(1\):\n• הקמת סביבה: לכתוב תיעוד$/);
  });

  test('a category filter narrows it; categories are named only when more than one is in the report', () => {
    const state = stateWith([
      task('קוד', 'dev', [subtask('קוד', 'in_progress')]),
      task('ראיון', 'hr', [subtask('ראיון', 'in_progress')]),
      task('בלי קטגוריה', null, [subtask('בלי קטגוריה', 'waiting')]),
    ]);
    const all = buildStatusReport(state, { now: NOW });
    assert.match(all, /• \[פיתוח\] קוד/);
    assert.match(all, /• \[ללא קטגוריה\] בלי קטגוריה/);
    const hrOnly = buildStatusReport(state, { now: NOW, categoryIds: ['hr'] });
    assert.match(hrOnly, /• ראיון \(/);
    assert.equal(hrOnly.includes('קוד'), false);
    const uncategorized = buildStatusReport(state, { now: NOW, categoryIds: [NO_CATEGORY] });
    assert.match(uncategorized, /ממתין לתגובה \(1\):\n• בלי קטגוריה/);
  });

  test('nothing to report', () => {
    const report = buildStatusReport(stateWith([task('רק לביצוע', 'dev', [subtask('רק לביצוע', 'todo')])]), { now: NOW });
    assert.equal(report.split('\n\n')[1], EMPTY_REPORT_TEXT);
  });
});
