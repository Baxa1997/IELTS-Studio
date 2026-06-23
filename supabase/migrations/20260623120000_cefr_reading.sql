-- ============================================================================
-- 20260623120000_cefr_reading.sql
-- CEFR reading — mark a reading_passages row as belonging to the distinct CEFR
-- track (A1..C2) rather than the IELTS-band track. A non-null cefr_level means the
-- passage is a SHORTER, level-graded CEFR practice text and its result is reported
-- as a CEFR level instead of an IELTS band. Everything else (questions, delivery,
-- grading, RLS) reuses the existing reading pipeline unchanged.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

alter table public.reading_passages
  add column if not exists cefr_level text;  -- 'A1'..'C2', or null for IELTS passages

comment on column public.reading_passages.cefr_level is
  'CEFR level (A1..C2) for distinct-track CEFR reading; null for the IELTS-band track.';
