-- ============================================================================
-- 20260617120700_prompt_generation.sql
-- Generated Task 2 prompt library + teacher approval gate + per-student no-repeat.
--
--   - writing_prompts gains: category (the four Task 2 shapes), an approval
--     status, a source (ai|manual), and reviewer provenance.
--   - Students may read ONLY approved prompts; teachers/admins see all (so the
--     review queue can show pending ones). AI-generated prompts land as 'pending'
--     and are invisible to students until a teacher approves them.
--   - prompt_assignments is the ledger that guarantees a prompt is served to a
--     given student at most once (unique student_id+prompt_id) → never repeats.
-- (CLAUDE.md: content review gate; generator separate from grader.)
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

do $$ begin
  create type public.prompt_category as enum ('opinion', 'discussion', 'problem_solution', 'two_part');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.prompt_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.prompt_source as enum ('ai', 'manual');
exception when duplicate_object then null;
end $$;

-- ---------- Extend writing_prompts -----------------------------------------
alter table public.writing_prompts
  add column if not exists category    public.prompt_category,            -- Task 2 shape; null for Task 1
  add column if not exists status      public.prompt_status not null default 'pending',
  add column if not exists source      public.prompt_source not null default 'manual',
  add column if not exists reviewed_by uuid references public.profiles (id),
  add column if not exists reviewed_at timestamptz;

-- Composite unique so child tables can FK (prompt_id, organization_id) and make a
-- prompt's tenant un-forgeable at the DB level (same pattern as essays/profiles).
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'writing_prompts_id_org_key') then
    alter table public.writing_prompts
      add constraint writing_prompts_id_org_key unique (id, organization_id);
  end if;
end $$;

-- Existing rows predate the approval gate; treat manual/legacy ones as approved so
-- they don't silently vanish from students. Scoped to source='manual' so a re-run
-- never approves genuinely-pending AI prompts.
update public.writing_prompts set status = 'approved'
  where status = 'pending' and source = 'manual';

create index if not exists writing_prompts_pick_idx
  on public.writing_prompts (organization_id, task_type, status);

-- ---------- prompt_assignments (the no-repeat ledger) ----------------------
-- One row per (student, prompt) the moment a prompt is served. The unique
-- constraint is what enforces "never repeat for the same student".
create table if not exists public.prompt_assignments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  student_id      uuid not null,
  prompt_id       uuid not null,
  assigned_at     timestamptz not null default now(),
  unique (student_id, prompt_id),
  -- both FKs carry organization_id so a cross-tenant pairing is impossible
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade,
  foreign key (prompt_id, organization_id)
    references public.writing_prompts (id, organization_id) on delete cascade
);
create index if not exists prompt_assignments_student_idx
  on public.prompt_assignments (student_id, assigned_at desc);

-- ---------- Row Level Security ---------------------------------------------
alter table public.prompt_assignments enable row level security;

-- Tighten writing_prompts reads: students see ONLY approved prompts; teachers and
-- admins see everything in the org (incl. pending, for the review queue). Replaces
-- the open "any member reads all" policy from the writing migration.
drop policy if exists prompts_read on public.writing_prompts;
create policy prompts_read on public.writing_prompts
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and ((select public.current_app_role()) in ('center_admin', 'teacher')
         or status = 'approved')
  );
-- prompts_manage (teacher/admin write) from the writing migration is unchanged and
-- still covers insert/update/delete — including approve/reject.

-- prompt_assignments: a student sees their own; teachers/admins see the org's.
drop policy if exists assignments_select on public.prompt_assignments;
create policy assignments_select on public.prompt_assignments
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and ((select public.current_app_role()) in ('center_admin', 'teacher')
         or student_id = (select auth.uid()))
  );

-- A student records their own assignment when they pull a prompt; teachers/admins
-- may assign on a student's behalf. No update/delete — the ledger is append-only.
drop policy if exists assignments_insert on public.prompt_assignments;
create policy assignments_insert on public.prompt_assignments
  for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.current_app_role()) in ('center_admin', 'teacher'))
  );

-- ---------- Grants ----------------------------------------------------------
grant select, insert on public.prompt_assignments to authenticated;  -- gated by RLS
grant all on public.prompt_assignments to service_role;
