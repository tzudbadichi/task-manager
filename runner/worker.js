// The runner's loop: report in (heartbeat), watch the queue (realtime + a periodic check), take the jobs
// addressed to this machine, run each one's agent in its work folder, and write the outcome back.
//
// Order and parallelism: jobs run oldest first; up to maxParallelJobs at once; never two jobs of the same
// task at once (they share one conversation and one folder), and never two jobs of a project whose agents
// work directly in the project folder (isolation "none").
//
// Every dependency is injected, so tests/runner-worker.test.js drives it with fakes.

import { randomUUID } from 'node:crypto';
import { AGENT_LIMITS } from '../src/js/agent-model.js';
import { isMissingTableError } from '../src/js/cloud.js';
import { conversationKey } from './local-state.js';
import { buildAgentPrompt, shapeError, shapeSummary } from './outcome.js';

const POLL_INTERVAL_MS = 15_000;
const HEARTBEAT_INTERVAL_MS = 60_000;
const KEEP_FINISHED_JOBS_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const RESTARTED_MESSAGE = 'הראנר הופעל מחדש באמצע העבודה, והריצה לא הסתיימה. אפשר לשלוח שוב.';
const STOPPED_MESSAGE = 'הראנר נעצר באמצע העבודה, והריצה לא הסתיימה. אפשר לשלוח שוב.';
const RESTARTED_CONVERSATION_NOTE = '(השיחה הקודמת עם האייג\'נט לא נמצאה במחשב, ולכן התחילה שיחה חדשה באותה תיקייה. ייתכן שחסר לו הקשר מההודעות הקודמות.)';

const shortId = id => String(id).slice(0, 8);

export function createWorker({
  config,
  remote,
  localState,
  log,
  runAgent,
  prepareWorktree,
  countChangedFiles,
  isGitFolder,
  openJobLog,
  tmpDir,
  clock = () => Date.now(),
  timers = globalThis,
  pollIntervalMs = POLL_INTERVAL_MS,
  heartbeatIntervalMs = HEARTBEAT_INTERVAL_MS,
}) {
  const projectsByKey = new Map(config.projects.map(project => [project.key, project]));
  const active = new Map(); // jobId -> { controller, conversationKey, projectKey, promise }
  const pendingReports = new Map(); // jobId -> fields that could not be written yet (network)
  let stopped = false;
  let polling = false;
  let pollAgain = false;
  let currentPoll = Promise.resolve();
  let pollTimer = null;
  let heartbeatTimer = null;
  let unsubscribe = null;

  const advertisedProjects = () => config.projects.map(project => ({
    key: project.key,
    name: project.name,
    engine: config.profiles[project.profile].engine,
    profile: config.profiles[project.profile].label,
  }));

  async function heartbeat() {
    await remote.heartbeat({ name: config.runnerName, projects: advertisedProjects() });
  }

  async function report(jobId, fields) {
    try {
      const isRecorded = await remote.finishJob(jobId, fields);
      pendingReports.delete(jobId);
      if (!isRecorded) {
        log.warning(`Job ${shortId(jobId)} was already closed on the board - its outcome (${fields.status}) was not recorded`);
        return;
      }
      // The error text is Hebrew (it is shown on the board); the console only says where the details are.
      const message = `Job ${shortId(jobId)} ${fields.status}${Number.isInteger(fields.changed_files) ? ` (${fields.changed_files} files changed)` : ''}`;
      if (fields.status === 'done') log.success(message);
      else if (fields.status === 'cancelled') log.warning(message);
      else log.error(`${message} - details on the board and in logs/${jobId}.log`);
    } catch (error) {
      pendingReports.set(jobId, fields);
      log.warning(`Could not report job ${shortId(jobId)} yet (${error.message}) - will retry`);
    }
  }

  async function retryReports() {
    for (const [jobId, fields] of [...pendingReports]) await report(jobId, fields);
  }

  async function forwardCancelRequests() {
    const requested = await remote.listCancelRequests([...active.keys()]);
    for (const jobId of requested) {
      const entry = active.get(jobId);
      if (entry && !entry.controller.signal.aborted) {
        log.warning(`Stop requested for job ${shortId(jobId)} - stopping the agent`);
        entry.controller.abort();
      }
    }
  }

  function isBusy(job, project) {
    const key = conversationKey(project.key, job.task_id);
    for (const entry of active.values()) {
      if (entry.conversationKey === key) return true;
      if (project.isolation === 'none' && entry.projectKey === project.key) return true;
    }
    return false;
  }

  /** Why this machine will not run a job (Hebrew, shown on the board), or null. */
  function refusalOf(job, project) {
    if (!project) return `הפרויקט "${job.project_key}" לא מוגדר בראנר של "${config.runnerName}". אולי הוא הוסר מההגדרות.`;
    if (typeof job.prompt !== 'string' || job.prompt.trim() === '' || job.prompt.length > AGENT_LIMITS.prompt) return 'ההודעה ריקה או ארוכה מדי';
    return null;
  }

  function poll() {
    if (stopped) return Promise.resolve();
    if (polling) {
      pollAgain = true;
      return currentPoll;
    }
    polling = true;
    currentPoll = checkQueue();
    return currentPoll;
  }

  async function checkQueue() {
    try {
      await retryReports();
      if (active.size > 0) await forwardCancelRequests();
      for (const job of await remote.listJobs(['queued'])) {
        if (stopped || active.size >= config.maxParallelJobs) break;
        const project = projectsByKey.get(job.project_key) ?? null;
        const refusal = refusalOf(job, project);
        if (refusal) {
          log.warning(`Job ${shortId(job.id)} refused: project "${job.project_key}" is not configured here, or the message is invalid`);
          await report(job.id, { status: 'failed', error: refusal });
          continue;
        }
        if (isBusy(job, project)) continue;
        const claimed = await remote.claimJob(job.id);
        if (!claimed) continue;
        if (stopped) {
          // Stopping began while the claim was on its way: give the job back as not done, instead of leaving it "running".
          await report(claimed.id, { status: 'failed', error: STOPPED_MESSAGE });
          break;
        }
        startJob(claimed, project);
      }
    } catch (error) {
      log.warning(`Could not check the queue: ${error.message}`);
    } finally {
      polling = false;
      if (pollAgain && !stopped) {
        pollAgain = false;
        poll();
      }
    }
  }

  function startJob(job, project) {
    const controller = new AbortController();
    const entry = { controller, conversationKey: conversationKey(project.key, job.task_id), projectKey: project.key, promise: null };
    active.set(job.id, entry);
    log.info(`Job ${shortId(job.id)} started: project "${project.key}" (${config.profiles[project.profile].name}), task ${job.task_id}`);
    entry.promise = runJob(job, project, controller.signal)
      .then(fields => report(job.id, stopped && fields.status === 'cancelled' ? { ...fields, status: 'failed', error: STOPPED_MESSAGE } : fields))
      .finally(() => {
        active.delete(job.id);
        if (!stopped) poll(); // a slot is free: take the next job
      });
  }

  const accountOf = profile => (profile.engine === 'claude' ? profile.claudeConfigDir : profile.codexHome) ?? null;

  function newConversation(workspace, profile) {
    return {
      ...workspace,
      engine: profile.engine,
      profile: profile.name,
      account: accountOf(profile),
      // Claude Code takes a session id chosen in advance; Codex reports its thread id after the first answer.
      sessionId: profile.engine === 'claude' ? randomUUID() : null,
      started: false,
      lastUsedAt: clock(),
    };
  }

  /**
   * The task's conversation on this machine: its work folder (a git worktree per task, or the project folder
   * with isolation "none") and the agent's session. A conversation belongs to one engine, profile and account
   * folder; if the config changed since, a new conversation starts in the same folder.
   */
  async function ensureConversation(key, project, profile, taskId) {
    const previous = localState.getConversation(key);
    let workspace;
    if (project.isolation === 'worktree') {
      const prepared = await prepareWorktree({ project, taskId, worktreesDir: profile.worktreesDir });
      // The first base commit is kept, so "files changed" counts everything since the task started.
      const baseCommit = previous?.folder === prepared.worktreePath && previous.baseCommit ? previous.baseCommit : prepared.baseCommit;
      workspace = { folder: prepared.worktreePath, branch: prepared.branch, baseCommit, isGit: true };
    } else {
      workspace = { folder: project.path, branch: null, baseCommit: null, isGit: await isGitFolder(project.path) };
    }
    const isSameAgent = previous && previous.engine === profile.engine && previous.profile === profile.name
      && (previous.account ?? null) === accountOf(profile) && previous.folder === workspace.folder;
    return isSameAgent ? { ...previous, ...workspace } : newConversation(workspace, profile);
  }

  /** Whether this run produced a conversation the next message can continue. */
  function hasStarted(conversation, outcome, profile) {
    if (conversation.started) return true;
    return profile.engine === 'claude' ? outcome.sessionId !== null : Boolean(outcome.sessionId ?? conversation.sessionId);
  }

  /**
   * A continued conversation that failed without any answer - the agent could not even resume it (its
   * transcript was cleaned up, or it lives under another account folder) - is started over once. The new one
   * is kept only if it really started, so a passing network error never throws away a good conversation.
   */
  function cannotContinue(conversation, outcome) {
    return conversation.started && !outcome.ok && !outcome.cancelled && !outcome.timedOut && !outcome.text;
  }

  async function runJob(job, project, signal) {
    const profile = config.profiles[project.profile];
    const key = conversationKey(project.key, job.task_id);
    let jobLog = { write() {}, end() {} };
    try {
      jobLog = await openJobLog(job.id);
      jobLog.write(`# Job ${job.id}\n# Project ${project.key} - profile ${profile.name} (${profile.engine})\n`
        + `# Task ${job.task_id} / subtask ${job.subtask_id}\n\n## Message\n${job.prompt}\n\n## Agent output\n`);
      const runWith = conversation => runAgent({
        profile,
        conversation,
        prompt: buildAgentPrompt(job.prompt, { isNewConversation: !conversation.started, cloudReport: profile.cloudReport }),
        cwd: conversation.folder,
        timeoutMs: config.jobTimeoutMinutes * 60_000,
        signal,
        log: jobLog,
        tmpDir,
        jobId: job.id,
        skipGitRepoCheck: !conversation.isGit,
      });

      let conversation = await ensureConversation(key, project, profile, job.task_id);
      let outcome = await runWith(conversation);
      let isRestarted = false;
      if (cannotContinue(conversation, outcome)) {
        jobLog.write('\n\n## The conversation could not be continued - starting a new one\n');
        const fresh = newConversation(conversation, profile);
        const freshOutcome = await runWith(fresh);
        if (hasStarted(fresh, freshOutcome, profile)) {
          conversation = fresh;
          outcome = freshOutcome;
          isRestarted = true;
        }
      }

      // Remember the conversation, so the next message continues it. A Claude conversation that did not
      // start gets a fresh id, so a half-created session can never clash with the next attempt.
      const started = hasStarted(conversation, outcome, profile);
      const sessionId = outcome.sessionId ?? conversation.sessionId;
      await localState.setConversation(key, {
        ...conversation,
        sessionId: profile.engine === 'claude' && !started ? randomUUID() : sessionId,
        started,
        lastUsedAt: clock(),
      }).catch(error => log.warning(`Could not save state.json (${error.message}) - the next message may start a new conversation`));

      const changedFiles = conversation.isGit
        ? await countChangedFiles({ folder: conversation.folder, baseCommit: conversation.baseCommit }).catch(() => null)
        : null;
      const status = outcome.cancelled ? 'cancelled' : outcome.ok ? 'done' : 'failed';
      jobLog.write(`\n\n## Outcome: ${status}\n${outcome.text ?? ''}\n${outcome.error ?? ''}\n`);
      const answer = isRestarted && outcome.text ? `${RESTARTED_CONVERSATION_NOTE}\n\n${outcome.text}` : outcome.text;
      return {
        status,
        summary: shapeSummary(answer, profile.cloudReport),
        error: outcome.ok ? null : shapeError(outcome.error, profile.cloudReport),
        branch: conversation.branch,
        worktree_path: conversation.folder,
        changed_files: changedFiles,
      };
    } catch (error) {
      jobLog.write(`\n\n## Runner error\n${error.stack ?? error.message}\n`);
      return { status: signal.aborted ? 'cancelled' : 'failed', error: shapeError(`הראנר נכשל: ${error.message}`, profile.cloudReport) };
    } finally {
      jobLog.end();
    }
  }

  return {
    get activeCount() { return active.size; },
    /** Reports in, closes jobs a previous run left open, and starts watching the queue. Throws when the agent tables are missing. */
    async start() {
      try {
        await heartbeat();
      } catch (error) {
        if (isMissingTableError(error)) throw new Error('The agent tables do not exist in Supabase yet. Run the updated supabase/schema.sql in the SQL Editor first.');
        log.warning(`Heartbeat failed (${error.message}) - will keep trying`);
      }
      try {
        for (const job of await remote.listJobs(['running'])) {
          await report(job.id, { status: 'failed', error: RESTARTED_MESSAGE });
        }
        await remote.deleteFinishedBefore(new Date(clock() - KEEP_FINISHED_JOBS_DAYS * DAY_MS).toISOString());
      } catch (error) {
        log.warning(`Startup cleanup failed: ${error.message}`);
      }
      unsubscribe = remote.subscribe(() => poll());
      heartbeatTimer = timers.setInterval(() => heartbeat().catch(error => log.warning(`Heartbeat failed: ${error.message}`)), heartbeatIntervalMs);
      pollTimer = timers.setInterval(() => poll(), pollIntervalMs);
      await poll();
    },
    /** Stops taking jobs, stops the running agents and reports them, then resolves. */
    async stop() {
      stopped = true;
      if (pollTimer !== null) timers.clearInterval(pollTimer);
      if (heartbeatTimer !== null) timers.clearInterval(heartbeatTimer);
      unsubscribe?.();
      await currentPoll; // a claim on its way either starts its job (stopped below) or gives the job back
      for (const entry of active.values()) entry.controller.abort();
      await Promise.allSettled([...active.values()].map(entry => entry.promise));
    },
    poll,
  };
}
