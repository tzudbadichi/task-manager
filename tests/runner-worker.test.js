import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorker } from '../runner/worker.js';
import { conversationKey } from '../runner/local-state.js';

const T0 = Date.UTC(2026, 9, 8, 9, 0, 0);
const THREAD = '7d1e2f3a-4b5c-4d6e-8f70-112233445566';

function baseConfig(overrides = {}) {
  return {
    runnerName: 'Work PC',
    maxParallelJobs: 2,
    jobTimeoutMinutes: 30,
    profiles: {
      work: { name: 'work', label: 'עבודה', engine: 'claude', cloudReport: 'minimal', worktreesDir: '/wt/work' },
      personal: { name: 'personal', label: 'אישי', engine: 'codex', cloudReport: 'full', worktreesDir: '/wt/personal' },
    },
    projects: [
      { key: 'portal', name: 'Portal', profile: 'work', path: '/work/portal', isolation: 'worktree', baseBranch: null },
      { key: 'notes', name: 'Notes', profile: 'personal', path: '/me/notes', isolation: 'none', baseBranch: null },
    ],
    ...overrides,
  };
}

function job(id, { projectKey = 'portal', taskId = 't1', prompt = 'do it' } = {}) {
  return { id, runner_id: 'r1', project_key: projectKey, task_id: taskId, subtask_id: 's1', prompt, status: 'queued', cancel_requested: false };
}

/** In-memory queue playing the runner's side of agent_jobs. */
function createFakeQueue(jobs = []) {
  const rows = new Map(jobs.map(item => [item.id, { ...item }]));
  const finished = [];
  const heartbeats = [];
  let finishFailures = 0;
  return {
    rows, finished, heartbeats,
    failFinishes(count) { finishFailures = count; },
    add(item) { rows.set(item.id, { ...item }); },
    async heartbeat(payload) { heartbeats.push(payload); },
    async listJobs(statuses) { return [...rows.values()].filter(row => statuses.includes(row.status)).map(row => ({ ...row })); },
    async claimJob(jobId) {
      const row = rows.get(jobId);
      if (!row || row.status !== 'queued') return null;
      row.status = 'running';
      return { ...row };
    },
    async listCancelRequests(ids) { return ids.filter(id => rows.get(id)?.cancel_requested); },
    async finishJob(jobId, fields) {
      if (finishFailures > 0) {
        finishFailures -= 1;
        throw new Error('Failed to fetch');
      }
      const row = rows.get(jobId);
      if (!row || !['queued', 'running'].includes(row.status)) return false;
      Object.assign(row, fields);
      finished.push({ id: jobId, ...fields });
      return true;
    },
    async deleteFinishedBefore() {},
    subscribe() { return () => {}; },
  };
}

function createLocalStateFake() {
  const conversations = {};
  return {
    conversations,
    runnerId: 'r1',
    getConversation: key => conversations[key] ?? null,
    async setConversation(key, value) { conversations[key] = value; },
  };
}

const silentLog = { info() {}, success() {}, warning() {}, error() {} };

/** A controllable agent: each call waits until the test releases it with an outcome. */
function createAgentDouble() {
  const calls = [];
  return {
    calls,
    run(options) {
      return new Promise(resolve => {
        calls.push({ options, resolve });
        options.signal.addEventListener('abort', () => resolve({ ok: false, text: '', sessionId: null, error: 'stopped', cancelled: true, timedOut: false }));
      });
    },
  };
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
async function settle(times = 5) {
  for (let index = 0; index < times; index += 1) await flush();
}

function createHarness({ jobs = [], config = baseConfig() } = {}) {
  const queue = createFakeQueue(jobs);
  const localState = createLocalStateFake();
  const agent = createAgentDouble();
  const preparedWorktrees = [];
  const worker = createWorker({
    config,
    remote: queue,
    localState,
    log: silentLog,
    runAgent: options => agent.run(options),
    prepareWorktree: async ({ project, taskId, worktreesDir }) => {
      preparedWorktrees.push({ project: project.key, taskId, worktreesDir });
      return { worktreePath: `${worktreesDir}/${project.key}/${taskId}`, branch: `agent/${project.key}-${taskId}`, baseCommit: 'abc123' };
    },
    countChangedFiles: async () => 3,
    isGitFolder: async () => false,
    openJobLog: async () => ({ write() {}, end() {} }),
    tmpDir: '/tmp',
    clock: () => T0,
    timers: { setInterval: () => 1, clearInterval: () => {} },
  });
  return { queue, localState, agent, worker, preparedWorktrees };
}

describe('runner worker', () => {
  test('runs a job in the task\'s worktree and reports a minimal answer for a work project', async () => {
    const { queue, agent, worker, preparedWorktrees, localState } = createHarness({ jobs: [job('j1')] });
    await worker.start();
    await settle();
    assert.equal(queue.heartbeats[0].name, 'Work PC');
    assert.deepEqual(queue.heartbeats[0].projects, [
      { key: 'portal', name: 'Portal', engine: 'claude', profile: 'עבודה' },
      { key: 'notes', name: 'Notes', engine: 'codex', profile: 'אישי' },
    ]);
    assert.equal(queue.rows.get('j1').status, 'running');
    assert.deepEqual(preparedWorktrees, [{ project: 'portal', taskId: 't1', worktreesDir: '/wt/work' }]);

    const [{ options, resolve }] = agent.calls;
    assert.equal(options.cwd, '/wt/work/portal/t1');
    assert.equal(options.profile.engine, 'claude');
    assert.equal(options.conversation.started, false);
    assert.match(options.prompt, /^do it\n\n---\n/, 'the first message carries the reporting instructions');
    assert.equal(options.timeoutMs, 30 * 60_000);

    resolve({ ok: true, text: 'Fixed.\n```js\nsecret()\n```', sessionId: options.conversation.sessionId, error: null, cancelled: false, timedOut: false });
    await settle();
    const [report] = queue.finished;
    assert.equal(report.status, 'done');
    assert.doesNotMatch(report.summary, /secret\(\)/);
    assert.equal(report.branch, 'agent/portal-t1');
    assert.equal(report.worktree_path, '/wt/work/portal/t1');
    assert.equal(report.changed_files, 3);
    assert.equal(localState.conversations[conversationKey('portal', 't1')].started, true);
    await worker.stop();
  });

  test('the next message of the same task continues the same conversation', async () => {
    const { queue, agent, worker } = createHarness({ jobs: [job('j1')] });
    await worker.start();
    await settle();
    const first = agent.calls[0];
    first.resolve({ ok: true, text: 'Need a decision', sessionId: first.options.conversation.sessionId, error: null, cancelled: false, timedOut: false });
    await settle();
    queue.add(job('j2', { prompt: 'use option B' }));
    await worker.poll();
    await settle();
    const second = agent.calls[1];
    assert.equal(second.options.conversation.started, true);
    assert.equal(second.options.conversation.sessionId, first.options.conversation.sessionId);
    assert.equal(second.options.prompt, 'use option B');
    await worker.stop();
  });

  test('jobs of one task run one after the other; jobs of other tasks run in parallel up to the limit', async () => {
    const { agent, worker } = createHarness({
      jobs: [job('a1', { taskId: 'A' }), job('a2', { taskId: 'A' }), job('b1', { taskId: 'B' }), job('c1', { taskId: 'C' })],
    });
    await worker.start();
    await settle();
    assert.deepEqual(agent.calls.map(call => call.options.jobId), ['a1', 'b1'], 'a2 waits for a1; c1 waits for a free slot');
    agent.calls[0].resolve({ ok: true, text: 'ok', sessionId: null, error: null, cancelled: false, timedOut: false });
    await settle(10);
    assert.deepEqual(agent.calls.map(call => call.options.jobId), ['a1', 'b1', 'a2']);
    await worker.stop();
  });

  test('a project with isolation "none" runs one job at a time, even for different tasks', async () => {
    const { agent, worker } = createHarness({ jobs: [job('n1', { projectKey: 'notes', taskId: 'A' }), job('n2', { projectKey: 'notes', taskId: 'B' })] });
    await worker.start();
    await settle();
    assert.deepEqual(agent.calls.map(call => call.options.jobId), ['n1']);
    assert.equal(agent.calls[0].options.cwd, '/me/notes');
    assert.equal(agent.calls[0].options.skipGitRepoCheck, true);
    await worker.stop();
  });

  test('a job for a project this machine does not have is refused with a reason', async () => {
    const { queue, agent, worker } = createHarness({ jobs: [job('x1', { projectKey: 'secret-repo' }), job('x2', { prompt: '   ' })] });
    await worker.start();
    await settle();
    assert.equal(agent.calls.length, 0);
    assert.deepEqual(queue.finished.map(item => [item.id, item.status]), [['x1', 'failed'], ['x2', 'failed']]);
    assert.match(queue.finished[0].error, /secret-repo/);
    await worker.stop();
  });

  test('a stop requested on the board stops the agent and reports "cancelled"', async () => {
    const { queue, worker } = createHarness({ jobs: [job('j1')] });
    await worker.start();
    await settle();
    queue.rows.get('j1').cancel_requested = true;
    await worker.poll();
    await settle();
    assert.equal(queue.finished[0].status, 'cancelled');
    await worker.stop();
  });

  test('Codex: the thread id from the first answer is kept for the next message', async () => {
    const { queue, agent, worker, localState } = createHarness({ jobs: [job('n1', { projectKey: 'notes' })] });
    await worker.start();
    await settle();
    assert.equal(agent.calls[0].options.conversation.sessionId, null);
    agent.calls[0].resolve({ ok: true, text: 'done', sessionId: THREAD, error: null, cancelled: false, timedOut: false });
    await settle();
    assert.equal(localState.conversations[conversationKey('notes', 't1')].sessionId, THREAD);
    assert.equal(queue.finished[0].summary, 'done');
    assert.equal(queue.finished[0].changed_files, null, 'no git, no count');
    await worker.stop();
  });

  test('a Claude conversation that never started gets a new session id for the next attempt', async () => {
    const { agent, worker, localState } = createHarness({ jobs: [job('j1')] });
    await worker.start();
    await settle();
    const firstId = agent.calls[0].options.conversation.sessionId;
    agent.calls[0].resolve({ ok: false, text: '', sessionId: null, error: 'Claude Code did not return a result', cancelled: false, timedOut: false });
    await settle();
    const saved = localState.conversations[conversationKey('portal', 't1')];
    assert.equal(saved.started, false);
    assert.notEqual(saved.sessionId, firstId);
    await worker.stop();
  });

  test('an outcome that could not be reported is kept and retried on the next checks', async () => {
    const { queue, agent, worker } = createHarness({ jobs: [job('j1')] });
    await worker.start();
    await settle();
    // Fails when the job ends, and again on the check that follows right after it.
    queue.failFinishes(2);
    agent.calls[0].resolve({ ok: true, text: 'ok', sessionId: null, error: null, cancelled: false, timedOut: false });
    await settle();
    assert.equal(queue.finished.length, 0);
    await worker.poll();
    assert.equal(queue.finished[0].status, 'done');
    await worker.stop();
  });

  test('on start, jobs a previous run left "running" are closed; on stop, running agents are stopped and reported', async () => {
    const leftOver = { ...job('old'), status: 'running' };
    const { queue, worker } = createHarness({ jobs: [leftOver, job('j1')] });
    await worker.start();
    await settle();
    assert.equal(queue.rows.get('old').status, 'failed');
    assert.match(queue.rows.get('old').error, /הופעל מחדש/);
    await worker.stop();
    assert.equal(queue.rows.get('j1').status, 'failed');
    assert.match(queue.rows.get('j1').error, /נעצר/);
  });

  test('a conversation that can no longer be continued is started over once, and the answer says so', async () => {
    const { queue, agent, worker, localState } = createHarness({ jobs: [job('j1')] });
    await worker.start();
    await settle();
    const firstId = agent.calls[0].options.conversation.sessionId;
    agent.calls[0].resolve({ ok: true, text: 'first answer', sessionId: firstId, error: null, cancelled: false, timedOut: false });
    await settle();
    queue.add(job('j2', { prompt: 'continue' }));
    await worker.poll();
    await settle();
    // The transcript is gone: resuming fails without any answer.
    agent.calls[1].resolve({ ok: false, text: '', sessionId: null, error: 'No conversation found', cancelled: false, timedOut: false });
    await settle();
    const retry = agent.calls[2];
    assert.equal(retry.options.conversation.started, false);
    assert.notEqual(retry.options.conversation.sessionId, firstId);
    assert.match(retry.options.prompt, /^continue\n\n---\n/, 'the new conversation gets the reporting instructions');
    retry.resolve({ ok: true, text: 'done again', sessionId: retry.options.conversation.sessionId, error: null, cancelled: false, timedOut: false });
    await settle();
    const report = queue.finished.find(item => item.id === 'j2');
    assert.equal(report.status, 'done');
    assert.match(report.summary, /השיחה הקודמת/);
    assert.equal(localState.conversations[conversationKey('portal', 't1')].sessionId, retry.options.conversation.sessionId);
    await worker.stop();
  });

  test('when the fresh attempt fails too, the old conversation is kept for next time', async () => {
    const { queue, agent, worker, localState } = createHarness({ jobs: [job('j1')] });
    await worker.start();
    await settle();
    const firstId = agent.calls[0].options.conversation.sessionId;
    agent.calls[0].resolve({ ok: true, text: 'ok', sessionId: firstId, error: null, cancelled: false, timedOut: false });
    await settle();
    queue.add(job('j2', { prompt: 'continue' }));
    await worker.poll();
    await settle();
    const offline = { ok: false, text: '', sessionId: null, error: 'Failed to fetch', cancelled: false, timedOut: false };
    agent.calls[1].resolve(offline);
    await settle();
    agent.calls[2].resolve(offline);
    await settle();
    assert.equal(queue.finished.find(item => item.id === 'j2').status, 'failed');
    const saved = localState.conversations[conversationKey('portal', 't1')];
    assert.deepEqual([saved.sessionId, saved.started], [firstId, true]);
    await worker.stop();
  });

  test('changing the account folder of a profile starts a new conversation', async () => {
    const { agent, worker, localState } = createHarness({ jobs: [job('j1')] });
    localState.conversations[conversationKey('portal', 't1')] = {
      folder: '/wt/work/portal/t1', engine: 'claude', profile: 'work', account: 'C:/old-account', sessionId: 'old', started: true,
    };
    await worker.start();
    await settle();
    assert.equal(agent.calls[0].options.conversation.started, false);
    assert.notEqual(agent.calls[0].options.conversation.sessionId, 'old');
    await worker.stop();
  });

  test('an outcome for a job that was already closed on the board is dropped', async () => {
    const { queue, agent, worker } = createHarness({ jobs: [job('j1')] });
    await worker.start();
    await settle();
    queue.rows.get('j1').status = 'cancelled'; // closed from the board while the agent worked
    agent.calls[0].resolve({ ok: true, text: 'late answer', sessionId: null, error: null, cancelled: false, timedOut: false });
    await settle();
    assert.equal(queue.rows.get('j1').status, 'cancelled');
    assert.equal(queue.finished.length, 0);
    await worker.stop();
  });

  test('a claim that lands while stopping gives the job back instead of leaving it running', async () => {
    const { queue, agent, worker } = createHarness({ jobs: [job('j1')] });
    let releaseClaim;
    const claimJob = queue.claimJob;
    queue.claimJob = jobId => new Promise(resolve => {
      releaseClaim = () => resolve(claimJob(jobId));
    });
    const starting = worker.start();
    await settle();
    const stopping = worker.stop();
    releaseClaim();
    await starting;
    await stopping;
    assert.equal(agent.calls.length, 0);
    assert.equal(queue.rows.get('j1').status, 'failed');
    assert.match(queue.rows.get('j1').error, /נעצר/);
  });

  test('start fails clearly when the agent tables do not exist', async () => {
    const { queue, worker } = createHarness();
    queue.heartbeat = async () => {
      throw { code: 'PGRST205', message: 'Could not find the table public.agent_runners' };
    };
    await assert.rejects(worker.start(), /schema\.sql/);
  });
});
