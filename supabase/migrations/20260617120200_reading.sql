-- ============================================================================
-- 20260617120200_reading.sql
-- Reading module — STUB columns for now (payload/answers kept as jsonb until the
-- reading spec lands). RLS is fully enforced regardless: passages/questions are
-- org-scoped content; attempts are student-owned like essays.
-- ============================================================================

create type public.reading_module as enum ('academic', 'general');

-- ---------- reading_passages ------------------------------------------------
create table public.reading_passages (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title           text not null,
  body            text not null default '',
  module          public.reading_module not null default 'academic',
  difficulty      int,
  created_at      timestamptz not null default now(),
  unique (id, organization_id)
);
create index reading_passages_org_idx on public.reading_passages (organization_id);

-- ---------- reading_questions (stub) ---------------------------------------
create table public.reading_questions (
  id              uuid primary key default gen_random_uuid(),
  passage_id      uuid not null,
  organization_id uuid not null,
  question_type   text not null,                       -- stub: 'tfng', 'matching_headings', … (enum later)
  payload         jsonb not null default '{}'::jsonb,  -- stub: options + answer key
  order_index     int not null default 0,
  created_at      timestamptz not null default now(),
  foreign key (passage_id, organization_id)
    references public.reading_passages (id, organization_id) on delete cascade
);
create index reading_questions_passage_idx on public.reading_questions (passage_id);

-- ---------- reading_attempts (stub) ----------------------------------------
create table public.reading_attempts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  student_id      uuid not null,
  passage_id      uuid not null,
  answers         jsonb not null default '{}'::jsonb,  -- stub
  raw_score       int,
  band            numeric(2,1),
  status          text not null default 'in_progress', -- stub
  created_at      timestamptz not null default now(),
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade,
  foreign key (passage_id, organization_id)
    references public.reading_passages (id, organization_id) on delete cascade
);
create index reading_attempts_org_student_idx on public.reading_attempts (organization_id, student_id);

-- ---------- Row Level Security ---------------------------------------------
alter table public.reading_passages  enable row level security;
alter table public.reading_questions enable row level security;
alter table public.reading_attempts  enable row level security;

-- passages: members read; teacher/admin manage (same pattern as writing_prompts)
create policy passages_read on public.reading_passages
  for select to authenticated
  using (organization_id = (select public.current_org_id()));
create policy passages_manage on public.reading_passages
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('teacher', 'center_admin'))
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) in ('teacher', 'center_admin'));

-- questions: members read; teacher/admin manage
create policy questions_read on public.reading_questions
  for select to authenticated
  using (organization_id = (select public.current_org_id()));
create policy questions_manage on public.reading_questions
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('teacher', 'center_admin'))
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) in ('teacher', 'center_admin'));

-- attempts: students see only their own; teacher/admin see all in org (essays pattern)
create policy attempts_select on public.reading_attempts
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and ((select public.current_app_role()) in ('center_admin', 'teacher')
         or student_id = (select auth.uid()))
  );
create policy attempts_insert on public.reading_attempts
  for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.current_app_role()) in ('center_admin', 'teacher'))
  );
create policy attempts_update on public.reading_attempts
  for update to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.current_app_role()) in ('center_admin', 'teacher'))
  )
  with check (organization_id = (select public.current_org_id()));
create policy attempts_delete on public.reading_attempts
  for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.current_app_role()) = 'center_admin')
  );

-- ---------- Grants ----------------------------------------------------------
grant select, insert, update, delete on public.reading_passages  to authenticated;
grant select, insert, update, delete on public.reading_questions to authenticated;
grant select, insert, update, delete on public.reading_attempts  to authenticated;
grant all on public.reading_passages  to service_role;
grant all on public.reading_questions to service_role;
grant all on public.reading_attempts  to service_role;
