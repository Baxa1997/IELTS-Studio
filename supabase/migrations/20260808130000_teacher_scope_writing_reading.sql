-- ============================================================================
-- 20260808130000_teacher_scope_writing_reading.sql
-- Close the last hole in teacher visibility.
--
-- `20260807160000_teacher_visibility` introduced can_view_student() — a
-- center_admin sees their whole organization, a teacher sees only the students
-- in groups they own — and applied it to listening and speaking. It deliberately
-- left essays, gradings and reading_attempts alone, because those policies
-- predate groups and are read by the review queue and the cohort dashboard.
--
-- That gap contradicts the permission matrix: with the old policies ANY teacher
-- in the org could read (and update, and grade) ANY student's essay, including
-- another teacher's class, straight through PostgREST. This migration puts the
-- three writing/reading tables on the same rule as the other two skills.
--
-- What does NOT change:
--   • students still read/write exactly their own rows (the auth.uid() branch);
--   • a center_admin still sees the whole org (can_view_student's first branch),
--     so /console/cohort — center_admin only — is unaffected;
--   • the AI grader, the queue drainer and every other server path use the
--     service-role client and bypass RLS entirely.
--
-- What changes for a teacher: a grading or essay belonging to a student in
-- someone else's group now reads as "not found" instead of opening. That is the
-- intended behaviour; /console/grading/[id] already handles a missing row.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- essays ----------------------------------------------------------
-- Read: your own, or a student you're entitled to look at.
drop policy if exists essays_select on public.essays;
create policy essays_select on public.essays
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.can_view_student(student_id)))
  );

-- Write: unchanged for the student; staff writes narrow to their own students.
-- (In practice no staff UI writes an essay — the studio saves the learner's own
-- row and grading runs service-role — but an over-broad policy is a foothold.)
drop policy if exists essays_update on public.essays;
create policy essays_update on public.essays
  for update to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.can_view_student(student_id)))
  )
  with check (organization_id = (select public.current_org_id()));

drop policy if exists essays_insert on public.essays;
create policy essays_insert on public.essays
  for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.can_view_student(student_id)))
  );

-- Delete stays admin-or-owner: a teacher deleting a learner's graded work is
-- not a flow we want, and can_view_student would have granted it.
drop policy if exists essays_delete on public.essays;
create policy essays_delete on public.essays
  for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.current_app_role()) = 'center_admin')
  );

-- ---------- gradings --------------------------------------------------------
-- A grading is visible exactly when its essay is. Resolving through the essay
-- (rather than repeating the role test) means the two can never drift apart.
drop policy if exists gradings_select on public.gradings;
create policy gradings_select on public.gradings
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and exists (
      select 1 from public.essays e
       where e.id = gradings.essay_id
         and (e.student_id = (select auth.uid())
              or (select public.can_view_student(e.student_id)))
    )
  );

-- The teacher band override (the only client-side write) is likewise limited to
-- the staff member's own students.
drop policy if exists gradings_write on public.gradings;
create policy gradings_write on public.gradings
  for all to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) in ('teacher', 'center_admin')
    and exists (
      select 1 from public.essays e
       where e.id = gradings.essay_id
         and (select public.can_view_student(e.student_id))
    )
  )
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) in ('teacher', 'center_admin')
    and exists (
      select 1 from public.essays e
       where e.id = gradings.essay_id
         and (select public.can_view_student(e.student_id))
    )
  );

-- ---------- reading_attempts ------------------------------------------------
drop policy if exists attempts_select on public.reading_attempts;
create policy attempts_select on public.reading_attempts
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.can_view_student(student_id)))
  );

drop policy if exists attempts_insert on public.reading_attempts;
create policy attempts_insert on public.reading_attempts
  for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.can_view_student(student_id)))
  );

drop policy if exists attempts_update on public.reading_attempts;
create policy attempts_update on public.reading_attempts
  for update to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.can_view_student(student_id)))
  )
  with check (organization_id = (select public.current_org_id()));

drop policy if exists attempts_delete on public.reading_attempts;
create policy attempts_delete on public.reading_attempts
  for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.current_app_role()) = 'center_admin')
  );
