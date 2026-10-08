import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { SEASON_KEYS, getHebrewDate, getSeasonForDate, resolveSeason } from '../src/js/seasons.js';

// Noon local time, so the date is the same in any time zone the tests run in.
const on = isoDate => new Date(`${isoDate}T12:00:00`);
const seasonOn = isoDate => getSeasonForDate(on(isoDate));

describe('Hebrew calendar seasons', () => {
  test('reads the Hebrew date', () => {
    assert.deepEqual(getHebrewDate(on('2026-10-07')), { day: 26, month: 'tishri' });
    assert.deepEqual(getHebrewDate(on('2027-03-23')), { day: 14, month: 'adar2' });
  });

  test('holidays and the days around them', () => {
    assert.equal(seasonOn('2026-09-04'), 'rosh-hashana', 'a week before, from 22 Elul');
    assert.equal(seasonOn('2026-09-12'), 'rosh-hashana');
    assert.equal(seasonOn('2026-09-21'), null, 'Yom Kippur gets no festive theme');
    assert.equal(seasonOn('2026-09-26'), 'sukkot');
    assert.equal(seasonOn('2026-10-07'), null);
    assert.equal(seasonOn('2026-12-04'), 'hanukkah', 'the eve, 24 Kislev');
    assert.equal(seasonOn('2027-01-23'), 'tu-bishvat');
    assert.equal(seasonOn('2027-04-22'), 'pesach');
    assert.equal(seasonOn('2027-05-25'), 'lag-baomer');
    assert.equal(seasonOn('2027-06-11'), 'shavuot');
  });

  test('Purim is in Adar, or in Adar II in a leap year (never Adar I)', () => {
    assert.equal(seasonOn('2026-03-03'), 'purim');
    assert.equal(seasonOn('2027-03-23'), 'purim');
    assert.equal(seasonOn('2027-02-21'), null);
  });

  test('Independence Day moves away from Shabbat, and Memorial Day never gets the theme', () => {
    assert.equal(seasonOn('2027-05-12'), 'atzmaut', '5 Iyar on a Wednesday');
    assert.equal(seasonOn('2027-05-11'), null);
    assert.equal(seasonOn('2025-05-01'), 'atzmaut', '5 Iyar on Shabbat: moved to Thursday, 3 Iyar');
    assert.equal(seasonOn('2025-05-03'), null);
    assert.equal(seasonOn('2025-04-30'), null);
    assert.equal(seasonOn('2024-05-14'), 'atzmaut', '5 Iyar on a Monday: moved to Tuesday, 6 Iyar');
    assert.equal(seasonOn('2024-05-13'), null);
  });

  test('the preference: automatic, off, or a fixed preview', () => {
    assert.equal(resolveSeason('auto', on('2026-12-05')), 'hanukkah');
    assert.equal(resolveSeason('off', on('2026-12-05')), null);
    assert.equal(resolveSeason('purim', on('2026-10-07')), 'purim');
    assert.equal(resolveSeason('unknown', on('2026-10-07')), null);
    assert.ok(SEASON_KEYS.includes('atzmaut'));
  });
});
