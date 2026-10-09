import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentHub } from '../src/js/agent-hub.js';

const T0 = Date.UTC(2026, 9, 8, 9, 0, 0);
const iso = ms => new Date(ms).toISOString();

function jobRow(id, { status = 'queued', createdAt = T0, subtaskId = 's1' } = {}) {
  return { id, runner_id: 'r1', project_key: 'portal', task_id: 't1', subtask_id: subtaskId, prompt: 'do it', status, created_at: iso(createdAt) };
}

/** Fake agent remote: queued responses per call, and a way to fire realtime events. */
function createFakeAgentRemote({ runners = [], jobs = [], failWith = null } = {}) {
  let listener = null;
  const inserted = [];
  return {
    inserted,
    async listRunners() {
      if (failWith) throw failWith;
      return runners;
    },
    async listJobs() {
      if (failWith) throw failWith;
      return jobs;
    },
    async insertJob(job) {
      inserted.push(job);
      return { ...jobRow(job.id), prompt: job.prompt, created_at: iso(T0 + 1000) };
    },
    async cancelJob(jobId) {
      return { ...jobRow(jobId), status: 'cancelled' };
    },
    subscribe(onEvent) {
      listener = onEvent;
      return () => { listener = null; };
    },
    fire(event) {
      listener?.(event);
    },
    get isSubscribed() { return listener !== null; },
  };
}

const manualTimers = () => ({ setTimeout: () => 1, clearTimeout: () => {} });

/** Timers whose callbacks the test runs by hand. */
function steppedTimers() {
  const pending = [];
  return {
    setTimeout(callback) {
      pending.push(callback);
      return pending.length;
    },
    clearTimeout() {},
    async runNext() {
      await pending.shift()?.();
    },
  };
}

describe('createAgentHub', () => {
  test('loads runners and jobs (newest first) and reports "ready"', async () => {
    const remote = createFakeAgentRemote({
      runners: [{ id: 'r1', name: 'Work PC', last_seen_at: iso(T0), projects: [{ key: 'portal', name: 'Portal', engine: 'claude' }] }],
      jobs: [jobRow('old', { createdAt: T0 }), jobRow('new', { createdAt: T0 + 5 }), { id: 'broken', status: '???' }],
    });
    const snapshots = [];
    const hub = createAgentHub({ remote, onChange: snapshot => snapshots.push(snapshot), timers: manualTimers() });
    await hub.start();
    const last = snapshots.at(-1);
    assert.equal(last.status, 'ready');
    assert.deepEqual(last.jobs.map(job => job.id), ['new', 'old']);
    assert.equal(last.runners[0].projects[0].key, 'portal');
    hub.stop();
    assert.equal(remote.isSubscribed, false);
  });

  test('realtime events update, add and remove jobs and runners', async () => {
    const remote = createFakeAgentRemote({ jobs: [jobRow('j1')] });
    const hub = createAgentHub({ remote, timers: manualTimers() });
    await hub.start();
    remote.fire({ table: 'agent_jobs', type: 'UPDATE', row: jobRow('j1', { status: 'running' }), oldRow: null });
    remote.fire({ table: 'agent_jobs', type: 'INSERT', row: jobRow('j2', { createdAt: T0 + 9 }), oldRow: null });
    remote.fire({ table: 'agent_runners', type: 'INSERT', row: { id: 'r1', name: 'PC', last_seen_at: iso(T0), projects: [] }, oldRow: null });
    let snapshot = hub.getSnapshot();
    assert.deepEqual(snapshot.jobs.map(job => [job.id, job.status]), [['j2', 'queued'], ['j1', 'running']]);
    assert.deepEqual(snapshot.runners.map(runner => runner.id), ['r1']);
    remote.fire({ table: 'agent_jobs', type: 'DELETE', row: null, oldRow: { id: 'j1' } });
    remote.fire({ table: 'agent_runners', type: 'DELETE', row: null, oldRow: { id: 'r1' } });
    snapshot = hub.getSnapshot();
    assert.deepEqual(snapshot.jobs.map(job => job.id), ['j2']);
    assert.deepEqual(snapshot.runners, []);
    hub.stop();
  });

  test('missing agent tables = "unavailable"; other failures = "error" until a reload works', async () => {
    const missing = createAgentHub({ remote: createFakeAgentRemote({ failWith: { code: 'PGRST205', message: 'Could not find the table' } }), timers: manualTimers() });
    await missing.start();
    assert.equal(missing.status, 'unavailable');
    missing.stop();

    const remote = createFakeAgentRemote({ failWith: new Error('Failed to fetch') });
    const hub = createAgentHub({ remote, timers: manualTimers() });
    await hub.start();
    assert.equal(hub.status, 'error');
    // The network is back.
    Object.assign(remote, { listRunners: async () => [], listJobs: async () => [] });
    await hub.reload();
    assert.equal(hub.status, 'ready');
    hub.stop();
  });

  test('every minute only the runners are reloaded; the jobs come from realtime', async () => {
    const remote = createFakeAgentRemote({ jobs: [jobRow('j1')] });
    let jobLoads = 0;
    const listJobs = remote.listJobs;
    remote.listJobs = async () => {
      jobLoads += 1;
      return listJobs();
    };
    const timers = steppedTimers();
    const hub = createAgentHub({ remote, timers });
    await hub.start();
    await timers.runNext();
    await timers.runNext();
    assert.equal(jobLoads, 1);
    remote.fire(null); // the live channel reconnected: everything is loaded again
    await hub.reload();
    assert.equal(jobLoads, 2);
    hub.stop();
  });

  test('a reload never moves a job back behind what realtime already showed', async () => {
    const remote = createFakeAgentRemote({ jobs: [jobRow('j1', { status: 'running' })] });
    const hub = createAgentHub({ remote, timers: manualTimers() });
    await hub.start();
    remote.fire({ table: 'agent_jobs', type: 'UPDATE', row: jobRow('j1', { status: 'done' }), oldRow: null });
    await hub.reload(); // the reply was read before the job finished
    assert.equal(hub.getSnapshot().jobs[0].status, 'done');
    hub.stop();
  });

  test('send inserts a queued job and shows it right away; cancel shows the updated job', async () => {
    const remote = createFakeAgentRemote();
    const hub = createAgentHub({ remote, timers: manualTimers() });
    await hub.start();
    const job = await hub.send({ id: 'j9', runnerId: 'r1', projectKey: 'portal', taskId: 't1', subtaskId: 's1', prompt: 'go' });
    assert.equal(job.status, 'queued');
    assert.equal(remote.inserted[0].prompt, 'go');
    assert.equal(hub.getSnapshot().jobs[0].id, 'j9');
    await hub.cancel('j9');
    assert.equal(hub.getSnapshot().jobs[0].status, 'cancelled');
    hub.stop();
  });
});
