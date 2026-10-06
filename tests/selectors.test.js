import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NO_CATEGORY, getBackupReminder, getDashboardCounts, getTaskRank, selectVisibleTasks,
} from '../src/js/selectors.js';
import { DEFAULT_SETTINGS } from '../src/js/store.js';
import { deriveTaskStatus } from '../src/js/statuses.js';

const NOW = Date.UTC(2026, 9, 4, 12, 0, 0);
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

let idCounter = 0;
function item(overrides = {}) {
  idCounter += 1;
  return {
    id: `item-${idCounter}`, title: `item ${idCounter}`, status: 'todo',
    statusChangedAt: NOW - MINUTE, createdAt: NOW - DAY, updatedAt: NOW - MINUTE,
    ...overrides,
  };
}
/** A task as the store keeps it: with subtasks (default: one, in overrides.status) and the status derived from them. */
function task(overrides = {}, subtasks = [item({ status: overrides.status ?? 'todo' })]) {
  return { ...item(overrides), description: '', categoryId: null, ...overrides, status: deriveTaskStatus(subtasks), subtasks };
}
function stateWith(tasks, extra = {}) {
  return {
    categories: [{ id: 'dev', name: 'פיתוח', color: '#2563eb' }, { id: 'hr', name: 'HR', color: '#db2777' }],
    tasks,
    settings: { ...DEFAULT_SETTINGS },
    ...extra,
  };
}
const filters = (overrides = {}) => ({ search: '', categoryIds: [], status: 'all', showDone: false, sort: 'status', ...overrides });
const titles = tasks => tasks.map(t => t.title);

describe('deriveTaskStatus', () => {
  const statusOf = (...statuses) => deriveTaskStatus(statuses.map(status => item({ status })));

  test('any subtask in progress makes the whole task in progress', () => {
    assert.equal(statusOf('todo', 'waiting', 'done', 'in_progress'), 'in_progress');
  });

  test('otherwise any waiting subtask makes it waiting', () => {
    assert.equal(statusOf('todo', 'done', 'waiting'), 'waiting');
  });

  test('otherwise any to-do subtask makes it to-do', () => {
    assert.equal(statusOf('done', 'todo', 'done'), 'todo');
  });

  test('only when every subtask is done is the task done', () => {
    assert.equal(statusOf('done', 'done'), 'done');
    assert.equal(statusOf(), 'todo');
  });
});

describe('getTaskRank', () => {
  test('ranks by the derived task status: to-do first, then in progress, then waiting, then done', () => {
    assert.equal(getTaskRank(task({ status: 'todo' })), 0);
    assert.equal(getTaskRank(task({}, [item({ status: 'todo' }), item({ status: 'in_progress' })])), 1);
    assert.equal(getTaskRank(task({}, [item({ status: 'todo' }), item({ status: 'waiting' })])), 2);
    assert.equal(getTaskRank(task({}, [item({ status: 'done' }), item({ status: 'done' })])), 3);
  });
});

describe('selectVisibleTasks', () => {
  test('hides done tasks unless showDone is on or the done filter is selected', () => {
    const state = stateWith([task({ title: 'open' }), task({ title: 'closed', status: 'done' })]);
    assert.deepEqual(titles(selectVisibleTasks(state, filters())), ['open']);
    assert.equal(selectVisibleTasks(state, filters({ showDone: true })).length, 2);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ status: 'done' }))), ['closed']);
  });

  test('status filters match a task when any of its subtasks is in that status', () => {
    const state = stateWith([
      task({ title: 'active, also has a to-do' }, [item({ status: 'todo' }), item({ status: 'in_progress' })]),
      task({ title: 'active', status: 'in_progress' }),
      task({ title: 'plain' }),
    ]);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ status: 'in_progress' }))).sort(),
      ['active', 'active, also has a to-do']);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ status: 'todo' }))).sort(),
      ['active, also has a to-do', 'plain']);
  });

  test('category filter supports several categories and "no category"', () => {
    const state = stateWith([
      task({ title: 'dev', categoryId: 'dev' }),
      task({ title: 'hr', categoryId: 'hr' }),
      task({ title: 'none', categoryId: null }),
    ]);
    const titlesFor = categoryIds => titles(selectVisibleTasks(state, filters({ categoryIds }))).sort();
    assert.deepEqual(titlesFor(['dev']), ['dev']);
    assert.deepEqual(titlesFor(['hr', NO_CATEGORY]), ['hr', 'none']);
  });

  test('search looks into descriptions, subtasks and the category name (case-insensitive)', () => {
    const state = stateWith([
      task({ title: 'alpha', categoryId: 'hr' }),
      task({ title: 'beta' }, [item({ title: 'Deploy to IIS' })]),
      task({ title: 'gamma', description: 'talk to Dana Levi' }),
    ]);
    const search = text => titles(selectVisibleTasks(state, filters({ search: text })));
    assert.deepEqual(search('iis'), ['beta']);
    assert.deepEqual(search('  dana '), ['gamma']);
    assert.deepEqual(search('hr'), ['alpha']);
  });

  test('status sort: to-do first, then in progress, then waiting, then done, newest first within a status', () => {
    const state = stateWith([
      task({ title: 'old todo', createdAt: NOW - 3 * DAY }),
      task({ title: 'new todo', createdAt: NOW - DAY }),
      task({ title: 'waiting', status: 'waiting', createdAt: NOW }),
      task({ title: 'active', status: 'in_progress', createdAt: NOW - 5 * DAY }),
      task({ title: 'active with a to-do subtask', createdAt: NOW - 4 * DAY }, [item({ status: 'todo' }), item({ status: 'in_progress' })]),
      task({ title: 'closed', status: 'done', createdAt: NOW }),
    ]);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ showDone: true }))),
      ['new todo', 'old todo', 'active with a to-do subtask', 'active', 'waiting', 'closed']);
  });

  test('"my order" keeps the stored (drag-and-drop) order', () => {
    const state = stateWith([
      task({ title: 'third by date', createdAt: NOW - 3 * DAY }),
      task({ title: 'done', status: 'done' }),
      task({ title: 'newest', createdAt: NOW }),
    ]);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ sort: 'manual', showDone: true }))), ['third by date', 'done', 'newest']);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ sort: 'unknown' }))), ['third by date', 'newest']);
  });

  test('updated and created sorts', () => {
    const state = stateWith([
      task({ title: 'a', createdAt: NOW - 3 * DAY, updatedAt: NOW - MINUTE }),
      task({ title: 'b', createdAt: NOW - DAY, updatedAt: NOW - DAY }),
    ]);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ sort: 'updated' }))), ['a', 'b']);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ sort: 'created' }))), ['b', 'a']);
  });

  test('category sort follows the category order, uncategorized last', () => {
    const state = stateWith([
      task({ title: 'none', categoryId: null }),
      task({ title: 'hr', categoryId: 'hr' }),
      task({ title: 'dev', categoryId: 'dev' }),
    ]);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ sort: 'category' }))), ['dev', 'hr', 'none']);
  });
});

describe('getDashboardCounts', () => {
  test('counts the subtasks by their own status', () => {
    const state = stateWith([
      task({}, [item({ status: 'todo' }), item({ status: 'in_progress' }), item({ status: 'waiting' }), item({ status: 'done' })]),
      task({ status: 'todo' }),
      task({ status: 'waiting' }),
      task({}, [item({ status: 'done' }), item({ status: 'done' })]),
    ]);
    assert.deepEqual(getDashboardCounts(state), { todo: 2, in_progress: 1, waiting: 2, done: 3 });
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
    const settings = { ...DEFAULT_SETTINGS, lastExportAt };
    const unchanged = stateWith([task({ updatedAt: NOW - 9 * DAY })], { settings });
    const changed = stateWith([task({ updatedAt: NOW - DAY })], { settings });
    assert.equal(getBackupReminder(unchanged, NOW), null);
    assert.deepEqual(getBackupReminder(changed, NOW), { lastExportAt });
    const recent = stateWith([task({ updatedAt: NOW })], { settings: { ...DEFAULT_SETTINGS, lastExportAt: NOW - DAY } });
    assert.equal(getBackupReminder(recent, NOW), null);
  });
});
