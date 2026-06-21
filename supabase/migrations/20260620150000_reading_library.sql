-- ============================================================================
-- 20260620150000_reading_library.sql
-- A shared, ready-to-start LIBRARY of original reading content so a learner who
-- doesn't want to wait for generation can start instantly: ~10 full tests +
-- ~10 standalone passages, all AI-generated in the IELTS Academic FORMAT (never
-- Cambridge content — CLAUDE.md §IP).
--
-- The library lives in ONE dedicated organization (seeded once by
-- scripts/seed-reading-library.ts). Two columns make it work WITHOUT touching the
-- existing per-tenant RLS / FK model:
--
--   - is_library  : marks a canonical template row (lives in the library org).
--   - library_key : on a LEARNER's copy, the id of the template it was cloned
--                   from. NULL on templates and on freshly-generated content.
--
-- Templates are read server-side with the service-role client (they're meant to
-- be visible to everyone). On "Start", a template is CLONED into the learner's
-- own org (idempotent via library_key) and from then on it's an ordinary in-org
-- row — so the runner, grading, attempts and RLS all work unchanged.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- reading_tests ---------------------------------------------------
alter table public.reading_tests
  add column if not exists is_library  boolean not null default false,
  add column if not exists library_key uuid;

-- One copy of a given template per org (dedupe clone-on-start).
create unique index if not exists reading_tests_library_clone_uidx
  on public.reading_tests (organization_id, library_key)
  where library_key is not null;

create index if not exists reading_tests_library_idx
  on public.reading_tests (is_library, organization_id)
  where is_library;

-- ---------- reading_passages ------------------------------------------------
alter table public.reading_passages
  add column if not exists is_library  boolean not null default false,
  add column if not exists library_key uuid;

-- Standalone (test_id null) library passage: one clone per org.
create unique index if not exists reading_passages_library_clone_uidx
  on public.reading_passages (organization_id, library_key)
  where library_key is not null and test_id is null;

create index if not exists reading_passages_library_idx
  on public.reading_passages (is_library, organization_id)
  where is_library;

-- No RLS changes: templates are read with the service-role client, and a clone is
-- an ordinary approved row in the learner's own org, already covered by
-- passages_read / reading_tests_read.
