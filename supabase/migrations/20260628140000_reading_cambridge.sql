-- ============================================================================
-- 20260628140000_reading_cambridge.sql
-- Cambridge-style reading: two more real IELTS question structures and the
-- group-level fields the Cambridge layout needs.
--
--   - reading_question_type gains 'note_completion' and
--     'matching_sentence_endings' (the notes-completion block and the
--     sentence-endings matching block seen in real Academic papers).
--   - reading_questions gains:
--       word_limit  text — the completion group's exact limit phrase
--                          ("ONE WORD ONLY", "NO MORE THAN TWO WORDS …").
--                          Stored per-question, identical across a block, and
--                          rendered ONCE in the group heading — never inside a
--                          question (fixes the limit being mixed into questions).
--       section     text — an optional sub-heading for note completion
--                          ("Adaptations", "Reasons for decline") grouping
--                          consecutive note lines, like the Cambridge notes box.
--
-- Idempotent: safe to re-run in the Supabase SQL editor. ADD VALUE IF NOT EXISTS
-- needs Postgres 12+ (Supabase is 15) and the new values are NOT used elsewhere
-- in this file, so it is transaction-safe.
-- ============================================================================

alter type public.reading_question_type add value if not exists 'matching_sentence_endings';
alter type public.reading_question_type add value if not exists 'note_completion';

alter table public.reading_questions
  add column if not exists word_limit text,   -- completion groups: the group's word-limit phrase
  add column if not exists section    text;   -- note completion: optional sub-heading
