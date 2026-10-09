// Minimal stand-in for the supabase-js client: records every query chain (table + method calls) and
// resolves it with the response a test queued for that operation (select / insert / update / upsert / delete).
// Also records realtime channels, so tests can fire postgres_changes events and status callbacks.

const CHAIN_METHODS = ['select', 'insert', 'update', 'upsert', 'delete', 'eq', 'in', 'lt', 'order', 'limit', 'maybeSingle', 'single'];
const OPERATIONS = new Set(['select', 'insert', 'update', 'upsert', 'delete']);

export function createFakeQueryClient(responder = () => ({ data: [], error: null })) {
  const calls = [];
  const channels = [];
  const client = {
    from(table) {
      const call = { table, steps: [] };
      calls.push(call);
      const builder = {
        then(resolve, reject) {
          const operation = call.steps.find(([method]) => OPERATIONS.has(method))?.[0];
          return Promise.resolve(responder(operation, call)).then(resolve, reject);
        },
      };
      for (const method of CHAIN_METHODS) {
        builder[method] = (...args) => {
          call.steps.push([method, ...args]);
          return builder;
        };
      }
      return builder;
    },
    channel(name) {
      const channel = { name, handlers: [], removed: false };
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
