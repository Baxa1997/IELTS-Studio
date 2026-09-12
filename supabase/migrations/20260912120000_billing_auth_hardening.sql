-- Billing notifications and retryable transactional email delivery.
-- All writes are service-role only; this migration is safe to re-run.

alter type public.notification_type add value if not exists 'billing_expiring';
alter type public.notification_type add value if not exists 'billing_expired';
alter type public.notification_type add value if not exists 'billing_renewed';
alter type public.notification_type add value if not exists 'billing_payment_failed';

alter table public.notifications
  add column if not exists dedupe_key text;

create unique index if not exists notifications_recipient_dedupe_idx
  on public.notifications (recipient_id, dedupe_key)
  where dedupe_key is not null;

create table if not exists public.billing_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('expiring', 'expired', 'renewed', 'payment_failed')),
  period_end timestamptz not null,
  recipient_email text not null,
  attempts int not null default 0,
  claimed_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (organization_id, recipient_id, kind, period_end)
);

create index if not exists billing_email_delivery_retry_idx
  on public.billing_email_deliveries (sent_at, claimed_at, created_at);

alter table public.billing_email_deliveries enable row level security;
revoke all on public.billing_email_deliveries from authenticated;
grant all on public.billing_email_deliveries to service_role;

drop policy if exists billing_email_deliveries_none on public.billing_email_deliveries;
create policy billing_email_deliveries_none on public.billing_email_deliveries
  for all to authenticated using (false) with check (false);

-- The profile is deliberately selected from the database, not from a caller
-- supplied email. This makes retries safe even after a user changes contact data.
