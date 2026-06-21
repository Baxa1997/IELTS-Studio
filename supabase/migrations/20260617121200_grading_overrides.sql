-- ============================================================================
-- 20260617121200_grading_overrides.sql
-- Teacher overrides — the human-in-the-loop on AI grading, AND the flywheel.
--
-- When a teacher adjusts an AI band, we (1) stamp the grading itself
-- (is_teacher_override = true, graded_by = the teacher, overall_band = the human
-- band) and (2) append an immutable row here pairing the PRIOR (AI) band with the
-- human band and the teacher's rationale.
--
-- THE FLYWHEEL: each grading_overrides row is a calibrated (essay → human band +
-- why) pair — exactly the source data for new few-shot calibration anchors. As
-- teachers correct the grader, the anchor set grows and the grader gets more
-- accurate. (CLAUDE.md: "Teacher overrides feed back into the anchor set.")
--
-- Append-only: no UPDATE/DELETE policy for end users; staff read their org's log.
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.grading_overrides (
  id              uuid primary key default gen_random_uuid(),
  grading_id      uuid not null references public.gradings (id) on delete cascade,
  essay_id        uuid not null,
  organization_id uuid not null,
  teacher_id      uuid not null,
  previous_band   numeric(2,1),               -- the band before this override (AI, or a prior override)
  new_band        numeric(2,1) not null
    check (new_band between 0 and 9 and (new_band * 2) = floor(new_band * 2)),
  comment         text not null,              -- the rationale → anchor annotation
  version_no      int,                        -- which essay draft was judged
  created_at      timestamptz not null default now(),
  -- ties the override to the same tenant as the teacher who made it
  foreign key (teacher_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);
create index if not exists grading_overrides_org_created_idx
  on public.grading_overrides (organization_id, created_at desc);
create index if not exists grading_overrides_grading_idx
  on public.grading_overrides (grading_id);

comment on table public.grading_overrides is
  'Audit log of teacher band adjustments. Each row pairs the prior (AI) band with the human band + rationale — the SOURCE DATA for new calibration anchors (the grader-improvement flywheel).';

-- ---------- Row Level Security ---------------------------------------------
alter table public.grading_overrides enable row level security;

-- Teacher/admin read + write within their own org. No update/delete (append-only
-- log). Students have no access — overrides are staff/calibration data.
drop policy if exists grading_overrides_select on public.grading_overrides;
create policy grading_overrides_select on public.grading_overrides
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) in ('center_admin', 'teacher')
  );

drop policy if exists grading_overrides_insert on public.grading_overrides;
create policy grading_overrides_insert on public.grading_overrides
  for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) in ('center_admin', 'teacher')
    and teacher_id = (select auth.uid())
  );

-- ---------- Grants ----------------------------------------------------------
grant select, insert on public.grading_overrides to authenticated;  -- gated by RLS
grant all on public.grading_overrides to service_role;
