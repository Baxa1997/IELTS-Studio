-- ============================================================================
-- 20260808180000_notifications.sql
-- In-app notifications — the missing half of every flow the product already has.
--
-- Homework was published and nobody was told. An essay finished grading and the
-- learner had to go looking. A grading exhausted its retries and it was visible
-- to nobody at all. Each of those is an event the app already knows about; there
-- was simply nowhere to put it.
--
-- Deliberately not email: a center student may have no real address (they sign
-- in by login), so the in-app bell is the only channel that reaches everyone.
-- Telegram hangs off the same rows later — one table, several transports.
--
-- WRITES ARE SERVICE-ROLE ONLY. A notification is a statement by the system
-- about something that happened; a client that could insert one could tell a
-- classmate their band had changed. The single exception is marking your own as
-- read, granted at column level below.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

do $$ begin
  create type public.notification_type as enum (
    'assignment_published',   -- a teacher set your class some practice
    'assignment_due_soon',    -- 24h before due_at (cron)
    'attempt_graded',         -- your essay came back
    'grading_queued',         -- busy or over quota: it will be graded, not lost
    'grading_failed',         -- retries exhausted; staff can re-run it
    'quota_warning',          -- 80% of the monthly allowance (admins)
    'quota_exhausted'         -- 100% (admins)
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.notifications (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  -- The person this is FOR. profiles.id, tied to the org by the composite FK so
  -- a notification can never be addressed across tenants.
  recipient_id    uuid not null,
  type            public.notification_type not null,
  title           text not null,
  body            text,
  -- Where clicking it goes (an assignment, a feedback page, billing).
  href            text,
  payload         jsonb not null default '{}'::jsonb,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  foreign key (recipient_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);

-- The bell asks one question — "my unread, newest first" — and this answers it.
create index if not exists notifications_inbox_idx
  on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (recipient_id)
  where read_at is null;

alter table public.notifications enable row level security;

-- Read your own. Nobody reads anybody else's, including staff: this is the
-- learner's inbox, not another reporting surface.
drop policy if exists notifications_own_select on public.notifications;
create policy notifications_own_select on public.notifications
  for select to authenticated
  using (recipient_id = (select auth.uid()));

-- Mark your own as read. The column grant below is what stops this policy from
-- also allowing a rewrite of the title or the link.
drop policy if exists notifications_own_update on public.notifications;
create policy notifications_own_update on public.notifications
  for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
grant all on public.notifications to service_role;
