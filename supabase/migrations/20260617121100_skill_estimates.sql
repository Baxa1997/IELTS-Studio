-- ============================================================================
-- 20260617121100_skill_estimates.sql
-- Level identification: one rolling, conservative band estimate per (student,
-- skill), surfaced as a "current band → target band" tracker.
--
--   - baseline_band: the entry-diagnostic result — the FIRST estimate computed
--     for the skill, frozen so progress-since-baseline is honest.
--   - current_band: the rolling re-estimate, recomputed after every graded
--     submission (reading attempt / essay grading), weighted to recent work.
--   - target_band: the student's goal (the only field they set themselves).
--   current_band / baseline_band are NULL until the skill is first measured.
--
-- SECURITY: current_band / baseline_band are written ONLY by the server
-- (service_role) after grading — there is no authenticated write policy, so a
-- student can't inflate their own band. The "set target" action also runs
-- server-side. Reads: the student sees their own; teacher/admin see the org's
-- (cohort analytics). (CLAUDE.md: conservative, never-inflated estimates.)
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

do $$ begin
  create type public.skill as enum ('reading', 'writing');
exception when duplicate_object then null;
end $$;

create table if not exists public.skill_estimates (
  student_id      uuid not null,
  organization_id uuid not null,
  skill           public.skill not null,
  current_band    numeric(2,1),                       -- null until first measured
  baseline_band   numeric(2,1),                       -- diagnostic result, frozen
  target_band     numeric(2,1) not null default 7.0,
  sample_count    int  not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (student_id, skill),
  -- carry organization_id so an estimate can't cross tenants
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);
create index if not exists skill_estimates_org_idx on public.skill_estimates (organization_id);

-- ---------- Row Level Security ---------------------------------------------
alter table public.skill_estimates enable row level security;

-- Student sees their own; teacher/admin see the org's (for cohort dashboards).
drop policy if exists skill_estimates_select on public.skill_estimates;
create policy skill_estimates_select on public.skill_estimates
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and ((select public.current_app_role()) in ('center_admin', 'teacher')
         or student_id = (select auth.uid()))
  );

-- No authenticated INSERT/UPDATE/DELETE policy: every write (recompute + target)
-- goes through the server's service-role client, so bands stay tamper-proof.

-- ---------- Grants ----------------------------------------------------------
grant select on public.skill_estimates to authenticated;  -- gated by RLS above
grant all    on public.skill_estimates to service_role;
