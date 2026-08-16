-- ============================================================================
-- 20260816190000_practice_library.sql
-- The practice library (§9): stop regenerating the same Task 2 prompt.
--
-- THE PROBLEM IT SOLVES. `createAssignment` generates fresh content on every
-- call. A teacher who wants the same Task 2 prompt for their Tuesday class that
-- they set the Monday one gets a DIFFERENT prompt, because there is no way to
-- say "that one again". So three things go wrong at once: the two classes sit
-- different papers and cannot be compared, the centre burns generation quota
-- re-making work it already has, and a prompt somebody read and liked is
-- unfindable an hour later.
--
-- NOT A SECOND COPY OF THE CONTENT. `writing_prompts` and `reading_tests`
-- already hold everything the centre has generated, already scoped by org.
-- Duplicating the text here would create two sources of truth for one prompt
-- and a way for them to drift. This table is a SHELF: which existing pieces are
-- worth keeping, what they are about, and who said so.
--
-- WHY ONE TABLE ACROSS SKILLS rather than a flag on each content table. §9 asks
-- for one list filtered by skill, task type and level. Two tables with two
-- shapes cannot be sorted, paged, or filtered together without a union at every
-- call site — the same reason `v_gradable_attempts` exists.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

do $$ begin
  create type public.library_kind as enum ('writing_prompt', 'reading_test');
exception when duplicate_object then null; end $$;

create table if not exists public.practice_library (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind            public.library_kind not null,
  -- The row in writing_prompts / reading_tests. Not a foreign key, because the
  -- target differs per kind; the uniqueness below is what stops duplicates, and
  -- a shelved item whose content was purged simply stops resolving.
  ref_id          uuid not null,

  -- What a teacher scans to find it again. Written by a human at save time
  -- rather than derived: "Task 2 — cities, opinion" is findable, and the first
  -- 60 characters of a prompt are not.
  title           text not null,
  skill           text not null check (skill in ('writing', 'reading', 'listening', 'speaking')),
  task_type       text,
  -- §9's "level". Free text on purpose: a centre thinks in "Band 5-6" or "B1"
  -- or "intermediate" depending on which exam it teaches, and an enum here
  -- would be a fight with every centre that names its levels differently.
  level           text,
  notes           text,

  saved_by        uuid,
  saved_at        timestamptz not null default now(),
  -- R5: nothing is deleted, things are archived. A prompt a class has already
  -- sat cannot vanish from the shelf without its assignments losing their
  -- context.
  archived_at     timestamptz,

  unique (organization_id, kind, ref_id),
  foreign key (saved_by, organization_id)
    references public.profiles (id, organization_id) on delete set null
);

create index if not exists practice_library_browse_idx
  on public.practice_library (organization_id, skill, saved_at desc)
  where archived_at is null;

comment on table public.practice_library is
  'Which generated prompts/tests a centre keeps, with tags. The content itself stays in writing_prompts / reading_tests.';

alter table public.practice_library enable row level security;

-- A LIBRARY IS SHARED, WHICH IS THE ENTIRE POINT. Every teacher in the centre
-- reads it — a shelf only one person can see does not stop anyone else
-- regenerating the same prompt.
drop policy if exists practice_library_read on public.practice_library;
create policy practice_library_read on public.practice_library
  for select to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('center_admin', 'teacher', 'administrator'));

-- Teachers stock it, because teachers are the only people who generate practice
-- (createAssignment refuses anyone else). center_admin can tidy it.
drop policy if exists practice_library_write on public.practice_library;
create policy practice_library_write on public.practice_library
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('center_admin', 'teacher'))
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) in ('center_admin', 'teacher'));

grant select, insert, update, delete on public.practice_library to authenticated;
grant all on public.practice_library to service_role;

-- ---------- Stamp the saver -------------------------------------------------
create or replace function public.stamp_library_save()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and auth.uid() is not null then
    new.saved_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists practice_library_stamp on public.practice_library;
create trigger practice_library_stamp
  before insert on public.practice_library
  for each row execute function public.stamp_library_save();

-- ---------- Assigning from the shelf ----------------------------------------
-- Which library item an assignment came from, so "used 4 times" is a fact
-- rather than a guess made by matching prompt ids. Nullable: an assignment
-- generated fresh has no library item, which is the normal case today.

alter table public.assignments
  add column if not exists library_id uuid;

do $$ begin
  alter table public.assignments
    add constraint assignments_library_fk
    foreign key (library_id) references public.practice_library (id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists assignments_library_idx
  on public.assignments (library_id) where library_id is not null;

comment on column public.assignments.library_id is
  'Set when this practice was assigned from the library rather than generated fresh.';
