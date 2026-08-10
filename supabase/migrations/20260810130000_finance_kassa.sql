-- ============================================================================
-- 20260810130000_finance_kassa.sql
-- Reshapes the money module to the way a center actually runs a front desk,
-- which is the shape the reference CRM uses and the one the staff already know:
--
--   • A KASSA is a float held by a NAMED PERSON, not a payment method. The
--     cashier is accountable for what is in their drawer, so `owner_id` is the
--     column that turns "Cash" into "Olim's desk, 24 330 000 in it".
--
--   • The payment METHOD (naqd / karta / terminal / QR) is a property of the
--     TRANSACTION, not of the desk. That distinction already existed on
--     `finance_transactions.method`; what changes here is that the UI now totals
--     by method across every desk, which is what the four cards along the top
--     of the finance page are.
--
--   • KO'CHIRISH — moving money between two desks — is two ledger rows sharing
--     a `transfer_id`, not a third kind of row. That way a transfer cannot
--     change the center's net position, only where the money sits, and every
--     balance keeps coming from the same one view.
--
-- Depends on 20260810120000.
-- ============================================================================

-- ---------- The cashier ------------------------------------------------------

alter table public.finance_accounts
  add column if not exists owner_id uuid;

do $$ begin
  alter table public.finance_accounts
    add constraint finance_accounts_owner_fk
    foreign key (owner_id, organization_id)
      references public.profiles (id, organization_id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists finance_accounts_owner_idx
  on public.finance_accounts (owner_id) where owner_id is not null;

-- ---------- Transfers and status ---------------------------------------------

-- Both legs of a Ko'chirish carry the same id. Nullable: an ordinary payment is
-- not part of a transfer.
alter table public.finance_transactions
  add column if not exists transfer_id uuid;

create index if not exists finance_tx_transfer_idx
  on public.finance_transactions (transfer_id) where transfer_id is not null;

-- HOLAT. Everything the app writes today is settled the moment it is written;
-- the column exists so a pending bank transfer or a cancelled receipt has
-- somewhere honest to live instead of being deleted.
alter table public.finance_transactions
  add column if not exists status text not null default 'confirmed';

do $$ begin
  alter table public.finance_transactions
    add constraint finance_transactions_status_check
    check (status in ('confirmed', 'pending', 'cancelled'));
exception when duplicate_object then null; end $$;

-- Cancelled money never moved, so it must not count towards a desk's balance.
--
-- COLUMN ORDER IS LOAD-BEARING. `create or replace view` may only APPEND
-- columns: slipping `owner_id` in beside `kind` would rename position 5 and
-- Postgres refuses with "cannot change name of view column". So the original
-- nine columns keep their exact order and `owner_id` goes on the end, which is
-- also why this is a replace rather than a drop — a drop would take the grants
-- with it and leave a window where the view does not exist.
create or replace view public.v_finance_account_balances with (security_invoker = true) as
  select a.id                as account_id,
         a.organization_id,
         a.name,
         a.kind,
         a.active,
         a.sort,
         a.opening_balance_minor
           + coalesce(sum(t.amount_minor) filter (where t.direction = 'in'), 0)
           - coalesce(sum(t.amount_minor) filter (where t.direction = 'out'), 0) as balance_minor,
         coalesce(sum(t.amount_minor) filter (where t.direction = 'in'), 0)  as total_in_minor,
         coalesce(sum(t.amount_minor) filter (where t.direction = 'out'), 0) as total_out_minor,
         a.owner_id
    from public.finance_accounts a
    left join public.finance_transactions t
      on t.account_id = a.id and t.status <> 'cancelled'
   group by a.id, a.organization_id, a.name, a.kind, a.active, a.sort,
            a.opening_balance_minor, a.owner_id;

grant select on public.v_finance_account_balances to authenticated;

-- A student's balance must ignore cancelled receipts for the same reason.
create or replace view public.v_student_finance with (security_invoker = true) as
  with charged as (
    select student_id, organization_id,
           sum(amount_minor - discount_minor) as charged_minor
      from public.student_invoices
     where not voided
     group by student_id, organization_id
  ), paid as (
    select student_id, organization_id, sum(amount_minor) as paid_minor
      from public.finance_transactions
     where direction = 'in' and student_id is not null and status <> 'cancelled'
     group by student_id, organization_id
  )
  select coalesce(c.student_id, p.student_id)           as student_id,
         coalesce(c.organization_id, p.organization_id) as organization_id,
         coalesce(c.charged_minor, 0)                   as charged_minor,
         coalesce(p.paid_minor, 0)                      as paid_minor,
         coalesce(c.charged_minor, 0) - coalesce(p.paid_minor, 0) as owed_minor
    from charged c
    full outer join paid p
      on p.student_id = c.student_id and p.organization_id = c.organization_id;

grant select on public.v_student_finance to authenticated;

-- ---------- Seed the desks a center recognises -------------------------------
-- The first migration seeded desks named after payment methods (Cash, Card,
-- Terminal, QR), which was the wrong model: those are how money arrives, not
-- where it sits. A center that has not recorded anything yet gets them renamed
-- to one real desk; a center that has already used them keeps them, because
-- renaming a desk with transactions in it would rewrite history.

do $$
declare org record;
begin
  for org in select id from public.organizations where kind = 'center' loop
    if not exists (
      select 1 from public.finance_transactions t where t.organization_id = org.id
    ) then
      delete from public.finance_accounts a
       where a.organization_id = org.id
         and a.name in ('Card', 'Terminal', 'QR');

      update public.finance_accounts
         set name = 'Main desk'
       where organization_id = org.id
         and name = 'Cash';
    end if;
  end loop;
end $$;
