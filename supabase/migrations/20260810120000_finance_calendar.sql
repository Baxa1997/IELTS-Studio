-- ============================================================================
-- 20260810120000_finance_calendar.sql
-- Two modules a real education center runs on and this product had no home for:
--
--   1. MONEY — cash desks (kassa), the income/expense ledger, student tuition
--      charges, and payroll: what each teacher earned this month and why.
--   2. TIME — rooms and a weekly timetable, so "when does this class meet, and
--      where" stops being tribal knowledge and starts feeding attendance.
--
-- Tenancy follows the house rule: every row carries organization_id, and every
-- reference to a person, a group or a room uses the composite FK
-- (id, organization_id) so a cross-tenant row is impossible at the database
-- level rather than only in policy.
--
-- MONEY IS STORED IN MINOR UNITS as `bigint` — whole soms for UZS (which has no
-- practical subunit), cents for USD. Never numeric: PostgREST hands numerics to
-- JS as floats, and a payroll run that is off by a rounding error is a payroll
-- run nobody trusts. Parsing and formatting live in one place,
-- lib/finance/money.ts, which owns the per-currency minor-digit table.
--
-- AUTHORITY. Finance is the center owner's business, not the whole staff's:
-- writes are center_admin-only. The two deliberate exceptions are the ones that
-- would otherwise force the owner to be a human API — a teacher may read their
-- OWN payslip, and a student may read their OWN invoices and payments.
-- ============================================================================

-- ---------- Enums -----------------------------------------------------------

do $$ begin
  create type public.finance_direction as enum ('in', 'out');
exception when duplicate_object then null; end $$;

-- How the money physically moved. Mirrors the desks a center actually keeps.
do $$ begin
  create type public.finance_method as enum ('cash', 'card', 'terminal', 'qr', 'bank', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payroll_status as enum ('draft', 'approved', 'paid');
exception when duplicate_object then null; end $$;

-- 'odd'/'even' are the Uzbek timetable convention (toq/juft kunlar): a class
-- that meets Mon/Wed/Fri vs Tue/Thu/Sat is described by which days it lands on,
-- not by three separate rows.
do $$ begin
  create type public.slot_pattern as enum ('weekly', 'odd', 'even');
exception when duplicate_object then null; end $$;

-- ---------- Per-center finance settings -------------------------------------
-- A separate table rather than columns on `organizations`, because that table's
-- update grant is deliberately narrow (name/slug/branding only — see the
-- organizations migration) and widening it to let a center edit its own money
-- settings would also widen the surface that the column grants exist to close.

create table if not exists public.finance_settings (
  organization_id   uuid primary key references public.organizations (id) on delete cascade,
  currency          text not null default 'UZS',
  -- Day of the month tuition is due. Invoices default their due date to it.
  invoice_due_day   int  not null default 5 check (invoice_due_day between 1 and 28),
  -- Free-text on purpose: "40% of collected" is a rule, this is the note the
  -- owner leaves themselves about how the center pays.
  payroll_note      text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create or replace trigger finance_settings_set_updated_at
  before update on public.finance_settings
  for each row execute function public.set_updated_at();

-- ---------- Rooms and the timetable -----------------------------------------

create table if not exists public.rooms (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  capacity        int,
  -- Column tint in the timetable grid. Stored so a room keeps its colour
  -- between sessions instead of being re-hashed from its name.
  color           text,
  active          boolean not null default true,
  sort            int not null default 0,
  created_at      timestamptz not null default now(),
  unique (organization_id, name),
  unique (id, organization_id)
);
create index if not exists rooms_org_idx on public.rooms (organization_id) where active;

-- One weekly repeating meeting of a class. A group that meets Mon/Wed/Fri in
-- the same room at the same hour is ONE row (weekday = Monday, pattern = odd);
-- a group with a different Saturday slot gets a second row.
create table if not exists public.lesson_slots (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  group_id        uuid not null,
  room_id         uuid,
  -- 0 = Sunday, matching JS getDay() and the Yak..Sha tab order.
  weekday         int  not null check (weekday between 0 and 6),
  starts_at       time not null,
  ends_at         time not null,
  pattern         public.slot_pattern not null default 'weekly',
  effective_from  date not null default current_date,
  effective_to    date,
  created_at      timestamptz not null default now(),
  check (ends_at > starts_at),
  check (effective_to is null or effective_to >= effective_from),
  unique (id, organization_id),
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete cascade,
  foreign key (room_id, organization_id)
    references public.rooms (id, organization_id) on delete set null
);
create index if not exists lesson_slots_org_day_idx on public.lesson_slots (organization_id, weekday);
create index if not exists lesson_slots_group_idx   on public.lesson_slots (group_id);

-- ---------- Cash desks and categories ---------------------------------------

create table if not exists public.finance_accounts (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  name                  text not null,
  kind                  public.finance_method not null default 'cash',
  -- What was already in the drawer when the center started using the app.
  opening_balance_minor bigint not null default 0,
  active                boolean not null default true,
  sort                  int not null default 0,
  created_at            timestamptz not null default now(),
  unique (organization_id, name),
  unique (id, organization_id)
);
create index if not exists finance_accounts_org_idx on public.finance_accounts (organization_id);

create table if not exists public.finance_categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  direction       public.finance_direction not null,
  -- Seeded rows the app reaches for by name (tuition income, payroll expense).
  -- Renamable, not deletable — deleting one would orphan the automation.
  slug            text,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (organization_id, direction, name),
  unique (id, organization_id)
);
create unique index if not exists finance_categories_slug_idx
  on public.finance_categories (organization_id, slug) where slug is not null;

-- ---------- Tuition charges --------------------------------------------------
-- What a student OWES for one course-month. Kept separate from payments so the
-- center can answer "who is behind" — a ledger of receipts alone cannot.

create table if not exists public.student_invoices (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id      uuid not null,
  group_id        uuid not null,
  -- Always the 1st of the month it covers, so a period is comparable.
  period_month    date not null,
  amount_minor    bigint not null check (amount_minor >= 0),
  discount_minor  bigint not null default 0 check (discount_minor >= 0),
  due_on          date,
  note            text,
  voided          boolean not null default false,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  check (discount_minor <= amount_minor),
  check (date_trunc('month', period_month) = period_month),
  unique (student_id, group_id, period_month),
  unique (id, organization_id),
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade,
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete cascade,
  foreign key (created_by, organization_id)
    references public.profiles (id, organization_id) on delete set null
);
create index if not exists student_invoices_org_period_idx
  on public.student_invoices (organization_id, period_month desc);
create index if not exists student_invoices_student_idx on public.student_invoices (student_id);
create index if not exists student_invoices_group_idx   on public.student_invoices (group_id);

-- ---------- Payroll ----------------------------------------------------------
-- A run is a snapshot: once approved, the numbers stop tracking the live data.
-- That is the point. A payslip that silently changes after it was shown to the
-- teacher is worse than no payslip.

create table if not exists public.payroll_runs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  period_month    date not null,
  status          public.payroll_status not null default 'draft',
  gross_minor     bigint not null default 0,
  net_minor       bigint not null default 0,
  note            text,
  computed_at     timestamptz not null default now(),
  approved_at     timestamptz,
  approved_by     uuid,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  check (date_trunc('month', period_month) = period_month),
  unique (organization_id, period_month),
  unique (id, organization_id),
  foreign key (approved_by, organization_id)
    references public.profiles (id, organization_id) on delete set null
);
create index if not exists payroll_runs_org_idx on public.payroll_runs (organization_id, period_month desc);

create table if not exists public.payroll_items (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  run_id            uuid not null,
  teacher_id        uuid not null,
  gross_minor       bigint not null default 0,
  -- Manual correction the owner typed, with its reason. Kept apart from gross
  -- so the computed part stays reproducible from the rule.
  adjustment_minor  bigint not null default 0,
  adjustment_note   text,
  net_minor         bigint not null default 0,
  -- The explanation: every line the engine produced (kind, basis, rate,
  -- amount, which group it came from). This is what makes a payslip arguable
  -- instead of a number the teacher has to take on faith.
  breakdown         jsonb not null default '[]'::jsonb,
  rule_id           uuid,
  created_at        timestamptz not null default now(),
  unique (run_id, teacher_id),
  unique (id, organization_id),
  foreign key (run_id, organization_id)
    references public.payroll_runs (id, organization_id) on delete cascade,
  foreign key (teacher_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);
create index if not exists payroll_items_teacher_idx on public.payroll_items (teacher_id);

-- ---------- The ledger -------------------------------------------------------
-- Every som in or out. Declared after payroll so a salary payment can point at
-- the payslip it settles.

create table if not exists public.finance_transactions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  account_id      uuid not null,
  direction       public.finance_direction not null,
  amount_minor    bigint not null check (amount_minor > 0),
  method          public.finance_method not null default 'cash',
  category_id     uuid,
  occurred_on     date not null default current_date,
  -- Who/what the money is about. All optional: rent has none of them, a tuition
  -- receipt has student + group + invoice, a salary payment has teacher + item.
  student_id      uuid,
  group_id        uuid,
  teacher_id      uuid,
  invoice_id      uuid,
  payroll_item_id uuid,
  note            text,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (account_id, organization_id)
    references public.finance_accounts (id, organization_id) on delete restrict,
  foreign key (category_id, organization_id)
    references public.finance_categories (id, organization_id) on delete set null,
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete set null,
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete set null,
  foreign key (teacher_id, organization_id)
    references public.profiles (id, organization_id) on delete set null,
  foreign key (invoice_id, organization_id)
    references public.student_invoices (id, organization_id) on delete set null,
  foreign key (payroll_item_id, organization_id)
    references public.payroll_items (id, organization_id) on delete set null,
  foreign key (created_by, organization_id)
    references public.profiles (id, organization_id) on delete set null
);
create index if not exists finance_tx_org_date_idx  on public.finance_transactions (organization_id, occurred_on desc, created_at desc);
create index if not exists finance_tx_student_idx   on public.finance_transactions (student_id) where student_id is not null;
create index if not exists finance_tx_group_idx     on public.finance_transactions (group_id) where group_id is not null;
create index if not exists finance_tx_teacher_idx   on public.finance_transactions (teacher_id) where teacher_id is not null;
create index if not exists finance_tx_invoice_idx   on public.finance_transactions (invoice_id) where invoice_id is not null;
create index if not exists finance_tx_account_idx   on public.finance_transactions (account_id);

-- ---------- Salary rules -----------------------------------------------------
-- THE POINT OF THE MODULE. Every center pays differently — a share of what the
-- class collected, a flat amount per head, per lesson taught, a base plus a
-- bonus, a percentage that steps up once the group passes 20 students — so the
-- formula is DATA, not code. `components` is an ordered list the engine in
-- lib/finance/salary.ts evaluates against measured facts for the period.
--
-- Resolution is most-specific-wins, per teacher AND per group:
--     (teacher + group)  >  (teacher)  >  (group)  >  (org default)
-- so a center can set one house rule and still pay one teacher differently for
-- one class without duplicating the rest.

create table if not exists public.salary_rules (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  scope           text not null check (scope in ('org', 'group', 'teacher')),
  group_id        uuid,
  teacher_id      uuid,
  components      jsonb not null default '[]'::jsonb,
  -- Guarantees, applied after the components are summed.
  floor_minor     bigint,
  cap_minor       bigint,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (
    (scope = 'org'     and group_id is null and teacher_id is null) or
    (scope = 'group'   and group_id is not null and teacher_id is null) or
    (scope = 'teacher' and teacher_id is not null)
  ),
  check (cap_minor is null or floor_minor is null or cap_minor >= floor_minor),
  unique (id, organization_id),
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete cascade,
  foreign key (teacher_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);
create index if not exists salary_rules_org_idx on public.salary_rules (organization_id) where active;

-- Only one active rule per exact target, or "most specific wins" has a tie.
create unique index if not exists salary_rules_org_default_idx
  on public.salary_rules (organization_id) where active and scope = 'org';
create unique index if not exists salary_rules_group_idx
  on public.salary_rules (organization_id, group_id) where active and scope = 'group';
create unique index if not exists salary_rules_teacher_idx
  on public.salary_rules (organization_id, teacher_id) where active and scope = 'teacher' and group_id is null;
create unique index if not exists salary_rules_teacher_group_idx
  on public.salary_rules (organization_id, teacher_id, group_id) where active and scope = 'teacher' and group_id is not null;

create or replace trigger salary_rules_set_updated_at
  before update on public.salary_rules
  for each row execute function public.set_updated_at();

do $$ begin
  alter table public.payroll_items
    add constraint payroll_items_rule_fk
    foreign key (rule_id, organization_id)
      references public.salary_rules (id, organization_id) on delete set null;
exception when duplicate_object then null; end $$;

-- ---------- Tuition on the group ---------------------------------------------
-- The default charge for a seat in this class, so generating a month of
-- invoices is one click instead of one row per student. Nullable: a class that
-- has never been priced simply doesn't invoice.
alter table public.groups
  add column if not exists monthly_fee_minor bigint check (monthly_fee_minor is null or monthly_fee_minor >= 0);

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.finance_settings      enable row level security;
alter table public.rooms                 enable row level security;
alter table public.lesson_slots          enable row level security;
alter table public.finance_accounts      enable row level security;
alter table public.finance_categories    enable row level security;
alter table public.student_invoices      enable row level security;
alter table public.payroll_runs          enable row level security;
alter table public.payroll_items         enable row level security;
alter table public.finance_transactions  enable row level security;
alter table public.salary_rules          enable row level security;

/** true when the caller owns the center: the only role that may touch money. */
create or replace function public.is_center_admin()
returns boolean
language sql
stable
as $$
  select (select public.current_app_role()) = 'center_admin'
$$;
grant execute on function public.is_center_admin() to authenticated;

-- ── settings / accounts / categories / rules: owner-only, end to end ────────
-- Read is owner-only too. A teacher does not need to know what is in the till.

do $$
declare t text;
begin
  foreach t in array array[
    'finance_settings', 'finance_accounts', 'finance_categories', 'salary_rules'
  ] loop
    execute format('drop policy if exists %I_owner on public.%I', t, t);
    execute format($f$
      create policy %I_owner on public.%I
        for all to authenticated
        using (organization_id = (select public.current_org_id()) and public.is_center_admin())
        with check (organization_id = (select public.current_org_id()) and public.is_center_admin())
    $f$, t, t);
  end loop;
end $$;

-- ── rooms: everyone in the org reads (a timetable is public inside a center),
--    the owner writes ─────────────────────────────────────────────────────────
drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms
  for select to authenticated
  using (organization_id = (select public.current_org_id()));

drop policy if exists rooms_write on public.rooms;
create policy rooms_write on public.rooms
  for all to authenticated
  using (organization_id = (select public.current_org_id()) and public.is_center_admin())
  with check (organization_id = (select public.current_org_id()) and public.is_center_admin());

-- ── lesson slots: read across the org (students need their own timetable),
--    written by whoever may manage the class ─────────────────────────────────
drop policy if exists lesson_slots_read on public.lesson_slots;
create policy lesson_slots_read on public.lesson_slots
  for select to authenticated
  using (organization_id = (select public.current_org_id()));

drop policy if exists lesson_slots_write on public.lesson_slots;
create policy lesson_slots_write on public.lesson_slots
  for all to authenticated
  using (organization_id = (select public.current_org_id()) and public.can_manage_group(group_id))
  with check (organization_id = (select public.current_org_id()) and public.can_manage_group(group_id));

-- ── invoices: owner writes; a student reads their own ───────────────────────
drop policy if exists student_invoices_read on public.student_invoices;
create policy student_invoices_read on public.student_invoices
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (public.is_center_admin() or student_id = (select auth.uid()))
  );

drop policy if exists student_invoices_write on public.student_invoices;
create policy student_invoices_write on public.student_invoices
  for all to authenticated
  using (organization_id = (select public.current_org_id()) and public.is_center_admin())
  with check (organization_id = (select public.current_org_id()) and public.is_center_admin());

-- ── ledger: owner writes; a student reads the receipts that are about them ──
drop policy if exists finance_transactions_read on public.finance_transactions;
create policy finance_transactions_read on public.finance_transactions
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (public.is_center_admin() or student_id = (select auth.uid()))
  );

drop policy if exists finance_transactions_write on public.finance_transactions;
create policy finance_transactions_write on public.finance_transactions
  for all to authenticated
  using (organization_id = (select public.current_org_id()) and public.is_center_admin())
  with check (organization_id = (select public.current_org_id()) and public.is_center_admin());

-- ── payroll: owner writes; a teacher reads their own payslip and the run it
--    belongs to, and nothing about anyone else's ──────────────────────────────
drop policy if exists payroll_items_read on public.payroll_items;
create policy payroll_items_read on public.payroll_items
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (public.is_center_admin() or teacher_id = (select auth.uid()))
  );

drop policy if exists payroll_items_write on public.payroll_items;
create policy payroll_items_write on public.payroll_items
  for all to authenticated
  using (organization_id = (select public.current_org_id()) and public.is_center_admin())
  with check (organization_id = (select public.current_org_id()) and public.is_center_admin());

drop policy if exists payroll_runs_read on public.payroll_runs;
create policy payroll_runs_read on public.payroll_runs
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (
      public.is_center_admin()
      or exists (
        select 1 from public.payroll_items i
         where i.run_id = payroll_runs.id
           and i.teacher_id = (select auth.uid())
      )
    )
  );

drop policy if exists payroll_runs_write on public.payroll_runs;
create policy payroll_runs_write on public.payroll_runs
  for all to authenticated
  using (organization_id = (select public.current_org_id()) and public.is_center_admin())
  with check (organization_id = (select public.current_org_id()) and public.is_center_admin());

-- ============================================================================
-- Roll-up views. security_invoker so the caller's RLS still applies — a view is
-- a convenience here, never a way around a policy.
-- ============================================================================

-- What each desk holds now: opening float, plus everything in, minus everything
-- out. The KPI row across the top of /console/finance reads exactly this.
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
         coalesce(sum(t.amount_minor) filter (where t.direction = 'out'), 0) as total_out_minor
    from public.finance_accounts a
    left join public.finance_transactions t on t.account_id = a.id
   group by a.id, a.organization_id, a.name, a.kind, a.active, a.sort, a.opening_balance_minor;

-- Charged vs paid per student. `owed` is the debtor list the front desk chases.
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
     where direction = 'in' and student_id is not null
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

comment on view public.v_student_finance is
  'Charged vs paid per student. owed_minor > 0 is a debtor; < 0 is credit carried forward.';

-- How much of one invoice has been settled, so a part payment is visible as a
-- part payment rather than as "unpaid".
create or replace view public.v_invoice_settlement with (security_invoker = true) as
  select i.id                                        as invoice_id,
         i.organization_id,
         i.student_id,
         i.group_id,
         i.period_month,
         (i.amount_minor - i.discount_minor)         as due_minor,
         coalesce(sum(t.amount_minor), 0)            as paid_minor,
         (i.amount_minor - i.discount_minor) - coalesce(sum(t.amount_minor), 0) as balance_minor
    from public.student_invoices i
    left join public.finance_transactions t
      on t.invoice_id = i.id and t.direction = 'in'
   where not i.voided
   group by i.id, i.organization_id, i.student_id, i.group_id, i.period_month,
            i.amount_minor, i.discount_minor;

-- ============================================================================
-- Grants
-- ============================================================================

grant select, insert, update, delete on public.finance_settings     to authenticated;
grant select, insert, update, delete on public.rooms                to authenticated;
grant select, insert, update, delete on public.lesson_slots         to authenticated;
grant select, insert, update, delete on public.finance_accounts     to authenticated;
grant select, insert, update, delete on public.finance_categories   to authenticated;
grant select, insert, update, delete on public.student_invoices     to authenticated;
grant select, insert, update, delete on public.payroll_runs         to authenticated;
grant select, insert, update, delete on public.payroll_items        to authenticated;
grant select, insert, update, delete on public.finance_transactions to authenticated;
grant select, insert, update, delete on public.salary_rules         to authenticated;

grant select on public.v_finance_account_balances to authenticated;
grant select on public.v_student_finance          to authenticated;
grant select on public.v_invoice_settlement       to authenticated;

grant all on public.finance_settings     to service_role;
grant all on public.rooms                to service_role;
grant all on public.lesson_slots         to service_role;
grant all on public.finance_accounts     to service_role;
grant all on public.finance_categories   to service_role;
grant all on public.student_invoices     to service_role;
grant all on public.payroll_runs         to service_role;
grant all on public.payroll_items        to service_role;
grant all on public.finance_transactions to service_role;
grant all on public.salary_rules         to service_role;

-- ============================================================================
-- Seed: a center opens the module already usable
-- ============================================================================
-- Four desks and the categories every center has, so the first page load shows
-- a working ledger instead of an empty-state maze. Seeding happens in the
-- database, not on first render: a page that writes when you look at it is a
-- page that writes twice when two people look at once.

create or replace function public.seed_center_finance(p_org uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.finance_settings (organization_id) values (p_org)
    on conflict (organization_id) do nothing;

  insert into public.finance_accounts (organization_id, name, kind, sort) values
    (p_org, 'Cash',     'cash',     0),
    (p_org, 'Card',     'card',     1),
    (p_org, 'Terminal', 'terminal', 2),
    (p_org, 'QR',       'qr',       3)
  on conflict (organization_id, name) do nothing;

  insert into public.finance_categories (organization_id, name, direction, slug) values
    (p_org, 'Tuition',          'in',  'tuition'),
    (p_org, 'Registration fee', 'in',  'registration'),
    (p_org, 'Books & materials','in',  'materials_in'),
    (p_org, 'Other income',     'in',  'other_in'),
    (p_org, 'Teacher salaries', 'out', 'salary'),
    (p_org, 'Rent',             'out', 'rent'),
    (p_org, 'Utilities',        'out', 'utilities'),
    (p_org, 'Marketing',        'out', 'marketing'),
    (p_org, 'Supplies',         'out', 'supplies'),
    (p_org, 'Taxes',            'out', 'taxes'),
    (p_org, 'Other expense',    'out', 'other_out')
  on conflict (organization_id, direction, name) do nothing;

  -- A starting house rule, inactive-by-default would be unhelpful: 40% of what
  -- the class collected is the most common arrangement in the market this is
  -- built for, and it is one edit away from whatever the center actually does.
  insert into public.salary_rules (organization_id, name, scope, components)
  select p_org,
         'House rule — 40% of collected tuition',
         'org',
         '[{"kind":"revenue_share","percent":40,"of":"collected","label":"Share of tuition collected"}]'::jsonb
  where not exists (
    select 1 from public.salary_rules r where r.organization_id = p_org and r.scope = 'org'
  );
end $$;

revoke all on function public.seed_center_finance(uuid) from public, authenticated;

-- New centers get it on creation.
create or replace function public.seed_center_finance_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.kind = 'center' then
    perform public.seed_center_finance(new.id);
  end if;
  return new;
end $$;

drop trigger if exists organizations_seed_finance on public.organizations;
create trigger organizations_seed_finance
  after insert on public.organizations
  for each row execute function public.seed_center_finance_trigger();

-- Existing centers get it now. Personal orgs are skipped: an individual learner
-- has no cash desk, and seeding one would put finance rows on every B2C account.
do $$
declare org record;
begin
  for org in select id from public.organizations where kind = 'center' loop
    perform public.seed_center_finance(org.id);
  end loop;
end $$;
