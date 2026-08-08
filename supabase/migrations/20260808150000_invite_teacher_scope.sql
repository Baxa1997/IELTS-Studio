-- ============================================================================
-- 20260808150000_invite_teacher_scope.sql
-- Let a teacher actually issue the invites the app already offers them.
--
-- `inviteMember` supports a teacher inviting a student into a group they own,
-- and the group page lists that group's pending invites — but the only policy on
-- `invites` is center_admin-only, so for a teacher the insert was refused by RLS
-- and the list came back empty. The feature existed everywhere except the
-- database.
--
-- The grant is deliberately narrow: a teacher may only touch an invite that is
-- attached to a group they manage, and may only invite students. Inviting staff
-- stays a center_admin decision.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

drop policy if exists invites_teacher_manage on public.invites;
create policy invites_teacher_manage on public.invites
  for all to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) = 'teacher'
    and group_id is not null
    and (select public.can_manage_group(group_id))
  )
  with check (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) = 'teacher'
    and invites.role = 'student'
    and group_id is not null
    and (select public.can_manage_group(group_id))
  );
