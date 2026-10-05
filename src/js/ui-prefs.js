// View preferences (filters, sort, which cards are expanded), saved separately from the data.
// The search text is deliberately not saved, so a reload never hides tasks behind an old search.

import { STATUSES } from './statuses.js';

export const UI_PREFS_KEY = 'taskManager.ui.v1';
export const SORT_KEYS = Object.freeze(['attention', 'updated', 'created', 'category']);
const SPECIAL_STATUS_FILTERS = Object.freeze(['all', 'attention', 'open']);

export const DEFAULT_FILTERS = Object.freeze({
  search: '',
  categoryIds: [],
  status: 'all',
  showDone: false,
  sort: 'attention',
});

export function isValidStatusFilter(value) {
  return SPECIAL_STATUS_FILTERS.includes(value) || (typeof value === 'string' && Object.hasOwn(STATUSES, value));
}

const onlyStrings = value => (Array.isArray(value) ? value.filter(item => typeof item === 'string') : []);

export function loadUiPrefs(storage) {
  let raw = null;
  try {
    raw = JSON.parse(storage?.getItem(UI_PREFS_KEY) ?? 'null');
  } catch {
    raw = null;
  }
  const filters = raw && typeof raw.filters === 'object' && raw.filters !== null ? raw.filters : {};
  return {
    filters: {
      search: '',
      categoryIds: onlyStrings(filters.categoryIds),
      status: isValidStatusFilter(filters.status) ? filters.status : DEFAULT_FILTERS.status,
      showDone: filters.showDone === true,
      sort: SORT_KEYS.includes(filters.sort) ? filters.sort : DEFAULT_FILTERS.sort,
    },
    expandedTaskIds: new Set(onlyStrings(raw?.expandedTaskIds)),
  };
}

export function saveUiPrefs(storage, prefs) {
  const { search, ...savedFilters } = prefs.filters;
  try {
    storage?.setItem(UI_PREFS_KEY, JSON.stringify({ filters: savedFilters, expandedTaskIds: [...prefs.expandedTaskIds] }));
  } catch {
    // View preferences are a convenience - ignore quota / privacy-mode errors.
  }
}
