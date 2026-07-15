-- ============================================================================
-- 20260714090000_speaking_full_mock.sql
-- Speaking phase 2 (docs/ielts-speaking-plan.md §4): the live 3-part full mock.
--
-- Phase 1 (part-2 push-to-talk) keeps its own `speaking_attempts` table — a
-- single recorded answer. A full mock is a different animal: a live conversation
-- with two audio tracks, a turn-by-turn transcript and per-part timings, so it
-- gets its own `speaking_sessions` table rather than overloading attempts.
--
-- Exam sets live in the existing `speaking_library` with **part = 0**, meaning
-- "a complete exam set": Part-1 frames + the Part-2 cue card + the Part-3
-- question tree, GENERATED TOGETHER so Part 3 is thematically linked to Part 2
-- (that linkage is real IELTS behaviour and can't be faked by joining random rows).
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- speaking_sessions : one live 3-part mock -------------------------
create table if not exists public.speaking_sessions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id      uuid not null,
  mode            text not null default 'full',
  -- the speaking_library row (part = 0) this exam was drawn from
  set_id          uuid references public.speaking_library (id) on delete set null,
  -- live | graded | abandoned | failed. A session only counts against quota
  -- once it actually starts; `abandoned` (user closed the tab) still counts —
  -- the Live minutes were spent.
  state           text not null default 'live',
  -- speaking-audio/<session-id>/candidate.wav | examiner.wav
  candidate_audio_path text,
  examiner_audio_path  text,
  -- [{ role: 'examiner'|'candidate', part: 1|2|3, text, t_ms }]
  transcript      jsonb not null default '[]'::jsonb,
  -- { duration_s, part_s: {"1":..,"2":..,"3":..}, words, wpm, fillers, ... }
  metrics         jsonb not null default '{}'::jsonb,
  -- Conservative grading (same shape as part 2): overall_band (FC/LR/GRA mean,
  -- floored to 0.5), criteria incl. P flagged beta, score_blocker, band_with_fixes.
  result          jsonb not null default '{}'::jsonb,
  duration_s      numeric not null default 0,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);

create index if not exists speaking_sessions_org_student_idx
  on public.speaking_sessions (organization_id, student_id, started_at desc);
-- the index the monthly full-mock quota count rides on
create index if not exists speaking_sessions_quota_idx
  on public.speaking_sessions (organization_id, mode, started_at);

alter table public.speaking_sessions enable row level security;

-- Read-your-own, exactly like speaking_attempts. All writes are service-role
-- (the engine owns the session lifecycle) — the browser never writes a band.
drop policy if exists speaking_sessions_select on public.speaking_sessions;
create policy speaking_sessions_select on public.speaking_sessions
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and student_id = (select auth.uid())
  );

grant select on public.speaking_sessions to authenticated;
grant all on public.speaking_sessions to service_role;

-- ---------- speaking_library: allow part = 0 (a full exam set) ---------------
-- content for part 0 = {
--   "topic": "...",
--   "part1": [ { "frame": "Home", "questions": ["..", "..", ".."] }, ... ],
--   "cue_card": { "title", "bullets"[3], "closing" },
--   "part3": [ { "question": "..", "followups": ["..", ".."] }, ... ]
-- }
comment on column public.speaking_library.part is
  'IELTS speaking part: 0 = a complete 3-part exam set (part1 frames + cue card + part3 tree, generated together); 2 = a standalone Part-2 cue card (phase-1 quick practice).';
