-- ============================================================================
-- 20260622120000_cefr_attempts.sql
-- CEFR writing attempts — the learner's own history on the distinct CEFR track
-- (separate from the IELTS essays table, which is band-shaped). Each row is one
-- graded CEFR writing submission: the task, the response, and the full grade JSON
-- (estimated level + four-subscale feedback), reopenable from the CEFR hub.
--
-- Student-owned and private, like vocabulary_items / reading_attempts: a learner
-- sees ONLY their own attempts, scoped to their (personal) org (B2C, CLAUDE.md).
-- The grade itself is produced by the single server-side AI service; this table
-- only stores the result. Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.cefr_attempts (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  student_id       uuid not null,
  skill            text not null default 'writing',   -- 'writing' (reading later)
  task_id          text,                              -- authored task id, when used
  task_title       text,                              -- denormalised label for lists
  target_level     text not null,                     -- A1..C2 the task was set at
  genre            text not null,                     -- email | essay | report | …
  prompt           text not null,                     -- the task the learner answered
  response         text not null,                     -- the learner's writing
  estimated_level  text not null,                     -- A1..C2 the grade landed on
  on_target        boolean not null default false,
  model            text,                              -- grader model id
  grade            jsonb not null,                    -- full CefrGrade (subscales, summary, …)
  created_at       timestamptz not null default now(),
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);

-- History list = the student's attempts, newest first.
create index if not exists cefr_attempts_student_created_idx
  on public.cefr_attempts (student_id, created_at desc);

-- ---------- Row Level Security ---------------------------------------------
alter table public.cefr_attempts enable row level security;

-- A learner only ever sees their OWN attempts, inside their org. No teacher/admin
-- read path — private study material (B2C). Inserts come from the server-side
-- grader via the service-role client, so no INSERT policy for authenticated users.
create policy cefr_attempts_select on public.cefr_attempts
  for select to authenticated
  using (organization_id = (select public.current_org_id())
         and student_id = (select auth.uid()));

-- ---------- Grants ----------------------------------------------------------
grant select on public.cefr_attempts to authenticated;
grant all on public.cefr_attempts to service_role;
