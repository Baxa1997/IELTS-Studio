-- ============================================================================
-- 20260617121400_public_grader.sql
-- Public, no-login essay grader (the marketing funnel).
--
--   1) A single seeded "public" organization that the anonymous grader attributes
--      its AI usage to. ai_usage.organization_id is NOT NULL, so public calls need
--      a real org to bill the cost ledger against; it has no members, so RLS keeps
--      it invisible to every real tenant (center_admin only reads their OWN org).
--   2) public_grade_events — a lightweight rate-limit ledger keyed by a SALTED HASH
--      of the visitor's IP (never the raw IP). The route counts recent rows per-IP
--      and globally before spending a model call. Service-role only: there is no
--      RLS policy and no grant to `authenticated`, so no signed-in user can read or
--      write it; only the server-side route (service_role) touches it.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- Seed the public marketing org -----------------------------------
-- Fixed UUID mirrored by PUBLIC_ORG_ID in lib/public-grader/prompts.ts. Keep them
-- in sync. The slug is namespaced so it can't collide with a real center.
insert into public.organizations (id, name, slug, plan)
values ('00000000-0000-4000-a000-000000000001', 'Public grader (marketing)', '__public__', 'trial')
on conflict (id) do nothing;

-- ---------- Rate-limit ledger -----------------------------------------------
create table if not exists public.public_grade_events (
  id         uuid primary key default gen_random_uuid(),
  ip_hash    text not null,                 -- sha256(salt:ip); raw IP is never stored
  created_at timestamptz not null default now()
);
-- Per-IP window count and the global cost-ceiling count both filter on created_at.
create index if not exists public_grade_events_ip_idx on public.public_grade_events (ip_hash, created_at desc);
create index if not exists public_grade_events_created_idx on public.public_grade_events (created_at desc);

-- ---------- Row Level Security ----------------------------------------------
-- Enabled with NO policies and NO grant to authenticated => every non-service_role
-- access is denied. The grader route uses the service-role client, which bypasses
-- RLS. This table holds only opaque hashes + timestamps, never PII.
alter table public.public_grade_events enable row level security;

grant all on public.public_grade_events to service_role;
