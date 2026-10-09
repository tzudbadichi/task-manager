// Agent farm: DOM-free rules shared by the store, the UI and the tests (see Kingdom_of_Claudes_Beloved_MDs/AGENT_FARM.md).
//
// A task can be linked to an agent project (task.agentProject = the key of a project that a runner on a
// dev machine offers). Each subtask of such a task can be sent to the agent: that inserts a job into the
// cloud queue (table agent_jobs); the runner on that machine runs Claude Code / Codex and writes the
// outcome back. The latest job of a subtask is mirrored into the task document (subtask.agentJob), and
// its state moves the subtask's status: while the agent works the subtask is "waiting for a reply";
// when the agent is done (or failed), the ball is back with me - "in progress, on me".

import { cleanText } from './utils.js';

export const AGENT_JOB_STATUSES = Object.freeze(['queued', 'running', 'done', 'failed', 'cancelled']);
// A job only moves forward: queued -> running -> one of the final states.
const JOB_RANK = Object.freeze({ queued: 0, running: 1, done: 2, failed: 2, cancelled: 2 });

export const AGENT_PROJECT_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]{0,39}$/;
export const AGENT_LIMITS = Object.freeze({ prompt: 20000, jobId: 100, projectsPerRunner: 50 });

// A runner reports in every minute; after this long without a sign it is shown as not connected.
export const RUNNER_ONLINE_MS = 3 * 60_000;

export const AGENT_JOB_VIEW = Object.freeze({
  queued: { label: 'ממתין בתור', hint: 'נשלח, ומחכה שהמחשב יתחיל לעבוד עליו' },
  running: { label: 'האייג\'נט עובד', hint: 'האייג\'נט עובד על זה עכשיו' },
  done: { label: 'סיים - תורך', hint: 'האייג\'נט סיים, ומחכה שתעבור על התוצאה או שתענה לו' },
  failed: { label: 'נכשל', hint: 'הריצה נכשלה - הפרטים בחלון האייג\'נט' },
  cancelled: { label: 'בוטל', hint: 'הריצה בוטלה' },
});

export const ENGINE_LABELS = Object.freeze({ claude: 'Claude Code', codex: 'Codex' });

export function isAgentJobStatus(value) {
  return typeof value === 'string' && Object.hasOwn(JOB_RANK, value);
}

export function isAgentProjectKey(value) {
  return typeof value === 'string' && AGENT_PROJECT_KEY_PATTERN.test(value);
}

/** Queued or running: the agent has not answered yet. */
export function isJobActive(status) {
  return status === 'queued' || status === 'running';
}

export function agentJobRank(status) {
  return JOB_RANK[status] ?? -1;
}

/**
 * The status a job's state moves its subtask to, or null to leave it as it is.
 * Sending (queued) always means "waiting for the agent", even for a subtask that was done - it was sent again.
 * Later updates never reopen a subtask that was marked done meanwhile.
 */
export function subtaskStatusForJob(jobStatus, currentStatus) {
  if (jobStatus === 'queued') return 'waiting';
  if (currentStatus === 'done') return null;
  return isJobActive(jobStatus) ? 'waiting' : 'in_progress';
}

/** subtask.agentJob as stored in the document ({ id, status, createdAt }), or null when it is not valid. */
export function normalizeAgentJobRef(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const { id, status, createdAt } = raw;
  if (typeof id !== 'string' || !id || id.length > AGENT_LIMITS.jobId || !isAgentJobStatus(status)) return null;
  if (!Number.isFinite(createdAt) || createdAt <= 0) return null;
  return { id, status, createdAt };
}

// ---------------------------------------------------------------------------
// Rows from the cloud tables are untrusted: rebuilt field by field.
// ---------------------------------------------------------------------------

function timestampOf(value) {
  const parsed = typeof value === 'string' ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalText(value, maxLength) {
  return typeof value === 'string' ? value.slice(0, maxLength) : '';
}

function normalizeProjectInfo(raw) {
  if (!raw || typeof raw !== 'object' || !isAgentProjectKey(raw.key)) return null;
  return {
    key: raw.key,
    name: cleanText(raw.name, 60) || raw.key,
    engine: Object.hasOwn(ENGINE_LABELS, raw.engine) ? raw.engine : null,
    profile: cleanText(raw.profile, 30),
  };
}

/** A row of agent_runners: one dev machine running the runner, and the projects it offers. */
export function normalizeRunnerRow(row) {
  if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !row.id) return null;
  const projects = [];
  for (const rawProject of Array.isArray(row.projects) ? row.projects : []) {
    const project = normalizeProjectInfo(rawProject);
    if (project && !projects.some(item => item.key === project.key)) projects.push(project);
    if (projects.length >= AGENT_LIMITS.projectsPerRunner) break;
  }
  return { id: row.id, name: cleanText(row.name, 60) || 'מחשב', lastSeenAt: timestampOf(row.last_seen_at) ?? 0, projects };
}

/** A row of agent_jobs: one message to an agent and, once it ran, the agent's answer. */
export function normalizeJobRow(row) {
  if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !row.id || !isAgentJobStatus(row.status)) return null;
  return {
    id: row.id,
    runnerId: typeof row.runner_id === 'string' ? row.runner_id : '',
    projectKey: typeof row.project_key === 'string' ? row.project_key : '',
    taskId: typeof row.task_id === 'string' ? row.task_id : '',
    subtaskId: typeof row.subtask_id === 'string' ? row.subtask_id : '',
    prompt: optionalText(row.prompt, AGENT_LIMITS.prompt),
    status: row.status,
    cancelRequested: row.cancel_requested === true,
    summary: optionalText(row.summary, 8000),
    error: optionalText(row.error, 2000),
    branch: optionalText(row.branch, 200),
    worktreePath: optionalText(row.worktree_path, 500),
    changedFiles: Number.isInteger(row.changed_files) && row.changed_files >= 0 ? row.changed_files : null,
    createdAt: timestampOf(row.created_at) ?? 0,
    startedAt: timestampOf(row.started_at),
    finishedAt: timestampOf(row.finished_at),
  };
}

// ---------------------------------------------------------------------------
// Derivations used by the UI
// ---------------------------------------------------------------------------

export function isRunnerOnline(runner, now) {
  return now - runner.lastSeenAt < RUNNER_ONLINE_MS;
}

/**
 * Every project the runners offer, merged by key (the same project may be set up on two machines):
 * name, engine, profile, the machines that have it and whether any of them is connected. Sorted by name.
 * isMismatched: the machines disagree on the engine or the profile of that key - nothing is sent to it
 * then, so a work task can never land on a machine where the same key means the personal account.
 */
export function listAgentProjects(runners, now) {
  const byKey = new Map();
  for (const runner of runners) {
    for (const project of runner.projects) {
      const entry = byKey.get(project.key) ?? { ...project, runners: [], isMismatched: false };
      if (entry.engine !== project.engine || entry.profile !== project.profile) entry.isMismatched = true;
      entry.runners.push({ id: runner.id, name: runner.name, online: isRunnerOnline(runner, now) });
      byKey.set(project.key, entry);
    }
  }
  return [...byKey.values()]
    .map(project => ({ ...project, online: project.runners.some(runner => runner.online) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'he'));
}

const byCreatedAt = (a, b) => a.createdAt - b.createdAt;

/**
 * The machine that gets a new job of a task: the one that ran the task's previous job (it holds the
 * agent's conversation and work folder) while it is connected; otherwise the connected one seen last.
 */
export function pickRunnerForJob(projectKey, runners, taskJobs, now) {
  const candidates = runners.filter(runner => isRunnerOnline(runner, now) && runner.projects.some(project => project.key === projectKey));
  if (candidates.length === 0) return null;
  const previousRunnerId = taskJobs.filter(job => job.projectKey === projectKey).sort(byCreatedAt).at(-1)?.runnerId;
  return candidates.find(runner => runner.id === previousRunnerId)
    ?? candidates.reduce((latest, runner) => (runner.lastSeenAt > latest.lastSeenAt ? runner : latest));
}

/** The conversation of one subtask with its agent, oldest first. */
export function jobsOfSubtask(jobs, taskId, subtaskId) {
  return jobs.filter(job => job.taskId === taskId && job.subtaskId === subtaskId).sort(byCreatedAt);
}

export function subtaskKey(taskId, subtaskId) {
  return `${taskId}\u0000${subtaskId}`;
}

// Newer job first; two jobs created in the same millisecond (two devices) are ordered by id, so every device agrees.
function isLaterJob(createdAt, id, otherCreatedAt, otherId) {
  return createdAt > otherCreatedAt || (createdAt === otherCreatedAt && id > otherId);
}

/** Map of subtaskKey -> that subtask's newest job. */
export function latestJobBySubtask(jobs) {
  const latest = new Map();
  for (const job of jobs) {
    const key = subtaskKey(job.taskId, job.subtaskId);
    const current = latest.get(key);
    if (!current || isLaterJob(job.createdAt, job.id, current.createdAt, current.id)) latest.set(key, job);
  }
  return latest;
}

/**
 * The subtask/agentSync actions that bring the document up to date with the jobs: one per subtask whose
 * newest job is newer, or further along, than what the document has. Empty when everything matches.
 */
export function agentSyncActions(state, jobs) {
  const latest = latestJobBySubtask(jobs);
  const actions = [];
  for (const task of state.tasks) {
    for (const subtask of task.subtasks) {
      const job = latest.get(subtaskKey(task.id, subtask.id));
      if (!job || !isNewerJobState(subtask.agentJob, job.id, job.status, job.createdAt)) continue;
      actions.push({
        type: 'subtask/agentSync', taskId: task.id, subtaskId: subtask.id, jobId: job.id, jobStatus: job.status, jobCreatedAt: job.createdAt,
      });
    }
  }
  return actions;
}

/** Whether a job state is news compared to what a subtask already shows (same job further along, or a newer job). */
export function isNewerJobState(known, jobId, jobStatus, jobCreatedAt) {
  if (!known) return true;
  if (known.id === jobId) return agentJobRank(jobStatus) > agentJobRank(known.status);
  return isLaterJob(jobCreatedAt, jobId, known.createdAt, known.id);
}

/**
 * How much context a new message needs. The runner keeps one conversation per task on each machine, so:
 * 'task' - the first message of the task on that machine (title, description and the subtask);
 * 'subtask' - the first message of another subtask in a conversation that already exists;
 * 'none' - a reply in an ongoing subtask.
 */
export function promptContextFor(taskJobs, subtaskId, runnerId) {
  const onRunner = taskJobs.filter(job => job.runnerId === runnerId);
  if (onRunner.length === 0) return 'task';
  return onRunner.some(job => job.subtaskId === subtaskId) ? 'none' : 'subtask';
}

/** The text sent to the agent, with the context the conversation does not have yet (promptContextFor). */
export function composeAgentPrompt({ task, subtask, message, context }) {
  const text = String(message ?? '').trim();
  if (context === 'none') return text.slice(0, AGENT_LIMITS.prompt);
  const parts = [];
  if (context === 'task') {
    parts.push(`משימה: ${task.title}`);
    if (task.description) parts.push(`תיאור המשימה:\n${task.description}`);
  }
  if (subtask.title !== task.title || context === 'subtask') parts.push(`מה לעשות עכשיו: ${subtask.title}`);
  if (text) parts.push(`הנחיות נוספות:\n${text}`);
  return parts.join('\n\n').slice(0, AGENT_LIMITS.prompt);
}

/**
 * The copy of a job to keep when two copies of the same job meet (a reply that left before a realtime update
 * arrived): never one that is behind - a job only moves forward. Same stage: the incoming copy.
 */
export function laterCopyOfJob(existing, incoming) {
  return existing && agentJobRank(existing.status) > agentJobRank(incoming.status) ? existing : incoming;
}

// Paths a runner reports for its work folders: a Windows drive path or an absolute POSIX path, nothing exotic.
const LOCAL_PATH_PATTERN = /^(?:[A-Za-z]:[\\/]|\/)[^<>"|?*\u0000-\u001f]*$/;

/** A vscode:// link that opens a job's work folder in VS Code, or null when the path does not look like a local folder. */
export function vscodeFolderLink(folderPath) {
  if (typeof folderPath !== 'string' || folderPath.length > 500 || !LOCAL_PATH_PATTERN.test(folderPath)) return null;
  const forward = folderPath.replace(/\\/g, '/');
  return `vscode://file/${encodeURI(forward.startsWith('/') ? forward.slice(1) : forward)}`;
}
