// Agent farm in the browser: keeps the runners (dev machines) and the recent agent jobs up to date, and
// sends or cancels jobs. The jobs are loaded in full when the live channel connects (and reconnects) and
// then follow realtime; every minute only the small runners list is reloaded, which also ages their
// "connected" state - so a board left open all day does not keep downloading every message.
// No DOM access: the cloud is reached through an injected remote (cloud.js createAgentRemote in the
// browser, a fake in tests/agent-hub.test.js).

import { laterCopyOfJob, normalizeJobRow, normalizeRunnerRow } from './agent-model.js';
import { isMissingTableError } from './cloud.js';

export const JOBS_LIMIT = 300;
const RELOAD_INTERVAL_MS = 60_000;

const byNewestFirst = (a, b) => b.createdAt - a.createdAt;

/**
 * status: 'loading' | 'ready' | 'unavailable' (the agent tables do not exist - the updated schema was not run)
 *       | 'error' (could not load yet; keeps retrying with the periodic reload).
 * onChange({ status, runners, jobs }) after every change. runners and jobs are normalized (agent-model.js).
 */
export function createAgentHub({ remote, onChange = () => {}, timers = globalThis }) {
  let status = 'loading';
  let runners = [];
  let jobs = [];
  let stopped = false;
  let loading = null;
  let unsubscribe = null;
  let reloadTimer = null;

  const snapshot = () => ({ status, runners, jobs });
  const emit = () => {
    if (!stopped) onChange(snapshot());
  };

  function handleLoadError(error) {
    if (isMissingTableError(error)) status = 'unavailable';
    else if (status !== 'ready') status = 'error'; // a failed reload keeps what was shown
  }

  /** Runners and jobs in full. A job that realtime already moved further along keeps its newer copy. */
  function load() {
    if (loading) return loading;
    loading = (async () => {
      try {
        const [runnerRows, jobRows] = await Promise.all([remote.listRunners(), remote.listJobs(JOBS_LIMIT)]);
        if (stopped) return;
        const known = new Map(jobs.map(job => [job.id, job]));
        runners = runnerRows.map(normalizeRunnerRow).filter(Boolean);
        jobs = jobRows.map(normalizeJobRow).filter(Boolean).map(job => laterCopyOfJob(known.get(job.id), job)).sort(byNewestFirst);
        status = 'ready';
      } catch (error) {
        if (stopped) return;
        handleLoadError(error);
      } finally {
        loading = null;
      }
      emit();
    })();
    return loading;
  }

  async function reloadRunners() {
    try {
      const runnerRows = await remote.listRunners();
      if (stopped) return;
      runners = runnerRows.map(normalizeRunnerRow).filter(Boolean);
    } catch (error) {
      if (stopped) return;
      handleLoadError(error);
    }
    emit();
  }

  function upsertJob(job) {
    const merged = laterCopyOfJob(jobs.find(item => item.id === job.id), job);
    jobs = [merged, ...jobs.filter(item => item.id !== job.id)].sort(byNewestFirst).slice(0, JOBS_LIMIT);
  }

  function applyEvent({ table, type, row, oldRow }) {
    if (table === 'agent_jobs') {
      if (type === 'DELETE') {
        jobs = jobs.filter(job => job.id !== oldRow?.id);
      } else {
        const job = normalizeJobRow(row);
        if (!job) return;
        upsertJob(job);
      }
    } else if (table === 'agent_runners') {
      if (type === 'DELETE') {
        runners = runners.filter(runner => runner.id !== oldRow?.id);
      } else {
        const runner = normalizeRunnerRow(row);
        if (!runner) return;
        runners = [runner, ...runners.filter(item => item.id !== runner.id)];
      }
    } else {
      return;
    }
    emit();
  }

  function scheduleReload() {
    if (stopped) return;
    reloadTimer = timers.setTimeout(async () => {
      reloadTimer = null;
      if (status === 'ready') await reloadRunners();
      else if (status === 'error') await load(); // not loaded yet: keep trying in full
      else emit(); // still re-render, so "seen X minutes ago" keeps counting
      scheduleReload();
    }, RELOAD_INTERVAL_MS);
  }

  return {
    get status() { return status; },
    getSnapshot: snapshot,
    async start() {
      // Listen before the first load, so a change in between is not missed (the channel also reloads on connect).
      unsubscribe = remote.subscribe(event => {
        if (stopped) return;
        if (event === null) load();
        else applyEvent(event);
      });
      await load();
      scheduleReload();
    },
    stop() {
      stopped = true;
      if (reloadTimer !== null) timers.clearTimeout(reloadTimer);
      unsubscribe?.();
    },
    reload: load,
    /** Inserts a queued job and returns it (normalized). Throws when the cloud refused it. */
    async send({ id, runnerId, projectKey, taskId, subtaskId, prompt }) {
      const job = normalizeJobRow(await remote.insertJob({ id, runnerId, projectKey, taskId, subtaskId, prompt }));
      if (!job) throw new Error('The cloud returned an invalid job');
      upsertJob(job);
      emit();
      return job;
    },
    /** Cancels a queued job, or asks the runner to stop a running one (close: closes it right away - see cloud.js). */
    async cancel(jobId, { close = false } = {}) {
      const job = normalizeJobRow(await remote.cancelJob(jobId, { close }));
      if (job) {
        upsertJob(job);
        emit();
      }
      return job;
    },
  };
}
