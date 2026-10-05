// In-memory stand-in for the Supabase document table (one row: { data, version }),
// with hooks to simulate other devices, network failures and lost responses.

import { createInitialState } from '../../src/js/store.js';

export function createFakeRemote(initialData = null) {
  let document = initialData ? { data: structuredClone(initialData), version: 1 } : null;
  let failure = null;
  let loseResponse = false;
  let beforeWrite = null;
  let afterRead = null;
  const subscribers = new Set();
  const counters = { fetches: 0, writes: 0 };

  const guard = () => {
    if (failure) throw failure;
  };
  const runBeforeWrite = () => {
    const hook = beforeWrite;
    beforeWrite = null;
    hook?.();
  };
  const finishWrite = result => {
    if (loseResponse) {
      loseResponse = false;
      throw new Error('Failed to fetch');
    }
    return result;
  };

  return {
    get document() { return document; },
    get fetches() { return counters.fetches; },
    get writes() { return counters.writes; },

    async fetch() {
      guard();
      counters.fetches += 1;
      const result = document ? { data: structuredClone(document.data), version: document.version } : null;
      const hook = afterRead;
      afterRead = null;
      await hook?.(); // something happens after the read, before the reply arrives
      return result;
    },
    async insert(data) {
      guard();
      runBeforeWrite();
      if (document) return { conflict: true };
      counters.writes += 1;
      document = { data: structuredClone(data), version: 1 };
      return finishWrite({ version: 1 });
    },
    async update(data, expectedVersion) {
      guard();
      runBeforeWrite();
      if (!document || document.version !== expectedVersion) return { conflict: true };
      counters.writes += 1;
      document = { data: structuredClone(data), version: document.version + 1 };
      return finishWrite({ version: document.version });
    },
    subscribe(onChange) {
      subscribers.add(onChange);
      return () => subscribers.delete(onChange);
    },

    // --- test controls
    simulateOtherDevice(change) {
      const base = document?.data ?? createInitialState();
      document = { data: change(structuredClone(base)), version: (document?.version ?? 0) + 1 };
    },
    async notifySubscribers() {
      for (const subscriber of subscribers) subscriber(document?.version ?? null);
      await new Promise(resolve => setTimeout(resolve, 0));
    },
    failWith(error) {
      failure = error;
    },
    loseNextResponse() {
      loseResponse = true;
    },
    beforeNextWrite(hook) {
      beforeWrite = hook;
    },
    afterNextRead(hook) {
      afterRead = hook;
    },
  };
}
