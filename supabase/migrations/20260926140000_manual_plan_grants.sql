-- A plan granted by hand in /admin can now carry an end date.
--
-- It is stored as an ordinary `subscriptions` row with provider 'manual', so the
-- machinery that already ends Payme and Click plans by their date — the nightly
-- job's reminder a week before, the downgrade and its email, the quota reader's
-- lapse check — ends a comp the same way, with no second code path.
--
-- ⚠️ A 'manual' row is NOT revenue. lib/admin/revenue.ts excludes it from MRR and
-- lib/billing/service.ts from "was already paying"; anything new that reads
-- `subscriptions` to mean "somebody pays" must do the same.
--
-- Apply BEFORE deploying the code: until then, saving an end date in /admin
-- fails with an enum error, which the dialog shows. Plans without an end date
-- are unaffected. Safe to re-run.

alter type public.billing_provider add value if not exists 'manual';
