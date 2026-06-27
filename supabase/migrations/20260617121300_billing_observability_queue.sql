-- ============================================================================
-- 20260617121300_billing_observability_queue.sql
-- Three operational systems on top of the AI layer:
--
--   1. OBSERVABILITY — ai_usage gains cost_usd, prompt_version, trace_id and a
--      small result_summary so every model call is traceable (Langfuse-compatible)
--      and costed.
--   2. BILLING — provider-agnostic subscriptions + an append-only webhook event
--      log (Stripe / Payme / Click). organizations gains a generation limit knob.
--   3. QUEUE — grading_jobs: an async fallback so grading spikes degrade to a
--      drained queue instead of hard failures.
--
-- Multi-tenant throughout: center_admin reads its org's billing/usage; the queue
-- is staff-readable; every WRITE is service_role (webhooks, the AI service, the
-- queue drainer) so none of it is client-forgeable.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- Enums -----------------------------------------------------------
do $$ begin
  create type public.billing_provider as enum ('stripe', 'payme', 'click');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.subscription_status as enum
    ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
exception when duplicate_object then null;
end $$;
do $$ begin
  create type public.grading_job_status as enum ('queued', 'processing', 'done', 'failed');
exception when duplicate_object then null;
end $$;

-- ---------- 1. Observability: extend ai_usage ------------------------------
alter table public.ai_usage
  add column if not exists cost_usd       numeric(10,6),  -- estimated from tokens × model price
  add column if not exists prompt_version text,           -- which prompt build produced this
  add column if not exists trace_id       text,           -- Langfuse trace id for this call
  add column if not exists result_summary text;           -- e.g. 'band 6.5' / 'reading_set'
create index if not exists ai_usage_trace_idx on public.ai_usage (trace_id);

-- ---------- 2. Billing ------------------------------------------------------
alter table public.organizations
  add column if not exists generation_monthly_limit int
    check (generation_monthly_limit is null or generation_monthly_limit >= 0);

-- One subscription row per org (its current plan + provider linkage). Written by
-- webhooks via service_role; center_admin reads it.
create table if not exists public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null unique references public.organizations (id) on delete cascade,
  provider                public.billing_provider,
  plan                    public.org_plan not null default 'trial',
  status                  public.subscription_status not null default 'trialing',
  external_customer_id    text,
  external_subscription_id text,
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create index if not exists subscriptions_org_idx on public.subscriptions (organization_id);

-- Append-only webhook log. The unique (provider, external_event_id) makes webhook
-- processing idempotent — a provider re-delivery is a no-op insert.
create table if not exists public.billing_events (
  id                uuid primary key default gen_random_uuid(),
  provider          public.billing_provider not null,
  event_type        text,
  external_event_id text,
  organization_id   uuid references public.organizations (id) on delete set null,
  payload           jsonb not null default '{}'::jsonb,
  created_at        timestamptz not null default now(),
  unique (provider, external_event_id)
);
create index if not exists billing_events_org_idx on public.billing_events (organization_id, created_at desc);

-- ---------- 3. Grading queue ------------------------------------------------
create table if not exists public.grading_jobs (
  id              uuid primary key default gen_random_uuid(),
  essay_id        uuid not null,
  organization_id uuid not null,
  status          public.grading_job_status not null default 'queued',
  attempts        int  not null default 0,
  max_attempts    int  not null default 5,
  last_error      text,
  run_after       timestamptz not null default now(),  -- backoff: don't pick up before this
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (essay_id),                                    -- one job per essay (upserted)
  foreign key (essay_id, organization_id)
    references public.essays (id, organization_id) on delete cascade
);
create index if not exists grading_jobs_claim_idx on public.grading_jobs (status, run_after);

-- ---------- updated_at triggers --------------------------------------------
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create or replace trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();
drop trigger if exists grading_jobs_set_updated_at on public.grading_jobs;
create or replace trigger grading_jobs_set_updated_at
  before update on public.grading_jobs
  for each row execute function public.set_updated_at();

-- ---------- Row Level Security ---------------------------------------------
alter table public.subscriptions  enable row level security;
alter table public.billing_events enable row level security;
alter table public.grading_jobs   enable row level security;

-- subscriptions: center_admin reads its org's billing. No authenticated write —
-- only webhooks (service_role) mutate billing state.
drop policy if exists subscriptions_select on public.subscriptions;
create policy subscriptions_select on public.subscriptions
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) = 'center_admin'
  );

-- billing_events: center_admin reads its org's audit trail; writes are webhook-only.
drop policy if exists billing_events_select on public.billing_events;
create policy billing_events_select on public.billing_events
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) = 'center_admin'
  );

-- grading_jobs: teacher/admin can see the queue for their org; the drainer and the
-- grade route (service_role) own all writes.
drop policy if exists grading_jobs_select on public.grading_jobs;
create policy grading_jobs_select on public.grading_jobs
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) in ('center_admin', 'teacher')
  );

-- ---------- Grants ----------------------------------------------------------
grant select on public.subscriptions  to authenticated;  -- gated by RLS
grant select on public.billing_events to authenticated;
grant select on public.grading_jobs   to authenticated;
grant all on public.subscriptions  to service_role;
grant all on public.billing_events to service_role;
grant all on public.grading_jobs   to service_role;
