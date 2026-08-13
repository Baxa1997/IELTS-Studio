-- ============================================================================
-- 20260813140000_administrator_access.sql
-- What `administrator` can actually reach. Companion to 20260813130000, which
-- only added the enum value (Postgres refuses both in one transaction).
--
-- HOW THIS IS DONE. `center_admin` is named in 26 policies. Rewriting all of
-- them to say "center_admin or administrator" would spread the boundary across
-- 26 places and guarantee the next role costs the same again. Instead two
-- functions carry the meaning, and only the policies that should change call
-- them:
--
--   is_org_owner()      — the money and the plan. center_admin alone.
--   can_manage_people() — the day-to-day. center_admin OR administrator.
--
-- Policies about payroll, invoices, branches, billing and the organization row
-- are NOT touched: they already say `center_admin`, which is now precisely the
-- owner, so they keep the right meaning for free.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- The two capabilities --------------------------------------------

/** The owner: prices, payroll, the ledger, the plan, the settings. */
create or replace function public.is_org_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = (select auth.uid()) and p.role = 'center_admin'
  )
$$;

/** Runs the center day to day: classes, rosters, attendance, the front desk. */
create or replace function public.can_manage_people()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = (select auth.uid())
       and p.role in ('center_admin', 'administrator')
  )
$$;

grant execute on function public.is_org_owner()      to authenticated;
grant execute on function public.can_manage_people() to authenticated;

-- ---------- Classes -----------------------------------------------------------
-- One function change reaches assignments, group members, attendance and the
-- timetable, because they all ask can_manage_group() rather than the role.

create or replace function public.can_manage_group(p_group uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.groups g
      join public.profiles p on p.organization_id = g.organization_id
     where g.id = p_group
       and p.id = (select auth.uid())
       and (p.role in ('center_admin', 'administrator') or g.teacher_id = p.id)
  )
$$;

-- An administrator sees every student in the center, exactly as the owner does
-- — they are the person who answers the phone about any of them. A teacher is
-- unchanged: still only the students in groups they own.
create or replace function public.can_view_student(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    -- center_admin / administrator: anyone in their organization
    select 1
      from public.profiles me
      join public.profiles them on them.organization_id = me.organization_id
     where me.id = (select auth.uid())
       and me.role in ('center_admin', 'administrator')
       and them.id = p_student
    union all
    -- teacher: students in the groups they own
    select 1
      from public.groups g
      join public.group_members gm on gm.group_id = g.id
     where g.teacher_id = (select auth.uid())
       and gm.student_id = p_student
  )
$$;

-- groups: the manage policy moves off the bare role onto the capability.
drop policy if exists groups_admin_manage on public.groups;
create policy groups_admin_manage on public.groups
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.can_manage_people()))
  with check (organization_id = (select public.current_org_id())
              and (select public.can_manage_people()));

-- ---------- Enrolment ---------------------------------------------------------
-- Adding students and putting them in a class is the whole job, so invites
-- follow. Inviting a TEACHER stays with the owner: hiring is not a front-desk
-- decision, and the policy below is explicit about it rather than implying it.

drop policy if exists invites_admin_manage on public.invites;
create policy invites_admin_manage on public.invites
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and ((select public.is_org_owner())
              or ((select public.can_manage_people()) and role = 'student')))
  with check (organization_id = (select public.current_org_id())
              and ((select public.is_org_owner())
                   or ((select public.can_manage_people()) and role = 'student')));

-- ---------- Attendance, announcements, certificates ---------------------------
-- All three are operations. Each was center_admin-or-own-group; the owner half
-- becomes the capability so an administrator gets the center-wide view.

do $$ begin
  if to_regclass('public.attendance_alert_settings') is not null then
    drop policy if exists attendance_alert_admin on public.attendance_alert_settings;
    create policy attendance_alert_admin on public.attendance_alert_settings
      for all to authenticated
      using (organization_id = (select public.current_org_id())
             and (select public.can_manage_people()))
      with check (organization_id = (select public.current_org_id())
                  and (select public.can_manage_people()));
  end if;
end $$;

do $$ begin
  if to_regclass('public.certificates') is not null then
    drop policy if exists certificates_admin_manage on public.certificates;
    create policy certificates_admin_manage on public.certificates
      for all to authenticated
      using (organization_id = (select public.current_org_id())
             and (select public.can_manage_people()))
      with check (organization_id = (select public.current_org_id())
                  and (select public.can_manage_people()));
  end if;
end $$;

-- ---------- Subjects ----------------------------------------------------------
-- Which subjects exist, and who teaches them, is staffing — the owner's. An
-- administrator reads them (the org-read policy from 20260813120000 already
-- covers that) and assigns a class to one, which happens through `groups`.

-- ---------- Money -------------------------------------------------------------
-- The only money an administrator touches: tuition arriving at the counter.
--
-- Enforced by DIRECTION, in the database. `direction = 'in'` is the whole
-- permission — they can take a payment and see what has been taken, and an
-- expense, a transfer or a salary is refused here rather than merely hidden by
-- a page that does not offer it.
--
-- The desks, categories, invoices, payroll and branch tables are untouched, so
-- they remain owner-only exactly as written.

do $$ begin
  if to_regclass('public.finance_transactions') is not null then
    drop policy if exists finance_tx_desk_income on public.finance_transactions;
    create policy finance_tx_desk_income on public.finance_transactions
      for insert to authenticated
      with check (organization_id = (select public.current_org_id())
                  and (select public.can_manage_people())
                  and direction = 'in');

    drop policy if exists finance_tx_desk_read_income on public.finance_transactions;
    create policy finance_tx_desk_read_income on public.finance_transactions
      for select to authenticated
      using (organization_id = (select public.current_org_id())
             and (select public.can_manage_people())
             and direction = 'in');
  end if;
end $$;
