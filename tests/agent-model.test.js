import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AGENT_LIMITS, RUNNER_ONLINE_MS, agentSyncActions, composeAgentPrompt, isNewerJobState, jobsOfSubtask, laterCopyOfJob,
  latestJobBySubtask, listAgentProjects, normalizeAgentJobRef, normalizeJobRow, normalizeRunnerRow, pickRunnerForJob,
  promptContextFor, subtaskKey, subtaskStatusForJob, vscodeFolderLink,
} from '../src/js/agent-model.js';

const T0 = Date.UTC(2026, 9, 8, 9, 0, 0);
const MINUTE = 60_000;

function runner(id, { lastSeenAt = T0, projects = [] } = {}) {
  return { id, name: `pc-${id}`, lastSeenAt, projects };
}

function job(id, { taskId = 't1', subtaskId = 's1', status = 'queued', createdAt = T0, runnerId = 'r1', projectKey = 'portal' } = {}) {
  return { id, taskId, subtaskId, status, createdAt, runnerId, projectKey };
}

describe('subtaskStatusForJob', () => {
  test('working agent = waiting for a reply; finished agent = on me; a done subtask is only reopened by sending again', () => {
    assert.equal(subtaskStatusForJob('queued', 'todo'), 'waiting');
    assert.equal(subtaskStatusForJob('queued', 'done'), 'waiting');
    assert.equal(subtaskStatusForJob('running', 'in_progress'), 'waiting');
    assert.equal(subtaskStatusForJob('running', 'done'), null);
    assert.equal(subtaskStatusForJob('done', 'waiting'), 'in_progress');
    assert.equal(subtaskStatusForJob('failed', 'waiting'), 'in_progress');
    assert.equal(subtaskStatusForJob('cancelled', 'todo'), 'in_progress');
    assert.equal(subtaskStatusForJob('done', 'done'), null);
  });
});

describe('isNewerJobState', () => {
  test('the same job only moves forward; another job counts when it is not older', () => {
    const known = { id: 'j1', status: 'running', createdAt: T0 };
    assert.equal(isNewerJobState(null, 'j1', 'queued', T0), true);
    assert.equal(isNewerJobState(known, 'j1', 'queued', T0), false);
    assert.equal(isNewerJobState(known, 'j1', 'running', T0), false);
    assert.equal(isNewerJobState(known, 'j1', 'done', T0), true);
    assert.equal(isNewerJobState(known, 'j0', 'done', T0 - 1), false);
    assert.equal(isNewerJobState(known, 'j2', 'queued', T0 + 1), true);
  });

  test('two jobs created in the same millisecond are ordered by id, the same way on every device', () => {
    const known = { id: 'b', status: 'queued', createdAt: T0 };
    assert.equal(isNewerJobState(known, 'a', 'queued', T0), false);
    assert.equal(isNewerJobState(known, 'c', 'queued', T0), true);
    const latest = latestJobBySubtask([job('c', { createdAt: T0 }), job('a', { createdAt: T0 })]);
    assert.equal(latest.get(subtaskKey('t1', 's1')).id, 'c');
  });

  test('laterCopyOfJob never keeps a copy that is behind', () => {
    const running = job('j1', { status: 'running' });
    const done = job('j1', { status: 'done' });
    assert.equal(laterCopyOfJob(done, running), done);
    assert.equal(laterCopyOfJob(running, done), done);
    const stopRequested = { ...running, cancelRequested: true };
    assert.equal(laterCopyOfJob(running, stopRequested), stopRequested, 'same stage: the incoming copy');
    assert.equal(laterCopyOfJob(undefined, running), running);
  });
});

describe('normalizing untrusted rows', () => {
  test('normalizeAgentJobRef keeps only a valid { id, status, createdAt }', () => {
    assert.deepEqual(normalizeAgentJobRef({ id: 'j1', status: 'done', createdAt: T0, extra: 1 }), { id: 'j1', status: 'done', createdAt: T0 });
    assert.equal(normalizeAgentJobRef({ id: 'j1', status: 'weird', createdAt: T0 }), null);
    assert.equal(normalizeAgentJobRef({ id: '', status: 'done', createdAt: T0 }), null);
    assert.equal(normalizeAgentJobRef({ id: 'x'.repeat(AGENT_LIMITS.jobId + 1), status: 'done', createdAt: T0 }), null);
    assert.equal(normalizeAgentJobRef({ id: 'j1', status: 'done', createdAt: 'yesterday' }), null);
    assert.equal(normalizeAgentJobRef('garbage'), null);
  });

  test('normalizeRunnerRow drops invalid and duplicate projects and parses the heartbeat', () => {
    const row = {
      id: 'r1', name: '  Work   PC ', last_seen_at: new Date(T0).toISOString(),
      projects: [
        { key: 'portal', name: 'Portal', engine: 'claude', profile: 'עבודה' },
        { key: 'portal', name: 'Duplicate' },
        { key: 'Bad Key', name: 'x' },
        { key: 'notes', engine: 'gpt-x' },
        'garbage',
      ],
    };
    assert.deepEqual(normalizeRunnerRow(row), {
      id: 'r1', name: 'Work PC', lastSeenAt: T0,
      projects: [
        { key: 'portal', name: 'Portal', engine: 'claude', profile: 'עבודה' },
        { key: 'notes', name: 'notes', engine: null, profile: '' },
      ],
    });
    assert.equal(normalizeRunnerRow({ name: 'no id' }), null);
  });

  test('normalizeJobRow maps snake_case columns and rejects unknown statuses', () => {
    const normalized = normalizeJobRow({
      id: 'j1', runner_id: 'r1', project_key: 'portal', task_id: 't1', subtask_id: 's1', prompt: 'do it', status: 'done',
      cancel_requested: false, summary: 'did it', error: null, branch: 'agent/portal-x', worktree_path: 'C:\\wt\\x', changed_files: 3,
      created_at: new Date(T0).toISOString(), started_at: new Date(T0 + MINUTE).toISOString(), finished_at: null,
    });
    assert.equal(normalized.status, 'done');
    assert.equal(normalized.createdAt, T0);
    assert.equal(normalized.startedAt, T0 + MINUTE);
    assert.equal(normalized.finishedAt, null);
    assert.equal(normalized.changedFiles, 3);
    assert.equal(normalized.error, '');
    assert.equal(normalizeJobRow({ id: 'j2', status: 'exploded' }), null);
    assert.equal(normalizeJobRow({ id: 'j3', status: 'queued', changed_files: -2 }).changedFiles, null);
  });
});

describe('projects and machines', () => {
  const portal = { key: 'portal', name: 'Portal', engine: 'claude', profile: 'עבודה' };
  const notes = { key: 'notes', name: 'Notes', engine: 'codex', profile: 'אישי' };

  test('listAgentProjects merges a project offered by two machines and tells whether any is connected', () => {
    const runners = [
      runner('work', { projects: [portal, notes] }),
      runner('home', { lastSeenAt: T0 - RUNNER_ONLINE_MS - 1, projects: [notes] }),
    ];
    const projects = listAgentProjects(runners, T0);
    assert.deepEqual(projects.map(project => [project.key, project.online, project.runners.map(item => [item.id, item.online])]), [
      ['notes', true, [['work', true], ['home', false]]],
      ['portal', true, [['work', true]]],
    ]);
    assert.equal(projects.some(project => project.isMismatched), false);
  });

  test('a key that means another engine or profile on another machine is marked as mismatched', () => {
    const runners = [
      runner('work', { projects: [portal] }),
      runner('home', { projects: [{ ...portal, engine: 'codex', profile: 'אישי' }] }),
    ];
    assert.equal(listAgentProjects(runners, T0)[0].isMismatched, true);
  });

  test('pickRunnerForJob keeps a task on the machine that ran it, else takes the connected one seen last', () => {
    const runners = [
      runner('a', { lastSeenAt: T0 - MINUTE, projects: [portal] }),
      runner('b', { lastSeenAt: T0, projects: [portal] }),
      runner('c', { lastSeenAt: T0 - RUNNER_ONLINE_MS - 1, projects: [portal] }),
    ];
    assert.equal(pickRunnerForJob('portal', runners, [], T0).id, 'b');
    assert.equal(pickRunnerForJob('portal', runners, [job('j1', { runnerId: 'a' })], T0).id, 'a');
    // The machine of the previous job is offline: the conversation cannot continue there, so another one takes it.
    assert.equal(pickRunnerForJob('portal', runners, [job('j1', { runnerId: 'c' })], T0).id, 'b');
    assert.equal(pickRunnerForJob('unknown', runners, [], T0), null);
  });
});

describe('jobs per subtask and the sync actions', () => {
  test('jobsOfSubtask is oldest first; latestJobBySubtask keeps the newest per subtask', () => {
    const jobs = [job('j2', { createdAt: T0 + 2 }), job('j1', { createdAt: T0 + 1 }), job('other', { subtaskId: 's2' })];
    assert.deepEqual(jobsOfSubtask(jobs, 't1', 's1').map(item => item.id), ['j1', 'j2']);
    const latest = latestJobBySubtask(jobs);
    assert.equal(latest.get(subtaskKey('t1', 's1')).id, 'j2');
    assert.equal(latest.get(subtaskKey('t1', 's2')).id, 'other');
  });

  test('agentSyncActions lists only subtasks whose newest job is news', () => {
    const state = {
      tasks: [{
        id: 't1',
        subtasks: [
          { id: 's1', agentJob: { id: 'j1', status: 'queued', createdAt: T0 } },
          { id: 's2', agentJob: { id: 'j3', status: 'done', createdAt: T0 } },
          { id: 's3' },
          { id: 's4' },
        ],
      }],
    };
    const jobs = [
      job('j1', { status: 'done' }),
      job('j3', { subtaskId: 's2', status: 'done' }),
      job('j4', { subtaskId: 's3', status: 'running', createdAt: T0 + 5 }),
      job('ghost', { taskId: 'deleted-task', subtaskId: 'x' }),
    ];
    assert.deepEqual(agentSyncActions(state, jobs), [
      { type: 'subtask/agentSync', taskId: 't1', subtaskId: 's1', jobId: 'j1', jobStatus: 'done', jobCreatedAt: T0 },
      { type: 'subtask/agentSync', taskId: 't1', subtaskId: 's3', jobId: 'j4', jobStatus: 'running', jobCreatedAt: T0 + 5 },
    ]);
  });
});

describe('composeAgentPrompt and promptContextFor', () => {
  const task = { title: 'Login page', description: 'The form crashes on empty email' };

  test('the context follows the conversation on the chosen machine', () => {
    const jobs = [job('j1', { subtaskId: 's1', runnerId: 'work' })];
    assert.equal(promptContextFor([], 's1', 'work'), 'task');
    assert.equal(promptContextFor(jobs, 's1', 'work'), 'none');
    assert.equal(promptContextFor(jobs, 's2', 'work'), 'subtask');
    assert.equal(promptContextFor(jobs, 's1', 'home'), 'task', 'another machine has not seen the task');
  });

  test('task context, subtask context, or the message as written', () => {
    const first = composeAgentPrompt({ task, subtask: { title: 'Fix the crash' }, message: '  add a test too ', context: 'task' });
    assert.equal(first, 'משימה: Login page\n\nתיאור המשימה:\nThe form crashes on empty email\n\nמה לעשות עכשיו: Fix the crash\n\nהנחיות נוספות:\nadd a test too');
    assert.equal(composeAgentPrompt({ task, subtask: { title: 'Login page' }, message: '', context: 'task' }),
      'משימה: Login page\n\nתיאור המשימה:\nThe form crashes on empty email');
    assert.equal(composeAgentPrompt({ task, subtask: { title: 'Add tests' }, message: '', context: 'subtask' }), 'מה לעשות עכשיו: Add tests');
    assert.equal(composeAgentPrompt({ task, subtask: { title: 'x' }, message: ' yes, go ahead ', context: 'none' }), 'yes, go ahead');
    assert.equal(composeAgentPrompt({ task, subtask: { title: 'x' }, message: 'a'.repeat(30000), context: 'none' }).length, AGENT_LIMITS.prompt);
  });
});

describe('vscodeFolderLink', () => {
  test('builds vscode://file links for local folders only', () => {
    assert.equal(vscodeFolderLink('C:\\agent-worktrees\\portal\\task 1'), 'vscode://file/C:/agent-worktrees/portal/task%201');
    assert.equal(vscodeFolderLink('/home/me/wt/x'), 'vscode://file/home/me/wt/x');
    assert.equal(vscodeFolderLink('relative/path'), null);
    assert.equal(vscodeFolderLink('javascript:alert(1)'), null);
    assert.equal(vscodeFolderLink('C:\\bad"quote'), null);
    assert.equal(vscodeFolderLink(''), null);
  });
});
