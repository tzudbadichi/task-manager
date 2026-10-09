// The runner's side of the cloud queue (tables agent_runners and agent_jobs - see supabase/schema.sql).
// It signs in as the same user as the board, so row-level security limits it to that user's rows; on top
// of that every query here is limited to the jobs addressed to this machine (runner_id).

const RUNNERS_TABLE = 'agent_runners';
const JOBS_TABLE = 'agent_jobs';
const JOB_COLUMNS = 'id, runner_id, project_key, task_id, subtask_id, prompt, status, cancel_requested, created_at';

function dataOf({ data, error }) {
  if (error) throw error;
  return data;
}

export function createRunnerRemote(client, { runnerId }) {
  const jobs = () => client.from(JOBS_TABLE);
  return {
    /** Heartbeat: the machine's name and the projects it offers (key, name, engine, profile label - no paths). */
    async heartbeat({ name, projects }) {
      dataOf(await client.from(RUNNERS_TABLE).upsert({ id: runnerId, name, projects }, { onConflict: 'id' }));
    },
    /** This machine's jobs in the given statuses, oldest first (that is the order they run in). */
    async listJobs(statuses) {
      return dataOf(await jobs().select(JOB_COLUMNS).eq('runner_id', runnerId).in('status', statuses)
        .order('created_at', { ascending: true }).limit(100));
    },
    /** Takes a queued job. The update is conditional, so a job cancelled in the meantime is not taken. Returns the row or null. */
    async claimJob(jobId) {
      const rows = dataOf(await jobs().update({ status: 'running' }).eq('id', jobId).eq('runner_id', runnerId).eq('status', 'queued')
        .select(JOB_COLUMNS));
      return rows[0] ?? null;
    },
    /** Ids of running jobs whose stop was requested from the board. */
    async listCancelRequests(jobIds) {
      if (jobIds.length === 0) return [];
      const rows = dataOf(await jobs().select('id').in('id', jobIds).eq('cancel_requested', true));
      return rows.map(row => row.id);
    },
    /**
     * Writes the outcome of a job that this machine ran (or refuses to run). fields: status + summary, error,
     * branch, worktree_path, changed_files. Returns false when the job was no longer open (nothing to update).
     */
    async finishJob(jobId, fields) {
      const rows = dataOf(await jobs().update(fields).eq('id', jobId).eq('runner_id', runnerId).in('status', ['queued', 'running'])
        .select('id'));
      return rows.length > 0;
    },
    /** Removes this machine's finished jobs created before the given time (keeps the queue table small). */
    async deleteFinishedBefore(isoTime) {
      dataOf(await jobs().delete().eq('runner_id', runnerId).in('status', ['done', 'failed', 'cancelled']).lt('created_at', isoTime));
    },
    /**
     * onChange() whenever a job of this machine is added or changes (a new job, a stop request), and once
     * each time the live channel (re)connects. Returns unsubscribe.
     */
    subscribe(onChange) {
      const channel = client
        .channel(`agent-runner-${runnerId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: JOBS_TABLE, filter: `runner_id=eq.${runnerId}` }, () => onChange())
        .subscribe(channelStatus => {
          if (channelStatus === 'SUBSCRIBED') onChange();
        });
      return () => client.removeChannel(channel);
    },
  };
}
