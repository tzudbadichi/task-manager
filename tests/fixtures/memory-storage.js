// Test doubles for window.localStorage and deterministic id generation.

export function createMemoryStorage(initialEntries = {}) {
  const entries = new Map(Object.entries(initialEntries));
  return {
    get length() { return entries.size; },
    key: index => [...entries.keys()][index] ?? null,
    getItem: key => (entries.has(key) ? entries.get(key) : null),
    setItem: (key, value) => {
      entries.set(key, String(value));
    },
    removeItem: key => {
      entries.delete(key);
    },
    keys: () => [...entries.keys()],
  };
}

/** Storage whose writes always fail, like a full quota. */
export function createFailingStorage() {
  return {
    getItem: () => null,
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
    removeItem: () => {},
  };
}

export function sequentialIds(prefix = 'id') {
  let counter = 0;
  return () => `${prefix}-${++counter}`;
}
