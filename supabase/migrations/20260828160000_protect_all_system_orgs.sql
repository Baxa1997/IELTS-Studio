-- ============================================================================
-- 20260828160000_protect_all_system_orgs.sql
-- Extend the library-org guard to EVERY reserved organisation, and put back the
-- third one that had also been deleted.
--
-- ⚠️ THE AUDIT FOUND A THIRD CASUALTY. 20260828120000 protected the two content
-- libraries. Sweeping the codebase for reserved uuids turned up one more:
--
--   00000000-0000-4000-a000-000000000001  'Public grader (marketing)'
--
-- seeded by 20260617121400 and exported as PUBLIC_ORG_ID from
-- lib/public-grader/prompts.ts. It was missing too. Every public-grader and
-- public-transcribe call attributes its AI spend to that id, so the marketing
-- grader has been running with its usage rows silently failing their foreign
-- key — the feature still answers, and nothing has been recording what it
-- costs. Three reserved orgs, all gone, all with the same fingerprint.
--
-- THE FINGERPRINT, which is the finding worth keeping. Every one of these rows
-- was created with the column defaults — kind 'personal', status 'active' — and
-- has ZERO members, because nothing ever signs into them. A sweep looking for
-- abandoned personal workspaces cannot tell them from junk. They are, to every
-- query anyone would write, exactly the thing worth deleting.
--
-- Fifty-eight tables cascade from `organizations`, so each of these is a
-- single-row delete that silently empties a feature.
--
-- The guard is therefore a LIST, not two ids, and the next reserved org must be
-- added here on the day it is invented.
-- ============================================================================

create or replace function public.refuse_system_org_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'organization % is a reserved system row and cannot be deleted — 58 tables cascade from it. Drop trigger protect_system_orgs deliberately if you really mean it.',
    old.id
    using errcode = 'restrict_violation';
end;
$$;

comment on function public.refuse_system_org_delete is
  'Guards the reserved organisations (content libraries, public grader). They wear kind=personal with no members, so every application-level check reads them as an abandoned workspace — see 20260828120000 and 20260828160000 for the incident.';

-- Replaces the narrower guard from 20260828120000.
drop trigger if exists protect_library_orgs on public.organizations;
drop trigger if exists protect_system_orgs on public.organizations;

create trigger protect_system_orgs
  before delete on public.organizations
  for each row
  when (old.id in (
    '00000000-0000-4000-8000-00000000111b',  -- READING_LIBRARY_ORG_ID
    '00000000-0000-4000-8000-00000000111c',  -- the listening twin
    '00000000-0000-4000-a000-000000000001'   -- PUBLIC_ORG_ID (marketing grader)
  ))
  execute function public.refuse_system_org_delete();

-- Put the public grader's org back, same shape as 20260617121400 seeded it.
-- Usage logging starts working again the moment this row exists; nothing else
-- has to change.
insert into public.organizations (id, name, slug, plan)
values (
  '00000000-0000-4000-a000-000000000001',
  'Public grader (marketing)',
  '__public__',
  'trial'
)
on conflict (id) do nothing;
