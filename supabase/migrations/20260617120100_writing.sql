-- ============================================================================
-- 20260617120100_writing.sql
-- Writing module: prompts, essays, gradings.
-- Students see ONLY their own essays; teachers/admins see all in their org.
-- AI gradings are written server-side via service_role (bypasses RLS).
-- ============================================================================

create type public.essay_task_type as enum ('task1_academic', 'task1_general', 'task2');
create type public.essay_status    as enum ('draft', 'submitted', 'grading', 'graded');

-- ---------- writing_prompts -------------------------------------------------
create table public.writing_prompts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  task_type       public.essay_task_type not null,
  prompt_text     text not null,
  topic_family    text,        -- environment, education, technology, ...
  difficulty      int,         -- target band / CEFR pitch
  created_by      uuid references public.profiles (id),
  created_at      timestamptz not null default now()
);
create index writing_prompts_org_idx on public.writing_prompts (organization_id);

-- ---------- essays ----------------------------------------------------------
create table public.essays (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id      uuid not null,
  prompt_id       uuid references public.writing_prompts (id) on delete set null,
  task_type       public.essay_task_type not null,
  content         text not null default '',
  word_count      int  not null default 0,
  status          public.essay_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (id, organization_id),
  -- guarantees an essay's org always equals its student's org
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);
create index essays_org_student_idx on public.essays (organization_id, student_id);

create trigger essays_set_updated_at
  before update on public.essays
  for each row execute function public.set_updated_at();

-- ---------- gradings --------------------------------------------------------
-- One essay can have many gradings (drafts across the revision loop, plus
-- teacher overrides that feed grader calibration).
create table public.gradings (
  id                  uuid primary key default gen_random_uuid(),
  essay_id            uuid not null,
  organization_id     uuid not null,
  model               text not null,                 -- 'gemini-2.5-flash', 'claude-sonnet-…'
  overall_band        numeric(2,1) not null
    check (overall_band between 0 and 9 and (overall_band * 2) = floor(overall_band * 2)),
  criteria            jsonb not null default '{}'::jsonb,  -- {TR/TA,CC,LR,GRA} -> {band,evidence,what_caps_it,fix}
  score_blocker       jsonb,                          -- {criterion, why}
  band_with_fixes     numeric(2,1)
    check (band_with_fixes is null
           or (band_with_fixes between 0 and 9 and (band_with_fixes * 2) = floor(band_with_fixes * 2))),
  is_teacher_override boolean not null default false,
  graded_by           uuid references public.profiles (id),  -- null = AI, set = teacher
  created_at          timestamptz not null default now(),
  -- ties the grading to the same tenant as its essay
  foreign key (essay_id, organization_id)
    references public.essays (id, organization_id) on delete cascade
);
create index gradings_essay_idx on public.gradings (essay_id, created_at desc);

-- ---------- Row Level Security ---------------------------------------------
alter table public.writing_prompts enable row level security;
alter table public.essays          enable row level security;
alter table public.gradings        enable row level security;

-- writing_prompts: any member reads; teacher/admin manage.
create policy prompts_read on public.writing_prompts
  for select to authenticated
  using (organization_id = (select public.current_org_id()));

create policy prompts_manage on public.writing_prompts
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('teacher', 'center_admin'))
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) in ('teacher', 'center_admin'));

-- essays: students see only their own; teachers/admins see all in their org.
create policy essays_select on public.essays
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and ((select public.current_app_role()) in ('center_admin', 'teacher')
         or student_id = (select auth.uid()))
  );

create policy essays_insert on public.essays
  for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.current_app_role()) in ('center_admin', 'teacher'))
  );

create policy essays_update on public.essays
  for update to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.current_app_role()) in ('center_admin', 'teacher'))
  )
  with check (organization_id = (select public.current_org_id()));

create policy essays_delete on public.essays
  for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (student_id = (select auth.uid())
         or (select public.current_app_role()) = 'center_admin')
  );

-- gradings: visible if you can see the parent essay; only teacher/admin write
-- (the AI grader runs server-side as service_role and bypasses RLS).
create policy gradings_select on public.gradings
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and ((select public.current_app_role()) in ('center_admin', 'teacher')
         or exists (select 1 from public.essays e
                    where e.id = gradings.essay_id
                      and e.student_id = (select auth.uid())))
  );

create policy gradings_write on public.gradings
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('teacher', 'center_admin'))
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) in ('teacher', 'center_admin'));

-- ---------- Grants ----------------------------------------------------------
grant select, insert, update, delete on public.writing_prompts to authenticated;
grant select, insert, update, delete on public.essays          to authenticated;
grant select, insert, update, delete on public.gradings        to authenticated;
grant all on public.writing_prompts to service_role;
grant all on public.essays          to service_role;
grant all on public.gradings        to service_role;
