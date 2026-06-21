-- ============================================================================
-- 20260617120000_tenancy.sql
-- Core multi-tenant foundation: enums, RLS helper functions, organizations,
-- profiles. Center A must never see Center B's data — enforced via RLS here and
-- in every later migration. (CLAUDE.md, principle 1.)
-- ============================================================================

-- ---------- Enums -----------------------------------------------------------
create type public.user_role as enum ('center_admin', 'teacher', 'student');
create type public.org_plan  as enum ('trial', 'starter', 'pro', 'enterprise');

-- ---------- Tables ----------------------------------------------------------
create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique,                          -- white-label routing handle
  branding   jsonb not null default '{}'::jsonb,   -- {logo_url, primary_color, ...}
  plan       public.org_plan not null default 'trial',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role            public.user_role not null default 'student',
  full_name       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- composite key so child tables can FK (id, organization_id) and make a
  -- user's tenant un-forgeable at the DB level (see writing/reading migrations)
  unique (id, organization_id)
);
create index profiles_organization_id_idx on public.profiles (organization_id);

-- ---------- RLS helper functions -------------------------------------------
-- SECURITY DEFINER so the lookup against profiles bypasses RLS — this is what
-- prevents policy recursion (a policy on profiles that reads profiles).
create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organization_id from public.profiles where id = (select auth.uid())
$$;

create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

grant execute on function public.current_org_id()  to authenticated;
grant execute on function public.current_app_role() to authenticated;

-- ---------- updated_at trigger ---------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ---------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles      enable row level security;

-- organizations: members read their own org; only center_admin edits it.
-- No insert/delete for end users — provisioning runs through service_role.
create policy org_select on public.organizations
  for select to authenticated
  using (id = (select public.current_org_id()));

create policy org_update on public.organizations
  for update to authenticated
  using (id = (select public.current_org_id())
         and (select public.current_app_role()) = 'center_admin')
  with check (id = (select public.current_org_id())
              and (select public.current_app_role()) = 'center_admin');

-- profiles: see your own profile; admins/teachers see the org roster.
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (organization_id = (select public.current_org_id())
        and (select public.current_app_role()) in ('center_admin', 'teacher'))
  );

-- edit your own profile, but you cannot move orgs or escalate your own role
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and organization_id = (select public.current_org_id())
    and role = (select public.current_app_role())
  );

-- center_admin fully manages profiles within their own org (invite/assign/role)
create policy profiles_admin_manage on public.profiles
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) = 'center_admin')
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) = 'center_admin');

-- ---------- Grants (RLS only engages once the role has table privileges) ----
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.profiles      to authenticated;
grant all on public.organizations to service_role;
grant all on public.profiles      to service_role;
