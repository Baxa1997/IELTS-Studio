-- ============================================================================
-- 20260812130000_teacher_announcements.sql
-- A teacher may announce to their own classes.
--
-- WHY THIS WAS WRONG BEFORE. A teacher is the only person who can attach
-- homework to a class — `createAssignment` refuses anyone but the class's own
-- teacher — and they are the one who connects that class's Telegram channel.
-- But announcing to the class was center_admin only, so the person who runs the
-- class could set its work and wire up its channel, then had to ask the owner
-- to tell anybody about it. The read policy already let them SEE announcements;
-- only writing was barred, which is the least defensible half of the split.
--
-- WHAT STAYS THE OWNER'S. A center-wide announcement — 'everyone', 'students',
-- 'teachers' — reaches people who are not in the teacher's classes, including
-- other staff. That is the center speaking, not a teacher, and it stays with
-- center_admin. A teacher's announcement must name a group, and it must be a
-- group they manage: `can_manage_group` is the same helper that decides who may
-- mark a register or set homework, so authority over a class is one rule
-- everywhere rather than three that can drift apart.
-- ============================================================================

drop policy if exists announcements_write on public.announcements;
create policy announcements_write on public.announcements
  for all to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (
      (select public.current_app_role()) = 'center_admin'
      -- A teacher, and only for a class they own. `group_id is not null` is
      -- what stops a teacher writing a center-wide announcement: the audiences
      -- that reach the whole center all leave it null.
      or (group_id is not null and public.can_manage_group(group_id))
    )
  )
  with check (
    organization_id = (select public.current_org_id())
    and (
      (select public.current_app_role()) = 'center_admin'
      or (group_id is not null and public.can_manage_group(group_id))
    )
  );

comment on policy announcements_write on public.announcements is
  'center_admin may announce to anyone; a teacher only to a class they manage (group_id set and can_manage_group).';
