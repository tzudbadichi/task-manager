import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanText, dateStamp, formatElapsed, hashString, isDateStamp, isHexColor, truncate } from '../src/js/utils.js';
import { DEFAULT_DISPLAY, UI_PREFS_KEY, loadUiPrefs, saveUiPrefs } from '../src/js/ui-prefs.js';
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

  test('isDateStamp accepts YYYY-MM-DD strings only', () => {
    assert.equal(isDateStamp('2026-10-07'), true);
    assert.equal(isDateStamp('2026-10-7'), false);
    assert.equal(isDateStamp(20261007), false);
    assert.equal(isDateStamp(null), false);
  });

  test('truncate shortens with an ellipsis; hashString is stable', () => {
    assert.equal(truncate('short', 10), 'short');
    assert.equal(truncate('a long title here', 8), 'a long…');
    assert.equal(hashString('task-1'), hashString('task-1'));
    assert.notEqual(hashString('task-1'), hashString('task-2'));
  });
});

describe('UI preferences', () => {
  test('round-trips filters and sort, but never the search text', () => {
    const storage = createMemoryStorage();
    saveUiPrefs(storage, {
      filters: { search: 'secret', categoryIds: ['dev'], status: 'in_progress', showDone: true, sort: 'category' },
    });
    const prefs = loadUiPrefs(storage);
    assert.deepEqual(prefs.filters, { search: '', categoryIds: ['dev'], status: 'in_progress', showDone: true, sort: 'category' });
    assert.equal(storage.getItem(UI_PREFS_KEY).includes('secret'), false);
  });

  test('defaults to "my order"; invalid or corrupt saved preferences fall back to defaults', () => {
    assert.equal(loadUiPrefs(null).filters.sort, 'manual');
    const corrupt = loadUiPrefs(createMemoryStorage({ [UI_PREFS_KEY]: '{oops' }));
    assert.equal(corrupt.filters.status, 'all');
    const invalid = loadUiPrefs(createMemoryStorage({
      [UI_PREFS_KEY]: JSON.stringify({ filters: { status: 'attention', sort: 'attention', categoryIds: [1, 'ok'] }, expandedTaskIds: ['t1'] }),
    }));
    assert.deepEqual(invalid, {
      filters: { search: '', categoryIds: ['ok'], status: 'all', showDone: false, sort: 'manual' },
      display: { ...DEFAULT_DISPLAY },
    });
  });

  test('display choices round-trip; unknown values fall back to the defaults', () => {
    const storage = createMemoryStorage();
    const display = { view: 'people', world: 'pirates', season: 'hanukkah', celebrate: false, sound: true, chatter: false, myDay: false, voice: false, voiceConsent: true };
    saveUiPrefs(storage, { filters: loadUiPrefs(null).filters, display });
    assert.deepEqual(loadUiPrefs(storage).display, display);
    const invalid = loadUiPrefs(createMemoryStorage({
      [UI_PREFS_KEY]: JSON.stringify({ display: { view: 'list', world: 'narnia', season: 'christmas', sound: 'yes', extra: 1 } }),
    }));
    assert.deepEqual(invalid.display, { ...DEFAULT_DISPLAY });
    assert.equal(DEFAULT_DISPLAY.view, 'grid');
    assert.equal(DEFAULT_DISPLAY.voiceConsent, false);
  });
});
