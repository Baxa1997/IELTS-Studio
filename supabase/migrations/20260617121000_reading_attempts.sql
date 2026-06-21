-- ============================================================================
-- 20260617121000_reading_attempts.sql
-- Reading practice attempts — upgrade the stub into a real, gradeable record.
-- A student reads a (timed) passage, answers its questions, and submits; the
-- server grades objectively (no AI call), reveals the answer key + the proving
-- sentence for every WRONG answer, and stores the result here.
--
--   - total_questions / correct_count / percent / duration_seconds: the score.
--   - details: per-question review rows (student vs. correct answer, the proving
--     sentence, and why the trap worked) — the post-submit explanation surface.
--   - type_breakdown: { question_type: { attempted, correct } } — so we can see
--     which TYPES a student fails and target them later (jsonb so one row carries
--     the whole per-type tally; GIN-indexed for aggregation).
--
-- Writes go through the server on submit (the answer key lives in
-- reading_questions, which students can't read); RLS still scopes every attempt
-- to its owning student + org. Idempotent: safe to re-run in the SQL editor.
-- ============================================================================

alter table public.reading_attempts
  add column if not exists total_questions  int  not null default 0,
  add column if not exists correct_count    int  not null default 0,
  add column if not exists percent          numeric(5,2),               -- 0..100
  add column if not exists duration_seconds int,
  add column if not exists details          jsonb not null default '[]'::jsonb,
  add column if not exists type_breakdown   jsonb not null default '{}'::jsonb,
  add column if not exists submitted_at      timestamptz;

-- Aggregating "which types is this student weak at" reads type_breakdown across
-- their attempts; a GIN index keeps that containment/key scan cheap later.
create index if not exists reading_attempts_type_breakdown_gin
  on public.reading_attempts using gin (type_breakdown);

-- Existing RLS (attempts_select / _insert / _update / _delete) and grants from
-- 20260617120200_reading.sql already cover these columns — students own their
-- attempts, teacher/admin read the org's. Nothing to change there.
