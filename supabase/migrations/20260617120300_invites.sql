-- ============================================================================
-- 20260617120300_invites.sql
-- Pending invitations. A center_admin creates an invite for a student email in
-- THEIR OWN org; the student accepts via a tokenized link and is provisioned a
-- profile in that org. This is the only student onboarding path — there is no
-- public self-signup into an arbitrary org.
--
-- Acceptance runs server-side as service_role (the invitee has no session yet),
-- so the only RLS policy needed here is admin management.
-- ============================================================================

create table if not exists public.invites (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email           text not null,
  role            public.user_role not null default 'student',
  token           text not null unique,            -- bearer token in the accept link (app-generated)
  invited_by      uuid references public.profiles (id),
  accepted_at     timestamptz,
  expires_at      timestamptz not null default (now() + interval '7 days'),
  created_at      timestamptz not null default now(),
  unique (organization_id, email)                  -- one live invite per email per org
);
create index if not exists invites_org_idx on public.invites (organization_id);

alter table public.invites enable row level security;

-- Only a center_admin manages invites within their own org.
drop policy if exists invites_admin_manage on public.invites;
create policy invites_admin_manage on public.invites
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) = 'center_admin')
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) = 'center_admin');

grant select, insert, update, delete on public.invites to authenticated;
grant all on public.invites to service_role;
