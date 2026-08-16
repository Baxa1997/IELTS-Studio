-- ============================================================================
-- 20260816120000_center_correctness.sql
-- Phase 1 of the center restructure: the facts every later number rests on.
--
-- Nothing here is a feature. Every one of these columns exists because a number
-- the console already shows is wrong without it:
--
--   * a student who left is still in the attendance denominator, so the class
--     looks like it is haemorrhaging students;
--   * a lesson nobody taught is still an unmarked register, so the "registers
--     to mark" alert cries wolf until it is ignored;
--   * a closed group still counts as running, so "groups with no practice set"
--     counts groups that finished in June;
--   * an excused absence is an absence, so the absence alert fires on the
--     student whose parent rang ahead — which is how a center switches alerts
--     off within a week.
--
-- The rule this migration follows throughout: NOTHING IS DELETED. A student
-- leaves, a group closes, a lesson is cancelled. History, attendance and
-- invoices all stay intact and keep pointing at rows that still exist.
-- ============================================================================

-- ---------- People: active / paused / left -----------------------------------
-- One enum for staff and students both. A student is `paused` when they have
-- stopped attending but intend to come back (illness, exams, a month abroad);
-- a teacher is `paused` when they are on leave. In both cases the meaning the
-- rest of the system needs is identical: still enrolled, do not chase them, do
-- not count them against anything.
--
-- WHY NOT A `deleted_at`. Because "left" is not deletion — a student who left in
-- May still owes March's fee, still appears on March's register, and still has
-- a report their parent may ask for. Soft-delete columns invite code that
-- filters them out everywhere, which is exactly wrong here: they should be
-- filtered out of *forward-looking* counts and kept in every historical one.

do $$ begin
  create type public.member_status as enum ('active', 'paused', 'left');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists member_status public.member_status not null default 'active',
  add column if not exists status_changed_at timestamptz,
  add column if not exists status_note text;

comment on column public.profiles.member_status is
  'active = counts everywhere. paused = enrolled, excluded from chasing and from attendance/invoice denominators. left = historical only.';

create index if not exists profiles_member_status_idx
  on public.profiles (organization_id, member_status)
  where member_status <> 'active';

-- ---------- Groups: active / closed ------------------------------------------
-- A course that finished is not a course with no practice set.

do $$ begin
  create type public.group_status as enum ('active', 'closed');
exception when duplicate_object then null; end $$;

alter table public.groups
  add column if not exists status public.group_status not null default 'active',
  add column if not exists closed_at timestamptz;

comment on column public.groups.status is
  'closed = the course finished. Keeps its roster, registers and invoices; drops out of every "is this running" count.';

-- ---------- Attendance: the fourth state -------------------------------------
-- `excused` is not a softer `absent`. It means someone told us in advance, and
-- the difference is the whole value of an absence alert: without it the alert
-- fires on the student whose mother rang, the teacher learns to ignore it, and
-- the feature is dead inside a fortnight.
--
-- ADD VALUE is safe inside a transaction on PG12+ so long as nothing in the
-- same transaction *uses* the new label. Nothing below does.

alter type public.attendance_status add value if not exists 'excused';

-- ---------- Lessons that did not happen --------------------------------------
-- The timetable is a recurrence rule, so a single lesson has no row of its own
-- until someone marks its register. Cancelling one therefore cannot be an
-- UPDATE — there is nothing to update. It is a row that says "on this date,
-- this group did not meet", and every derived figure consults it:
--
--   attendance %      — cancelled lessons leave the denominator
--   part-month fees   — the divisor is lessons HELD, not lessons scheduled
--   register alerts   — a cancelled lesson has no register to chase
--
-- Without this the first time a teacher is ill, attendance and billing are both
-- wrong, and they are wrong in the direction that costs the center money.

create table if not exists public.lesson_cancellations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  group_id        uuid not null,
  held_on         date not null,
  -- Required. "Cancelled" with no reason is an argument three weeks later.
  reason          text not null check (length(btrim(reason)) between 1 and 300),
  cancelled_by    uuid,
  created_at      timestamptz not null default now(),
  unique (group_id, held_on),
  unique (id, organization_id),
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete cascade,
  foreign key (cancelled_by, organization_id)
    references public.profiles (id, organization_id) on delete set null
);
create index if not exists lesson_cancellations_org_date_idx
  on public.lesson_cancellations (organization_id, held_on);

comment on table public.lesson_cancellations is
  'One row per lesson that did not happen. Excluded from attendance %, from the fee divisor, and from unmarked-register alerts.';

-- ---------- Days the center is shut ------------------------------------------
-- A date range, not a date: centers close for the whole of Navruz, not for one
-- morning of it. A date is a holiday when ANY row covers it, so overlapping
-- entries are harmless and no exclusion constraint is needed.

create table if not exists public.center_holidays (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null check (length(btrim(name)) between 1 and 120),
  starts_on       date not null,
  ends_on         date not null,
  created_by      uuid,
  created_at      timestamptz not null default now(),
  check (ends_on >= starts_on),
  unique (organization_id, name, starts_on),
  foreign key (created_by, organization_id)
    references public.profiles (id, organization_id) on delete set null
);
create index if not exists center_holidays_org_idx
  on public.center_holidays (organization_id, starts_on, ends_on);

comment on table public.center_holidays is
  'Dates the center is shut. No lessons are generated, no registers expected, no fee-divisor entries.';

-- ---------- Where the center is, and when its week starts --------------------
-- This exists now rather than later because two Phase 1 numbers are wrong
-- without it. "Today" is currently the UTC day, so between midnight and 05:00 in
-- Tashkent the console shows yesterday's lessons; and "lessons that have
-- finished" compares a wall-clock `time` against a UTC clock, which is off by
-- five hours for the entire market this is sold in.
--
-- Deliberately NOT on finance_settings, which is money, and not on
-- organizations, whose operational columns are platform-owned.

create table if not exists public.center_settings (
  organization_id       uuid primary key
                          references public.organizations (id) on delete cascade,
  -- An IANA name, so daylight saving is the database's problem and not ours.
  timezone              text not null default 'Asia/Tashkent',
  -- 1 = Monday, matching the console's week order.
  week_starts_on        int  not null default 1 check (week_starts_on between 0 and 6),
  -- Days the center teaches at all. Used to grey out the timetable and to stop
  -- "no lessons on Sunday" reading as a fault.
  working_days          int[] not null default '{1,2,3,4,5,6}'::int[],
  default_lesson_minutes int not null default 90
                          check (default_lesson_minutes between 15 and 480),
  -- Who may overrule an AI band. Phase 2 reads this; storing it now keeps the
  -- settings page in one migration.
  override_policy       text not null default 'teacher'
                          check (override_policy in ('teacher', 'admin_only', 'nobody')),
  updated_at            timestamptz not null default now(),
  created_at            timestamptz not null default now()
);

comment on table public.center_settings is
  'Operational settings for one center. A missing row means every default above — reading code must not require it to exist.';

create or replace trigger center_settings_set_updated_at
  before update on public.center_settings
  for each row execute function public.set_updated_at();

-- ---------- What the center did ----------------------------------------------
-- Append-only. Denormalised actor name on purpose: this outlives the profile
-- row it names, and "unlocked by (deleted user)" is not an audit trail.

create table if not exists public.center_audit_log (
  id              bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id        uuid,
  actor_name      text,
  action          text not null,
  subject         text,
  detail          jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists center_audit_log_org_idx
  on public.center_audit_log (organization_id, created_at desc);

comment on table public.center_audit_log is
  'Append-only record of center actions that need to be answerable for. No update or delete policy exists, by design.';

-- ---------- Registers close after a week -------------------------------------
-- An attendance record that can be edited forever is not a record. Seven days
-- is long enough to fix a genuine mistake and short enough that the register is
-- worth something when a parent disputes it.
--
-- Enforced by a TRIGGER, not by RLS. RLS can say who may write a row; it cannot
-- easily say "these marks are frozen because their session's date has passed",
-- and a rule this consequential must not live only in the interface.

alter table public.attendance_sessions
  add column if not exists unlocked_until timestamptz;

comment on column public.attendance_sessions.unlocked_until is
  'Set by a center admin to reopen a locked register for a short window. Every unlock writes to center_audit_log.';

create or replace function public.attendance_is_locked(p_held_on date, p_unlocked_until timestamptz)
returns boolean
language sql
stable
as $$
  select p_held_on < current_date - 7
     and (p_unlocked_until is null or p_unlocked_until < now())
$$;

comment on function public.attendance_is_locked(date, timestamptz) is
  'A register locks 7 days after the lesson, unless a center admin has reopened it.';

create or replace function public.guard_attendance_marks()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_held_on    date;
  v_unlocked   timestamptz;
begin
  -- NEW is unassigned on DELETE and OLD on INSERT; reading the wrong one raises
  -- "record is not assigned yet" rather than returning null, so branch on TG_OP.
  if tg_op = 'DELETE' then
    v_session_id := old.session_id;
  else
    v_session_id := new.session_id;
  end if;

  select s.held_on, s.unlocked_until
    into v_held_on, v_unlocked
    from public.attendance_sessions s
   where s.id = v_session_id;

  if found and public.attendance_is_locked(v_held_on, v_unlocked) then
    raise exception
      'This register closed on % and can no longer be changed. A center admin can reopen it.',
      to_char(v_held_on + 7, 'DD Mon YYYY')
      using errcode = 'check_violation';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists attendance_marks_locked on public.attendance_marks;
create trigger attendance_marks_locked
  before insert or update or delete on public.attendance_marks
  for each row execute function public.guard_attendance_marks();

create or replace function public.guard_attendance_session()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor text;
begin
  -- Reopening is the center admin's alone, and it is logged from here rather
  -- than from the application: a write that bypasses the app must still leave a
  -- trace, otherwise the log records intentions instead of events.
  if new.unlocked_until is distinct from old.unlocked_until then
    if not public.is_center_admin() then
      raise exception 'Only a center admin can reopen a closed register.'
        using errcode = 'insufficient_privilege';
    end if;

    select p.full_name into v_actor
      from public.profiles p where p.id = (select auth.uid());

    insert into public.center_audit_log
      (organization_id, actor_id, actor_name, action, subject, detail)
    values (
      old.organization_id,
      (select auth.uid()),
      coalesce(v_actor, 'Unknown'),
      case when new.unlocked_until is null then 'register.relock' else 'register.unlock' end,
      old.held_on::text,
      jsonb_build_object('session_id', old.id, 'group_id', old.group_id, 'until', new.unlocked_until)
    );
    return new;
  end if;

  if public.attendance_is_locked(old.held_on, old.unlocked_until) then
    raise exception
      'This register closed on % and can no longer be changed. A center admin can reopen it.',
      to_char(old.held_on + 7, 'DD Mon YYYY')
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists attendance_sessions_locked on public.attendance_sessions;
create trigger attendance_sessions_locked
  before update on public.attendance_sessions
  for each row execute function public.guard_attendance_session();

-- Opening a register for a date that is already closed is the same act as
-- editing one, and has to be refused the same way — otherwise the lock is a
-- lock you walk around by deleting nothing and inserting a fresh row.
-- A center admin may still backfill: someone has to be able to enter the week
-- the internet was down, and they are the person accountable for it.
create or replace function public.guard_attendance_session_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.held_on < current_date - 7 and not public.is_center_admin() then
    raise exception
      'Registers older than 7 days are closed. Ask a center admin to enter this one.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists attendance_sessions_backdate on public.attendance_sessions;
create trigger attendance_sessions_backdate
  before insert on public.attendance_sessions
  for each row execute function public.guard_attendance_session_insert();

-- ---------- What "attendance %" now means ------------------------------------
-- Two corrections, both of which were silently overstating or understating the
-- rate before:
--
--   1. An EXCUSED absence leaves the denominator entirely. It is neither an
--      attendance nor a failure to attend — the lesson simply does not count
--      for that student. Treating it as attended would flatter the number;
--      treating it as absent is what makes parents argue with it.
--   2. A CANCELLED lesson takes its marks with it. If a register was marked and
--      the lesson was later written off, those marks are not evidence of
--      anything.
--
-- `status::text` rather than the enum literal on purpose: this runs in the same
-- transaction as the ADD VALUE above, and Postgres refuses to let a new enum
-- label be used before that transaction commits. The cast sidesteps it without
-- a second migration.

create or replace view public.v_student_attendance with (security_invoker = true) as
  select m.student_id,
         m.organization_id,
         count(*) filter (where m.status::text <> 'excused')::int   as sessions,
         count(*) filter (where m.status::text in ('present', 'late'))::int as attended,
         round(
           100.0 * count(*) filter (where m.status::text in ('present', 'late'))
                 / nullif(count(*) filter (where m.status::text <> 'excused'), 0)
         )::int                                                     as rate_pct
    from public.attendance_marks m
    join public.attendance_sessions s on s.id = m.session_id
   where not exists (
           select 1 from public.lesson_cancellations c
            where c.group_id = s.group_id and c.held_on = s.held_on
         )
   group by m.student_id, m.organization_id;

comment on view public.v_student_attendance is
  'Attendance rate per student. Attended = present or late. Excused absences and cancelled lessons leave the denominator.';

grant select on public.v_student_attendance to authenticated;

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.lesson_cancellations enable row level security;
alter table public.center_holidays      enable row level security;
alter table public.center_audit_log     enable row level security;
alter table public.center_settings      enable row level security;

-- Settings are read by everyone (a student's timetable needs the timezone) and
-- written by the owner.
do $$ begin
  create policy center_settings_read on public.center_settings
    for select to authenticated
    using (organization_id = (select public.current_org_id()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy center_settings_write on public.center_settings
    for all to authenticated
    using (organization_id = (select public.current_org_id()) and public.is_center_admin())
    with check (organization_id = (select public.current_org_id()) and public.is_center_admin());
exception when duplicate_object then null; end $$;

-- Cancellations: anyone in the org needs to READ them (a student should see
-- that Tuesday is off), but only whoever runs the group may write one.
do $$ begin
  create policy lesson_cancellations_read on public.lesson_cancellations
    for select to authenticated
    using (organization_id = (select public.current_org_id()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy lesson_cancellations_write on public.lesson_cancellations
    for all to authenticated
    using (
      organization_id = (select public.current_org_id())
      and (public.can_manage_people() or public.can_manage_group(group_id))
    )
    with check (
      organization_id = (select public.current_org_id())
      and (public.can_manage_people() or public.can_manage_group(group_id))
    );
exception when duplicate_object then null; end $$;

-- Holidays: everyone reads, the owner writes. A teacher should not be able to
-- shut the center.
do $$ begin
  create policy center_holidays_read on public.center_holidays
    for select to authenticated
    using (organization_id = (select public.current_org_id()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy center_holidays_write on public.center_holidays
    for all to authenticated
    using (organization_id = (select public.current_org_id()) and public.is_center_admin())
    with check (organization_id = (select public.current_org_id()) and public.is_center_admin());
exception when duplicate_object then null; end $$;

-- The audit log is readable by the people it holds to account, and writable by
-- nobody from the client: there is a SELECT policy and no other. Rows arrive
-- through the security-definer trigger above and through service-role code.
do $$ begin
  create policy center_audit_log_read on public.center_audit_log
    for select to authenticated
    using (organization_id = (select public.current_org_id()) and public.can_manage_people());
exception when duplicate_object then null; end $$;

grant execute on function public.attendance_is_locked(date, timestamptz) to authenticated;

-- ---------- Column grants ----------------------------------------------------
-- `member_status` and `groups.status` are ordinary staff-writable columns; the
-- existing profile and group write policies already decide who may touch the
-- row at all, and there is no reason a center admin who can rename a group
-- cannot close it.
