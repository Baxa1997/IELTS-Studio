-- ============================================================================
-- 20260620130000_study_plans.sql
-- Personalised study plan: one row per learner (B2C personal org = one student).
--
--   - Captures the learner-SET context the band estimate can't: a self-reported
--     starting band (provisional, used only to pitch task difficulty until a real
--     measurement exists), the overall target band, the real exam date, a weekly
--     task quota, and the re-test cadence (last/next level check).
--   - `starter_seeded` flags whether the curated starter prompts have been copied
--     into this org yet (one-time, idempotent seed on first library visit).
--
-- These fields are LEARNER-OWNED (target, exam date, self-report) — unlike the
-- measured bands in skill_estimates, which stay server-only. So a student may
-- read/write their own study_plan row under RLS.
--
-- Also adds a 'seed' value to prompt_source so the curated starter prompts are
-- distinguishable from on-demand AI prompts and one-off custom pastes.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

alter type public.prompt_source add value if not exists 'seed';

create table if not exists public.study_plans (
  student_id          uuid primary key,
  organization_id     uuid not null,
  -- The learner's most recent self-assessment (provisional; band grid 0–9).
  self_reported_band  numeric(2,1)
    check (self_reported_band is null
           or (self_reported_band between 0 and 9 and (self_reported_band * 2) = floor(self_reported_band * 2))),
  -- Overall goal band.
  target_band         numeric(2,1) not null default 7.0
    check (target_band between 0 and 9 and (target_band * 2) = floor(target_band * 2)),
  -- Real test date, if the learner has one (drives the paced plan + countdown).
  exam_date           date,
  -- Suggested tasks per week (derived from gap × weeks-to-exam, learner-adjustable).
  weekly_goal         int not null default 5 check (weekly_goal between 1 and 21),
  -- Re-test cadence: when the learner last did an explicit level check, and when
  -- the next one is due.
  last_level_check_at timestamptz,
  next_level_check_at timestamptz,
  -- One-time guard: have the curated starter prompts been copied into this org?
  starter_seeded      boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  -- carry organization_id so a plan can't cross tenants
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);
create index if not exists study_plans_org_idx on public.study_plans (organization_id);

create or replace trigger study_plans_set_updated_at
  before update on public.study_plans
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ---------------------------------------------
alter table public.study_plans enable row level security;

-- Student reads/writes their own; teacher/admin read the org's (dormant cohort view).
drop policy if exists study_plans_select on public.study_plans;
create policy study_plans_select on public.study_plans
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and ((select public.current_app_role()) in ('center_admin', 'teacher')
         or student_id = (select auth.uid()))
  );

drop policy if exists study_plans_insert on public.study_plans;
create policy study_plans_insert on public.study_plans
  for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and student_id = (select auth.uid())
  );

drop policy if exists study_plans_update on public.study_plans;
create policy study_plans_update on public.study_plans
  for update to authenticated
  using (organization_id = (select public.current_org_id()) and student_id = (select auth.uid()))
  with check (organization_id = (select public.current_org_id()) and student_id = (select auth.uid()));

-- ---------- Grants ----------------------------------------------------------
grant select, insert, update on public.study_plans to authenticated;  -- gated by RLS
grant all on public.study_plans to service_role;
