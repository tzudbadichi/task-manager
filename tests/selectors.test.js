import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NO_CATEGORY, getBackupReminder, getDashboardCounts, getTaskRank, selectVisibleTasks,
} from '../src/js/selectors.js';
import { DEFAULT_SETTINGS } from '../src/js/store.js';

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
function task(overrides = {}, subtasks = []) {
  return { ...item(overrides), description: '', categoryId: null, ...overrides, subtasks };
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

describe('getTaskRank', () => {
  test('in progress ranks before to-do, and a done task sinks regardless of its subtasks', () => {
    const active = task({ status: 'todo' }, [item({ status: 'done' }), item({ status: 'in_progress' })]);
    assert.equal(getTaskRank(active), 0);
    assert.equal(getTaskRank(task({ status: 'todo' })), 1);
    assert.equal(getTaskRank({ ...active, status: 'done' }), 2);
  });
});

describe('selectVisibleTasks', () => {
  test('hides done tasks unless showDone is on or the done filter is selected', () => {
    const state = stateWith([task({ title: 'open' }), task({ title: 'closed', status: 'done' })]);
    assert.deepEqual(titles(selectVisibleTasks(state, filters())), ['open']);
    assert.equal(selectVisibleTasks(state, filters({ showDone: true })).length, 2);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ status: 'done' }))), ['closed']);
  });

  test('status filters match the task or any of its subtasks', () => {
    const state = stateWith([
      task({ title: 'parent with active subtask' }, [item({ status: 'in_progress' })]),
      task({ title: 'active itself', status: 'in_progress' }),
      task({ title: 'plain' }),
    ]);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ status: 'in_progress' }))).sort(),
      ['active itself', 'parent with active subtask']);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ status: 'todo' }))).sort(),
      ['parent with active subtask', 'plain']);
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

  test('status sort: in progress first, then to-do, newest first within a status', () => {
    const state = stateWith([
      task({ title: 'old todo', createdAt: NOW - 3 * DAY }),
      task({ title: 'new todo', createdAt: NOW - DAY }),
      task({ title: 'active', status: 'in_progress', createdAt: NOW - 5 * DAY }),
      task({ title: 'has active subtask', createdAt: NOW - 4 * DAY }, [item({ status: 'in_progress' })]),
      task({ title: 'closed', status: 'done', createdAt: NOW }),
    ]);
    assert.deepEqual(titles(selectVisibleTasks(state, filters({ showDone: true }))),
      ['has active subtask', 'active', 'new todo', 'old todo', 'closed']);
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
  test('counts tasks without subtasks, the subtasks of tasks that have them, and closes subtasks of done tasks', () => {
    const state = stateWith([
      task({ status: 'in_progress' }, [item({ status: 'todo' }), item({ status: 'in_progress' }), item({ status: 'done' })]),
      task({ status: 'todo' }),
      task({ status: 'in_progress' }),
      task({ status: 'done' }, [item({ status: 'todo' }), item({ status: 'todo' })]),
    ]);
    assert.deepEqual(getDashboardCounts(state), { todo: 2, in_progress: 2, done: 3 });
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
