-- ============================================================================
-- 20260816130000_attempt_reviews.sql
-- Phase 2: the AI's band and the centre's band are two different facts.
--
-- WHY THIS IS THE COMMERCIAL FEATURE. An education centre will not put its name
-- on a grade it cannot correct. Right now it cannot: the only override path in
-- the product (grading_overrides, 2026-06) OVERWRITES `gradings.overall_band`
-- with the human's number, so the moment a teacher corrects a 6.0 to a 6.5 the
-- AI's original answer is gone from the column everything else reads. That is
-- wrong twice over — a centre loses the provenance it wanted, and WE lose the
-- (ai_band, human_band) pair, which is the single most valuable row this
-- product could accumulate and the thing the calibration loop in CLAUDE.md is
-- waiting for.
--
-- So: two fields, never one. `ai_band` is frozen at review time and never
-- edited again; `final_band` is what the centre stands behind. A report says
-- both, and names who decided.
--
-- WHY A SEPARATE TABLE INSTEAD OF COLUMNS ON THE FOUR RUNNERS. Writing, reading,
-- listening and speaking store their results in four different shapes, in four
-- tables owned by four different flows. Adding a nullable pair of columns to
-- each would mean four migrations, four sets of RLS, and four places for the
-- next person to forget one. This is one table keyed by (kind, ref_id) — the
-- same trick assignments already use to avoid putting an id on essays.
-- ============================================================================

do $$ begin
  create type public.attempt_kind as enum ('writing', 'reading', 'listening', 'speaking');
exception when duplicate_object then null; end $$;

create table if not exists public.attempt_reviews (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,

  kind            public.attempt_kind not null,
  -- The essay / reading_attempt / listening_attempt / speaking_session it judges.
  -- No FK: it points at one of four tables, and the alternative is four nullable
  -- columns with a check constraint, which is the same thing spelled worse.
  ref_id          uuid not null,
  student_id      uuid not null,

  -- What the model said, frozen. NEVER updated: a re-grade writes a new AI band
  -- to its own table, and this stays the number the human was looking at.
  ai_band         numeric(2,1)
                    check (ai_band is null or (ai_band between 0 and 9 and (ai_band * 2) = floor(ai_band * 2))),
  -- What the centre stands behind. Equal to ai_band when a teacher confirms it
  -- unchanged, which is still a decision worth recording.
  final_band      numeric(2,1) not null
                    check (final_band between 0 and 9 and (final_band * 2) = floor(final_band * 2)),

  -- Per-criterion corrections: {"TR": {"band": 6.0, "was": 5.5}}. Null when the
  -- reviewer only moved the overall band.
  criteria        jsonb,

  -- REQUIRED, and required for a reason. "6.5 because I said so" is not a
  -- record; the sentence here is what a parent is shown, what the next teacher
  -- reads, and what an anchor set is annotated with.
  reason          text not null check (length(btrim(reason)) between 3 and 1000),

  reviewed_by     uuid not null,
  reviewed_at     timestamptz not null default now(),

  -- One review per attempt. Correcting a correction updates this row; the
  -- history of that is not worth a second table until someone asks for it.
  unique (kind, ref_id),
  unique (id, organization_id),
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade,
  foreign key (reviewed_by, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);

create index if not exists attempt_reviews_student_idx
  on public.attempt_reviews (student_id, reviewed_at desc);
create index if not exists attempt_reviews_org_idx
  on public.attempt_reviews (organization_id, reviewed_at desc);

comment on table public.attempt_reviews is
  'The human verdict on one attempt. ai_band is frozen; final_band is what the centre stands behind. The pair is the calibration dataset.';

-- ---------- Who may correct a band -------------------------------------------
-- Read from center_settings.override_policy, so a centre that wants marking
-- locked to its owner gets it enforced in the database and not only in the form.

create or replace function public.can_override_bands()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case coalesce(
           (select s.override_policy
              from public.center_settings s
             where s.organization_id = (select public.current_org_id())),
           'teacher')
    when 'nobody'     then false
    when 'admin_only' then public.can_manage_people()
    else public.can_manage_people()
      or (select public.current_app_role()) = 'teacher'
  end
$$;

comment on function public.can_override_bands() is
  'Honours center_settings.override_policy. Defaults to "teacher" when a centre has no settings row.';

grant execute on function public.can_override_bands() to authenticated;

-- ---------- What still needs a human ------------------------------------------
-- Every graded attempt, in one shape, with the AI's band beside it.
--
-- SCOPED TO STUDENTS IN A GROUP. A solo B2C learner has no teacher, so their
-- work must never appear in anybody's queue — putting it there would invent an
-- obligation nobody agreed to, and on this database it would swamp the real
-- centre work by a hundred to one.
--
-- The jsonb bands are extracted through a regex guard rather than a bare cast:
-- `result` is written by four different flows, a tutor session stores a wholly
-- different shape in the same column, and one malformed value in one row would
-- otherwise fail the entire view for everyone.

create or replace view public.v_gradable_attempts with (security_invoker = true) as
  select 'writing'::public.attempt_kind as kind,
         e.id                            as ref_id,
         e.student_id,
         e.organization_id,
         e.created_at                    as submitted_at,
         g.overall_band                  as ai_band
    from public.essays e
    join lateral (
      select gg.overall_band
        from public.gradings gg
       where gg.essay_id = e.id and gg.overall_band is not null
       order by gg.created_at desc
       limit 1
    ) g on true
   where e.status = 'graded'

  union all
  select 'reading'::public.attempt_kind,
         r.id,
         r.student_id,
         r.organization_id,
         coalesce(r.submitted_at, r.created_at),
         r.band
    from public.reading_attempts r
   where r.status = 'graded' and r.band is not null

  union all
  select 'listening'::public.attempt_kind,
         l.id,
         l.student_id,
         l.organization_id,
         l.created_at,
         (l.result ->> 'band')::numeric
    from public.listening_attempts l
   where l.result ->> 'band' ~ '^[0-9]+(\.[0-9]+)?$'

  union all
  select 'speaking'::public.attempt_kind,
         s.id,
         s.student_id,
         s.organization_id,
         s.started_at,
         (s.result ->> 'overall_band')::numeric
    from public.speaking_sessions s
   where s.state = 'graded'
     and s.result ->> 'overall_band' ~ '^[0-9]+(\.[0-9]+)?$';

comment on view public.v_gradable_attempts is
  'Every graded attempt across the four skills, in one shape, with the AI band. RLS applies through security_invoker.';

grant select on public.v_gradable_attempts to authenticated;

create or replace view public.v_marking_queue with (security_invoker = true) as
  select a.kind,
         a.ref_id,
         a.student_id,
         a.organization_id,
         a.submitted_at,
         a.ai_band
    from public.v_gradable_attempts a
   where exists (
           select 1 from public.group_members gm where gm.student_id = a.student_id
         )
     and not exists (
           select 1 from public.attempt_reviews r
            where r.kind = a.kind and r.ref_id = a.ref_id
         );

comment on view public.v_marking_queue is
  'Graded attempts by a student in a group that no human has signed off. Oldest first is the caller''s job.';

grant select on public.v_marking_queue to authenticated;

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.attempt_reviews enable row level security;

-- A student reads the verdict on their own work: the final band and the name
-- against it are the whole point of the feature for a parent.
do $$ begin
  create policy attempt_reviews_read on public.attempt_reviews
    for select to authenticated
    using (
      organization_id = (select public.current_org_id())
      and (student_id = (select auth.uid()) or public.can_view_student(student_id))
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy attempt_reviews_write on public.attempt_reviews
    for insert to authenticated
    with check (
      organization_id = (select public.current_org_id())
      and reviewed_by = (select auth.uid())
      and public.can_override_bands()
      and public.can_view_student(student_id)
    );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy attempt_reviews_amend on public.attempt_reviews
    for update to authenticated
    using (
      organization_id = (select public.current_org_id())
      and public.can_override_bands()
      and public.can_view_student(student_id)
    )
    with check (
      organization_id = (select public.current_org_id())
      and reviewed_by = (select auth.uid())
      and public.can_override_bands()
    );
exception when duplicate_object then null; end $$;

-- No DELETE policy, deliberately. A verdict is withdrawn by correcting it, not
-- by making it disappear — the same rule the audit log follows.

-- ---------- ai_band is frozen -------------------------------------------------
-- The whole value of this table is that the pair stays honest. Nothing should be
-- able to quietly rewrite what the model said after the fact, including us.

create or replace function public.freeze_attempt_ai_band()
returns trigger
language plpgsql
as $$
begin
  if new.ai_band is distinct from old.ai_band then
    raise exception
      'The AI band is a record of what the model said and cannot be edited. Change final_band instead.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists attempt_reviews_freeze_ai on public.attempt_reviews;
create trigger attempt_reviews_freeze_ai
  before update on public.attempt_reviews
  for each row execute function public.freeze_attempt_ai_band();
