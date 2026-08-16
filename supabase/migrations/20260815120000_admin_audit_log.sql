-- ============================================================================
-- 20260815120000_admin_audit_log.sql
-- Every super-admin action, written down.
--
-- WHY THIS EXISTS. A super admin can approve a centre, suspend an account,
-- change what a paying customer is allowed to do, and hand out unlimited quota.
-- None of that left a trace anywhere — the only record was the new value of the
-- column, with no note of who changed it, when, or from what. That is fine on a
-- one-person platform and indefensible the moment a second person has the
-- password, or a customer asks why their limit changed.
--
-- APPEND-ONLY BY CONSTRUCTION. There is no UPDATE or DELETE policy for anyone,
-- including the service role's callers in app code: the table is written once
-- and read forever. An audit log that can be edited is not an audit log.
--
-- WHAT IT IS NOT. Not a general event stream and not analytics. One row per
-- deliberate administrative act on someone else's account. Page views, reads
-- and background jobs stay out — a log nobody can skim is a log nobody reads.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.admin_audit_log (
  id           uuid primary key default gen_random_uuid(),

  -- The super admin who acted. auth.users, NOT profiles: a super admin has no
  -- profile row (the role lives in the JWT's app_metadata), so a profiles FK
  -- would be null on every row this table exists for.
  actor_id     uuid references auth.users (id) on delete set null,
  -- Denormalised on purpose. The email is part of the RECORD, not a lookup: if
  -- the account is ever deleted the row must still say who did it, and `on
  -- delete set null` above would otherwise erase exactly that.
  actor_email  text,

  -- What happened, as a stable slug: 'center.approve', 'center.reject',
  -- 'user.plan_change', 'user.suspend', 'user.limits_change'. Text rather than
  -- an enum because a new administrative act should be a one-line change in the
  -- action that performs it, not a migration and a deploy.
  action       text not null,

  -- What it happened TO. Kind plus id, rather than a foreign key per target
  -- type: the target may be an organization, a profile or an auth user, and the
  -- row must survive that target being deleted — which is precisely when the
  -- log matters most.
  target_kind  text not null check (target_kind in ('organization', 'user', 'plan', 'platform')),
  target_id    uuid,
  -- Human-readable at the time of writing, for the same reason as actor_email.
  target_label text,

  -- Anything the action wants to keep: {"from":"trial","to":"pro"}. Free-form
  -- because what is worth recording differs per action, and a column per field
  -- would be a migration every time a new action appears.
  detail       jsonb not null default '{}'::jsonb,

  created_at   timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log (target_kind, target_id, created_at desc);

-- ---------- Row Level Security ----------------------------------------------

alter table public.admin_audit_log enable row level security;

-- No policy for `authenticated` at all — not even SELECT.
--
-- A super admin has no profile and no organization, so there is no org to scope
-- a policy to; and every other role reading this table would be reading the
-- platform owner's actions across every tenant, which is a cross-tenant leak by
-- definition. The console reads it through the service-role client behind
-- requireSuperAdmin(), which is where the role check actually lives.
--
-- With RLS enabled and zero policies, `authenticated` gets nothing. That is the
-- intent, stated rather than implied.

drop policy if exists "audit log is service-role only" on public.admin_audit_log;

comment on table public.admin_audit_log is
  'Append-only record of super-admin actions. Service-role writes, service-role reads (behind requireSuperAdmin). No authenticated policy exists by design.';
