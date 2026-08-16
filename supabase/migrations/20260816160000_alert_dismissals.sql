-- ============================================================================
-- 20260816160000_alert_dismissals.sql
-- Putting an alert down for a week.
--
-- WHY THIS IS PART OF THE ALERT FEATURE AND NOT AN EXTRA. An alert you cannot
-- silence is an alert you learn to scroll past, and once a centre is scrolling
-- past one row it is scrolling past the panel. "Two students have gone quiet"
-- when the centre already rang both of them is noise; it has to be possible to
-- say "yes, dealt with" and have the console believe you.
--
-- SEVEN DAYS, NOT FOR EVER. A dismissal that never expires is a mute button,
-- and the thing being muted is the only part of the console that tells an owner
-- something is wrong. A week is long enough to act and short enough that a
-- problem nobody actually fixed comes back.
--
-- BY TYPE, NOT BY INSTANCE. The panel shows one row per alert type with a
-- count, so a dismissal is keyed the same way. Dismissing "students gone quiet"
-- and having it reappear the moment a third student goes quiet would be
-- technically correct and useless.
-- ============================================================================

create table if not exists public.alert_dismissals (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  -- Matches the `key` of an entry in the catalogue (lib/console/alert-catalogue.ts).
  -- Deliberately free text: the catalogue is application knowledge and pinning
  -- it in an enum would mean a migration every time an alert is added.
  alert_key       text not null check (length(btrim(alert_key)) between 1 and 60),
  dismissed_by    uuid not null,
  dismissed_at    timestamptz not null default now(),
  expires_at      timestamptz not null,
  primary key (organization_id, alert_key),
  foreign key (dismissed_by, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);

create index if not exists alert_dismissals_live_idx
  on public.alert_dismissals (organization_id, expires_at);

comment on table public.alert_dismissals is
  'One row per silenced alert type per centre. Expires; never permanent. Every dismissal is written to center_audit_log.';

-- ---------- Every dismissal is on the record ---------------------------------
-- From the trigger rather than the action, for the same reason the register
-- unlock is: the log has to record what happened, not what the application
-- intended. "Nobody told me the students had gone quiet" is answerable only if
-- the moment somebody silenced it is written down.

create or replace function public.log_alert_dismissal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor text;
begin
  select p.full_name into v_actor
    from public.profiles p where p.id = new.dismissed_by;

  insert into public.center_audit_log
    (organization_id, actor_id, actor_name, action, subject, detail)
  values (
    new.organization_id,
    new.dismissed_by,
    coalesce(v_actor, 'Unknown'),
    'alert.dismiss',
    new.alert_key,
    jsonb_build_object('until', new.expires_at)
  );
  return new;
end;
$$;

drop trigger if exists alert_dismissals_logged on public.alert_dismissals;
create trigger alert_dismissals_logged
  after insert or update on public.alert_dismissals
  for each row execute function public.log_alert_dismissal();

-- ============================================================================
-- RLS — everyone on staff sees what is silenced; the owner decides.
-- ============================================================================

alter table public.alert_dismissals enable row level security;

do $$ begin
  create policy alert_dismissals_read on public.alert_dismissals
    for select to authenticated
    using (organization_id = (select public.current_org_id()));
exception when duplicate_object then null; end $$;

-- The doc is explicit that this is the centre admin's call. A teacher silencing
-- "3 registers not marked" is the person the alert is about.
do $$ begin
  create policy alert_dismissals_write on public.alert_dismissals
    for all to authenticated
    using (organization_id = (select public.current_org_id()) and public.is_center_admin())
    with check (
      organization_id = (select public.current_org_id())
      and public.is_center_admin()
      and dismissed_by = (select auth.uid())
    );
exception when duplicate_object then null; end $$;
