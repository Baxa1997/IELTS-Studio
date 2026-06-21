-- ============================================================================
-- 20260617120400_self_signup.sql
-- B2C self-signup. A person who signs up themselves (email/password or Google)
-- is NOT joining a center — they get a personal organization and a student role.
-- Centers stay invite-only; platform super_admins live in app_metadata (no org).
--
-- Profile/org provisioning happens in a trigger so it works for EVERY signup
-- path, including OAuth (where Supabase, not our code, creates the auth user).
-- ============================================================================

-- Phone is collected at email/password signup.
alter table public.profiles add column if not exists phone text;

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

  -- Already-provisioned users (invited students / center admins) carry their
  -- organization_id in app_metadata; their profile is created explicitly by the
  -- server, so skip auto-provisioning here.
  if (new.raw_app_meta_data ->> 'organization_id') is not null then
    return new;
  end if;

  -- Self-signup (B2C): create a personal workspace + student profile.
  insert into public.organizations (name, plan)
  values (
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1))
      || ' (personal)',
    'trial'
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
