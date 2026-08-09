-- ============================================================================
-- 20260809120000_center_operations.sql
-- The three center-operations modules the CRM design calls for and the product
-- had no home for: attendance registers, completion certificates, and
-- announcements.
--
-- Tenancy follows the house rule from the organizations migration: every row
-- carries organization_id, and every reference to a person or a group uses the
-- composite FK (id, organization_id) so a cross-tenant row is impossible at the
-- database level rather than only in policy.
--
-- Authority follows the existing helpers — `can_manage_group` (center_admin
-- anywhere in the org, teacher only on groups they own) and `can_view_student`
-- — so nothing here invents a second permission model.
-- ============================================================================

-- ---------- Attendance ------------------------------------------------------

do $$ begin
  create type public.attendance_status as enum ('present', 'late', 'absent');
exception when duplicate_object then null; end $$;

-- One row per class meeting. `held_on` is a date, not a timestamp: a register
-- belongs to a teaching day, and two sessions for the same group on the same
-- day is a data-entry mistake, not a case to support.
create table if not exists public.attendance_sessions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  group_id        uuid not null,
  held_on         date not null default current_date,
  note            text,
  -- 'open' until someone saves the register; 'marked' after.
  state           text not null default 'open' check (state in ('open', 'marked')),
  marked_by       uuid,
  marked_at       timestamptz,
  created_at      timestamptz not null default now(),
  unique (group_id, held_on),
  unique (id, organization_id),
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete cascade,
  foreign key (marked_by, organization_id)
    references public.profiles (id, organization_id) on delete set null
);
create index if not exists attendance_sessions_org_idx on public.attendance_sessions (organization_id);
create index if not exists attendance_sessions_group_idx on public.attendance_sessions (group_id, held_on desc);

create table if not exists public.attendance_marks (
  session_id      uuid not null,
  student_id      uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  status          public.attendance_status not null,
  recorded_at     timestamptz not null default now(),
  primary key (session_id, student_id),
  foreign key (session_id, organization_id)
    references public.attendance_sessions (id, organization_id) on delete cascade,
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);
create index if not exists attendance_marks_student_idx on public.attendance_marks (student_id);

alter table public.attendance_sessions enable row level security;
alter table public.attendance_marks    enable row level security;

drop policy if exists attendance_sessions_read on public.attendance_sessions;
create policy attendance_sessions_read on public.attendance_sessions
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (
      (select public.current_app_role()) in ('center_admin', 'teacher')
      -- A student may see the registers of classes they are in.
      or exists (
        select 1 from public.group_members gm
         where gm.group_id = attendance_sessions.group_id
           and gm.student_id = (select auth.uid())
      )
    )
  );

drop policy if exists attendance_sessions_write on public.attendance_sessions;
create policy attendance_sessions_write on public.attendance_sessions
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and public.can_manage_group(group_id))
  with check (organization_id = (select public.current_org_id())
              and public.can_manage_group(group_id));

drop policy if exists attendance_marks_read on public.attendance_marks;
create policy attendance_marks_read on public.attendance_marks
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid()) or public.can_view_student(student_id))
  );

drop policy if exists attendance_marks_write on public.attendance_marks;
create policy attendance_marks_write on public.attendance_marks
  for all to authenticated
  using (
    organization_id = (select public.current_org_id())
    and exists (
      select 1 from public.attendance_sessions s
       where s.id = attendance_marks.session_id
         and public.can_manage_group(s.group_id)
    )
  )
  with check (
    organization_id = (select public.current_org_id())
    and exists (
      select 1 from public.attendance_sessions s
       where s.id = attendance_marks.session_id
         and public.can_manage_group(s.group_id)
    )
  );

-- ---------- Certificates ----------------------------------------------------

-- Issued on course completion, carrying a short human-readable verification
-- code. The code is globally unique because verification happens on a public
-- page with no tenant in the URL.
create table if not exists public.certificates (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id      uuid not null,
  group_id        uuid,
  course          text not null,
  band            numeric(2,1),
  code            text not null unique,
  issued_on       date not null default current_date,
  issued_by       uuid,
  created_at      timestamptz not null default now(),
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade,
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete set null,
  foreign key (issued_by, organization_id)
    references public.profiles (id, organization_id) on delete set null
);
create index if not exists certificates_org_idx on public.certificates (organization_id, issued_on desc);
create index if not exists certificates_student_idx on public.certificates (student_id);

alter table public.certificates enable row level security;

drop policy if exists certificates_read on public.certificates;
create policy certificates_read on public.certificates
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.current_app_role()) in ('center_admin', 'teacher'))
  );

-- Only a center_admin issues one: a certificate is the center's statement, not
-- an individual teacher's.
drop policy if exists certificates_write on public.certificates;
create policy certificates_write on public.certificates
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) = 'center_admin')
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) = 'center_admin');

-- ---------- Announcements ---------------------------------------------------

create table if not exists public.announcements (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  subject         text not null,
  body            text not null,
  -- Who it went to, resolved to real people at send time.
  audience        text not null check (audience in ('everyone', 'students', 'teachers', 'group')),
  group_id        uuid,
  recipients      int not null default 0,
  sent_at         timestamptz not null default now(),
  sent_by         uuid,
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete set null,
  foreign key (sent_by, organization_id)
    references public.profiles (id, organization_id) on delete set null
);
create index if not exists announcements_org_idx on public.announcements (organization_id, sent_at desc);

alter table public.announcements enable row level security;

-- Staff read the log of what the center has sent. Recipients get the message
-- itself through `notifications`, not by reading this table.
drop policy if exists announcements_read on public.announcements;
create policy announcements_read on public.announcements
  for select to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('center_admin', 'teacher'));

drop policy if exists announcements_write on public.announcements;
create policy announcements_write on public.announcements
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) = 'center_admin')
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) = 'center_admin');

-- ---------- Grants ----------------------------------------------------------
grant select, insert, update, delete on public.attendance_sessions to authenticated;
grant select, insert, update, delete on public.attendance_marks    to authenticated;
grant select, insert, update, delete on public.certificates        to authenticated;
grant select, insert, update, delete on public.announcements       to authenticated;
grant all on public.attendance_sessions to service_role;
grant all on public.attendance_marks    to service_role;
grant all on public.certificates        to service_role;
grant all on public.announcements       to service_role;

-- ---------- Roll-up view ----------------------------------------------------
-- Attendance rate per student, so the roster and reports never re-derive it two
-- different ways. security_invoker so the caller's RLS still applies.
create or replace view public.v_student_attendance with (security_invoker = true) as
  select m.student_id,
         m.organization_id,
         count(*)::int                                             as sessions,
         count(*) filter (where m.status <> 'absent')::int          as attended,
         round(100.0 * count(*) filter (where m.status <> 'absent') / nullif(count(*), 0))::int
                                                                    as rate_pct
    from public.attendance_marks m
   group by m.student_id, m.organization_id;

comment on view public.v_student_attendance is
  'Attendance rate per student. "Attended" counts present AND late — a late arrival was in the room.';

grant select on public.v_student_attendance to authenticated;
