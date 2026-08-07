-- ============================================================================
-- 20260807120000_organizations_b2b.sql
-- Organizations (B2B, phase 1): a center can apply for an account from the
-- sign-up page ("Organization" tab). The workspace is created immediately but
-- starts as kind='center', status='pending' and stays locked out of the app
-- until the platform super_admin approves it in /admin (which also emails the
-- center a confirmation).
--
-- Existing personal workspaces are untouched: they backfill to
-- kind='personal', status='active' via the column defaults, and the B2C
-- self-signup path keeps provisioning exactly that.
-- ============================================================================

-- ---------- Enums -----------------------------------------------------------
do $$ begin
  create type public.org_kind as enum ('personal', 'center');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.org_status as enum ('pending', 'active', 'rejected', 'suspended');
exception when duplicate_object then null;
end $$;

-- ---------- Columns ---------------------------------------------------------
alter table public.organizations
  add column if not exists kind          public.org_kind   not null default 'personal',
  add column if not exists status        public.org_status not null default 'active',
  add column if not exists contact_email text,
  add column if not exists approved_at   timestamptz;

-- The /admin review queue lists pending centers; personal orgs (the vast
-- majority of rows) never hit this index.
create index if not exists organizations_center_status_idx
  on public.organizations (status)
  where kind = 'center';

-- ---------- Privilege lockdown ----------------------------------------------
-- The org_update RLS policy lets a center_admin edit their own org row — which
-- until now meant EVERY column, including status (self-approval) and plan
-- (free upgrade). Column-level grants close that: clients may only touch the
-- cosmetic columns; kind/status/plan/contact_email/approved_at change solely
-- through service_role (the /admin review actions and the billing webhook).
revoke update on public.organizations from authenticated;
grant update (name, slug, branding) on public.organizations to authenticated;

-- ---------- Signup trigger: add the center application path ------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  -- Platform super admins are above orgs: no org, no profile.
  if coalesce(new.raw_app_meta_data ->> 'role', '') = 'super_admin' then
    return new;
  end if;

  -- Already-provisioned users (invited students / center staff) carry their
  -- organization_id in app_metadata; their profile is created explicitly by the
  -- server, so skip auto-provisioning here.
  if (new.raw_app_meta_data ->> 'organization_id') is not null then
    return new;
  end if;

  -- Organization self-application (B2B): created pending, gated from the app
  -- until a super_admin approves. Email/password only — the OAuth path can't
  -- carry an official name, so it always lands in the personal branch below.
  if coalesce(new.raw_user_meta_data ->> 'account_kind', '') = 'center' then
    insert into public.organizations (name, plan, kind, status, contact_email)
    values (
      coalesce(nullif(new.raw_user_meta_data ->> 'org_name', ''), split_part(new.email, '@', 1)),
      'trial',
      'center',
      'pending',
      new.email
    )
    returning id into v_org;

    insert into public.profiles (id, organization_id, role, full_name, phone)
    values (
      new.id,
      v_org,
      'center_admin',
      nullif(new.raw_user_meta_data ->> 'org_name', ''),
      nullif(new.raw_user_meta_data ->> 'phone', '')
    );

    return new;
  end if;

  -- Self-signup (B2C): create a personal workspace + student profile.
  insert into public.organizations (name, plan, kind, status)
  values (
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1))
      || ' (personal)',
    'trial',
    'personal',
    'active'
  )
  returning id into v_org;

  insert into public.profiles (id, organization_id, role, full_name, phone)
  values (
    new.id,
    v_org,
    'student',
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  );

  return new;
end;
$$;
