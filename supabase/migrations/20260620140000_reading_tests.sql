-- ============================================================================
-- 20260620140000_reading_tests.sql
-- Full IELTS Reading TEST = 3 original passages + ~40 questions, 60 minutes,
-- difficulty rising P1→P3 — the authentic exam FORMAT (never Cambridge content;
-- passages stay AI-generated and original, per CLAUDE.md §IP).
--
--   - reading_tests: groups the 3 passages of one test. Approval gate + provenance
--     mirror reading_passages / writing_prompts (B2C auto-approves on generate).
--   - reading_passages gains test_id + order_in_test (1..3). A NULL test_id is a
--     standalone quick-practice passage (today's behavior, unchanged).
--   - reading_attempts gains test_id and passage_id becomes nullable: a full-test
--     attempt is ONE row keyed by test_id (band converted once over all ~40, the
--     real IELTS raw-score table). A CHECK enforces exactly one of passage_id /
--     test_id, so old single-passage attempts stay valid and no orphan rows form.
--
-- Reuses prompt_status / prompt_source (20260617120700) and reading_module enums,
-- and the current_org_id() / current_app_role() RLS helpers.
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- reading_tests ---------------------------------------------------
create table if not exists public.reading_tests (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  module          public.reading_module not null default 'academic',
  target_band     int,
  status          public.prompt_status not null default 'pending',
  source          public.prompt_source not null default 'ai',
  needs_review    boolean not null default false,
  created_by      uuid references public.profiles (id),
  created_at      timestamptz not null default now(),
  unique (id, organization_id)
);
create index if not exists reading_tests_pick_idx
  on public.reading_tests (organization_id, module, status);

-- ---------- Link passages to a test -----------------------------------------
alter table public.reading_passages
  add column if not exists test_id       uuid,
  add column if not exists order_in_test int;

do $$ begin
  alter table public.reading_passages
    add constraint reading_passages_test_fk
    foreign key (test_id, organization_id)
      references public.reading_tests (id, organization_id) on delete cascade;
exception when duplicate_object then null;
end $$;

create index if not exists reading_passages_test_idx
  on public.reading_passages (test_id, order_in_test);

-- ---------- Attempts can be per-test ----------------------------------------
alter table public.reading_attempts
  add column if not exists test_id uuid;

-- A test attempt has no single passage_id; relax the stub's NOT NULL.
alter table public.reading_attempts
  alter column passage_id drop not null;

do $$ begin
  alter table public.reading_attempts
    add constraint reading_attempts_test_fk
    foreign key (test_id, organization_id)
      references public.reading_tests (id, organization_id) on delete cascade;
exception when duplicate_object then null;
end $$;

-- Exactly one of passage_id / test_id is set (XOR). Existing rows (passage_id set,
-- test_id null) satisfy this, so it validates without a backfill.
do $$ begin
  alter table public.reading_attempts
    add constraint reading_attempts_passage_xor_test
    check ((passage_id is not null) <> (test_id is not null));
exception when duplicate_object then null;
end $$;

create index if not exists reading_attempts_test_idx
  on public.reading_attempts (organization_id, student_id, test_id);

-- ---------- Row Level Security ----------------------------------------------
alter table public.reading_tests enable row level security;

-- Students see ONLY approved tests in their org; teacher/admin see all (review).
-- Same shape as passages_read in 20260617120900.
drop policy if exists reading_tests_read on public.reading_tests;
create policy reading_tests_read on public.reading_tests
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and ((select public.current_app_role()) in ('center_admin', 'teacher')
         or status = 'approved')
  );

drop policy if exists reading_tests_manage on public.reading_tests;
create policy reading_tests_manage on public.reading_tests
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('teacher', 'center_admin'))
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) in ('teacher', 'center_admin'));

-- ---------- Grants ----------------------------------------------------------
grant select, insert, update, delete on public.reading_tests to authenticated;
grant all on public.reading_tests to service_role;
