-- ============================================================================
-- 20260628120000_multilevel.sql
-- Uzbekistan Multilevel (DTM / State Testing Centre) English exam — a track
-- distinct from both the IELTS-band and CEFR (A1..C2) tracks. It assesses
-- B1 -> B2 -> C1 in one sitting and has its own paper shapes (Reading: 5 parts /
-- 35 Qs; Writing: 3 tasks). Items are AI-generated on demand by the IELTS AI
-- Engine and stored here.
--
-- WHY ITS OWN TABLES (not reading_passages/reading_questions): a Multilevel
-- reading paper is a fixed 5-part structure with heterogeneous item types
-- (gap-fill, advert↔statement matching, heading↔paragraph matching, MCQ+T/F/NI,
-- summary completion) whose answer keys are part-shaped, not the flat
-- passage+typed-question model. We store the whole generated paper as one jsonb
-- document instead of normalising every part into columns.
--
-- SECURITY MODEL: the generated `content` holds the answer keys / model answers.
-- It is written by the engine with the service-role key and is NEVER selected by
-- the browser directly — the engine returns an answer-STRIPPED render view at
-- generate time and grades by id server-side. RLS below still scopes every row
-- to its owner as a defense-in-depth layer (and so a future Activities page can
-- list a learner's own attempts).
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- multilevel_items : a generated reading paper or writing prompt-set
create table if not exists public.multilevel_items (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id      uuid not null,
  paper           text not null,                       -- 'reading' | 'writing'
  scope           text not null default 'full',        -- 'full' | 'part' | 'task'
  -- The full generated item(s) WITH answer keys / model answers. Service-role
  -- writes; never exposed raw to the browser (engine strips answers for render).
  content         jsonb not null,
  created_at      timestamptz not null default now(),
  unique (id, organization_id),
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);
create index if not exists multilevel_items_org_student_idx
  on public.multilevel_items (organization_id, student_id);
create index if not exists multilevel_items_created_idx
  on public.multilevel_items (created_at desc);

-- ---------- multilevel_attempts : one grading event against an item ----------
create table if not exists public.multilevel_attempts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  student_id      uuid not null,
  item_id         uuid not null,
  paper           text not null,                       -- 'reading' | 'writing'
  -- Reading: { "1": "astronomers", "7": "G", ... }. Writing: { "answer": "..." }.
  user_answers    jsonb not null default '{}'::jsonb,
  -- Grading output: reading per-question verdicts + score; writing rubric JSON.
  result          jsonb not null default '{}'::jsonb,
  score           int,                                 -- reading raw score
  max_score       int,                                 -- reading total marks
  created_at      timestamptz not null default now(),
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade,
  foreign key (item_id, organization_id)
    references public.multilevel_items (id, organization_id) on delete cascade
);
create index if not exists multilevel_attempts_org_student_idx
  on public.multilevel_attempts (organization_id, student_id);
create index if not exists multilevel_attempts_item_idx
  on public.multilevel_attempts (item_id);

-- ---------- Row Level Security ----------------------------------------------
alter table public.multilevel_items    enable row level security;
alter table public.multilevel_attempts enable row level security;

-- items: a learner sees only their own generated papers; service-role writes.
drop policy if exists multilevel_items_select on public.multilevel_items;
create policy multilevel_items_select on public.multilevel_items
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and student_id = (select auth.uid())
  );
drop policy if exists multilevel_items_insert on public.multilevel_items;
create policy multilevel_items_insert on public.multilevel_items
  for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and student_id = (select auth.uid())
  );
drop policy if exists multilevel_items_delete on public.multilevel_items;
create policy multilevel_items_delete on public.multilevel_items
  for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and student_id = (select auth.uid())
  );

-- attempts: students see/insert only their own (essays/reading_attempts pattern).
drop policy if exists multilevel_attempts_select on public.multilevel_attempts;
create policy multilevel_attempts_select on public.multilevel_attempts
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and student_id = (select auth.uid())
  );
drop policy if exists multilevel_attempts_insert on public.multilevel_attempts;
create policy multilevel_attempts_insert on public.multilevel_attempts
  for insert to authenticated
  with check (
    organization_id = (select public.current_org_id())
    and student_id = (select auth.uid())
  );
drop policy if exists multilevel_attempts_delete on public.multilevel_attempts;
create policy multilevel_attempts_delete on public.multilevel_attempts
  for delete to authenticated
  using (
    organization_id = (select public.current_org_id())
    and student_id = (select auth.uid())
  );

-- ---------- Grants ----------------------------------------------------------
grant select, insert, delete on public.multilevel_items    to authenticated;
grant select, insert, delete on public.multilevel_attempts to authenticated;
grant all on public.multilevel_items    to service_role;
grant all on public.multilevel_attempts to service_role;
