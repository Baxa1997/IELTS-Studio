-- ============================================================================
-- 20261004130000_shared_multilevel_library.sql
-- A CEFR (Multilevel) paper may now belong to NO account — the shared library
-- the free daily practice serves to visitors (/practice/cefr in the app).
--
-- WHY. Every Multilevel paper so far was generated for one learner and owned by
-- them (organization_id + student_id, both NOT NULL). The free practice needs
-- papers that are nobody's, for the same reason the IELTS libraries were made
-- ownerless in 20260926150000: content that hangs off an account goes when the
-- account goes, and the August 2026 wipe showed what that costs.
--
-- WHAT CHANGES. Both owner columns become nullable, together: a row is either
-- a learner's (both set) or the library's (both NULL), never half of each. The
-- composite FK to profiles is MATCH SIMPLE, so a row with NULLs is not checked
-- against it — which is exactly the library's case.
--
-- WHAT DOES NOT. RLS: every policy still requires organization_id =
-- current_org_id(), which is never true of NULL — so no signed-in role, learner
-- or staff, can read a shared paper's answer keys. Only the service role sees
-- them: the engine's /multilevel/public/* routes (scoped to
-- organization_id IS NULL there) and the app's free-practice pool, which reads
-- metadata only.
--
-- ⚠️ A SHARED PAPER CANNOT BE ATTEMPTED BY A SIGNED-IN LEARNER YET.
-- multilevel_attempts' FK is (item_id, organization_id) → multilevel_items
-- (id, organization_id), and a learner's attempt carries their organisation,
-- which a shared paper does not have. The free practice stores no attempts, so
-- nothing breaks today; the day the signed-in hub lists the library, that FK
-- has to become item_id alone.
--
-- Rows come from the engine's scripts/seed_multilevel_library.py, which needs
-- this applied first. Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

alter table public.multilevel_items alter column organization_id drop not null;
alter table public.multilevel_items alter column student_id drop not null;

alter table public.multilevel_items drop constraint if exists multilevel_items_owner_whole;
alter table public.multilevel_items add constraint multilevel_items_owner_whole
  check ((organization_id is null) = (student_id is null));

-- What the free practice's pool reads: the library's full papers, oldest first.
create index if not exists multilevel_items_shared_idx
  on public.multilevel_items (paper, created_at, id)
  where organization_id is null;
