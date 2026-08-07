-- Restore handle_new_user to its current intended body.
--
-- The live trigger in production is migration 20260807120000's version: a
-- freshly created center comes out with billing_enforced = true (the column
-- default) instead of false, and an org application silently drops the login the
-- applicant chose. Both were added later — 150000 and 180000 — so 120000 was
-- evidently re-run last and overwrote them. Verified 2026-08-07 by creating a
-- center through the API and reading the row back.
--
-- Effect of NOT applying this: centers are metered, which is the opposite of the
-- documented "centers run unmetered" decision (CLAUDE.md), and org signup logins
-- never work because the username is never stored.
--
-- One owner per function: this migration is now the newest one that touches
-- handle_new_user and therefore owns it. Anything that changes it again must be
-- newer than this file, or it will silently roll these fixes back — which is
-- exactly how the bug above happened.
--
-- NOTE on the two app_metadata branches below: they do NOT fire for users made
-- with auth.admin.createUser, because Supabase writes custom app_metadata keys
-- after the auth.users INSERT, so raw_app_meta_data is still bare here. They are
-- kept only for rows inserted directly by SQL. The server reconciles instead —
-- see lib/provision.ts. Do not add an organization_id branch reading
-- raw_user_meta_data: that field is client-writable through the public signUp,
-- so it would let anyone join any organization.

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

-- Repair the centers that already exist with the wrong meter state. Personal
-- orgs are left alone: true is correct for them.
update public.organizations
   set billing_enforced = false
 where kind = 'center'
   and billing_enforced is distinct from false;

-- Repair the damage the dead skip-branch already did: a platform super admin
-- must have no organization and no profile, but the trigger gave them a personal
-- workspace and a `student` role. Deleting the organization cascades the profile.
--
-- Heavily guarded, and idempotent — it will only touch a `personal` org whose
-- SOLE member is a super_admin. Anything else is real data and is left alone.
delete from public.organizations o
 where o.kind = 'personal'
   and exists (
     select 1
       from public.profiles p
       join auth.users u on u.id = p.id
      where p.organization_id = o.id
        and coalesce(u.raw_app_meta_data ->> 'role', '') = 'super_admin'
   )
   and (select count(*) from public.profiles p2 where p2.organization_id = o.id) = 1;
