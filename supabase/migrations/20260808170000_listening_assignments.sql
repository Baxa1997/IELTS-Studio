-- ============================================================================
-- 20260808170000_listening_assignments.sql
-- Listening becomes assignable, so all three built skills behave the same.
--
-- Content model, unchanged: a listening practice is a row in the shared
-- `listening_library`, and an attempt carries `library_id`. So an assignment
-- pins a library id directly — no per-org clone, unlike reading, whose tests are
-- copied into the org on first use.
--
-- The `assignment_content_ck` constraint is replaced rather than extended: it
-- has to say "exactly one of three" now.
--
-- NOTE: 'listening' is added to assignment_kind here and deliberately NOT used
-- in this file — Postgres refuses a new enum value in the transaction that adds
-- it. The constraint below therefore names the COLUMNS, never the kind.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

alter type public.assignment_kind add value if not exists 'listening';

alter table public.assignments
  add column if not exists listening_library_id uuid
    references public.listening_library (id) on delete cascade;

alter table public.assignments
  drop constraint if exists assignment_content_ck;

alter table public.assignments
  add constraint assignment_content_ck check (
    (prompt_id is not null)::int
      + (reading_test_id is not null)::int
      + (listening_library_id is not null)::int
    = 1
  );

create index if not exists assignments_listening_idx
  on public.assignments (listening_library_id)
  where listening_library_id is not null;
