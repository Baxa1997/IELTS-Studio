-- ============================================================================
-- 20260814120000_practice_ai.sql
-- Practice AI: a teacher types what they need and gets a lesson page —
-- explanation plus staged practice — that can be set as homework or shared.
--
-- THE SHAPE. One row per lesson, its content a single JSONB document: HTML for
-- the teaching half (sanitised, allow-listed) and STRUCTURED items for the
-- practice half. The split is the whole design. Prose wants to be rich; an
-- exercise has to be machine-markable, or it can never be auto-graded, never
-- roll into a teacher's report, and never be safe on a public link.
--
-- ONE FILE, not two, even though it adds an enum value. `assignment_content_ck`
-- counts COLUMNS rather than naming kinds (see 20260808170000), so nothing here
-- uses 'lesson' in the same transaction that adds it — which is the rule
-- Postgres actually enforces.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

alter type public.assignment_kind add value if not exists 'lesson';

do $$ begin
  create type public.lesson_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

-- ---------- The lesson --------------------------------------------------------

create table if not exists public.lessons (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  created_by       uuid references public.profiles (id) on delete set null,

  title            text not null,
  subtitle         text,
  -- grammar | vocabulary | skill | exam_technique. Text, not an enum: the set
  -- will grow from what teachers actually type, and a fifth blueprint should be
  -- a prompt change, not a migration.
  blueprint        text not null,
  topic            text not null,
  level            text,
  -- Explanations may be written in the learner's own language while the
  -- examples stay English — the centre market is Uzbek/Russian speaking.
  explain_language text not null default 'en',

  status           public.lesson_status not null default 'draft',
  -- The teacher's own words, kept verbatim. Worth storing: it is the only
  -- record of what was ASKED for, which is what you compare against when a
  -- lesson comes out wrong.
  brief            text not null,
  clarifications   jsonb,
  content          jsonb not null,
  exercise_count   int not null default 0,

  share_token      text unique,
  share_enabled    boolean not null default false,

  model            text,
  prompt_version   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Child tables FK this pair so a lesson can never be attached to another
  -- tenant's assignment or attempt.
  unique (id, organization_id)
);

create index if not exists lessons_library_idx
  on public.lessons (organization_id, status, created_at desc);
create index if not exists lessons_author_idx
  on public.lessons (created_by, created_at desc);
create index if not exists lessons_share_idx
  on public.lessons (share_token) where share_token is not null;

create or replace trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

-- ---------- One person's go at one lesson -------------------------------------
-- `student_id` is NOT NULL on purpose. A visitor who opens a share link and
-- skips signing in is never stored at all — marking happens in their browser
-- and no row is written — so there is no such thing as an ownerless attempt,
-- and every policy below gets to assume an owner.

create table if not exists public.lesson_attempts (
  id               uuid primary key default gen_random_uuid(),
  lesson_id        uuid not null,
  student_id       uuid not null,
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  -- assignment | self | link. Which door they came through, which is what
  -- decides whether open items were marked by a model at all.
  source           text not null default 'assignment',

  answers          jsonb not null default '{}'::jsonb,
  -- closed items: { correct, given, expected }
  -- open items:   { criteria[], score, max, corrected, note }
  results          jsonb not null default '{}'::jsonb,
  -- { "third-person-s": { attempted, correct } } — what makes a report able to
  -- say WHICH point a class missed, rather than only how many marks it lost.
  tag_breakdown    jsonb,
  score            int not null default 0,
  max_score        int not null default 0,
  -- Open items are marked by a model call that can fail; the attempt must not.
  grading_status   text not null default 'complete',
  -- { exerciseId: { score, reason, by, at } } — a teacher overruling the model.
  teacher_overrides jsonb,
  duration_seconds int,
  created_at       timestamptz not null default now(),

  foreign key (lesson_id, organization_id)
    references public.lessons (id, organization_id) on delete cascade,
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade,
  constraint lesson_attempts_source_ck
    check (source in ('assignment', 'self', 'link')),
  constraint lesson_attempts_grading_status_ck
    check (grading_status in ('complete', 'pending', 'failed'))
);

create index if not exists lesson_attempts_lesson_idx
  on public.lesson_attempts (lesson_id, created_at desc);
create index if not exists lesson_attempts_student_idx
  on public.lesson_attempts (student_id, created_at desc);
create index if not exists lesson_attempts_pending_idx
  on public.lesson_attempts (grading_status) where grading_status <> 'complete';

-- ---------- A lesson can be set as homework -----------------------------------
-- The constraint names COLUMNS, never kinds — which is both why this can share
-- a file with the enum value above and why adding a fifth kind stays a one-line
-- change.

alter table public.assignments
  add column if not exists lesson_id uuid;

do $$ begin
  alter table public.assignments
    add constraint assignments_lesson_fk
    foreign key (lesson_id, organization_id)
      references public.lessons (id, organization_id) on delete cascade;
exception when duplicate_object or duplicate_table then null; end $$;

alter table public.assignments
  drop constraint if exists assignment_content_ck;

alter table public.assignments
  add constraint assignment_content_ck check (
    (prompt_id is not null)::int
      + (reading_test_id is not null)::int
      + (listening_library_id is not null)::int
      + (lesson_id is not null)::int
    = 1
  );

create index if not exists assignments_lesson_idx
  on public.assignments (lesson_id) where lesson_id is not null;

-- ---------- The retry queue learns about lessons -------------------------------
-- Open items are marked by a model call, and a failed call must not lose the
-- attempt. `grading_jobs` was built for essays only — `essay_id` NOT NULL and
-- UNIQUE — so it has to be widened rather than reused as-is.

alter table public.grading_jobs alter column essay_id drop not null;

alter table public.grading_jobs
  add column if not exists lesson_attempt_id uuid;

do $$ begin
  alter table public.grading_jobs
    add constraint grading_jobs_lesson_attempt_fk
    foreign key (lesson_attempt_id) references public.lesson_attempts (id) on delete cascade;
exception when duplicate_object or duplicate_table then null; end $$;

-- One job per attempt, mirroring `unique (essay_id)`. Partial, so the many rows
-- with a null lesson_attempt_id (every essay job) don't collide with each other.
create unique index if not exists grading_jobs_lesson_attempt_uniq
  on public.grading_jobs (lesson_attempt_id) where lesson_attempt_id is not null;

-- A job is about exactly one thing. Without this, dropping NOT NULL above would
-- allow a row that is about nothing at all.
do $$ begin
  alter table public.grading_jobs
    add constraint grading_jobs_subject_ck check (
      (essay_id is not null)::int + (lesson_attempt_id is not null)::int = 1
    );
exception when duplicate_object then null; end $$;

-- ---------- Row Level Security -------------------------------------------------

alter table public.lessons         enable row level security;
alter table public.lesson_attempts enable row level security;

-- Staff read their centre's lessons; the author or the owner changes them.
-- (An administrator runs the front desk, not the teaching — writing lessons is
-- not their job, and `can_manage_people` would have quietly given it to them.)
drop policy if exists lessons_staff_read on public.lessons;
create policy lessons_staff_read on public.lessons
  for select to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('center_admin', 'administrator', 'teacher'));

drop policy if exists lessons_author_write on public.lessons;
create policy lessons_author_write on public.lessons
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (created_by = (select auth.uid()) or (select public.is_org_owner())))
  with check (organization_id = (select public.current_org_id())
              and (created_by = (select auth.uid()) or (select public.is_org_owner())));

-- A student sees a lesson because it was set to a class they are in. This is
-- also the whole "centre students only" gate for AI marking: a lesson reaches a
-- signed-in learner ONLY through a group assignment, and groups only exist
-- inside centres.
drop policy if exists lessons_member_read on public.lessons;
create policy lessons_member_read on public.lessons
  for select to authenticated
  using (exists (
    select 1 from public.assignments a
     where a.lesson_id = lessons.id
       and (select public.is_group_member(a.group_id))
  ));

-- NOTE: there is deliberately NO anonymous policy. The public share page reads
-- through the service-role client behind a token check, so there is no
-- anon-readable surface on this table to misconfigure.

drop policy if exists lesson_attempts_own on public.lesson_attempts;
create policy lesson_attempts_own on public.lesson_attempts
  for all to authenticated
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid())
              and organization_id = (select public.current_org_id()));

-- Staff see an attempt through the same boundary as every other piece of
-- practice: a teacher gets their own students, the owner and administrator get
-- the centre. A stranger who did it via a share link belongs to no group of
-- yours and is invisible by construction.
drop policy if exists lesson_attempts_staff_read on public.lesson_attempts;
create policy lesson_attempts_staff_read on public.lesson_attempts
  for select to authenticated
  using ((select public.can_view_student(student_id)));

-- A teacher overruling a model's mark is the one write staff make here.
drop policy if exists lesson_attempts_staff_override on public.lesson_attempts;
create policy lesson_attempts_staff_override on public.lesson_attempts
  for update to authenticated
  using ((select public.can_view_student(student_id)))
  with check ((select public.can_view_student(student_id)));

grant select, insert, update, delete on public.lessons         to authenticated;
grant select, insert, update, delete on public.lesson_attempts to authenticated;
grant all on public.lessons         to service_role;
grant all on public.lesson_attempts to service_role;
