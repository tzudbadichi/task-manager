// View preferences, saved per device and separately from the data (they are not synced):
// filters and sort, plus display choices - tiles or animated characters, seasonal theme,
// celebrations, sound, character chatter, voice dictation and "my day".
// The search text is deliberately not saved, so a reload never hides tasks behind an old search.

import { STATUSES } from './statuses.js';
import { SEASON_PREFERENCES } from './seasons.js';

export const UI_PREFS_KEY = 'taskManager.ui.v1';
export const SORT_KEYS = Object.freeze(['manual', 'status', 'updated', 'created', 'category']);
export const VIEW_KEYS = Object.freeze(['grid', 'people']);

export const DEFAULT_FILTERS = Object.freeze({
  search: '',
  categoryIds: [],
  status: 'all',
  showDone: false,
  sort: 'manual',
});

export const DEFAULT_DISPLAY = Object.freeze({
  view: 'grid',
  season: 'auto',
  celebrate: true,
  sound: false,
  chatter: true,
  myDay: true,
  voice: true,
  // The one-time notice that dictation goes through the browser's speech service was accepted.
  voiceConsent: false,
});

// The on/off switches of the settings dialog (voiceConsent is set by the dictation notice, not a switch).
export const DISPLAY_TOGGLE_KEYS = Object.freeze(['celebrate', 'sound', 'chatter', 'myDay', 'voice']);
const BOOLEAN_DISPLAY_KEYS = Object.freeze([...DISPLAY_TOGGLE_KEYS, 'voiceConsent']);

export function isValidStatusFilter(value) {
  return value === 'all' || (typeof value === 'string' && Object.hasOwn(STATUSES, value));
}

const onlyStrings = value => (Array.isArray(value) ? value.filter(item => typeof item === 'string') : []);
const asObject = value => (value && typeof value === 'object' ? value : {});

function normalizeDisplay(raw) {
  const source = asObject(raw);
  const display = {
    view: VIEW_KEYS.includes(source.view) ? source.view : DEFAULT_DISPLAY.view,
    season: SEASON_PREFERENCES.includes(source.season) ? source.season : DEFAULT_DISPLAY.season,
  };
  for (const key of BOOLEAN_DISPLAY_KEYS) display[key] = typeof source[key] === 'boolean' ? source[key] : DEFAULT_DISPLAY[key];
  return display;
}

export function loadUiPrefs(storage) {
  let raw = null;
  try {
    raw = JSON.parse(storage?.getItem(UI_PREFS_KEY) ?? 'null');
  } catch {
    raw = null;
  }
  const filters = asObject(raw?.filters);
  return {
    filters: {
      search: '',
      categoryIds: onlyStrings(filters.categoryIds),
      status: isValidStatusFilter(filters.status) ? filters.status : DEFAULT_FILTERS.status,
      showDone: filters.showDone === true,
      sort: SORT_KEYS.includes(filters.sort) ? filters.sort : DEFAULT_FILTERS.sort,
    },
    display: normalizeDisplay(raw?.display),
  };
}

export function saveUiPrefs(storage, prefs) {
  const { search, ...savedFilters } = prefs.filters;
  try {
    storage?.setItem(UI_PREFS_KEY, JSON.stringify({ filters: savedFilters, display: normalizeDisplay(prefs.display) }));
  } catch {
    // View preferences are a convenience - ignore quota / privacy-mode errors.
  }
}
