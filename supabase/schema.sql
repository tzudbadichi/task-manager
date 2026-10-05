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
