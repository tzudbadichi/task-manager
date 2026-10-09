import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentRemote, isMissingTableError } from '../src/js/cloud.js';
import { createRunnerRemote } from '../runner/remote.js';
import { createFakeQueryClient } from './fixtures/fake-query-client.js';

describe('createAgentRemote (board side of the agent tables)', () => {
  test('lists this user\'s runners and newest jobs', async () => {
    const { client, calls } = createFakeQueryClient(() => ({ data: [{ id: 'x' }], error: null }));
    const remote = createAgentRemote(client, 'user-1');
    assert.deepEqual(await remote.listRunners(), [{ id: 'x' }]);
    await remote.listJobs(300);
    assert.equal(calls[0].table, 'agent_runners');
    assert.deepEqual(calls[0].steps.slice(1), [['eq', 'user_id', 'user-1'], ['order', 'last_seen_at', { ascending: false }]]);
    assert.equal(calls[1].table, 'agent_jobs');
    assert.deepEqual(calls[1].steps.slice(1), [['eq', 'user_id', 'user-1'], ['order', 'created_at', { ascending: false }], ['limit', 300]]);
  });

  test('insertJob sends only the request - never a status or an answer', async () => {
    const { client, calls } = createFakeQueryClient(() => ({ data: { id: 'j1', status: 'queued' }, error: null }));
    const remote = createAgentRemote(client, 'user-1');
    await remote.insertJob({ id: 'j1', runnerId: 'r1', projectKey: 'portal', taskId: 't1', subtaskId: 's1', prompt: 'do it' });
    assert.deepEqual(calls[0].steps[0], ['insert', {
      id: 'j1', user_id: 'user-1', runner_id: 'r1', project_key: 'portal', task_id: 't1', subtask_id: 's1', prompt: 'do it',
    }]);
  });

  test('cancelJob cancels a queued job; otherwise asks a running one to stop; null when it already finished', async () => {
    let updates = 0;
    const responses = [[], [{ id: 'j1', status: 'running', cancel_requested: true }]];
    const { client, calls } = createFakeQueryClient(() => ({ data: responses[updates++], error: null }));
    const remote = createAgentRemote(client, 'user-1');
    assert.deepEqual(await remote.cancelJob('j1'), { id: 'j1', status: 'running', cancel_requested: true });
    assert.deepEqual(calls[0].steps.slice(0, 3), [['update', { status: 'cancelled' }], ['eq', 'id', 'j1'], ['eq', 'status', 'queued']]);
    assert.deepEqual(calls[1].steps.slice(0, 3), [['update', { cancel_requested: true }], ['eq', 'id', 'j1'], ['eq', 'status', 'running']]);

    const finished = createAgentRemote(createFakeQueryClient(() => ({ data: [], error: null })).client, 'u');
    assert.equal(await finished.cancelJob('j9'), null);
  });

  test('cancelJob with close: a running job whose machine is gone is closed right away', async () => {
    let updates = 0;
    const responses = [[], [{ id: 'j1', status: 'cancelled' }]];
    const { client, calls } = createFakeQueryClient(() => ({ data: responses[updates++], error: null }));
    await createAgentRemote(client, 'user-1').cancelJob('j1', { close: true });
    assert.deepEqual(calls[1].steps.slice(0, 3), [['update', { status: 'cancelled', cancel_requested: true }], ['eq', 'id', 'j1'], ['eq', 'status', 'running']]);
  });

  test('errors are thrown; a missing table is recognised', async () => {
    const missing = { code: 'PGRST205', message: 'Could not find the table public.agent_jobs in the schema cache' };
    const remote = createAgentRemote(createFakeQueryClient(() => ({ data: null, error: missing })).client, 'u');
    await assert.rejects(remote.listJobs(10), error => isMissingTableError(error));
    assert.equal(isMissingTableError({ code: '42P01' }), true);
    assert.equal(isMissingTableError(new Error('Failed to fetch')), false);
  });

  test('subscribe forwards job and runner changes of this user, and asks for a reload on (re)connect', () => {
    const { client, channels } = createFakeQueryClient();
    const events = [];
    const unsubscribe = createAgentRemote(client, 'user-1').subscribe(event => events.push(event));
    const [jobsHandler, runnersHandler] = channels[0].handlers;
    assert.equal(jobsHandler.filter.table, 'agent_jobs');
    assert.equal(jobsHandler.filter.filter, 'user_id=eq.user-1');
    assert.equal(runnersHandler.filter.table, 'agent_runners');
    jobsHandler.handler({ eventType: 'UPDATE', new: { id: 'j1' }, old: {} });
    runnersHandler.handler({ eventType: 'DELETE', new: {}, old: { id: 'r1' } });
    channels[0].statusCallback('SUBSCRIBED');
    assert.deepEqual(events, [
      { table: 'agent_jobs', type: 'UPDATE', row: { id: 'j1' }, oldRow: {} },
      { table: 'agent_runners', type: 'DELETE', row: {}, oldRow: { id: 'r1' } },
      null,
    ]);
    unsubscribe();
    assert.equal(channels[0].removed, true);
  });
});

describe('createRunnerRemote (runner side of the agent tables)', () => {
  test('every job query is limited to this machine; claiming and finishing are conditional on the status', async () => {
    const { client, calls } = createFakeQueryClient(operation => ({ data: operation === 'update' ? [{ id: 'j1' }] : [], error: null }));
    const remote = createRunnerRemote(client, { runnerId: 'r1' });
    await remote.listJobs(['queued']);
    assert.deepEqual(calls[0].steps.slice(1, 3), [['eq', 'runner_id', 'r1'], ['in', 'status', ['queued']]]);

    assert.deepEqual(await remote.claimJob('j1'), { id: 'j1' });
    assert.deepEqual(calls[1].steps.slice(0, 4), [['update', { status: 'running' }], ['eq', 'id', 'j1'], ['eq', 'runner_id', 'r1'], ['eq', 'status', 'queued']]);

    assert.equal(await remote.finishJob('j1', { status: 'done', summary: 'ok' }), true);
    assert.deepEqual(calls[2].steps.slice(0, 4), [
      ['update', { status: 'done', summary: 'ok' }], ['eq', 'id', 'j1'], ['eq', 'runner_id', 'r1'], ['in', 'status', ['queued', 'running']],
    ]);
  });

  test('a job someone else changed in the meantime is not claimed', async () => {
    const remote = createRunnerRemote(createFakeQueryClient(() => ({ data: [], error: null })).client, { runnerId: 'r1' });
    assert.equal(await remote.claimJob('j1'), null);
    assert.equal(await remote.finishJob('j1', { status: 'done' }), false);
  });

  test('heartbeat upserts the machine with its projects; listCancelRequests skips the query when nothing runs', async () => {
    const { client, calls } = createFakeQueryClient(() => ({ data: [{ id: 'j2' }], error: null }));
    const remote = createRunnerRemote(client, { runnerId: 'r1' });
    await remote.heartbeat({ name: 'Work PC', projects: [{ key: 'portal' }] });
    assert.deepEqual(calls[0].steps[0], ['upsert', { id: 'r1', name: 'Work PC', projects: [{ key: 'portal' }] }, { onConflict: 'id' }]);
    assert.deepEqual(await remote.listCancelRequests([]), []);
    assert.equal(calls.length, 1);
    assert.deepEqual(await remote.listCancelRequests(['j2']), ['j2']);
  });

  test('subscribe listens to this machine\'s jobs only', () => {
    const { client, channels } = createFakeQueryClient();
    let changes = 0;
    createRunnerRemote(client, { runnerId: 'r1' }).subscribe(() => { changes += 1; });
    assert.equal(channels[0].handlers[0].filter.filter, 'runner_id=eq.r1');
    channels[0].handlers[0].handler({});
    channels[0].statusCallback('SUBSCRIBED');
    assert.equal(changes, 2);
  });
});
