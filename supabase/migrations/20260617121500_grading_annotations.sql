-- Per-mistake annotations for the marked-up essay.
-- The grader can emit verbatim mistake spans, each tagged spelling/grammar/
-- vocabulary/cohesion with an optional fix + note. Persisting them here lets a
-- reopened essay (Activities) show the same mark-up as the fresh Results screen,
-- instead of it living only on the live grade response.
--
-- Shape: [{ text, type, fix?, note? }]  (empty array = no annotations / older row)

alter table public.gradings
  add column if not exists annotations jsonb not null default '[]'::jsonb;
