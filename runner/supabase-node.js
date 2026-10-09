// Supabase for the runner: the same locked copy of supabase-js the board uses (src/vendor/supabase.js,
// a browser bundle that also runs in Node 22+, which has fetch and WebSocket built in), with the sign-in
// kept in a file in the runner's state folder instead of the browser's localStorage.

import { readFileSync } from 'node:fs';
import { chmod, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { writeFileAtomic } from './local-state.js';

const VENDOR_BUNDLE = fileURLToPath(new URL('../src/vendor/supabase.js', import.meta.url));
const AUTH_STORAGE_KEY = 'task-manager-runner-auth';

let library = null;

/** Loads the vendored bundle once. It defines a `supabase` variable (UMD build); it is returned instead of becoming a global. */
export function loadSupabaseLibrary(bundlePath = VENDOR_BUNDLE) {
  if (!library) {
    const source = readFileSync(bundlePath, 'utf8');
    // Our own vendored file, read from disk - never remote code.
    library = new Function(`${source}\n;return supabase;`)();
  }
  return library;
}

/**
 * Auth storage backed by one JSON file. It holds the refresh token (a secret): the file lives in the
 * user's own profile folder, is readable by this user only where the OS supports it, and is never committed.
 */
export function createFileAuthStorage(file) {
  let items = {};
  try {
    items = JSON.parse(readFileSync(file, 'utf8')) ?? {};
  } catch {
    items = {};
  }
  const writeNow = async () => {
    if (Object.keys(items).length === 0) {
      await rm(file, { force: true });
      return;
    }
    await writeFileAtomic(file, JSON.stringify(items), { mode: 0o600 });
    await chmod(file, 0o600).catch(() => {}); // no-op on Windows; the profile folder's ACL protects it there
  };
  // One write at a time (they share one temporary file); each writes the latest items.
  let writing = Promise.resolve();
  const persist = () => {
    writing = writing.then(writeNow, writeNow);
    return writing;
  };
  return {
    getItem: key => (Object.hasOwn(items, key) ? items[key] : null),
    async setItem(key, value) {
      items[key] = value;
      await persist();
    },
    async removeItem(key) {
      delete items[key];
      await persist();
    },
  };
}

export function createRunnerSupabase({ url, key, authFile }) {
  const { createClient } = loadSupabaseLibrary();
  return createClient(url, key, {
    auth: {
      storage: createFileAuthStorage(authFile),
      storageKey: AUTH_STORAGE_KEY,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
}
