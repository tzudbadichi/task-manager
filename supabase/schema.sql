-- Task manager - Supabase schema.
-- Run once in the Supabase dashboard: SQL Editor -> New query -> paste this file -> Run.
-- Safe to run again: every statement is idempotent.
--
-- Model: one row per user holding the whole app state as JSON (`data`), plus a `version`
-- number for optimistic concurrency. The browser only updates "where version = <the version
-- it last saw>"; the trigger below bumps the version on every update, so a save based on an
-- outdated copy matches no row and the app re-syncs instead of overwriting another device.

create table if not exists public.task_manager_documents (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  version bigint not null default 1,
  updated_at timestamptz not null default now(),
  constraint task_manager_documents_data_is_object check (jsonb_typeof(data) = 'object'),
  constraint task_manager_documents_data_size check (pg_column_size(data) < 2000000)
);

-- Row-level security: every query is limited to the signed-in user's own row.
alter table public.task_manager_documents enable row level security;

drop policy if exists "task manager: read own document" on public.task_manager_documents;
create policy "task manager: read own document" on public.task_manager_documents
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "task manager: create own document" on public.task_manager_documents;
create policy "task manager: create own document" on public.task_manager_documents
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "task manager: update own document" on public.task_manager_documents;
create policy "task manager: update own document" on public.task_manager_documents
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "task manager: delete own document" on public.task_manager_documents;
create policy "task manager: delete own document" on public.task_manager_documents
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Only signed-in users can reach the table at all.
revoke all on public.task_manager_documents from anon;
grant select, insert, update, delete on public.task_manager_documents to authenticated;

-- Versions are managed by the database, never by the client.
create or replace function public.task_manager_set_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1;
  else
    new.version := old.version + 1;
    new.user_id := old.user_id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists task_manager_documents_set_version on public.task_manager_documents;
create trigger task_manager_documents_set_version
  before insert or update on public.task_manager_documents
  for each row execute function public.task_manager_set_version();

-- Realtime: other devices hear about a change right away (row-level security still applies).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_manager_documents'
  ) then
    alter publication supabase_realtime add table public.task_manager_documents;
  end if;
end;
$$;

-- ===========================================================================
-- Agent farm: a job queue between the board and the runner (runner/) on a dev machine.
-- The board inserts a job ("send this message to the agent of project X on machine Y"); the runner on
-- that machine claims it, runs Claude Code / Codex in the project's work folder and writes the outcome
-- back. Folder paths, accounts and which engine runs a project live only in the runner's local config:
-- a job names a project key, never a path or a command.
-- ===========================================================================

-- One row per machine running the runner: its name, the projects it offers (key, name, engine, profile
-- label - no paths), and a heartbeat (last_seen_at, set by the database) that tells whether it is connected.
create table if not exists public.agent_runners (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  projects jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint agent_runners_name_length check (char_length(name) between 1 and 60),
  constraint agent_runners_projects_array check (jsonb_typeof(projects) = 'array'),
  constraint agent_runners_projects_size check (pg_column_size(projects) < 20000)
);

-- One row per message to an agent, and - once it ran - the agent's answer.
-- status: queued -> running -> done | failed | cancelled (a final state never changes again).
create table if not exists public.agent_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  runner_id uuid not null,
  project_key text not null,
  task_id text not null,
  subtask_id text not null,
  prompt text not null,
  status text not null default 'queued',
  cancel_requested boolean not null default false,
  summary text,
  error text,
  branch text,
  worktree_path text,
  changed_files integer,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint agent_jobs_status_valid check (status in ('queued', 'running', 'done', 'failed', 'cancelled')),
  constraint agent_jobs_project_key_valid check (project_key ~ '^[a-z0-9][a-z0-9_-]{0,39}$'),
  constraint agent_jobs_ids_length check (char_length(task_id) between 1 and 100 and char_length(subtask_id) between 1 and 200),
  constraint agent_jobs_prompt_length check (char_length(prompt) between 1 and 20000),
  constraint agent_jobs_summary_length check (summary is null or char_length(summary) <= 8000),
  constraint agent_jobs_error_length check (error is null or char_length(error) <= 2000),
  constraint agent_jobs_branch_length check (branch is null or char_length(branch) <= 200),
  constraint agent_jobs_worktree_length check (worktree_path is null or char_length(worktree_path) <= 500),
  constraint agent_jobs_changed_files_valid check (changed_files is null or changed_files >= 0)
);

create index if not exists agent_jobs_user_created on public.agent_jobs (user_id, created_at desc);
create index if not exists agent_jobs_runner_status on public.agent_jobs (runner_id, status, created_at);

alter table public.agent_runners enable row level security;
alter table public.agent_jobs enable row level security;

drop policy if exists "agent runners: read own" on public.agent_runners;
create policy "agent runners: read own" on public.agent_runners
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "agent runners: create own" on public.agent_runners;
create policy "agent runners: create own" on public.agent_runners
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "agent runners: update own" on public.agent_runners;
create policy "agent runners: update own" on public.agent_runners
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "agent runners: delete own" on public.agent_runners;
create policy "agent runners: delete own" on public.agent_runners
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "agent jobs: read own" on public.agent_jobs;
create policy "agent jobs: read own" on public.agent_jobs
  for select to authenticated using ((select auth.uid()) = user_id);

-- A new job always starts as a plain queued request: no answer, no stop request.
drop policy if exists "agent jobs: create own" on public.agent_jobs;
create policy "agent jobs: create own" on public.agent_jobs
  for insert to authenticated with check (
    (select auth.uid()) = user_id and status = 'queued' and cancel_requested = false
    and summary is null and error is null and branch is null and worktree_path is null and changed_files is null
  );

drop policy if exists "agent jobs: update own" on public.agent_jobs;
create policy "agent jobs: update own" on public.agent_jobs
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "agent jobs: delete own" on public.agent_jobs;
create policy "agent jobs: delete own" on public.agent_jobs
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.agent_runners from anon;
revoke all on public.agent_jobs from anon;
grant select, insert, update, delete on public.agent_runners to authenticated;
grant select, insert, update, delete on public.agent_jobs to authenticated;

-- The heartbeat time comes from the database clock, never from the machine.
create or replace function public.agent_runners_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.last_seen_at := now();
  if tg_op = 'UPDATE' then
    new.user_id := old.user_id;
    new.started_at := old.started_at;
  end if;
  return new;
end;
$$;

drop trigger if exists agent_runners_touch on public.agent_runners;
create trigger agent_runners_touch
  before insert or update on public.agent_runners
  for each row execute function public.agent_runners_touch();

-- What a job asks for (who, which machine and project, which subtask, the message) never changes after it
-- is created; a final status never changes again; the times are set by the database.
create or replace function public.agent_jobs_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.started_at := null;
    new.finished_at := null;
  else
    new.id := old.id;
    new.user_id := old.user_id;
    new.runner_id := old.runner_id;
    new.project_key := old.project_key;
    new.task_id := old.task_id;
    new.subtask_id := old.subtask_id;
    new.prompt := old.prompt;
    new.created_at := old.created_at;
    if old.status in ('done', 'failed', 'cancelled') or (old.status = 'running' and new.status = 'queued') then
      new.status := old.status; -- a job only moves forward
    end if;
    if new.status = 'running' and old.status = 'queued' then
      new.started_at := now();
    else
      new.started_at := old.started_at;
    end if;
    if new.status in ('done', 'failed', 'cancelled') and old.status not in ('done', 'failed', 'cancelled') then
      new.finished_at := now();
    else
      new.finished_at := old.finished_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists agent_jobs_guard on public.agent_jobs;
create trigger agent_jobs_guard
  before insert or update on public.agent_jobs
  for each row execute function public.agent_jobs_guard();

-- Realtime for the agent tables: the board sees answers arrive, the runner hears about new jobs.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'agent_runners'
  ) then
    alter publication supabase_realtime add table public.agent_runners;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'agent_jobs'
  ) then
    alter publication supabase_realtime add table public.agent_jobs;
  end if;
end;
$$;
