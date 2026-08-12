-- ============================================================================
-- 20260812120000_attendance_alerts.sql
-- Telling someone when a student did not turn up.
--
-- CONFIGURATION ONLY. Nothing sends yet, on purpose: the decision of WHO gets
-- told, after HOW MANY absences, and over WHICH channel is the part a center
-- has opinions about, and it is worth agreeing before any provider is wired up.
-- Sending is a later change that reads this table and nothing else.
--
-- WHY IT IS NOT A COLUMN ON finance_settings. That table is money. An
-- attendance alert is an operational rule, it will grow more fields (quiet
-- hours, templates, per-class overrides), and mixing the two is how a finance
-- page ends up needing an unrelated migration.
--
-- WHY `channels` IS AN ARRAY AND NOT THREE BOOLEANS. A center that turns on
-- email and SMS wants both, and the set will grow (Telegram is already used for
-- class announcements). A `text[]` with a CHECK keeps the growth to one line
-- and keeps the reading code a single `includes`.
-- ============================================================================

create table if not exists public.attendance_alert_settings (
  organization_id       uuid primary key
                          references public.organizations (id) on delete cascade,

  -- The master switch. Off means the rest of this row is a saved intention.
  enabled               boolean not null default false,

  -- Where it goes. Empty = nowhere, which is the same as disabled but says
  -- something different: "we decided, and we have not picked a channel yet".
  channels              text[] not null default '{}'::text[]
                          check (channels <@ array['email','sms','telegram']::text[]),

  -- Consecutive absences before anyone is told. 1 = every absence. Centers
  -- differ sharply here: some phone home the same evening, some wait for a
  -- pattern, and telling a parent about one missed lesson can be worse than
  -- saying nothing.
  absences_before_alert int not null default 1
                          check (absences_before_alert between 1 and 10),

  -- Who hears about it. Both can be true; a teenager and their parent are
  -- different audiences and often need different wording.
  notify_student        boolean not null default true,
  notify_guardian       boolean not null default false,

  -- The name an SMS appears from. Uzbek operators require a registered sender
  -- id, so this is not cosmetic — an unregistered one is silently dropped.
  sms_sender            text check (sms_sender is null or length(sms_sender) <= 11),

  -- Nothing is sent outside these hours; it is queued to the next window. A
  -- 22:40 absence alert is how a center loses a parent's goodwill.
  quiet_hours_from      time,
  quiet_hours_to        time,

  updated_at            timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

comment on table public.attendance_alert_settings is
  'Per-center rules for absence alerts. Read by the (not yet built) sender; writing here sends nothing.';

create or replace trigger attendance_alert_settings_set_updated_at
  before update on public.attendance_alert_settings
  for each row execute function public.set_updated_at();

-- ---------- Where an alert would go ------------------------------------------
-- A student created by a center has no phone and often no email, so SMS has
-- nowhere to land. The guardian's number is the one a center actually holds —
-- it is on the enrolment form — and it is stored on the student, not as a
-- separate person, because that is the only fact we need about them.

alter table public.profiles
  add column if not exists guardian_name  text,
  add column if not exists guardian_phone text;

comment on column public.profiles.guardian_phone is
  'Parent or guardian number for absence alerts. The student''s own phone is `phone`.';

-- ============================================================================
-- RLS — the settings are the owner's; the guardian fields follow the profile
-- ============================================================================

alter table public.attendance_alert_settings enable row level security;

do $$ begin
  create policy attendance_alert_settings_read on public.attendance_alert_settings
    for select using (organization_id = public.current_org_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy attendance_alert_settings_write on public.attendance_alert_settings
    for all
    using (organization_id = public.current_org_id() and public.is_center_admin())
    with check (organization_id = public.current_org_id() and public.is_center_admin());
exception when duplicate_object then null; end $$;
