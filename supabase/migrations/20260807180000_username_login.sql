-- ============================================================================
-- 20260807180000_username_login.sql
-- Sign in with a LOGIN instead of an email.
--
-- Centers hand out credentials in class, and plenty of their students have no
-- email address at all. Supabase Auth is email/password underneath and that
-- doesn't change: every account still has an email row in auth.users. What
-- changes is what a human has to type — the server resolves a login to its
-- account before calling signInWithPassword (see app/(auth)/actions.ts).
--
-- Students created without a real address get a synthetic one on a domain we
-- own that has no mail exchanger, so nothing is ever delivered there and it
-- can't collide with a real inbox. Such an account simply has no password
-- reset by email — the teacher resets it instead.
--
-- Usernames are global, not per-center: the login box has no idea which org
-- you belong to until after you've signed in, so two centers cannot both hand
-- out "aziz". The app suggests a free one and reports a clash plainly.
-- ============================================================================

alter table public.profiles
  add column if not exists username text;

comment on column public.profiles.username is
  'Optional login name, stored lowercase. Resolved to the account email server-side at sign-in; never a substitute for auth.users.email.';

-- Case-insensitive uniqueness without requiring the citext extension. The app
-- lowercases before writing, so this is belt and braces — and it doubles as the
-- lookup index for the sign-in resolver.
create unique index if not exists profiles_username_key
  on public.profiles (lower(username))
  where username is not null;

-- Same trigger as 20260807150000, plus: a center application may choose its own
-- login, carried in user_metadata alongside the org name.
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

    insert into public.profiles (id, organization_id, role, full_name, phone, username)
    values (
      new.id,
      v_org,
      'center_admin',
      nullif(new.raw_user_meta_data ->> 'org_name', ''),
      nullif(new.raw_user_meta_data ->> 'phone', ''),
      lower(nullif(new.raw_user_meta_data ->> 'username', ''))
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

-- A signed-in user may not rename themselves into someone else's login: the
-- self-update policy already pins id/org/role, and username is not in the
-- column grant list below, so only service_role writes it.
revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
