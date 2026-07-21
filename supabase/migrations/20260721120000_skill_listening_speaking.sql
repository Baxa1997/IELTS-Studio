-- ============================================================================
-- 20260721120000_skill_listening_speaking.sql
-- Make the progress model whole. The `public.skill` enum shipped with only
-- ('reading','writing') because those were the v1 skills; Listening and Speaking
-- then went live as their own experiences but stayed INVISIBLE to a learner's
-- progress — no band estimate, no weekly-goal credit, no streak, no "do this
-- next". This adds the two missing enum values so skill_estimates can hold a
-- band per skill for all four, and the dashboard can finally reflect the whole
-- product instead of half of it.
--
-- Bands themselves come from existing data (listening_attempts.result.band,
-- speaking_sessions.result.overall_band on graded full mocks) via the app's
-- rolling estimator — no new tables, no backfill required; estimates populate
-- on the next dashboard load.
--
-- Idempotent: `add value if not exists` is safe to re-run in the Supabase SQL
-- editor. NB: ALTER TYPE ... ADD VALUE cannot run inside a transaction block on
-- older Postgres — run this file on its own, not wrapped in BEGIN/COMMIT.
-- ============================================================================

alter type public.skill add value if not exists 'listening';
alter type public.skill add value if not exists 'speaking';
