-- ============================================================================
-- 20260628150000_reading_note_layout.sql
-- Rich Cambridge note-completion layout.
--
-- reading_questions gains:
--     note_meta  jsonb — note-completion only: the structured note layout for
--                        THIS line so the block renders like the real Cambridge
--                        notes box (a title, bullets, nested sub-dashes, and
--                        plain context lines with no gap). Shape:
--                          {
--                            "title":  "The saiga",          -- block title (group-level, repeated per row)
--                            "indent": 0|1|2,                 -- this line's nesting (0 bullet, 1 sub-dash)
--                            "before": [                      -- context lines (no gap) shown before this line
--                              { "text": "...", "indent": 0 }
--                            ]
--                          }
--                        Null for every non-note question. Render-only — never
--                        affects grading (the answer key is unchanged).
--
-- Depends on 20260628140000_reading_cambridge.sql (adds note_completion +
-- word_limit/section). Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

alter table public.reading_questions
  add column if not exists note_meta jsonb;   -- note completion: structured note layout for this line
