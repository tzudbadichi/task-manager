import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createDocumentRemote, describeAuthError } from '../src/js/cloud.js';

/**
 * Minimal stand-in for the supabase-js query builder: records every call of the chain
 * and resolves with the response queued for that operation.
 */
function createFakeClient(responses) {
  const calls = [];
  const channels = [];
  const client = {
    from(table) {
      const call = { table, steps: [] };
      calls.push(call);
      const builder = {
        then(resolve, reject) {
          const operation = call.steps[0]?.[0];
          return Promise.resolve(responses[operation]()).then(resolve, reject);
        },
      };
      for (const method of ['select', 'insert', 'update', 'eq', 'maybeSingle', 'single']) {
        builder[method] = (...args) => {
          call.steps.push([method, ...args]);
          return builder;
        };
      }
      return builder;
    },
    channel(name) {
      const channel = { name, handlers: [] };
      channel.on = (event, filter, handler) => {
        channel.handlers.push({ event, filter, handler });
        return channel;
      };
      channel.subscribe = callback => {
        channel.statusCallback = callback;
        return channel;
      };
      channels.push(channel);
      return channel;
    },
    removeChannel(channel) {
      channel.removed = true;
    },
  };
  return { client, calls, channels };
}

describe('createDocumentRemote (Supabase adapter)', () => {
  test('fetch reads only the signed-in user row and maps it', async () => {
    const { client, calls } = createFakeClient({ select: () => ({ data: { data: { tasks: [] }, version: 4 }, error: null }) });
    const remote = createDocumentRemote(client, 'user-1');
    assert.deepEqual(await remote.fetch(), { data: { tasks: [] }, version: 4 });
    assert.equal(calls[0].table, 'task_manager_documents');
    assert.deepEqual(calls[0].steps, [['select', 'data, version'], ['eq', 'user_id', 'user-1'], ['maybeSingle']]);
  });

  test('fetch returns null when the user has no row yet, and throws on errors', async () => {
    const empty = createDocumentRemote(createFakeClient({ select: () => ({ data: null, error: null }) }).client, 'u');
    assert.equal(await empty.fetch(), null);
    const failing = createDocumentRemote(createFakeClient({ select: () => ({ data: null, error: new Error('boom') }) }).client, 'u');
    await assert.rejects(failing.fetch(), /boom/);
  });

  test('insert creates the row for this user; a duplicate key means another device was first', async () => {
    const { client, calls } = createFakeClient({ insert: () => ({ data: { version: 1 }, error: null }) });
    const remote = createDocumentRemote(client, 'user-1');
    assert.deepEqual(await remote.insert({ tasks: [] }), { version: 1 });
    assert.deepEqual(calls[0].steps, [['insert', { user_id: 'user-1', data: { tasks: [] } }], ['select', 'version'], ['single']]);

    const duplicate = createDocumentRemote(createFakeClient({ insert: () => ({ data: null, error: { code: '23505' } }) }).client, 'u');
    assert.deepEqual(await duplicate.insert({}), { conflict: true });
  });

  test('update is conditional on the expected version; no matching row means a conflict', async () => {
    const { client, calls } = createFakeClient({ update: () => ({ data: [{ version: 8 }], error: null }) });
    const remote = createDocumentRemote(client, 'user-1');
    assert.deepEqual(await remote.update({ tasks: [] }, 7), { version: 8 });
    assert.deepEqual(calls[0].steps, [
      ['update', { data: { tasks: [] } }], ['eq', 'user_id', 'user-1'], ['eq', 'version', 7], ['select', 'version'],
    ]);

    const stale = createDocumentRemote(createFakeClient({ update: () => ({ data: [], error: null }) }).client, 'u');
    assert.deepEqual(await stale.update({}, 3), { conflict: true });
  });

  test('subscribe listens to this user row only, reports the new version, and unsubscribes', () => {
    const { client, channels } = createFakeClient({});
    const remote = createDocumentRemote(client, 'user-1');
    const versions = [];
    const unsubscribe = remote.subscribe(version => versions.push(version));
    const [{ event, filter, handler }] = channels[0].handlers;
    assert.equal(event, 'postgres_changes');
    assert.equal(filter.filter, 'user_id=eq.user-1');
    assert.equal(filter.table, 'task_manager_documents');
    handler({ new: { version: 5 } });
    handler({ new: {} });
    channels[0].statusCallback('SUBSCRIBED'); // (re)connected: check for changes missed meanwhile
    channels[0].statusCallback('CHANNEL_ERROR');
    assert.deepEqual(versions, [5, null, null]);
    unsubscribe();
    assert.equal(channels[0].removed, true);
  });
});

describe('describeAuthError', () => {
  test('maps common Supabase auth errors to Hebrew', () => {
    assert.equal(describeAuthError({ code: 'invalid_credentials' }), 'אימייל או סיסמה שגויים');
    assert.equal(describeAuthError({ message: 'Email not confirmed' }), 'צריך לאשר קודם את כתובת המייל - הקישור נשלח לתיבת הדואר');
    assert.equal(describeAuthError({ code: 'weak_password' }), 'הסיסמה חלשה מדי - לפחות 6 תווים');
    assert.equal(describeAuthError({ name: 'AuthRetryableFetchError', message: 'Failed to fetch' }), 'אין חיבור לשרת. כדאי לבדוק את החיבור לאינטרנט');
    assert.equal(describeAuthError(new Error('something odd')), 'משהו השתבש. כדאי לנסות שוב');
  });
});
