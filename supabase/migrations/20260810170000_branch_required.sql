-- ============================================================================
-- 20260810170000_branch_required.sql
-- Every room, class and cash desk belongs to a branch. And a class can no
-- longer be booked over itself — the database refuses it.
--
-- WHY MANDATORY. "No branch" was a real state (rooms existed before branches
-- did) and the app grew a whole tab to stop those rooms falling off the screen.
-- A nullable owner is a permanent second case to carry in every filter, every
-- report and every tab row, and it silently under-reports: a desk at no site
-- means takings that count towards no site. Making it required deletes the case
-- instead of handling it. Every center gets one branch automatically, so the
-- single-site center never has to think about branches at all — it just has
-- one, called "Main branch", and can rename it.
--
-- THE SHAPE. A branch owns ROOMS, CLASSES and CASH DESKS. Nothing else needs a
-- branch, because everything else hangs off one of those three: a lesson's site
-- is its class's, a payment's site is its desk's. The one place the three could
-- disagree — a class at Chilonzor booked into a Yunusobod room — is closed by a
-- trigger rather than by hoping the UI never offers it.
--
-- THE CLASH. One class cannot be in two places at once, so this stops being a
-- warning the app prints and becomes a constraint the database enforces: an
-- EXCLUDE over (class, weekday, overlapping hours). Two DIFFERENT classes
-- sharing a room or a teacher is still allowed and still only warned about,
-- because centers do that on purpose.
-- ============================================================================

-- gist needs btree semantics for the `=` parts of the exclusion below.
create extension if not exists btree_gist;

-- ---------- 1. Clear the overlaps that already exist -------------------------
-- Keep the oldest of any self-overlapping pair; it is the one the center has
-- been teaching. (Live data: IELTS Evening booked Wed 08:00 in two rooms.)

delete from public.lesson_slots a
 using public.lesson_slots b
 where a.organization_id = b.organization_id
   and a.group_id = b.group_id
   and a.weekday  = b.weekday
   and a.starts_at < b.ends_at
   and b.starts_at < a.ends_at
   and (a.created_at, a.id) > (b.created_at, b.id);

-- ---------- 2. Make it impossible ------------------------------------------
-- Supersedes the two unique indexes from 20260810160000: those caught only an
-- identical booking in the same room, this catches any overlap in any room.

create or replace function public.slot_span(p_starts time, p_ends time)
returns tsrange
language sql
immutable
set search_path = ''
as $$ select tsrange(timestamp '2000-01-01' + p_starts, timestamp '2000-01-01' + p_ends, '[)') $$;

drop index if exists public.lesson_slots_unique_in_room_idx;
drop index if exists public.lesson_slots_unique_no_room_idx;

-- `duplicate_table` as well as `duplicate_object`: an EXCLUDE constraint is
-- backed by an index, so re-adding one raises 42P07 ("relation ... already
-- exists"), which a bare `when duplicate_object` does NOT catch. That made this
-- one statement the only non-idempotent line in the file — a re-run after any
-- later step failed would stop dead here.
do $$ begin
  alter table public.lesson_slots
    add constraint lesson_slots_no_self_overlap
    exclude using gist (
      organization_id with =,
      group_id        with =,
      weekday         with =,
      public.slot_span(starts_at, ends_at) with &&
    );
exception when duplicate_object or duplicate_table then null; end $$;

-- ---------- 3. Every center has at least one branch --------------------------

insert into public.branches (organization_id, name, sort)
select o.id, 'Main branch', 0
  from public.organizations o
 where not exists (select 1 from public.branches b where b.organization_id = o.id)
   and (
     o.kind = 'center'
     or exists (select 1 from public.rooms r            where r.organization_id = o.id)
     or exists (select 1 from public.groups g           where g.organization_id = o.id)
     or exists (select 1 from public.finance_accounts a where a.organization_id = o.id)
   );

-- The branch everything unassigned falls into: the org's first, by sort.
create or replace function public.default_branch(p_org uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.branches
   where organization_id = p_org and active
   order by sort, name
   limit 1
$$;
grant execute on function public.default_branch(uuid) to authenticated;

-- ---------- 4. Rooms ---------------------------------------------------------

update public.rooms
   set branch_id = public.default_branch(organization_id)
 where branch_id is null;

alter table public.rooms alter column branch_id set not null;

-- A room name is unique within its branch; with branch_id now NOT NULL the two
-- partial indexes from 20260810140000 collapse back into one plain constraint.
drop index if exists public.rooms_name_in_branch_idx;
drop index if exists public.rooms_name_no_branch_idx;
create unique index if not exists rooms_name_per_branch_idx
  on public.rooms (organization_id, branch_id, name);

-- ---------- 5. Classes -------------------------------------------------------

alter table public.groups
  add column if not exists branch_id uuid;

do $$ begin
  alter table public.groups
    add constraint groups_branch_fk
    foreign key (branch_id, organization_id)
      references public.branches (id, organization_id) on delete restrict;
exception when duplicate_object then null; end $$;

update public.groups
   set branch_id = public.default_branch(organization_id)
 where branch_id is null;

alter table public.groups alter column branch_id set not null;
create index if not exists groups_branch_idx on public.groups (branch_id);

comment on column public.groups.branch_id is
  'The site this class is taught at. Its lessons may only be booked into rooms '
  'at the same branch — enforced by lesson_slot_branch_guard.';

-- ---------- 6. Cash desks ----------------------------------------------------

update public.finance_accounts
   set branch_id = public.default_branch(organization_id)
 where branch_id is null;

alter table public.finance_accounts alter column branch_id set not null;

-- ---------- 7. The three can never disagree ----------------------------------
-- A class at Chilonzor booked into a Yunusobod room is the one way the model
-- could contradict itself. The UI only offers rooms at the class's branch; this
-- is the guarantee behind it.

create or replace function public.lesson_slot_branch_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_branch  uuid;
  v_group_branch uuid;
begin
  if new.room_id is null then
    return new;
  end if;
  select branch_id into v_room_branch  from public.rooms  where id = new.room_id;
  select branch_id into v_group_branch from public.groups where id = new.group_id;
  if v_room_branch is distinct from v_group_branch then
    raise exception 'That room is at a different branch from the class.'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;

drop trigger if exists lesson_slots_branch_guard on public.lesson_slots;
create trigger lesson_slots_branch_guard
  before insert or update of room_id, group_id on public.lesson_slots
  for each row execute function public.lesson_slot_branch_guard();

-- Moving a ROOM or a CLASS to another branch would strand the bookings between
-- them. Rather than blocking the move, the lesson survives and loses its room —
-- it lands in the "No room" column, exactly as it does when a room is deleted.
-- Losing a room is recoverable in ten seconds; losing the lesson is not.

create or replace function public.unroom_slots_on_branch_move()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'rooms' then
    update public.lesson_slots s
       set room_id = null
      from public.groups g
     where s.room_id = new.id
       and g.id = s.group_id
       and g.branch_id is distinct from new.branch_id;
  else
    update public.lesson_slots s
       set room_id = null
      from public.rooms r
     where s.group_id = new.id
       and r.id = s.room_id
       and r.branch_id is distinct from new.branch_id;
  end if;
  return null;
end $$;

drop trigger if exists rooms_unroom_on_branch_move on public.rooms;
create trigger rooms_unroom_on_branch_move
  after update of branch_id on public.rooms
  for each row when (old.branch_id is distinct from new.branch_id)
  execute function public.unroom_slots_on_branch_move();

drop trigger if exists groups_unroom_on_branch_move on public.groups;
create trigger groups_unroom_on_branch_move
  after update of branch_id on public.groups
  for each row when (old.branch_id is distinct from new.branch_id)
  execute function public.unroom_slots_on_branch_move();

-- ---------- 8. A new center is born with a branch ----------------------------
-- Replaces the 20260810120000 version: the branch has to exist before the cash
-- desks, because a desk cannot be created without one any more.

create or replace function public.seed_center_finance(p_org uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_branch uuid;
begin
  insert into public.branches (organization_id, name, sort)
  values (p_org, 'Main branch', 0)
  on conflict (organization_id, name) do nothing;

  select public.default_branch(p_org) into v_branch;

  insert into public.finance_settings (organization_id) values (p_org)
    on conflict (organization_id) do nothing;

  insert into public.finance_accounts (organization_id, branch_id, name, kind, sort) values
    (p_org, v_branch, 'Main desk', 'cash',     0),
    (p_org, v_branch, 'Card',      'card',     1),
    (p_org, v_branch, 'Terminal',  'terminal', 2),
    (p_org, v_branch, 'QR',        'qr',       3)
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
