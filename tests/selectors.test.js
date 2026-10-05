import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ATTENTION, NO_CATEGORY, countAttentionItems, getAttention, getBackupReminder, getDashboardCounts,
  getTaskRank, listOverdueClaudeItems, selectVisibleTasks,
} from '../src/js/selectors.js';
import { DEFAULT_SETTINGS } from '../src/js/store.js';

const NOW = Date.UTC(2026, 9, 4, 12, 0, 0);
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const SETTINGS = { ...DEFAULT_SETTINGS, claudeCheckMinutes: 15, waitingFollowUpDays: 3 };

let idCounter = 0;
function item(overrides = {}) {
  idCounter += 1;
  return {
    id: `item-${idCounter}`, title: `item ${idCounter}`, status: 'todo', contact: '',
    statusChangedAt: NOW - MINUTE, lastCheckedAt: null, createdAt: NOW - DAY, updatedAt: NOW - MINUTE,
    ...overrides,
  };
}
function task(overrides = {}, subtasks = []) {
  return { ...item(overrides), description: '', categoryId: null, subtasks, ...overrides, subtasks };
}
function stateWith(tasks, extra = {}) {
  return {
    categories: [{ id: 'dev', name: 'פיתוח', color: '#2563eb' }, { id: 'hr', name: 'HR', color: '#db2777' }],
    tasks,
    settings: SETTINGS,
    ...extra,
  };
}
const filters = (overrides = {}) => ({ search: '', categoryIds: [], status: 'all', showDone: false, sort: 'attention', ...overrides });

describe('getAttention', () => {
  test('email received always needs action', () => {
    assert.equal(getAttention(item({ status: 'email_received' }), SETTINGS, NOW), ATTENTION.action);
  });

  test('Claude becomes "check now" once the check interval passes, and a check resets the timer', () => {
    const running = item({ status: 'claude_running', statusChangedAt: NOW - 14 * MINUTE });
    assert.equal(getAttention(running, SETTINGS, NOW), ATTENTION.running);
    assert.equal(getAttention(running, SETTINGS, NOW + MINUTE), ATTENTION.check);
    const checked = { ...running, statusChangedAt: NOW - 60 * MINUTE, lastCheckedAt: NOW - 2 * MINUTE };
    assert.equal(getAttention(checked, SETTINGS, NOW), ATTENTION.running);
  });

  test('waiting for email suggests a follow-up only after the configured days', () => {
    assert.equal(getAttention(item({ status: 'waiting_email', statusChangedAt: NOW - 2 * DAY }), SETTINGS, NOW), null);
    assert.equal(getAttention(item({ status: 'waiting_email', statusChangedAt: NOW - 3 * DAY }), SETTINGS, NOW), ATTENTION.followup);
  });

  test('plain statuses need no attention', () => {
    for (const status of ['todo', 'in_progress', 'done']) assert.equal(getAttention(item({ status }), SETTINGS, NOW), null);
  });
});

describe('getTaskRank', () => {
  test('a task is as urgent as its most urgent subtask, unless the task itself is done', () => {
    const urgent = task({ status: 'todo' }, [item({ status: 'waiting_email' }), item({ status: 'email_received' })]);
    assert.equal(getTaskRank(urgent, SETTINGS, NOW), ATTENTION.action.rank);
    assert.equal(getTaskRank({ ...urgent, status: 'done' }, SETTINGS, NOW), 9);
  });
});

describe('selectVisibleTasks', () => {
  test('hides done tasks unless showDone is on or the done filter is selected', () => {
    const state = stateWith([task({ title: 'open' }), task({ title: 'closed', status: 'done' })]);
    assert.deepEqual(selectVisibleTasks(state, filters(), NOW).map(t => t.title), ['open']);
    assert.equal(selectVisibleTasks(state, filters({ showDone: true }), NOW).length, 2);
    assert.deepEqual(selectVisibleTasks(state, filters({ status: 'done' }), NOW).map(t => t.title), ['closed']);
  });

  test('status filters match the task or any of its subtasks', () => {
    const state = stateWith([
      task({ title: 'parent waits' }, [item({ status: 'waiting_email' })]),
      task({ title: 'self running', status: 'claude_running' }),
      task({ title: 'plain' }),
    ]);
    assert.deepEqual(selectVisibleTasks(state, filters({ status: 'waiting_email' }), NOW).map(t => t.title), ['parent waits']);
    assert.deepEqual(selectVisibleTasks(state, filters({ status: 'claude_running' }), NOW).map(t => t.title), ['self running']);
  });

  test('the attention filter keeps only email-received and overdue Claude items', () => {
    const state = stateWith([
      task({ title: 'overdue' }, [item({ status: 'claude_running', statusChangedAt: NOW - 30 * MINUTE })]),
      task({ title: 'fresh run' }, [item({ status: 'claude_running', statusChangedAt: NOW - MINUTE })]),
      task({ title: 'reply arrived', status: 'email_received' }),
    ]);
    const titles = selectVisibleTasks(state, filters({ status: 'attention' }), NOW).map(t => t.title);
    assert.deepEqual(titles.sort(), ['overdue', 'reply arrived']);
  });

  test('category filter supports several categories and "no category"', () => {
    const state = stateWith([
      task({ title: 'dev', categoryId: 'dev' }),
      task({ title: 'hr', categoryId: 'hr' }),
      task({ title: 'none', categoryId: null }),
    ]);
    const titlesFor = categoryIds => selectVisibleTasks(state, filters({ categoryIds }), NOW).map(t => t.title).sort();
    assert.deepEqual(titlesFor(['dev']), ['dev']);
    assert.deepEqual(titlesFor(['hr', NO_CATEGORY]), ['hr', 'none']);
  });

  test('search looks into subtasks, contacts and the category name (case-insensitive)', () => {
    const state = stateWith([
      task({ title: 'alpha', categoryId: 'hr' }),
      task({ title: 'beta' }, [item({ title: 'Deploy to IIS' })]),
      task({ title: 'gamma', contact: 'Dana Levi' }),
    ]);
    const search = text => selectVisibleTasks(state, filters({ search: text }), NOW).map(t => t.title);
    assert.deepEqual(search('iis'), ['beta']);
    assert.deepEqual(search('  dana '), ['gamma']);
    assert.deepEqual(search('hr'), ['alpha']);
  });

  test('"urgent first" sort: email received, overdue Claude, running, in progress, todo, waiting', () => {
    const state = stateWith([
      task({ title: 'waiting', status: 'waiting_email', createdAt: NOW - 1 }),
      task({ title: 'todo', createdAt: NOW - 2 }),
      task({ title: 'in progress', status: 'in_progress', createdAt: NOW - 3 }),
      task({ title: 'running', status: 'claude_running', statusChangedAt: NOW - MINUTE, createdAt: NOW - 4 }),
      task({ title: 'overdue', status: 'claude_running', statusChangedAt: NOW - 20 * MINUTE, createdAt: NOW - 5 }),
      task({ title: 'email', status: 'email_received', createdAt: NOW - 6 }),
    ]);
    assert.deepEqual(selectVisibleTasks(state, filters(), NOW).map(t => t.title),
      ['email', 'overdue', 'running', 'in progress', 'todo', 'waiting']);
  });

  test('category sort follows the category order, uncategorized last', () => {
    const state = stateWith([
      task({ title: 'none', categoryId: null }),
      task({ title: 'hr', categoryId: 'hr' }),
      task({ title: 'dev', categoryId: 'dev' }),
    ]);
    assert.deepEqual(selectVisibleTasks(state, filters({ sort: 'category' }), NOW).map(t => t.title), ['dev', 'hr', 'none']);
  });
});

describe('dashboard counts', () => {
  test('counts subtasks and special-status parents, skips plain container parents and done tasks', () => {
    const state = stateWith([
      task({ status: 'todo' }, [
        item({ status: 'email_received' }),
        item({ status: 'claude_running', statusChangedAt: NOW - 20 * MINUTE }),
        item({ status: 'claude_running' }),
        item({ status: 'waiting_email', statusChangedAt: NOW - 5 * DAY }),
        item({ status: 'in_progress' }),
        item({ status: 'done' }),
      ]),
      task({ status: 'waiting_email' }, [item({ status: 'todo' })]),
      task({ status: 'todo' }),
      task({ status: 'done' }, [item({ status: 'email_received' })]),
    ]);
    const counts = getDashboardCounts(state, NOW);
    assert.deepEqual(counts, {
      emailReceived: 1, claudeRunning: 2, claudeOverdue: 1,
      waitingEmail: 2, waitingFollowUp: 1, inProgress: 1, todo: 2, open: 3,
    });
    assert.equal(countAttentionItems(state, NOW), 2);
  });
});

describe('listOverdueClaudeItems', () => {
  test('returns overdue Claude items with a key that changes after a check', () => {
    const subtask = item({ title: 'migration', status: 'claude_running', statusChangedAt: NOW - 20 * MINUTE });
    const state = stateWith([task({ title: 'parent' }, [subtask])]);
    const [overdue] = listOverdueClaudeItems(state, NOW);
    assert.equal(overdue.title, 'migration');
    assert.equal(overdue.context, 'parent');

    const checkedLater = { ...subtask, lastCheckedAt: NOW };
    const laterState = stateWith([task({ title: 'parent' }, [checkedLater])]);
    assert.equal(listOverdueClaudeItems(laterState, NOW).length, 0);
    const [again] = listOverdueClaudeItems(laterState, NOW + 16 * MINUTE);
    assert.notEqual(again.key, overdue.key);
  });
});

describe('getBackupReminder', () => {
  test('never exported: remind only once there is real content', () => {
    assert.equal(getBackupReminder(stateWith([]), NOW), null);
    assert.equal(getBackupReminder(stateWith([task()]), NOW), null);
    const bigger = stateWith([task({}, [item(), item(), item(), item()])]);
    assert.deepEqual(getBackupReminder(bigger, NOW), { lastExportAt: null });
  });

  test('exported before: remind after a week, and only if something changed since', () => {
    const lastExportAt = NOW - 8 * DAY;
    const settings = { ...SETTINGS, lastExportAt };
    const unchanged = stateWith([task({ updatedAt: NOW - 9 * DAY })], { settings });
    const changed = stateWith([task({ updatedAt: NOW - DAY })], { settings });
    assert.equal(getBackupReminder(unchanged, NOW), null);
    assert.deepEqual(getBackupReminder(changed, NOW), { lastExportAt });
    const recent = stateWith([task({ updatedAt: NOW })], { settings: { ...SETTINGS, lastExportAt: NOW - DAY } });
    assert.equal(getBackupReminder(recent, NOW), null);
  });
});
