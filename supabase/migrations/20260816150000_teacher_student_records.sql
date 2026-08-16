-- ============================================================================
-- 20260816150000_teacher_student_records.sql
-- A teacher may edit the records of the students in their own groups.
--
-- WHAT THIS FIXES. `profiles` has exactly two UPDATE policies: `self_update`
-- (your own row) and `admin_manage` (centre_admin, org-wide). A TEACHER has
-- none — so a teacher cannot correct a student's phone number, and could not
-- mark a student as having left. The last migration granted the column and the
-- write still vanished: the grant said yes, and no row policy said yes, so
-- PostgREST reported success and changed nothing. That silent shape is this
-- schema's signature failure and it is why the grant fix alone was not enough.
--
-- WHY WIDEN IT AT ALL. §5 of the restructure puts "mark as left" on the group
-- roster, which is a teacher's screen — the teacher is the one who knows a
-- student has stopped coming, often weeks before the front desk does. Without
-- this they can see the problem and not record it, and the student sits in the
-- gone-quiet list for ever.
--
-- WHY IT IS SAFE. Teachers already CREATE these accounts — name, login,
-- password, photo and guardian details all go through `addStudentAccount`. This
-- grants no authority they did not already have over the same people; it lets
-- them maintain what they created. The scope is narrow in three ways:
--
--   * `role = 'student'` — a teacher cannot touch a colleague's record, or
--     their own (their own row is a staff row, so this excludes it too).
--   * `can_view_student` — a teacher reaches only the students in the groups
--     they own; a centre_admin still reaches the whole organization.
--   * the column grant is unchanged, so "edit a student" means the same five
--     columns it already meant, and `role` is not among them.
--
-- The self-set rule from 20260816140000 still applies on top: nobody sets their
-- own status, whatever policy lets them reach the row.
-- ============================================================================

drop policy if exists profiles_teacher_manage_students on public.profiles;
create policy profiles_teacher_manage_students on public.profiles
  for update to authenticated
  using (
    organization_id = (select public.current_org_id())
    and role = 'student'
    and public.can_view_student(id)
  )
  with check (
    organization_id = (select public.current_org_id())
    and role = 'student'
    and public.can_view_student(id)
  );

comment on policy profiles_teacher_manage_students on public.profiles is
  'A teacher maintains the students in their own groups — the accounts they created. Students only; never staff, never themselves.';
