-- ============================================================================
-- 20260617120900_reading_generation.sql
-- Generated Academic Reading: original passages + auto-gradeable questions across
-- the real IELTS types, each with a defensible answer key AND the supporting
-- sentence from the passage. A second-pass validation flags low-confidence items
-- for teacher review (needs_review). Approval gate mirrors writing_prompts.
--
--   - reading_passages gains: status (approval), source (ai|manual), reviewer
--     provenance, topic, created_by, and a needs_review roll-up.
--   - reading_questions becomes a real schema: typed, with prompt/options/
--     answer_key/supporting_sentence/explanation + per-item validation fields.
--   - SECURITY: reading_questions holds answer keys, so it is teacher/admin-read
--     ONLY. Students never read it directly; test delivery returns answer-free
--     questions via the server (service_role). Passages stay student-readable
--     once approved.
-- Reuses the prompt_status / prompt_source enums from 20260617120700.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

do $$ begin
  create type public.reading_question_type as enum (
    'true_false_not_given',
    'yes_no_not_given',
    'matching_headings',
    'matching_information',
    'sentence_completion',
    'summary_completion',
    'multiple_choice'
  );
exception when duplicate_object then null;
end $$;

-- ---------- Extend reading_passages ----------------------------------------
alter table public.reading_passages
  add column if not exists topic       text,
  add column if not exists status      public.prompt_status not null default 'pending',
  add column if not exists source      public.prompt_source not null default 'manual',
  add column if not exists needs_review boolean not null default false,   -- any question flagged
  add column if not exists created_by  uuid references public.profiles (id),
  add column if not exists reviewed_by uuid references public.profiles (id),
  add column if not exists reviewed_at timestamptz;

-- Existing stub rows predate the gate; treat manual/legacy ones as approved so
-- they don't vanish. Scoped to source='manual' so a re-run never approves
-- genuinely-pending AI passages.
update public.reading_passages set status = 'approved'
  where status = 'pending' and source = 'manual';

create index if not exists reading_passages_pick_idx
  on public.reading_passages (organization_id, module, status);

-- ---------- Upgrade reading_questions from stub to real schema --------------
-- Convert question_type text -> enum, but only if it hasn't been converted yet
-- (so a re-run doesn't needlessly rewrite the table).
do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reading_questions'
      and column_name = 'question_type' and data_type <> 'USER-DEFINED'
  ) then
    alter table public.reading_questions
      alter column question_type type public.reading_question_type
        using question_type::public.reading_question_type;
  end if;
end $$;

alter table public.reading_questions
  add column if not exists prompt              text not null default '',  -- the statement/question shown
  add column if not exists options             jsonb,                     -- choices / heading bank; null when N/A
  add column if not exists answer_key          text not null default '',  -- the single defensible answer
  add column if not exists supporting_sentence text not null default '',  -- verbatim passage sentence (empty for Not Given)
  add column if not exists explanation         text not null default '',  -- why this answer / why the trap works
  add column if not exists confidence          numeric(3,2),              -- 0..1 from the validation pass
  add column if not exists needs_review        boolean not null default false,
  add column if not exists validation_verdict  text,                      -- correct|incorrect|ambiguous|unsupported
  add column if not exists validation_note     text;

create index if not exists reading_questions_review_idx
  on public.reading_questions (organization_id, needs_review);

-- ---------- Row Level Security ---------------------------------------------
-- Passages: students see ONLY approved; teacher/admin see all (review queue).
-- Replaces the open "any member reads" policy from the reading stub migration.
drop policy if exists passages_read on public.reading_passages;
create policy passages_read on public.reading_passages
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and ((select public.current_app_role()) in ('center_admin', 'teacher')
         or status = 'approved')
  );

-- Questions hold the answer key — restrict reads to teacher/admin. Students do
-- NOT read this table; the (future) test-delivery endpoint returns answer-free
-- questions via service_role. Replaces the open member-read policy.
drop policy if exists questions_read on public.reading_questions;
create policy questions_read on public.reading_questions
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) in ('center_admin', 'teacher')
  );

-- passages_manage / questions_manage (teacher/admin write) from the reading stub
-- are unchanged and still cover insert/update/delete, incl. approve/reject.

-- Grants are already in place from the reading stub migration (authenticated +
-- service_role); the tightened policies above govern what each role can read.
