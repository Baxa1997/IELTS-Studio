-- ============================================================================
-- 20260617120500_ai_usage.sql
-- Per-call AI usage log. Every model call (grade/generate, success or failure)
-- writes one row via the server-side AI service (service_role). Powers cost
-- tracking and per-tenant quotas/billing.
--   - Tenant-scoped: center_admin reads their own org's usage.
--   - Writes are service_role-only (the AI service); no authenticated writes.
-- (CLAUDE.md: "All AI calls go through a single server-side service with usage
--  logging.")
--
-- Idempotent: safe to re-run in the Supabase SQL editor (CREATE TYPE is guarded;
-- tables/indexes use IF NOT EXISTS; the policy is dropped before re-create).
-- ============================================================================

do $$ begin
  create type public.ai_task as enum ('grade', 'generate');
exception when duplicate_object then null;
end $$;

create table if not exists public.ai_usage (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid references auth.users (id) on delete set null,  -- who triggered it
  task            public.ai_task not null,
  provider        text not null,                 -- 'gemini', 'claude'
  model           text not null,                 -- 'gemini-2.5-flash', …
  request_kind    text,                          -- 'task2' | 'writing_prompt' | …
  essay_id        uuid references public.essays (id) on delete set null,
  input_tokens    int,
  output_tokens   int,
  latency_ms      int  not null,
  ok              boolean not null,
  error           text,
  created_at      timestamptz not null default now()
);
create index if not exists ai_usage_org_created_idx on public.ai_usage (organization_id, created_at desc);

-- ---------- Row Level Security ---------------------------------------------
alter table public.ai_usage enable row level security;

-- center_admin sees their own org's usage (billing/quota visibility). No
-- authenticated INSERT/UPDATE/DELETE policy exists, so only service_role (which
-- bypasses RLS) can write — exactly how the AI service logs.
drop policy if exists ai_usage_admin_read on public.ai_usage;
create policy ai_usage_admin_read on public.ai_usage
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) = 'center_admin'
  );

-- ---------- Grants ----------------------------------------------------------
grant select on public.ai_usage to authenticated;  -- still gated by RLS above
grant all    on public.ai_usage to service_role;
