-- ============================================================================
-- 20260617120800_essay_versions.sql
-- The revision loop. Each time an essay is submitted for grading we snapshot its
-- text as an immutable essay_versions row, and tie the resulting grading to that
-- exact version. That makes an honest before/after possible ("did your fix
-- work?") and persists the draft history so a student's progress is visible.
--
--   - essays.content stays the live working draft (autosave target).
--   - essay_versions holds the frozen text that was actually graded, v1, v2, …
--   - gradings.version_id / version_no pin each grade to the text it judged.
-- Versions are written server-side by the grade route (service_role); students
-- read their own, teachers/admins read the org's.
-- (CLAUDE.md: the revision loop — coach a single essay across drafts.)
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

create table if not exists public.essay_versions (
  id              uuid primary key default gen_random_uuid(),
  essay_id        uuid not null,
  organization_id uuid not null,
  version_no      int  not null,
  content         text not null,
  word_count      int  not null default 0,
  created_at      timestamptz not null default now(),
  unique (essay_id, version_no),
  -- carries organization_id so a version can't cross tenants
  foreign key (essay_id, organization_id)
    references public.essays (id, organization_id) on delete cascade
);
create index if not exists essay_versions_essay_idx on public.essay_versions (essay_id, version_no);

-- Pin every grading to the version it judged. Nullable so historical AI gradings
-- (pre-versioning) remain valid; new gradings always set both.
alter table public.gradings
  add column if not exists version_id uuid references public.essay_versions (id) on delete cascade,
  add column if not exists version_no int;

-- ---------- Row Level Security ---------------------------------------------
alter table public.essay_versions enable row level security;

-- Visible to whoever can see the parent essay: the owning student, or any
-- teacher/admin in the org. No authenticated write policy — only the grade route
-- (service_role) snapshots versions.
drop policy if exists versions_select on public.essay_versions;
create policy versions_select on public.essay_versions
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and ((select public.current_app_role()) in ('center_admin', 'teacher')
         or exists (select 1 from public.essays e
                    where e.id = essay_versions.essay_id
                      and e.student_id = (select auth.uid())))
  );

-- ---------- Grants ----------------------------------------------------------
grant select on public.essay_versions to authenticated;  -- gated by RLS above
grant all    on public.essay_versions to service_role;
