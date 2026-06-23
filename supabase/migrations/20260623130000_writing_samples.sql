-- ============================================================================
-- 20260623130000_writing_samples.sql
-- Cache of AI-generated band-targeted model answers (the "Band 8 sample
-- comparison"). Each row holds the Band 7 + Band 8 model essays for ONE task,
-- keyed by a hash of (task_type + prompt) so re-opening the comparison is free
-- and deterministic per task. Original AI content — never a copyrighted corpus.
--
-- Org-scoped like the rest of the content (B2C: one learner per org, CLAUDE.md).
-- Written ONLY by the server-side AI service via the service-role client; learners
-- read their org's cached samples. Idempotent: safe to re-run in the SQL editor.
--
-- Forward-compatible: the app generates live and skips the cache if this table is
-- absent, so deploying the code before applying this migration is safe.
-- ============================================================================

create table if not exists public.writing_samples (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  task_type        text not null,                      -- task2 | task1_academic | task1_general
  prompt_hash      text not null,                      -- sha256(task_type \n prompt_text)
  samples          jsonb not null,                     -- [{ band, title, essay, highlights, to_next }]
  model            text,                               -- generator model id
  created_at       timestamptz not null default now(),
  unique (organization_id, prompt_hash)
);

-- ---------- Row Level Security ---------------------------------------------
alter table public.writing_samples enable row level security;

-- Learners read the cached model answers for their own org. Inserts come from the
-- server-side generator via the service-role client, so no INSERT policy here.
create policy writing_samples_select on public.writing_samples
  for select to authenticated
  using (organization_id = (select public.current_org_id()));

-- ---------- Grants ----------------------------------------------------------
grant select on public.writing_samples to authenticated;
grant all on public.writing_samples to service_role;
