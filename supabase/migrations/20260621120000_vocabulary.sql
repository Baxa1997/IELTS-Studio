-- ============================================================================
-- 20260621120000_vocabulary.sql
-- Personal vocabulary — words a student saves WHILE practicing (selecting a word
-- in a reading passage, asking for its translation in any language, and adding it
-- to their list). The dedicated /vocabulary page reads this back.
--
-- Student-owned like reading_attempts: a learner sees and manages ONLY their own
-- words, scoped to their (personal) org. The translation itself is produced by the
-- server-side AI service (never client → model); this table just stores the saved
-- result. Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.vocabulary_items (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  student_id       uuid not null,
  word             text not null,                         -- the selected word/phrase (English)
  language         text not null,                         -- target language label, e.g. 'Uzbek', 'Russian'
  translation      text not null default '',              -- the word rendered in `language`
  definition       text,                                  -- short plain-English gloss
  example          text,                                  -- a short example sentence
  context_sentence text,                                  -- the sentence it appeared in (sense disambiguation)
  source           text not null default 'reading',       -- 'reading' | 'writing' | 'manual'
  created_at       timestamptz not null default now(),
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);

-- Listing the page = the student's words, newest first.
create index if not exists vocabulary_items_student_created_idx
  on public.vocabulary_items (student_id, created_at desc);

-- One saved entry per (student, word, language): re-adding the same word in the
-- same language is an upsert, not a duplicate. Case-insensitive on the word.
create unique index if not exists vocabulary_items_student_word_lang_uidx
  on public.vocabulary_items (student_id, lower(word), language);

-- ---------- Row Level Security ---------------------------------------------
alter table public.vocabulary_items enable row level security;

-- A learner can only ever see/manage their OWN words, inside their org. No
-- teacher/admin read path — this is private study material (B2C, CLAUDE.md).
create policy vocabulary_select on public.vocabulary_items
  for select to authenticated
  using (organization_id = (select public.current_org_id())
         and student_id = (select auth.uid()));
create policy vocabulary_insert on public.vocabulary_items
  for insert to authenticated
  with check (organization_id = (select public.current_org_id())
              and student_id = (select auth.uid()));
create policy vocabulary_update on public.vocabulary_items
  for update to authenticated
  using (organization_id = (select public.current_org_id())
         and student_id = (select auth.uid()))
  with check (organization_id = (select public.current_org_id())
              and student_id = (select auth.uid()));
create policy vocabulary_delete on public.vocabulary_items
  for delete to authenticated
  using (organization_id = (select public.current_org_id())
         and student_id = (select auth.uid()));

-- ---------- Grants ----------------------------------------------------------
grant select, insert, update, delete on public.vocabulary_items to authenticated;
grant all on public.vocabulary_items to service_role;
