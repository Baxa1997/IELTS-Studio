-- ============================================================================
-- 20260813120000_subjects.sql
-- What a center actually teaches, and who teaches it.
--
-- Until now every class was implicitly an IELTS class, because that is all the
-- product graded. Real centers run IELTS beside General English, kids' groups,
-- SAT, sometimes Math — and the first thing that breaks without subjects is
-- staffing: nothing stops a Math teacher being put on an IELTS class, and the
-- timetable cannot answer "who covers General English on Tuesdays".
--
-- SHAPE. A subject belongs to the center. A teacher is linked to the subjects
-- they can take (many-to-many — a teacher who does both is the normal case, not
-- the exception). A group carries ONE subject, because a class teaches one
-- thing.
--
-- NULLABLE ON PURPOSE. `groups.subject_id` is nullable and no backfill invents
-- one. Every existing class predates this table, and guessing "they're all
-- IELTS" would write a fact nobody checked into rows the timetable and the
-- reports then repeat. An unset subject reads as "not said yet" and the console
-- asks for it the next time the class is edited.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- Tables ----------------------------------------------------------

create table if not exists public.subjects (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  -- Shown as a chip on the timetable and the group list. Free-form hex so the
  -- console can theme without a lookup table; the UI offers a fixed palette.
  color           text,
  -- Retired rather than deleted once classes point at it — same reasoning as a
  -- closed cash desk: history has to keep meaning something.
  active          boolean not null default true,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- Child tables FK this pair, so a subject can never be attached to another
  -- tenant's teacher or class.
  unique (id, organization_id)
);

-- One "General English" per center, however it was typed. Case-insensitive,
-- because two people will spell it two ways within a week.
create unique index if not exists subjects_org_name_uniq
  on public.subjects (organization_id, lower(name));

create index if not exists subjects_org_idx on public.subjects (organization_id, active);

create or replace trigger subjects_set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

-- Which subjects a teacher can be given. Many-to-many.
create table if not exists public.teacher_subjects (
  teacher_id      uuid not null,
  subject_id      uuid not null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (teacher_id, subject_id),
  foreign key (teacher_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade,
  foreign key (subject_id, organization_id)
    references public.subjects (id, organization_id) on delete cascade
);

create index if not exists teacher_subjects_subject_idx
  on public.teacher_subjects (subject_id);

-- ---------- A class teaches one subject -------------------------------------

alter table public.groups
  add column if not exists subject_id uuid;

do $$ begin
  alter table public.groups
    add constraint groups_subject_fk
    foreign key (subject_id, organization_id)
      references public.subjects (id, organization_id) on delete set null;
exception when duplicate_object then null; end $$;

create index if not exists groups_subject_idx
  on public.groups (subject_id) where subject_id is not null;

-- ---------- Row Level Security ----------------------------------------------

alter table public.subjects         enable row level security;
alter table public.teacher_subjects enable row level security;

-- Subjects are read by everyone in the center — a student's timetable names the
-- subject too — and changed only by the owner. Who teaches what is a staffing
-- decision, not a teaching one.
drop policy if exists subjects_org_read on public.subjects;
create policy subjects_org_read on public.subjects
  for select to authenticated
  using (organization_id = (select public.current_org_id()));

drop policy if exists subjects_admin_manage on public.subjects;
create policy subjects_admin_manage on public.subjects
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) = 'center_admin')
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) = 'center_admin');

drop policy if exists teacher_subjects_org_read on public.teacher_subjects;
create policy teacher_subjects_org_read on public.teacher_subjects
  for select to authenticated
  using (organization_id = (select public.current_org_id()));

drop policy if exists teacher_subjects_admin_manage on public.teacher_subjects;
create policy teacher_subjects_admin_manage on public.teacher_subjects
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) = 'center_admin')
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) = 'center_admin');

grant select, insert, update, delete on public.subjects         to authenticated;
grant select, insert, update, delete on public.teacher_subjects to authenticated;
grant all on public.subjects         to service_role;
grant all on public.teacher_subjects to service_role;

-- ---------- Every center starts with one -------------------------------------
-- A center that has been running IELTS classes should not open the page to an
-- empty list and have to guess what it is for. One row, named after the thing
-- the product already does, which they can rename or retire.

insert into public.subjects (organization_id, name, color)
select o.id, 'IELTS', '#4340CB'
  from public.organizations o
 where o.kind = 'center'
   and not exists (select 1 from public.subjects s where s.organization_id = o.id)
on conflict do nothing;
