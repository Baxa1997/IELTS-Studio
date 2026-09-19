-- ============================================================================
-- 20260919120000_practice_resume.sql
-- RESUMABLE PRACTICE — so a hub card can say "Paused · Passage 2 of 3" and mean
-- it, and a graded Listening card can report how long the attempt took.
--
-- The redesigned practice card (components/practice/card.tsx) draws four states:
-- fresh, graded, in progress, and target-only. Three of the four already had
-- data behind them; "in progress" had none outside Writing, which has stored
-- drafts since day one (essays.status = 'draft' + word_count). Reading and
-- Listening simply never wrote a row until the learner submitted, so a closed
-- tab lost the run.
--
-- WHAT THIS ADDS
--   reading_attempts   — cursor_index / seconds_left / answered_count / updated_at,
--                        plus the partial unique indexes that make "one live
--                        attempt per test (or per passage)" a database rule.
--   listening_attempts — status / progress / duration_seconds / updated_at, the
--                        same shape for the engine-owned side.
--
-- WHY status NEEDS NO BACKFILL HERE
--   reading_attempts.status has existed since the stub, defaulting to
--   'in_progress' — but BOTH submit routes insert an explicit status:'graded'
--   (app/api/reading/[id]/submit + app/api/reading/test/[id]/submit), so no
--   stored row has ever carried the default. The partial unique indexes below
--   therefore see an empty set and validate instantly.
--   listening_attempts has no status column at all and every row in it is a
--   finished grading, so the column is added defaulting to 'graded' — the
--   opposite direction, for the same reason: the default must describe the rows
--   that already exist.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- Reading ---------------------------------------------------------

alter table public.reading_attempts
  -- Which passage the learner had open (1-based). Null for a single-passage run.
  add column if not exists cursor_index    int,
  -- What the countdown had left, so a resumed test does not hand back free time.
  add column if not exists seconds_left    int,
  -- Denormalised so the hub can render "17 of 40 answered" without reading the
  -- answers blob (which is the whole point of not shipping it to the card).
  add column if not exists answered_count  int not null default 0,
  add column if not exists updated_at      timestamptz not null default now();

create or replace trigger reading_attempts_set_updated_at
  before update on public.reading_attempts
  for each row execute function public.set_updated_at();

-- ⭐ ONE LIVE ATTEMPT PER THING, ENFORCED BY THE DATABASE.
-- Partial, so finished attempts stay unlimited — the revision loop retakes the
-- same test as often as the learner likes, and every retake is its own graded
-- row. Without this, two tabs on one test would autosave into two rows and the
-- hub would show the same test paused twice.
create unique index if not exists reading_attempts_live_test_uniq
  on public.reading_attempts (student_id, test_id)
  where status = 'in_progress' and test_id is not null;
create unique index if not exists reading_attempts_live_passage_uniq
  on public.reading_attempts (student_id, passage_id)
  where status = 'in_progress' and passage_id is not null;

-- The hub asks "what has this learner got open?" on every visit.
create index if not exists reading_attempts_live_idx
  on public.reading_attempts (student_id, status)
  where status = 'in_progress';

-- ---------- Listening -------------------------------------------------------

alter table public.listening_attempts
  -- 'in_progress' | 'graded'. Defaulting to 'graded' backfills the existing rows
  -- correctly: every attempt stored so far is a completed grading.
  add column if not exists status           text not null default 'graded',
  -- { segment, elapsed_seconds, answered } — where the player was. A jsonb blob
  -- because the engine owns this shape and the app only forwards it.
  add column if not exists progress         jsonb not null default '{}'::jsonb,
  -- How long the attempt actually took, to match Reading's duration_seconds.
  add column if not exists duration_seconds int,
  add column if not exists updated_at       timestamptz not null default now();

do $$ begin
  alter table public.listening_attempts
    add constraint listening_attempts_status_chk
    check (status in ('in_progress', 'graded'));
exception when duplicate_object then null;
end $$;

create or replace trigger listening_attempts_set_updated_at
  before update on public.listening_attempts
  for each row execute function public.set_updated_at();

-- Same rule as Reading, across both kinds of attempt. A library practice carries
-- library_id (item_id null); the legacy per-learner flow carries item_id.
create unique index if not exists listening_attempts_live_library_uniq
  on public.listening_attempts (student_id, library_id)
  where status = 'in_progress' and library_id is not null;
create unique index if not exists listening_attempts_live_item_uniq
  on public.listening_attempts (student_id, item_id)
  where status = 'in_progress' and item_id is not null;

create index if not exists listening_attempts_live_idx
  on public.listening_attempts (student_id, status)
  where status = 'in_progress';

-- ⚠️ A HALF-FINISHED ATTEMPT MUST NOT COUNT AS A SCORE.
-- _best_scores in the engine (listening/service.py) reads every attempt row with
-- a library_id and takes the max score, which would now pick up in-progress rows
-- too. Their score stays null until they are graded, and that function already
-- skips nulls — but the same is NOT true of the app's dashboard aggregates, so
-- every consumer is narrowed to status = 'graded' in the same change as this
-- migration. Grep for listening_attempts before adding a new reader.

-- ---------- Row Level Security ----------------------------------------------
-- Nothing to change. Both tables' existing policies scope every row to its
-- owning student + org and cover all columns; `set_updated_at` is a trigger, so
-- it runs regardless of the writer's role.
