-- ============================================================================
-- 20260816140000_member_status_grants.sql
-- Make `member_status` actually writable — and only by the right people.
--
-- WHAT WAS BROKEN. 20260807180000 revoked UPDATE on `profiles` wholesale and
-- re-granted it column by column (`full_name, phone`, later `contact_email`).
-- Phase 1 added `member_status` and never granted it, so every attempt to pause
-- or release a student failed with "permission denied for table profiles" — the
-- feature could not work for anybody. Nothing caught it because the console
-- shows an action error as a toast, and the whole path had only been
-- typechecked, never run by a real user.
--
-- WHY THE GRANT ALONE WOULD BE WORSE THAN THE BUG. `profiles_self_update` lets
-- any authenticated user update THEIR OWN row. Grant `member_status` to
-- `authenticated` and a student can set themselves to `left` — dropping
-- themselves out of gone-quiet chasing, out of the attendance denominator and
-- out of next month's invoices. That is not a hypothetical: "stop being billed"
-- is the single most motivated edit a student could make.
--
-- So the grant comes with a rule, and the rule lives here rather than in the
-- action, because principle 1 of this codebase is that the database is the gate.
-- ============================================================================

grant update (full_name, phone, contact_email, member_status, status_changed_at, status_note)
  on public.profiles to authenticated;

create or replace function public.guard_member_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
begin
  -- Nothing to police unless the status itself is moving. A rename must not pay
  -- for this check.
  if new.member_status is not distinct from old.member_status
     and new.status_note is not distinct from old.status_note then
    return new;
  end if;

  -- Server-side code (service role, provisioning, the seed scripts) has no JWT.
  -- It is already trusted; RLS does not apply to it either.
  if v_actor is null then
    return new;
  end if;

  -- NOBODY SETS THEIR OWN STATUS. A teacher on leave is recorded by the centre,
  -- not by the teacher, and a student cannot invoice themselves out of the roll.
  if v_actor = old.id then
    raise exception 'You cannot change your own status — a colleague has to record it.'
      using errcode = 'insufficient_privilege';
  end if;

  -- Otherwise: whoever runs the centre, or the teacher whose group they are in.
  if not (public.can_manage_people() or public.can_view_student(old.id)) then
    raise exception 'Only centre staff can change a student''s status.'
      using errcode = 'insufficient_privilege';
  end if;

  -- Stamp the clock here so it cannot disagree with the value it describes.
  new.status_changed_at := now();
  return new;
end;
$$;

comment on function public.guard_member_status() is
  'member_status is staff-only and never self-set. The column grant is coarse; this is what makes it safe.';

drop trigger if exists profiles_guard_member_status on public.profiles;
create trigger profiles_guard_member_status
  before update on public.profiles
  for each row execute function public.guard_member_status();
