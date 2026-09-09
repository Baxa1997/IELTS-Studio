-- The referral programme.
--
-- Any account may apply; a super admin confirms it and can stop it at any time.
-- Stopping kills the link and the code — it does NOT confiscate what has already
-- been earned. That split is the whole shape of this schema: `referral_accounts`
-- decides whether new money can be earned, and `referral_commissions` is a ledger
-- that outlives the account's status.
--
-- WHAT IS DELIBERATELY NOT HERE: a plan column. Eligibility is not a tier, it is
-- a human decision, so the only thing that gates accrual is `status`. An earlier
-- draft gated on Pro; that was dropped because a price gate is buyable and a
-- review is not.
--
-- NOTHING IN HERE IS CLIENT-WRITABLE EXCEPT AN APPLICATION. Percentages, statuses,
-- amounts and payouts are all service-role only, enforced by column grants rather
-- than by the API remembering — the same protection `organizations.status` has.

-- ── enums ───────────────────────────────────────────────────────────────────
do $$
begin
  -- Two ways to stop. BOTH end future earning — the link dies and accrual
  -- refuses anything but `active`, including from somebody already attributed
  -- who pays next week. They differ in what happens to money ALREADY on the
  -- ledger and not yet settled:
  --
  --   closed  = they left, or we wound it down. Commission already accrued
  --             stands and is paid out as normal.
  --   revoked = caught abusing it. Everything still `pending` or `payable`
  --             reverses; only what has already been PAID survives, because
  --             that money has left.
  --
  -- An earlier draft said `closed` kept "paying out their window". That was
  -- written when commission was recurring and capped at twelve months. It is
  -- one-time now, so there is no window — a referral pays once or not at all,
  -- and the sentence described behaviour the code never had.
  if not exists (select 1 from pg_type where typname = 'referral_status') then
    create type public.referral_status as enum
      ('pending', 'active', 'rejected', 'closed', 'revoked');
  end if;

  if not exists (select 1 from pg_type where typname = 'referral_source') then
    create type public.referral_source as enum ('link', 'code');
  end if;

  -- `pending` → inside the refund hold. `payable` → the hold passed, it can be
  -- withdrawn. `reversed` → the payment behind it came back. `paid` → settled.
  if not exists (select 1 from pg_type where typname = 'commission_status') then
    create type public.commission_status as enum
      ('pending', 'payable', 'reversed', 'paid');
  end if;
end $$;

-- ── platform settings ───────────────────────────────────────────────────────
-- One row, so the default rate can change without a deploy. `id` is pinned to a
-- constant and checked, which is the cheapest way to say "there is exactly one
-- of these" in Postgres.
create table if not exists public.referral_settings (
  id                  boolean primary key default true,
  -- Percent of the FIRST payment a referral makes. Per-account overrides live
  -- on referral_accounts.percent.
  default_percent     numeric(5, 2) not null default 15.00,
  -- Days a commission sits `pending` before it can be withdrawn.
  --
  -- SEVEN, AND IT PAIRS WITH A MONTHLY PAYOUT. The hold is not trying to outlast
  -- every possible refund — a card dispute can arrive months later, and no hold
  -- short enough to be worth having would cover that. It only has to sit inside
  -- the payout cycle, and paying monthly means a refund in the first week
  -- reverses long before anybody is settled. Refunds after the hold are handled
  -- by reversing a `payable` row, which is why reversal covers both states and
  -- stops only at `paid`.
  hold_days           integer not null default 7,
  -- Nothing is withdrawn below this, in minor units of the earning currency.
  -- A transfer costs more than a $1.20 balance is worth.
  min_payout_minor    bigint not null default 2000,
  -- How long an unattributed click stays claimable.
  cookie_days         integer not null default 90,
  updated_at          timestamptz not null default now(),
  constraint referral_settings_singleton check (id)
);

insert into public.referral_settings (id) values (true) on conflict (id) do nothing;

/*
 * AND MAKE RE-APPLYING ACTUALLY CONVERGE.
 *
 * This file is written to be re-runnable, and the two statements above are not:
 * `create table if not exists` skips an existing table, so a changed column
 * DEFAULT never lands, and `on conflict do nothing` never touches the row that
 * is already there. So an early apply at 20%/14 days stayed at 20%/14 days
 * while the file above said 15/7 — the schema looked applied and the policy was
 * silently the old one. `scripts/check-referrals.mjs` is what caught it.
 *
 * The UPDATE is deliberately narrow: it only moves values still sitting on the
 * SUPERSEDED defaults. A rate somebody set on purpose — 20 because they meant
 * 20, not because an old migration left it there — is indistinguishable from a
 * stale one by value alone, so this is a judgement call rather than a fact. It
 * is made once, here, for the two values that changed after the first apply.
 * Anything set through the admin later must not be reverted by re-running this,
 * which is why there is no blanket UPDATE.
 */
alter table public.referral_settings alter column default_percent set default 15.00;
alter table public.referral_settings alter column hold_days       set default 7;

update public.referral_settings set default_percent = 15.00 where default_percent = 20.00;
update public.referral_settings set hold_days = 7            where hold_days = 14;

-- ── who may refer ───────────────────────────────────────────────────────────
create table if not exists public.referral_accounts (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null unique references public.profiles (id) on delete cascade,
  organization_id  uuid not null references public.organizations (id) on delete cascade,

  -- Null until approval. The code is minted by the reviewer, never chosen by the
  -- applicant, so there is nothing to validate against impersonation yet — see
  -- the unique index below for how case is handled.
  code             text,

  status           public.referral_status not null default 'pending',
  -- Null = use referral_settings.default_percent. Stored per account so a
  -- partner can be given a better rate without moving everyone else.
  percent          numeric(5, 2),

  -- WHAT THE REVIEWER IS ACTUALLY READING. A brand-new free account has no
  -- history to judge, so the application has to carry the case: where they mean
  -- to share it, and something that shows the audience is real. Without these
  -- the review queue is a rubber stamp, and approval is the only gate there is.
  pitch            text,
  audience_url     text,

  applied_at       timestamptz not null default now(),
  reviewed_at      timestamptz,
  reviewed_by      uuid,
  -- Why it was rejected or stopped. Shown to the applicant on a rejection and
  -- kept for the audit trail on a stop.
  review_note      text,
  stopped_at       timestamptz,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- A code is a URL component and a thing people retype from a screenshot.
  constraint referral_accounts_code_shape
    check (code is null or code ~ '^[a-z0-9][a-z0-9_-]{2,31}$'),
  -- An active account without a code cannot be referred to, and a code on a
  -- pending one would be a live credential nobody approved.
  constraint referral_accounts_active_needs_code
    check (status <> 'active' or code is not null)
);

-- Case-insensitive uniqueness without the citext extension, the same way
-- `profiles.username` does it: the app lowercases on the way in and this index
-- is what actually enforces it.
create unique index if not exists referral_accounts_code_key
  on public.referral_accounts (lower(code)) where code is not null;
create index if not exists referral_accounts_status_idx
  on public.referral_accounts (status, applied_at desc);

-- ── who was referred by whom ────────────────────────────────────────────────
-- FIRST TOUCH WINS, PERMANENTLY. `organization_id` is unique, which is not
-- tidiness: it is what stops a second referrer claiming an account that has
-- already converted, and stops an existing customer being re-attributed to
-- somebody later. Application code cannot be trusted to remember that.
create table if not exists public.referral_attributions (
  organization_id     uuid primary key references public.organizations (id) on delete cascade,
  referral_account_id uuid not null references public.referral_accounts (id) on delete cascade,
  source              public.referral_source not null,
  attributed_at       timestamptz not null default now()
);

create index if not exists referral_attributions_account_idx
  on public.referral_attributions (referral_account_id, attributed_at desc);

-- ── payouts ─────────────────────────────────────────────────────────────────
-- Declared before commissions so the FK below can point at it. A payout is one
-- settlement in one currency; `reference` is whatever the transfer was recorded
-- as outside this system, because there is no payout rail inside it.
create table if not exists public.referral_payouts (
  id                  uuid primary key default gen_random_uuid(),
  referral_account_id uuid not null references public.referral_accounts (id) on delete cascade,
  currency            text not null,
  amount_minor        bigint not null check (amount_minor > 0),
  reference           text,
  note                text,
  paid_at             timestamptz not null default now(),
  marked_by           uuid
);

create index if not exists referral_payouts_account_idx
  on public.referral_payouts (referral_account_id, paid_at desc);

-- ── the ledger ──────────────────────────────────────────────────────────────
create table if not exists public.referral_commissions (
  id                  uuid primary key default gen_random_uuid(),
  referral_account_id uuid not null references public.referral_accounts (id) on delete cascade,
  -- Who paid. Present so a reversal can find its row and an admin can audit one;
  -- NOT granted to the referrer, see the column grant at the bottom.
  organization_id     uuid references public.organizations (id) on delete set null,

  -- THE IDEMPOTENCY KEY. Providers re-deliver webhooks by design, and
  -- `billing_events` already makes the event itself a no-op on redelivery — this
  -- carries the same guarantee into the money. Without it a Stripe retry pays
  -- twice and nothing anywhere complains.
  --
  -- It is NOT the same guarantee as "once per referral" — see the unique index
  -- on organization_id below, which is the one that actually bounds the payout.
  billing_event_id    uuid not null unique references public.billing_events (id) on delete cascade,

  -- Minor units, never a float. Stripe settles USD and Payme/Click settle UZS,
  -- so a bare number here would be meaningless and a SUM across rows would be
  -- wrong — every total is per currency.
  amount_minor        bigint not null check (amount_minor >= 0),
  currency            text not null,

  -- FROZEN AT ACCRUAL. Reading the rate live from the account would mean that
  -- changing someone's percentage silently rewrites every payment they have
  -- ever earned, including ones already settled.
  percent_applied     numeric(5, 2) not null,

  status              public.commission_status not null default 'pending',
  -- When it stops being reversible and starts being withdrawable.
  payable_after       timestamptz not null,
  payout_id           uuid references public.referral_payouts (id) on delete set null,
  reversed_reason     text,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists referral_commissions_account_idx
  on public.referral_commissions (referral_account_id, created_at desc);
create index if not exists referral_commissions_status_idx
  on public.referral_commissions (status, payable_after);
/*
 * ONE COMMISSION PER REFERRAL, EVER. THIS IS THE RULE, AND IT IS A CONSTRAINT.
 *
 * The referrer earns from the first payment a referred account makes and never
 * again — not on renewals, not on an upgrade, not if they cancel and come back.
 *
 * `billing_event_id` above does NOT give this. It stops the same event paying
 * twice, which is a different question: two DIFFERENT payments are two different
 * events, and both would have accrued. That mattered most for Payme and Click,
 * which have no subscription object — each month is a fresh transaction with a
 * fresh id, so a UZS referral would have paid the referrer every single month
 * while Stripe's (unmapped renewals) paid once. Two currencies, two different
 * deals, and nothing would have reported it.
 *
 * A unique INDEX rather than a table constraint so this file stays re-runnable,
 * and so it can be added to a table that already exists.
 *
 * NOTE ON REVERSALS: a reversed commission still occupies the slot. Somebody who
 * pays, refunds, and pays again earns their referrer nothing the second time.
 * That is deliberate — the alternative is a refund loop that mints commission —
 * but it is a real edge, and the reversal reason is on the row if it ever needs
 * arbitrating by hand.
 */
create unique index if not exists referral_commissions_one_per_org
  on public.referral_commissions (organization_id)
  where organization_id is not null;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.referral_settings     enable row level security;
alter table public.referral_accounts     enable row level security;
alter table public.referral_attributions enable row level security;
alter table public.referral_commissions  enable row level security;
alter table public.referral_payouts      enable row level security;

-- The rate is public to a signed-in user: they are being asked to promote the
-- product, so "you earn X%" has to be readable without an admin round trip.
drop policy if exists referral_settings_read on public.referral_settings;
create policy referral_settings_read on public.referral_settings
  for select to authenticated using (true);

-- An account is visible to the person it belongs to, and to nobody else. Not
-- org-wide: a centre admin has no business reading a teacher's earnings, and a
-- referral account is a person's, not a tenant's.
drop policy if exists referral_accounts_own_read on public.referral_accounts;
create policy referral_accounts_own_read on public.referral_accounts
  for select to authenticated using (profile_id = (select auth.uid()));

-- Applying is the one write a client gets. `status` defaults to 'pending' and is
-- not in the column grant below, so the row cannot arrive pre-approved.
drop policy if exists referral_accounts_own_apply on public.referral_accounts;
create policy referral_accounts_own_apply on public.referral_accounts
  for insert to authenticated
  with check (profile_id = (select auth.uid())
              and organization_id = (select public.current_org_id()));

-- Commissions: the referrer reads their own rows. WHICH COLUMNS they read is
-- decided by the grant at the bottom, not here — `organization_id` is withheld
-- there, because a list of "people I recruited who are now paying" is other
-- people's account data and should never leave our side.
drop policy if exists referral_commissions_own_read on public.referral_commissions;
create policy referral_commissions_own_read on public.referral_commissions
  for select to authenticated
  using (referral_account_id in (
    select id from public.referral_accounts where profile_id = (select auth.uid())
  ));

drop policy if exists referral_payouts_own_read on public.referral_payouts;
create policy referral_payouts_own_read on public.referral_payouts
  for select to authenticated
  using (referral_account_id in (
    select id from public.referral_accounts where profile_id = (select auth.uid())
  ));

-- NO POLICY ON referral_attributions, AND THAT IS THE POINT. RLS with no policy
-- denies everything to `authenticated`, so the mapping from referrer to referred
-- org is unreadable by anyone but service-role. The referrer's own dashboard
-- gets counts from the function below instead of the rows.

-- ── grants ──────────────────────────────────────────────────────────────────
grant select on public.referral_settings to authenticated;

-- Read the whole account row (it is theirs), but write only the four fields an
-- application is made of. status, percent, code and every reviewed_* field are
-- absent on purpose: they are the reviewer's, and a column grant is what makes
-- that true rather than the API remembering to strip them.
grant select on public.referral_accounts to authenticated;
grant insert (profile_id, organization_id, pitch, audience_url)
  on public.referral_accounts to authenticated;

-- The money, minus who paid it.
grant select (id, referral_account_id, amount_minor, currency, percent_applied,
              status, payable_after, payout_id, created_at)
  on public.referral_commissions to authenticated;

grant select on public.referral_payouts to authenticated;

grant all on public.referral_settings     to service_role;
grant all on public.referral_accounts     to service_role;
grant all on public.referral_attributions to service_role;
grant all on public.referral_commissions  to service_role;
grant all on public.referral_payouts      to service_role;

-- ── the one aggregate a referrer may see ────────────────────────────────────
-- Counts, never identities — the answer to "is this working?" without handing
-- over a list of people. security definer so it can read `referral_attributions`
-- past the deny-all above, and it is pinned to the CALLER's own account so it
-- cannot be pointed at somebody else's.
create or replace function public.referral_counts()
returns table (signups bigint, converted bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) as signups,
    count(*) filter (
      where exists (
        select 1 from public.referral_commissions rc
        where rc.organization_id = a.organization_id
      )
    ) as converted
  from public.referral_attributions a
  join public.referral_accounts ra on ra.id = a.referral_account_id
  where ra.profile_id = (select auth.uid());
$$;

grant execute on function public.referral_counts() to authenticated;

-- ── keep updated_at honest ──────────────────────────────────────────────────
-- `public.set_updated_at()` already exists (20260617120000_tenancy.sql) and is
-- what every other table in this schema uses. Redefining it here under a second
-- name would leave two identical functions and a coin-flip about which one a
-- future table picks.
drop trigger if exists referral_accounts_touch on public.referral_accounts;
create trigger referral_accounts_touch before update on public.referral_accounts
  for each row execute function public.set_updated_at();

drop trigger if exists referral_commissions_touch on public.referral_commissions;
create trigger referral_commissions_touch before update on public.referral_commissions
  for each row execute function public.set_updated_at();

-- ── let the audit log name a referral ───────────────────────────────────────
-- `admin_audit_log.target_kind` is a CHECK, not an enum, and it did not include
-- 'referral'. Adding the value in TypeScript alone would have been the worst
-- kind of bug here: `recordAdminAction` NEVER THROWS by design, so every
-- approve/reject/stop would have failed its constraint, been swallowed, and left
-- the decisions unlogged while the console looked fine.
--
-- Guarded on the table existing because 20260815120000 (the audit log) may not
-- be applied yet in every environment, and a migration that assumes it is would
-- fail on a fresh database rather than skipping a log it cannot write to.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admin_audit_log'
  ) then
    alter table public.admin_audit_log drop constraint if exists admin_audit_log_target_kind_check;
    alter table public.admin_audit_log add constraint admin_audit_log_target_kind_check
      check (target_kind in ('organization', 'user', 'plan', 'platform', 'referral'));
  end if;
end $$;
