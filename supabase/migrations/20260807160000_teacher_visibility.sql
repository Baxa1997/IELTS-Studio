-- ============================================================================
-- 20260807160000_teacher_visibility.sql
-- Two things a teacher needs that the schema didn't allow yet:
--
-- 1. CREATE THEIR OWN GROUPS. Until now only a center_admin could; the owner
--    wants teachers to make their own classes and add students to them.
--    A teacher may only create a group they themselves own.
--
-- 2. SEE THEIR STUDENTS' PRACTICE — all four skills, not just homework.
--    essays and reading_attempts already let center staff read their org's
--    rows, but listening_attempts and speaking_sessions were student-only, so
--    half of a learner's practice was invisible to their teacher.
--
--    The new policies are scoped TIGHTER than the old ones: a teacher sees a
--    student only when they share a group (a center_admin still sees the whole
--    org). That asymmetry with the older essays/reading policies is deliberate
--    and known — tightening those too is a behaviour change for the existing
--    review queue, so it's left as a separate decision.
-- ============================================================================

/** true when the caller may look at this student's work: the org's
 *  center_admin, or a teacher who owns a group the student belongs to.
 *  SECURITY DEFINER so the group lookup doesn't re-enter RLS. */
create or replace function public.can_view_student(p_student uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    -- center_admin: anyone in their organization
    select 1
      from public.profiles me
      join public.profiles them on them.organization_id = me.organization_id
     where me.id = (select auth.uid())
       and me.role = 'center_admin'
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

grant execute on function public.can_view_student(uuid) to authenticated;

-- ---------- 1. Teachers create their own groups -----------------------------
drop policy if exists groups_teacher_insert on public.groups;
create policy groups_teacher_insert on public.groups
  for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) = 'teacher'
    -- a teacher can only create a class they own
    and teacher_id = (select auth.uid())
  );

-- They can also rename/delete their own group (the admin policy already covers
-- every group in the org).
drop policy if exists groups_teacher_update on public.groups;
create policy groups_teacher_update on public.groups
  for update to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid())
              and organization_id = (select public.current_org_id()));

drop policy if exists groups_teacher_delete on public.groups;
create policy groups_teacher_delete on public.groups
  for delete to authenticated
  using (teacher_id = (select auth.uid()));

-- ---------- 2. Staff can read their students' listening + speaking ----------
drop policy if exists listening_attempts_staff_select on public.listening_attempts;
create policy listening_attempts_staff_select on public.listening_attempts
  for select to authenticated
  using ((select public.can_view_student(student_id)));

drop policy if exists speaking_sessions_staff_select on public.speaking_sessions;
create policy speaking_sessions_staff_select on public.speaking_sessions
  for select to authenticated
  using ((select public.can_view_student(student_id)));

-- The listening item behind an attempt (its topic/part) — needed to label the
-- rows in the teacher's activity feed.
drop policy if exists listening_items_staff_select on public.listening_items;
create policy listening_items_staff_select on public.listening_items
  for select to authenticated
  using ((select public.can_view_student(student_id)));
