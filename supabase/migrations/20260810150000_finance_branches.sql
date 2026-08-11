-- ============================================================================
-- 20260810150000_finance_branches.sql
-- Money, per filial.
--
-- Run AFTER 20260810130000_finance_kassa.sql — that migration is what gives a
-- desk an owner and a transaction a status, and this one assumes both.
--
-- The modelling follows the same rule as the timetable: a BRANCH OWNS THINGS,
-- and everything else is derived. There a branch owns rooms and a lesson's site
-- is wherever its room is. Here a branch owns CASH DESKS, and a transaction's
-- site is wherever its desk is. So `finance_transactions` gains no column: it
-- already points at an account, and the account knows where it stands.
--
-- That single link is enough for a full per-branch picture, because every
-- rows-of-money in the system already passes through a desk:
--
--   tuition taken at Chilonzor  → Chilonzor's desk → Chilonzor income
--   rent paid for Chilonzor     → Chilonzor's desk → Chilonzor expense
--   salary paid to a teacher    → whichever desk paid it
--   desk-to-desk transfer       → two legs, each with its own desk, so moving
--                                 money between sites shows as out of one
--                                 branch and into the other, automatically
--
-- The alternative — stamping branch_id on every transaction — lets a payment
-- claim one branch while sitting in another branch's till, and no report can
-- then be trusted. Choosing the desk IS choosing the branch.
--
-- Desks with no branch stay valid and are reported under "No branch", exactly
-- like unassigned rooms: a center that has not split its cash yet is normal,
-- not broken.
-- ============================================================================

alter table public.finance_accounts
  add column if not exists branch_id uuid;

do $$ begin
  alter table public.finance_accounts
    add constraint finance_accounts_branch_fk
    foreign key (branch_id, organization_id)
      references public.branches (id, organization_id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists finance_accounts_branch_idx
  on public.finance_accounts (branch_id) where branch_id is not null;

comment on column public.finance_accounts.branch_id is
  'The site this desk stands at. A transaction inherits its branch from here — '
  'finance_transactions deliberately has no branch of its own.';
