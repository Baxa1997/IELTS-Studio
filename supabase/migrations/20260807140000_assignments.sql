-- ============================================================================
-- 20260807140000_assignments.sql
-- Organizations (B2B, phase 3): a teacher pins ONE piece of practice to a group
-- with a due date. Everyone in the group works the identical prompt/test, which
-- is what makes the phase-4 comparison report meaningful.
--
-- Deliberately NO assignment_id on essays/reading_attempts: an assignment
-- already names its content, and both runners are reached by deep link
-- (/write/{prompt_id}, /read/test/{test_id}) which stamps that content id on the
-- attempt. The report joins group member × content id, so neither runner needs
-- to learn what an assignment is.
-- ============================================================================

do $$ begin
  create type public.assignment_kind as enum ('writing', 'reading');
exception when duplicate_object then null;
end $$;

create table if not exists public.assignments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  group_id        uuid not null,
  kind            public.assignment_kind not null,
  title           text not null,
  instructions    text,
  -- Exactly one of these is set, per `assignment_content_ck` below.
  prompt_id       uuid references public.writing_prompts (id) on delete cascade,
  reading_test_id uuid,
  due_at          timestamptz,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete cascade,
  foreign key (reading_test_id, organization_id)
    references public.reading_tests (id, organization_id) on delete cascade,
  constraint assignment_content_ck check (
    (kind = 'writing' and prompt_id is not null and reading_test_id is null)
    or (kind = 'reading' and reading_test_id is not null and prompt_id is null)
  )
);
create index if not exists assignments_group_idx on public.assignments (group_id, created_at desc);

alter table public.assignments enable row level security;

-- Staff: the org's center_admin, or the teacher this group belongs to.
drop policy if exists assignments_staff_manage on public.assignments;
create policy assignments_staff_manage on public.assignments
  for all to authenticated
  using ((select public.can_manage_group(group_id)))
  with check ((select public.can_manage_group(group_id))
              and organization_id = (select public.current_org_id()));

-- Students read the assignments of groups they belong to (never write).
drop policy if exists assignments_member_select on public.assignments;
create policy assignments_member_select on public.assignments
  for select to authenticated
  using ((select public.is_group_member(group_id)));

grant select, insert, update, delete on public.assignments to authenticated;
grant all on public.assignments to service_role;
