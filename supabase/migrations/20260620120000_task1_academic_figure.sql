-- ============================================================================
-- 20260620120000_task1_academic_figure.sql
-- Academic Writing Task 1: a generated prompt carries the figure (chart/graph/
-- table) the candidate must describe, as structured data.
--
--   - writing_prompts gains `figure jsonb` (nullable). Only Task 1 Academic
--     prompts populate it; Task 2 essays and Task 1 letters leave it null.
--   - The same structured data drives BOTH the in-studio chart render AND the
--     grader (it sees the exact numbers, so Task Achievement is judged on whether
--     the student reported the data accurately). Generator stays separate from the
--     grader (CLAUDE.md).
--
-- Shape (validated in app code by lib/writing/figure.ts, not by a DB constraint —
-- jsonb keeps it flexible as figure kinds grow):
--   { "kind": "bar|grouped_bar|line|pie|table", "title": "...", ... }
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

alter table public.writing_prompts
  add column if not exists figure jsonb;

comment on column public.writing_prompts.figure is
  'Academic Task 1 only: structured chart/table data (lib/writing/figure.ts). Null for Task 2 and Task 1 letters.';
