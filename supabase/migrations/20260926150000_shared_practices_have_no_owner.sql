-- ============================================================================
-- 20260926150000_shared_practices_have_no_owner.sql
-- Shared practice content belongs to no organisation.
--
-- WHY. The reading library and the listening catalogue each hung off an
-- `organizations` row (the reserved …111b and …111c), and the writing starter
-- set was a copy inside every learner's own org. In August 2026 one delete of a
-- reserved row cascaded through `organization_id` and emptied both shared
-- libraries (see 20260828120000 and 20260828160000). The trigger added then
-- refuses those deletes; this removes what it was guarding. The owner's rule
-- since: a practice must not depend on any account, so that no account — and
-- no delete of one — can take it with it.
--
-- WHAT. A shared row now has organization_id NULL:
--
--   listening_library   the QA'd catalogue (was …111c). A centre's own promoted
--                       items keep their centre: deleting a centre SHOULD take
--                       its own items, and nobody else's.
--   reading templates   is_library tests, their passages and questions (was
--                       …111b). Plain `id` links are added beside the existing
--                       (id, organization_id) ones, because Postgres does not
--                       enforce a composite link whose organisation is NULL —
--                       without them, deleting a template would silently stop
--                       taking its passages and questions with it.
--   writing starter set one shared row per curated prompt, instead of a copy in
--                       each learner's org. That is also why a centre's
--                       teachers never saw the set: copies were only ever made
--                       for learners with a study plan. Learners' essays,
--                       assignments and shelf entries are repointed from their
--                       org's copy to the shared row, so every band, draft and
--                       report keeps its prompt. The copies themselves are LEFT
--                       IN PLACE (the app hides them once the shared set exists)
--                       — nothing is deleted, and removing them is a separate
--                       decision for later.
--
-- The reserved org rows stay, and so does their trigger: AI-usage rows and
-- storage paths still name them. They just own nothing anyone practises on.
--
-- ORDER. The engine and the app accept an ownerless row before this runs (and
-- keep accepting the old owners), so ship them first — engine, then app — and
-- apply this last. The other way round, the engine's catalogue query stops
-- matching the listening rows until it is deployed.
--
-- One statement string, one transaction: if any assertion below fails, none of
-- it has happened. Idempotent: safe to re-run.
-- ============================================================================


-- ---------- listening_library -------------------------------------------------

alter table public.listening_library alter column organization_id drop not null;

update public.listening_library
   set organization_id = null
 where organization_id = '00000000-0000-4000-8000-00000000111c';

comment on column public.listening_library.organization_id is
  'NULL = the shared catalogue every learner and centre sees, owned by no account so no account deletion can remove it. Any other value = that centre''s own promoted item. The ENGINE reads this table with the service-role key and must filter to (NULL, caller''s org) itself — RLS does not apply to it.';


-- ---------- reading: tests → passages → questions ------------------------------

-- Refuse a library that is not the shape this assumes, rather than guess.
do $$
declare
  n int;
begin
  select count(*) into n from public.reading_tests
   where is_library and organization_id is not null
     and organization_id <> '00000000-0000-4000-8000-00000000111b';
  if n > 0 then
    raise exception '% library reading test(s) are owned by an organisation other than the reading library; resolve them by hand first', n;
  end if;

  select count(*) into n from public.reading_passages
   where is_library and organization_id is not null
     and organization_id <> '00000000-0000-4000-8000-00000000111b';
  if n > 0 then
    raise exception '% library reading passage(s) are owned by an organisation other than the reading library; resolve them by hand first', n;
  end if;

  select count(*) into n from public.reading_tests
   where organization_id = '00000000-0000-4000-8000-00000000111b' and not is_library;
  if n > 0 then
    raise exception '% reading test(s) in the library org are not templates; resolve them by hand first', n;
  end if;

  select count(*) into n from public.reading_passages
   where organization_id = '00000000-0000-4000-8000-00000000111b' and not is_library;
  if n > 0 then
    raise exception '% reading passage(s) in the library org are not templates; resolve them by hand first', n;
  end if;
end $$;

-- Plain-id links that hold whatever the owner is. The existing composite links
-- already guarantee every parent exists, so these validate instantly.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'reading_passages_test_id_any_owner_fkey') then
    alter table public.reading_passages
      add constraint reading_passages_test_id_any_owner_fkey
      foreign key (test_id) references public.reading_tests (id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'reading_questions_passage_id_any_owner_fkey') then
    alter table public.reading_questions
      add constraint reading_questions_passage_id_any_owner_fkey
      foreign key (passage_id) references public.reading_passages (id) on delete cascade;
  end if;
end $$;

alter table public.reading_tests     alter column organization_id drop not null;
alter table public.reading_passages  alter column organization_id drop not null;
alter table public.reading_questions alter column organization_id drop not null;

-- Children first: a question still naming (passage, …111b) would hold its
-- passage's old key in place, and so would a passage its test's.
update public.reading_questions set organization_id = null
 where organization_id = '00000000-0000-4000-8000-00000000111b';
update public.reading_passages  set organization_id = null
 where organization_id = '00000000-0000-4000-8000-00000000111b';
update public.reading_tests     set organization_id = null
 where organization_id = '00000000-0000-4000-8000-00000000111b';

-- A template is exactly a row with no owner, in both directions: a template
-- that picked up an owner is an account's again, and an ownerless row that is
-- not a template is readable by nobody.
alter table public.reading_tests drop constraint if exists reading_tests_template_has_no_owner;
alter table public.reading_tests
  add constraint reading_tests_template_has_no_owner
  check (is_library = (organization_id is null));

alter table public.reading_passages drop constraint if exists reading_passages_template_has_no_owner;
alter table public.reading_passages
  add constraint reading_passages_template_has_no_owner
  check (is_library = (organization_id is null));


-- ---------- writing: one shared starter set ------------------------------------

alter table public.writing_prompts alter column organization_id drop not null;

-- The shared rows' id is DERIVED, not random, so the app computes the same
-- one: a name-based (version 3, MD5) uuid of `task_type \n prompt_text`. Its
-- twin is `sharedPromptId` in lib/prompts/shared.ts, pinned by a test to the
-- same literal — change one only together with the other. The version and
-- variant bits are set because a raw md5 is not a well-formed uuid, and a
-- strict validator (zod's `z.uuid()`) rejects it.
create or replace function public.shared_prompt_id(task_type text, prompt_text text)
returns uuid
language sql
immutable
parallel safe
as $$
  select (
    substr(m, 1, 12) || '3' || substr(m, 14, 3)
    || substr('89ab', (('x' || substr(m, 17, 1))::bit(4)::int & 3) + 1, 1)
    || substr(m, 18)
  )::uuid
  from (select md5(task_type || E'\n' || prompt_text) as m) as hashed
$$;
-- The app never calls it; keep it off the public API.
revoke execute on function public.shared_prompt_id(text, text) from public, anon, authenticated;

-- One shared row per curated prompt, built from the copies learners already
-- hold (every copy was seeded from the same code). The app inserts any curated
-- prompt no org ever received, under the same id.
insert into public.writing_prompts
  (id, organization_id, task_type, category, prompt_text, figure, topic_family,
   difficulty, status, source, created_by, created_at)
select distinct on (c.task_type, c.prompt_text)
       public.shared_prompt_id(c.task_type::text, c.prompt_text),
       null, c.task_type, c.category, c.prompt_text, c.figure, c.topic_family,
       c.difficulty, 'approved', 'seed', null, c.created_at
  from public.writing_prompts c
 where c.source = 'seed' and c.organization_id is not null
 order by c.task_type, c.prompt_text, c.created_at
on conflict (id) do nothing;

-- Repoint what learners and centres hold from their org's copy to the shared
-- row. ⚠️ essays_set_updated_at is paused for this: it stamps now() on every
-- update, and every learner's essays would otherwise all read "edited today".
alter table public.essays disable trigger essays_set_updated_at;

update public.essays e
   set prompt_id = public.shared_prompt_id(c.task_type::text, c.prompt_text)
  from public.writing_prompts c
 where e.prompt_id = c.id
   and c.source = 'seed' and c.organization_id is not null;

alter table public.essays enable trigger essays_set_updated_at;

update public.assignments a
   set prompt_id = public.shared_prompt_id(c.task_type::text, c.prompt_text)
  from public.writing_prompts c
 where a.prompt_id = c.id
   and c.source = 'seed' and c.organization_id is not null;

-- A centre's shelf, where it is not already holding the shared row itself.
update public.practice_library s
   set ref_id = public.shared_prompt_id(c.task_type::text, c.prompt_text)
  from public.writing_prompts c
 where s.kind = 'writing_prompt'
   and s.ref_id = c.id
   and c.source = 'seed' and c.organization_id is not null
   and not exists (
     select 1 from public.practice_library t
      where t.organization_id = s.organization_id
        and t.kind = s.kind
        and t.ref_id = public.shared_prompt_id(c.task_type::text, c.prompt_text)
   );

-- `prompt_assignments` (the no-repeat ledger) is deliberately NOT repointed: its
-- link is (prompt_id, organization_id), which a shared row cannot satisfy, and
-- the copies it names still exist.

do $$ begin
  if exists (select 1 from public.essays e
               join public.writing_prompts c on c.id = e.prompt_id
              where c.source = 'seed' and c.organization_id is not null) then
    raise exception 'essays still point at a per-org starter copy after the repoint';
  end if;
  if exists (select 1 from public.assignments a
               join public.writing_prompts c on c.id = a.prompt_id
              where c.source = 'seed' and c.organization_id is not null) then
    raise exception 'assignments still point at a per-org starter copy after the repoint';
  end if;
end $$;

-- Only the curated set may be ownerless.
alter table public.writing_prompts drop constraint if exists writing_prompts_shared_is_curated;
alter table public.writing_prompts
  add constraint writing_prompts_shared_is_curated
  check (organization_id is not null or (source = 'seed' and status = 'approved'));

-- Everyone reads the shared set; nobody's client can change it (the write
-- policy, prompts_manage, still requires organization_id = the caller's org).
drop policy if exists prompts_read_shared on public.writing_prompts;
create policy prompts_read_shared on public.writing_prompts
  for select to authenticated
  using (organization_id is null and status = 'approved');
