-- ============================================================================
-- 20260807150000_center_billing_switch.sql
-- Centers are NOT metered yet (owner's call, 2026-08-07): an education center
-- should be able to run its classes without hitting a seat cap or a monthly
-- generation limit while we're still onboarding them by hand.
--
-- But the meter must stay installed, so switching it on later is a data change
-- rather than a rebuild. `billing_enforced` is that switch, per organization:
--
--   • personal (B2C) orgs  -> true  (unchanged — plan limits apply exactly as before)
--   • center orgs          -> false (quota + seat checks are skipped)
--
-- TO START BILLING CENTERS: flip the rows, and change the `false` literal in
-- the center branch of handle_new_user (which lives in 20260807180000, the
-- newest migration to touch that function) so new centers are metered too.
--     update public.organizations set billing_enforced = true where kind = 'center';
-- Everything downstream already reads this flag — lib/quota.ts loadOrg() forces
-- an unlimited quota when it's false, and the invite seat check skips.
-- A single center can also be comped by flipping just its row.
--
-- Not client-writable: the 20260807120000 migration revoked blanket UPDATE and
-- re-granted only (name, slug, branding), so this column is service-role only.
-- ============================================================================

alter table public.organizations
  add column if not exists billing_enforced boolean not null default true;

update public.organizations set billing_enforced = false where kind = 'center';

comment on column public.organizations.billing_enforced is
  'When false, quota and seat limits are skipped for this org. Centers default to false until we start billing them.';

-- The trigger is NOT redefined here on purpose.
--
-- 20260807180000 also replaces handle_new_user (adding the login name), and its
-- version already creates centers with billing_enforced = false. If this file
-- also carried a trigger body, applying the two out of order — or re-running
-- this one later — would silently roll the trigger BACK to a version without
-- login support. One owner per function: the newest migration that touches
-- handle_new_user owns it, and that is 20260807180000.
--
-- The backfill above covers every center that already exists.
