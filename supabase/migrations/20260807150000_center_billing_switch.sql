-- ============================================================================
-- 20260807150000_center_billing_switch.sql
-- Centers are NOT metered yet (owner's call, 2026-08-07): an education center
-- should be able to run its classes without hitting a seat cap or a monthly
-- generation limit while we're still onboarding them by hand.
--
-- But the meter must stay installed, so switching it on later is a data change
-- rather than a rebuild. `billing_enforced` is that switch, per organization:
--
--   • personal (B2C) orgs  -> true  (unchanged — plan limits apply exactly as before)
--   • center orgs          -> false (quota + seat checks are skipped)
--
-- TO START BILLING CENTERS: flip the rows, and change the `false` literal in
-- the center branch of handle_new_user below so new centers are metered too.
--     update public.organizations set billing_enforced = true where kind = 'center';
-- Everything downstream already reads this flag — lib/quota.ts loadOrg() forces
-- an unlimited quota when it's false, and the invite seat check skips.
-- A single center can also be comped by flipping just its row.
--
-- Not client-writable: the 20260807120000 migration revoked blanket UPDATE and
-- re-granted only (name, slug, branding), so this column is service-role only.
-- ============================================================================

alter table public.organizations
  add column if not exists billing_enforced boolean not null default true;

update public.organizations set billing_enforced = false where kind = 'center';

comment on column public.organizations.billing_enforced is
  'When false, quota and seat limits are skipped for this org. Centers default to false until we start billing them.';

-- Same trigger as 20260807120000, with new centers created unmetered.
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
    insert into public.organizations (name, plan, kind, status, contact_email, billing_enforced)
    values (
      coalesce(nullif(new.raw_user_meta_data ->> 'org_name', ''), split_part(new.email, '@', 1)),
      'trial',
      'center',
      'pending',
      new.email,
      false   -- <- flip to true when centers start being billed
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
