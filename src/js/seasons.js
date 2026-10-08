// Seasonal themes by the Hebrew calendar: around a holiday the app takes its colors, an emblem and a
// greeting (and the characters of the people view dress up). The date is read with Intl's Hebrew
// calendar, so there is no calendar arithmetic here. Pure (no DOM), covered by tests/seasons.test.js.

export const SEASONS = Object.freeze({
  'rosh-hashana': { label: 'ראש השנה', greeting: 'שנה טובה ומתוקה' },
  sukkot: { label: 'סוכות', greeting: 'חג סוכות שמח' },
  hanukkah: { label: 'חנוכה', greeting: 'חג אורים שמח' },
  'tu-bishvat': { label: 'ט"ו בשבט', greeting: 'ט"ו בשבט שמח' },
  purim: { label: 'פורים', greeting: 'פורים שמח' },
  pesach: { label: 'פסח', greeting: 'חג פסח שמח' },
  atzmaut: { label: 'יום העצמאות', greeting: 'חג עצמאות שמח' },
  'lag-baomer': { label: 'ל"ג בעומר', greeting: 'ל"ג בעומר שמח' },
  shavuot: { label: 'שבועות', greeting: 'חג שבועות שמח' },
});

export const SEASON_KEYS = Object.freeze(Object.keys(SEASONS));

// The seasonal-theme preference: follow the calendar, never, or always show one theme (a preview).
export const SEASON_PREFERENCES = Object.freeze(['auto', 'off', ...SEASON_KEYS]);

// Month names as Intl writes them in English ("Tishri", "Adar II"...), matched loosely because
// spellings differ a little between ICU versions (Heshvan / Cheshvan, Tamuz / Tammuz).
const MONTH_MATCHERS = Object.freeze([
  ['tishri', /^tis/],
  ['heshvan', /^(ches|hes|marches)/],
  ['kislev', /^kis/],
  ['tevet', /^tev/],
  ['shevat', /^(shev|shv)/],
  ['adar2', /^adar ?ii$/],
  ['adar1', /^adar ?i$/],
  ['adar', /^adar$/],
  ['nisan', /^nis/],
  ['iyar', /^iy/],
  ['sivan', /^siv/],
  ['tamuz', /^tam/],
  ['av', /^av$/],
  ['elul', /^elu/],
]);

let hebrewFormatter = null;

/** { day, month } of a date in the Hebrew calendar (month keys as in MONTH_MATCHERS), or null if unsupported. */
export function getHebrewDate(date) {
  try {
    hebrewFormatter ??= new Intl.DateTimeFormat('en-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' });
    const parts = Object.fromEntries(hebrewFormatter.formatToParts(date).map(part => [part.type, part.value]));
    const year = Number.parseInt(parts.year, 10);
    const day = Number.parseInt(parts.day, 10);
    // A browser without the Hebrew calendar falls back to the Gregorian one; the year gives that away.
    if (!(year > 5000) || !Number.isInteger(day)) return null;
    const monthName = String(parts.month ?? '').toLowerCase().trim();
    const month = MONTH_MATCHERS.find(([, pattern]) => pattern.test(monthName))?.[0];
    return month ? { day, month } : null;
  } catch {
    return null;
  }
}

/**
 * Independence Day is the 5th of Iyar, moved so it never touches Shabbat: to Thursday when the 5th falls on
 * a Friday or Saturday, and to Tuesday when it falls on a Monday (so Memorial Day does not follow Shabbat).
 * Only the day itself gets the festive theme - never Memorial Day.
 */
function independenceDayOfIyar(dayOfMonth, weekday) {
  const weekdayOfFifth = (((weekday + (5 - dayOfMonth)) % 7) + 7) % 7;
  if (weekdayOfFifth === 5) return 4;
  if (weekdayOfFifth === 6) return 3;
  if (weekdayOfFifth === 1) return 6;
  return 5;
}

/** The holiday season a date falls in, or null. Ranges include the eve and a few days around short holidays. */
export function getSeasonForDate(date) {
  const hebrew = getHebrewDate(date);
  if (!hebrew) return null;
  const { day, month } = hebrew;
  const between = (from, to) => day >= from && day <= to;
  switch (month) {
    case 'elul': return day >= 22 ? 'rosh-hashana' : null;
    case 'tishri':
      if (between(1, 2)) return 'rosh-hashana';
      return between(14, 23) ? 'sukkot' : null;
    case 'kislev': return day >= 24 ? 'hanukkah' : null;
    case 'tevet': return day <= 3 ? 'hanukkah' : null;
    case 'shevat': return between(14, 15) ? 'tu-bishvat' : null;
    // In a leap year Purim is in Adar II; Adar I has no Purim theme.
    case 'adar':
    case 'adar2': return between(13, 15) ? 'purim' : null;
    case 'nisan': return between(14, 21) ? 'pesach' : null;
    case 'iyar':
      if (day === 18) return 'lag-baomer';
      return day === independenceDayOfIyar(day, date.getDay()) ? 'atzmaut' : null;
    case 'sivan': return between(5, 6) ? 'shavuot' : null;
    default: return null;
  }
}

/** The theme to show for a preference ('auto' | 'off' | a season key) on a date. */
export function resolveSeason(preference, date) {
  if (preference === 'off') return null;
  if (Object.hasOwn(SEASONS, preference)) return preference;
  return getSeasonForDate(date);
}
