-- A paid plan starting is now announced, like its renewal and its end already
-- were: a first payment, a payment after a lapse, or a plan granted in /admin.
-- See notifyPlanActivated in lib/billing/notify-expiry.ts.
--
-- ⚠️ Apply BEFORE deploying the code that sends it. Until then the in-app insert
-- fails on the enum and the delivery claim fails on the check constraint — both
-- are swallowed, so the activation email is silently skipped, never an error.
-- Safe to re-run.

alter type public.notification_type add value if not exists 'billing_activated';

-- The inline check from 20260912120000 is named by Postgres's convention.
alter table public.billing_email_deliveries
  drop constraint if exists billing_email_deliveries_kind_check;
alter table public.billing_email_deliveries
  add constraint billing_email_deliveries_kind_check
  check (kind in ('expiring', 'expired', 'renewed', 'payment_failed', 'activated'));
