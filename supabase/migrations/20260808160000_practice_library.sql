-- ============================================================================
-- 20260808160000_practice_library.sql
-- The teacher's practice library: an `archived` state, and content that cannot
-- be rewritten under a student who already answered it.
--
-- Until now a teacher generated a prompt and assigned it in one click, so a
-- prompt only ever existed as 'pending' for the microsecond before the same
-- action approved it. Splitting generate from assign (01 §7.5) gives the two
-- states meaning — 'pending' is a draft only staff can see, 'approved' is
-- published — and leaves a third one missing: a published practice a teacher is
-- finished with but does not want to delete, because students' graded work
-- points at it.
--
-- `prompt_status` is shared by writing_prompts and reading_tests, so both gain
-- the state at once.
--
-- NOTE: 'archived' is added here and deliberately not USED anywhere in this
-- file. Postgres refuses a new enum value in the same transaction that adds it.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

alter type public.prompt_status add value if not exists 'archived';

-- The library lists one org's practices newest-first, filtered by state.
create index if not exists writing_prompts_library_idx
  on public.writing_prompts (organization_id, status, created_at desc);

-- ---------- Content is immutable once it has been assigned ------------------
-- 01 D7: version-safe editing is achieved by never editing. A student's band
-- has to mean the prompt they actually answered, so once an assignment points
-- at a prompt its wording is frozen — the teacher makes a new one instead.
--
-- Only the CONTENT columns are frozen. status must still move (approve,
-- archive), and so must review provenance.
create or replace function public.block_assigned_prompt_edit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.prompt_text  is distinct from old.prompt_text
      or new.task_type is distinct from old.task_type
      or new.category  is distinct from old.category
      or new.figure    is distinct from old.figure)
     and exists (select 1 from public.assignments a where a.prompt_id = old.id)
  then
    raise exception
      'This prompt has already been assigned; make a new one rather than editing it.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create or replace trigger writing_prompts_immutable_once_assigned
  before update on public.writing_prompts
  for each row execute function public.block_assigned_prompt_edit();
