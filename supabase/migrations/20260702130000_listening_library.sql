-- ============================================================================
-- 20260702130000_listening_library.sql
-- Listening moves from per-user on-demand generation to a SHARED LIBRARY of
-- pre-generated practices (seeded by script, served to every learner):
--   * no 2-minute wait — practices open instantly;
--   * free plan gets 5 practice unlocks, paid plans get the whole library;
--   * retaking a practice never regenerates (same item, new attempt).
--
-- SECURITY: library `content` holds answer keys + audio manifests. NO
-- authenticated policies — service-role only (the engine returns the
-- answer-stripped render + signed audio URLs, and grades by id).
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

-- ---------- listening_library : shared pre-generated practices ---------------
create table if not exists public.listening_library (
  id          uuid primary key default gen_random_uuid(),
  part        int not null,                 -- 1|2|3|4
  topic       text not null default '',
  difficulty  int not null default 3,       -- 1 (easiest) .. 5 (hardest)
  -- Full generated item WITH answer key + audio segment manifest (paths under
  -- listening-audio/library/<id>/…; narrator boilerplate shared bucket-wide).
  content     jsonb not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists listening_library_part_idx
  on public.listening_library (part, difficulty, created_at);

alter table public.listening_library enable row level security;
-- No policies for `authenticated` on purpose: the browser must never read
-- content (it contains the answers). The engine uses the service-role key.
grant all on public.listening_library to service_role;

-- ---------- listening_unlocks : which library items a learner has opened -----
-- Powers the free-plan gate (5 unlocks) and "already practised" flags.
create table if not exists public.listening_unlocks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  student_id      uuid not null,
  library_id      uuid not null references public.listening_library (id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (organization_id, student_id, library_id),
  foreign key (student_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);
create index if not exists listening_unlocks_student_idx
  on public.listening_unlocks (organization_id, student_id);

alter table public.listening_unlocks enable row level security;
drop policy if exists listening_unlocks_select on public.listening_unlocks;
create policy listening_unlocks_select on public.listening_unlocks
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and student_id = (select auth.uid())
  );
grant select on public.listening_unlocks to authenticated;
grant all on public.listening_unlocks to service_role;

-- ---------- listening_attempts : now also reference library items ------------
-- Attempts against a library practice carry library_id; the legacy per-user
-- item_id becomes optional (that flow is retired from the UI but kept in the
-- engine for compatibility).
alter table public.listening_attempts
  add column if not exists library_id uuid references public.listening_library (id) on delete cascade;
alter table public.listening_attempts
  alter column item_id drop not null;
create index if not exists listening_attempts_library_idx
  on public.listening_attempts (organization_id, student_id, library_id);
