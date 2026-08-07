-- ============================================================================
-- 20260807130000_groups.sql
-- Organizations (B2B, phase 2): teachers and groups. A center_admin creates
-- groups, assigns a teacher to each, and invites students straight into one.
-- Assignments and teacher reports (phase 3/4) hang off `groups` later.
--
-- Tenancy: every row carries organization_id and uses the composite-FK trick
-- from the tenancy migration — (teacher_id, organization_id) must match a real
-- profile IN THAT ORG, so a cross-tenant reference is impossible at the DB
-- level, not just in policy.
-- ============================================================================

-- ---------- Tables ----------------------------------------------------------
create table if not exists public.groups (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  -- The teacher who owns this group. Nullable: a group can be created before a
  -- teacher accepts their invite.
  teacher_id      uuid,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (organization_id, name),
  -- child tables FK this pair so a group can't be attached to another tenant
  unique (id, organization_id),
  foreign key (teacher_id, organization_id)
    references public.profiles (id, organization_id) on delete set null
);
create index if not exists groups_organization_id_idx on public.groups (organization_id);
create index if not exists groups_teacher_id_idx on public.groups (teacher_id);

create table if not exists public.group_members (
  group_id        uuid not null,
  student_id      uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  added_by        uuid references public.profiles (id) on delete set null,
  joined_at       timestamptz not null default now(),
  primary key (group_id, student_id),
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete cascade,
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);
create index if not exists group_members_student_idx on public.group_members (student_id);

create or replace trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

-- An invite can drop the student directly into a group on acceptance.
alter table public.invites
  add column if not exists group_id uuid;

do $$ begin
  alter table public.invites
    add constraint invites_group_fk
    foreign key (group_id, organization_id)
      references public.groups (id, organization_id) on delete set null;
exception when duplicate_object then null;
end $$;

-- ---------- RLS helpers -----------------------------------------------------
-- SECURITY DEFINER so these bypass RLS internally: a policy on `groups` that
-- read `group_members` (whose own policy reads `groups`) would recurse.

/** true when the caller may manage this group: the org's center_admin, or the
 *  teacher the group is assigned to. */
create or replace function public.can_manage_group(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.groups g
      join public.profiles p on p.organization_id = g.organization_id
     where g.id = p_group
       and p.id = (select auth.uid())
       and (p.role = 'center_admin' or g.teacher_id = p.id)
  )
$$;

/** true when the caller is a student in this group. */
create or replace function public.is_group_member(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members gm
     where gm.group_id = p_group and gm.student_id = (select auth.uid())
  )
$$;

grant execute on function public.can_manage_group(uuid) to authenticated;
grant execute on function public.is_group_member(uuid)  to authenticated;

-- ---------- Row Level Security ---------------------------------------------
alter table public.groups        enable row level security;
alter table public.group_members enable row level security;

-- groups: center_admin manages every group in their org; teachers read their
-- org's groups (they only *manage* their own, via can_manage_group on members);
-- a student sees only the groups they belong to.
drop policy if exists groups_admin_manage on public.groups;
create policy groups_admin_manage on public.groups
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) = 'center_admin')
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) = 'center_admin');

drop policy if exists groups_teacher_select on public.groups;
create policy groups_teacher_select on public.groups
  for select to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) = 'teacher');

drop policy if exists groups_member_select on public.groups;
create policy groups_member_select on public.groups
  for select to authenticated
  using ((select public.is_group_member(id)));

-- group_members: managed by the org admin or the group's own teacher; a student
-- can read their own membership row and nothing else (NOT the classmate list).
drop policy if exists group_members_manage on public.group_members;
create policy group_members_manage on public.group_members
  for all to authenticated
  using ((select public.can_manage_group(group_id)))
  with check ((select public.can_manage_group(group_id))
              and organization_id = (select public.current_org_id()));

drop policy if exists group_members_self_select on public.group_members;
create policy group_members_self_select on public.group_members
  for select to authenticated
  using (student_id = (select auth.uid()));

-- ---------- Grants ----------------------------------------------------------
grant select, insert, update, delete on public.groups        to authenticated;
grant select, insert, update, delete on public.group_members to authenticated;
grant all on public.groups        to service_role;
grant all on public.group_members to service_role;
