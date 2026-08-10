-- ============================================================================
-- 20260810140000_branches.sql
-- Filiallar. A center that has grown past one address runs several sites —
-- "Ideal Education (2-filial)" — and every question the staff ask is asked of
-- one of them: which rooms are free HERE, who teaches HERE.
--
-- The modelling decision that keeps this small: a BRANCH OWNS ROOMS, and
-- nothing else. A lesson's branch is wherever its room is, so `lesson_slots`
-- gains no column, no existing row changes meaning, and a class that moves
-- between sites does so by being booked into a room at the other one. Putting
-- branch_id on lessons as well would create two sources of truth that can
-- disagree — a lesson tagged Chilonzor sitting in a Yunusobod room.
--
-- A center with no branches at all is the normal case, not a broken one: rooms
-- keep `branch_id` null, the timetable shows every room, and the branch tabs
-- stay hidden until there is more than one site to choose between.
-- ============================================================================

create table if not exists public.branches (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  address         text,
  phone           text,
  active          boolean not null default true,
  sort            int not null default 0,
  created_at      timestamptz not null default now(),
  unique (organization_id, name),
  -- child tables FK this pair, so a branch can't be borrowed by another tenant
  unique (id, organization_id)
);
create index if not exists branches_org_idx on public.branches (organization_id) where active;

-- ---------- Rooms belong to a branch ----------------------------------------

alter table public.rooms
  add column if not exists branch_id uuid;

do $$ begin
  alter table public.rooms
    add constraint rooms_branch_fk
    foreign key (branch_id, organization_id)
      references public.branches (id, organization_id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists rooms_branch_idx on public.rooms (branch_id) where branch_id is not null;

-- Two branches may each have a "Room 1", so the name is only unique WITHIN a
-- branch. Two partial indexes rather than one constraint, because Postgres
-- treats NULLs as distinct and a plain unique (org, branch_id, name) would let
-- a single-site center create "Room 1" twice.
alter table public.rooms drop constraint if exists rooms_organization_id_name_key;

create unique index if not exists rooms_name_in_branch_idx
  on public.rooms (organization_id, branch_id, name) where branch_id is not null;
create unique index if not exists rooms_name_no_branch_idx
  on public.rooms (organization_id, name) where branch_id is null;

-- ---------- RLS --------------------------------------------------------------
-- Same split as rooms: everyone in the center can read the site list (a student
-- needs to know which address to turn up at), only the owner edits it.

alter table public.branches enable row level security;

drop policy if exists branches_read on public.branches;
create policy branches_read on public.branches
  for select to authenticated
  using (organization_id = (select public.current_org_id()));

drop policy if exists branches_write on public.branches;
create policy branches_write on public.branches
  for all to authenticated
  using (organization_id = (select public.current_org_id()) and public.is_center_admin())
  with check (organization_id = (select public.current_org_id()) and public.is_center_admin());

grant select, insert, update, delete on public.branches to authenticated;
grant all on public.branches to service_role;
