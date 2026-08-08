-- Let a center's correspondence address differ from the address it signs in with.
--
-- Why: profiles.id IS the auth user id, so one login = one profile = one
-- organization. Somebody who already practises here as an individual could
-- therefore never register their center with the same address — the signup was
-- silently discarded by Supabase's duplicate masking. That is the normal funnel
-- (try it alone, then bring your school), so it cannot be a dead end.
--
-- The fix keeps one profile per user and changes nothing about RLS. A center
-- applies with a LOGIN plus a contact email. When the contact email is free it
-- is also the auth email, so they can sign in either way. When it is already
-- taken, the account is created against a synthetic address on a domain we own
-- and they sign in with the login — the same mechanism teacher-created students
-- already use. Either way `organizations.contact_email` holds the real address,
-- which is where every notice is sent.
--
-- One owner per function: this migration is now the newest one to touch
-- handle_new_user and therefore owns it. Anything changing it again must be
-- newer than this file, or it silently reverts these fixes.

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

  -- Already-provisioned users (invited staff / teacher-created students).
  -- NOTE: this does not fire for auth.admin.createUser — Supabase writes custom
  -- app_metadata after the INSERT. The server reconciles; see lib/provision.ts.
  if (new.raw_app_meta_data ->> 'organization_id') is not null then
    return new;
  end if;

  -- Organization self-application (B2B): created pending, gated from the app
  -- until a super_admin approves.
  if coalesce(new.raw_user_meta_data ->> 'account_kind', '') = 'center' then
    insert into public.organizations (name, plan, kind, status, contact_email, billing_enforced)
    values (
      coalesce(nullif(new.raw_user_meta_data ->> 'org_name', ''), split_part(new.email, '@', 1)),
      'trial',
      'center',
      'pending',
      -- The real address to write to, which is NOT necessarily the login. Falls
      -- back to the auth email for anything created before this migration.
      coalesce(nullif(new.raw_user_meta_data ->> 'contact_email', ''), new.email),
      false   -- centers run unmetered; flip when they start being billed
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
