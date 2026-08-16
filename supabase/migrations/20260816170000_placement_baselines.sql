-- ============================================================================
-- 20260816170000_placement_baselines.sql
-- Where a student started, said deliberately.
--
-- WHAT IS ALREADY TRUE. `skill_estimates.baseline_band` exists and freezes on
-- the first measurement, so progress is technically computable today. §6 of the
-- restructure is not asking for the column; it is asking for the number to MEAN
-- something.
--
-- THE PROBLEM WITH AN ACCIDENTAL BASELINE. A student's first graded attempt
-- might be a diagnostic sat properly in week one — or a task they opened on the
-- bus and abandoned, or the practice they did before anyone taught them the
-- format. All three become "where they started", and a centre that shows a
-- parent "+1.5 since baseline" cannot say which it was. That is exactly the
-- claim a parent will test.
--
-- So the baseline gains a PROVENANCE. `placement` means somebody sat a
-- diagnostic on purpose; `first_attempt` means we are using whatever happened
-- first, and the interface says so in those words. An education centre sells
-- progress, and progress from an unknown starting point is not a measurement.
-- ============================================================================

-- ---------- A practice can be a diagnostic -----------------------------------
-- A flag rather than a separate table: a placement IS an ordinary assignment in
-- every other respect — it is set to a group, it is handed in, it is marked and
-- it appears in the practice board. The only thing that differs is what its
-- band is used for afterwards.

alter table public.assignments
  add column if not exists is_placement boolean not null default false;

comment on column public.assignments.is_placement is
  'This practice measures where a student is starting. Its band sets skill_estimates.baseline_band.';

create index if not exists assignments_placement_idx
  on public.assignments (organization_id) where is_placement;

-- ---------- Where the baseline came from -------------------------------------

do $$ begin
  create type public.baseline_source as enum ('first_attempt', 'placement');
exception when duplicate_object then null; end $$;

alter table public.skill_estimates
  add column if not exists baseline_source public.baseline_source not null default 'first_attempt',
  add column if not exists baseline_at timestamptz;

comment on column public.skill_estimates.baseline_source is
  'placement = somebody sat a diagnostic on purpose. first_attempt = whatever happened first, and the interface says so.';

comment on column public.skill_estimates.baseline_band is
  'Where the student started. Frozen once set from a placement; before that, the first measurement stands in.';

-- Existing rows are honest about themselves: every baseline recorded before
-- this migration came from whatever the student happened to do first.
update public.skill_estimates
   set baseline_source = 'first_attempt'
 where baseline_source is null;

-- ---------- The target belongs to the student, not to the default ------------
-- §6 asks for a target band at enrolment. `target_band` already exists and
-- defaults to 7.0 for everyone, which is a wish rather than a plan — a B1
-- student aiming at 7.0 in three months is how a centre sets itself up to look
-- like it failed. Recording whether anybody actually chose it lets the console
-- tell "we agreed 6.5" apart from "nobody said, so it says 7".

alter table public.skill_estimates
  add column if not exists target_set_by uuid;

comment on column public.skill_estimates.target_set_by is
  'Who agreed this target. Null = nobody chose it and the default is standing in.';
