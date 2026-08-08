-- ============================================================================
-- 20260808140000_console_stat_views.sql
-- One definition per number on the console.
--
-- The roster cards ("Students / Have practised / Never practised / In no group")
-- and the "Pending invites" tile were each computed in TypeScript, slightly
-- differently on each page — which is why the numbers looked wrong:
--
--   • "Have practised" counted EVERY essay, reading, listening and speaking row
--     regardless of status, so an abandoned draft counted as practice;
--   • "Pending invites" on /console counted every unaccepted invite including
--     long-expired ones, while the group page correctly excluded them.
--
-- These views are now the single definition, and the pages read them.
--
-- `security_invoker = true` matters: without it a view runs with its owner's
-- rights and would hand every caller the whole table. With it, the base-table
-- RLS still applies, so a teacher's read of v_center_student_stats is narrowed
-- by can_view_student()/profiles policy exactly as a direct read would be.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- 1. What counts as "a practice" ----------------------------------
-- GRADED work only, across all four skills. A draft, an abandoned attempt or a
-- session the learner walked out of is not practice — counting it is what made
-- "Have practised" indefensible in front of a center owner.
--
-- Not included: speaking_attempts (part-2 practice) is student-only by policy,
-- so staff cannot read it; including it would give a learner and their teacher
-- two different totals. Widening that policy is a separate decision.
drop view if exists public.v_center_student_stats;
drop view if exists public.v_practice_activity;

create view public.v_practice_activity with (security_invoker = true) as
  select e.student_id, e.organization_id, 'writing'::text as skill, e.created_at as at
    from public.essays e
   where e.status = 'graded'
  union all
  select ra.student_id, ra.organization_id, 'reading'::text,
         coalesce(ra.submitted_at, ra.created_at)
    from public.reading_attempts ra
   where ra.status = 'graded'
  union all
  select la.student_id, la.organization_id, 'listening'::text, la.created_at
    from public.listening_attempts la
   where la.score is not null          -- listening has no status column: a score IS the grade
  union all
  select ss.student_id, ss.organization_id, 'speaking'::text, ss.started_at
    from public.speaking_sessions ss
   where ss.state = 'graded';

comment on view public.v_practice_activity is
  'One row per GRADED practice, any skill. The single definition of "a practice" for every console statistic.';

-- ---------- 2. One row per student ------------------------------------------
-- Lateral subqueries rather than joins: joining activity and memberships in one
-- query multiplies them (3 practices x 2 groups = 6), which is its own way of
-- reporting a wrong number.
create view public.v_center_student_stats with (security_invoker = true) as
  select p.id              as student_id,
         p.organization_id,
         p.full_name,
         p.username,
         p.avatar_path,
         act.practice_count,
         act.last_active,
         grp.group_count
    from public.profiles p
    cross join lateral (
      select count(*)::int as practice_count, max(a.at) as last_active
        from public.v_practice_activity a
       where a.student_id = p.id
    ) act
    cross join lateral (
      select count(*)::int as group_count
        from public.group_members gm
       where gm.student_id = p.id
    ) grp
   where p.role = 'student';

comment on view public.v_center_student_stats is
  'Roster row + the four cards: Students = count(*), Have practised = practice_count > 0, Never practised = practice_count = 0, In no group = group_count = 0.';

-- ---------- 3. A pending invite is unaccepted AND unexpired -----------------
drop view if exists public.v_pending_invites;
create view public.v_pending_invites with (security_invoker = true) as
  select i.id, i.organization_id, i.email, i.role, i.group_id,
         i.invited_by, i.created_at, i.expires_at
    from public.invites i
   where i.accepted_at is null
     and i.expires_at > now();

comment on view public.v_pending_invites is
  'The only definition of "pending": not accepted and not expired. Every surface that counts or lists invites reads this.';

-- ---------- Grants ----------------------------------------------------------
grant select on public.v_practice_activity     to authenticated;
grant select on public.v_center_student_stats  to authenticated;
grant select on public.v_pending_invites       to authenticated;
grant select on public.v_practice_activity     to service_role;
grant select on public.v_center_student_stats  to service_role;
grant select on public.v_pending_invites       to service_role;
