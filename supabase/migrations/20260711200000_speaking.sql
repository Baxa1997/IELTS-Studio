-- ============================================================================
-- 20260711200000_speaking.sql
-- Speaking V1 (docs/ielts-speaking-plan.md phase 1): Part-2 push-to-talk
-- practice. Cue cards live in a shared pre-generated library; each recorded
-- answer becomes an attempt row holding the transcript, deterministic fluency
-- metrics and the conservative grading result.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- speaking_library : shared pre-generated cue cards ----------------
-- content = { "cue_card": { "title", "bullets"[3], "closing" }, ... }  (text
-- only — no answers to protect, but kept service-role-only for consistency:
-- the engine serves the card at session start).
create table if not exists public.speaking_library (
  id          uuid primary key default gen_random_uuid(),
  part        int not null default 2,
  topic       text not null default '',
  difficulty  int not null default 3,        -- 1 (concrete) .. 5 (abstract)
  content     jsonb not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists speaking_library_part_idx
  on public.speaking_library (part, difficulty, created_at);

alter table public.speaking_library enable row level security;
grant all on public.speaking_library to service_role;

-- ---------- speaking_attempts : one recorded answer + its grading ------------
create table if not exists public.speaking_attempts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id      uuid not null,
  mode            text not null default 'part2',
  library_id      uuid references public.speaking_library (id) on delete set null,
  -- speaking-audio/<attempt-id>/answer.wav
  audio_path      text,
  transcript      text not null default '',
  -- { duration_s, words, wpm, fillers, filler_per_min, distinct_ratio }
  metrics         jsonb not null default '{}'::jsonb,
  -- Conservative grading: overall (FC/LR/GRA mean, floored to 0.5), criteria
  -- incl. P flagged beta, score_blocker, band_with_fixes, highlights, upgrades.
  result          jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);
create index if not exists speaking_attempts_org_student_idx
  on public.speaking_attempts (organization_id, student_id, created_at desc);

alter table public.speaking_attempts enable row level security;
drop policy if exists speaking_attempts_select on public.speaking_attempts;
create policy speaking_attempts_select on public.speaking_attempts
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and student_id = (select auth.uid())
  );
grant select on public.speaking_attempts to authenticated;
grant all on public.speaking_attempts to service_role;

-- ---------- storage : private bucket for recorded answers --------------------
insert into storage.buckets (id, name, public)
values ('speaking-audio', 'speaking-audio', false)
on conflict (id) do nothing;
-- No storage.objects policies on purpose: only the engine (service role, which
-- bypasses RLS) writes and signs; the browser gets short-lived signed URLs.
