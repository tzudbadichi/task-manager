import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, dateStamp, formatElapsed, isHexColor } from '../src/js/utils.js';
import { UI_PREFS_KEY, loadUiPrefs, saveUiPrefs } from '../src/js/ui-prefs.js';
import { createMemoryStorage } from './fixtures/memory-storage.js';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatElapsed', () => {
  test('uses short Hebrew forms including the dual forms', () => {
    assert.equal(formatElapsed(30_000), 'פחות מדקה');
    assert.equal(formatElapsed(-5), 'פחות מדקה');
    assert.equal(formatElapsed(MINUTE), 'דקה');
    assert.equal(formatElapsed(12 * MINUTE), "12 דק'");
    assert.equal(formatElapsed(HOUR), 'שעה');
    assert.equal(formatElapsed(2 * HOUR + 5 * MINUTE), 'שעתיים');
    assert.equal(formatElapsed(5 * HOUR), '5 שעות');
    assert.equal(formatElapsed(DAY), 'יום');
    assert.equal(formatElapsed(2 * DAY), 'יומיים');
    assert.equal(formatElapsed(9 * DAY), '9 ימים');
  });
});

describe('small helpers', () => {
  test('cleanText trims, collapses whitespace on single lines and keeps newlines when multiline', () => {
    assert.equal(cleanText('  a \t b \n c ', 50), 'a b c');
    assert.equal(cleanText('line 1\r\nline 2  ', 50, { multiline: true }), 'line 1\nline 2');
    assert.equal(cleanText(42, 50), '');
    assert.equal(cleanText('abcdef', 3), 'abc');
  });

  test('isHexColor accepts only #rrggbb', () => {
    assert.equal(isHexColor('#a1B2c3'), true);
    assert.equal(isHexColor('#fff'), false);
    assert.equal(isHexColor('red'), false);
    assert.equal(isHexColor('#123456; color: red'), false);
  });

  test('dateStamp pads month and day', () => {
    assert.equal(dateStamp(new Date(2026, 0, 5)), '2026-01-05');
  });
});

describe('UI preferences', () => {
  test('round-trips filters and expanded cards, but never the search text', () => {
    const storage = createMemoryStorage();
    saveUiPrefs(storage, {
      filters: { search: 'secret', categoryIds: ['dev'], status: 'in_progress', showDone: true, sort: 'category' },
      expandedTaskIds: new Set(['t1', 't2']),
    });
    const prefs = loadUiPrefs(storage);
    assert.deepEqual(prefs.filters, { search: '', categoryIds: ['dev'], status: 'in_progress', showDone: true, sort: 'category' });
    assert.deepEqual([...prefs.expandedTaskIds], ['t1', 't2']);
    assert.equal(storage.getItem(UI_PREFS_KEY).includes('secret'), false);
  });

  test('invalid or corrupt saved preferences fall back to defaults', () => {
    const corrupt = loadUiPrefs(createMemoryStorage({ [UI_PREFS_KEY]: '{oops' }));
    assert.equal(corrupt.filters.status, 'all');
    const invalid = loadUiPrefs(createMemoryStorage({
      [UI_PREFS_KEY]: JSON.stringify({ filters: { status: 'attention', sort: 'attention', categoryIds: [1, 'ok'] }, expandedTaskIds: 'nope' }),
    }));
    assert.deepEqual(invalid.filters, { search: '', categoryIds: ['ok'], status: 'all', showDone: false, sort: 'status' });
    assert.equal(invalid.expandedTaskIds.size, 0);
    assert.equal(loadUiPrefs(null).filters.sort, 'status');
  });
});
