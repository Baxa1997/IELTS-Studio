-- ============================================================================
-- 20260828120000_protect_library_orgs.sql
-- Make the two reserved content-library organisations undeletable.
--
-- ⚠️ WHAT HAPPENED. Both shared libraries were empty in production. Not
-- "never seeded" — `listening_attempts` still holds 13 rows pointing at
-- practices that no longer exist, and 54 folders of their audio are still
-- sitting in the `listening-audio/library/` bucket. The rows were there and
-- then they were not.
--
-- The mechanism is `20260809140000_listening_library_org.sql`:
--
--     alter table public.listening_library
--       add column organization_id uuid
--         references public.organizations (id) on delete cascade;
--
-- The shared catalogue is OWNED by a reserved organisation row, and 55 tables
-- carry that same cascade. Delete one organisation and the whole library goes
-- with it, silently, as a side effect of a single-row delete. Both reserved
-- orgs — listening (…111c) and reading (…111b) — are now missing, and both
-- libraries are empty. That is the whole story.
--
-- ⚠️ WHY EVERY EXISTING GUARD LET IT THROUGH, WHICH IS THE REAL BUG.
-- Those orgs were created wearing the DEFAULTS: kind 'personal', status
-- 'active', and no profile has ever belonged to one. So to every safety check
-- in the codebase they look exactly like an abandoned personal workspace —
-- the precise thing those checks exist to clean up. `placeUserInOrg`
-- (lib/provision.ts) refuses to delete an org that is not `kind = 'personal'`
-- and refuses one with more than one member; a library org passes both, and
-- passes the second one more convincingly than any real workspace, because it
-- has zero. `scripts/create-admin.mjs` and `scripts/qa-org-flow.mjs` filter on
-- `.eq("kind", "personal")` believing that is the safe side of the line. For
-- these two rows it is the dangerous side.
--
-- So this does not name a culprit and does not need to. Application-level
-- guards cannot protect these rows, because the guards are written in terms of
-- properties the rows genuinely have. The QA scripts, `/admin`, the engine and
-- a person clicking Delete in the Supabase dashboard all reach the same table
-- with the same service-role authority, and only the database sits underneath
-- all of them.
--
-- Hence a trigger. It is the one place that cannot be bypassed by whichever
-- path did it.
--
-- NOTE ON RECOVERY: this protects what is there; it does not bring back what
-- is gone. The audio survives, so a point-in-time restore of just the
-- `listening_library` rows would light the library up again without
-- regenerating anything — the storage paths still match.
-- ============================================================================

create or replace function public.refuse_library_org_delete()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'organization % is a reserved content library and cannot be deleted (its id is referenced by ON DELETE CASCADE from the shared reading/listening catalogues). Drop this trigger deliberately if you really mean it.',
    old.id
    using errcode = 'restrict_violation';
end;
$$;

comment on function public.refuse_library_org_delete is
  'Guards the reserved library organisations. They wear kind=personal with no members, so every application-level check reads them as an abandoned workspace — see 20260828120000 for the incident this prevents.';

drop trigger if exists protect_library_orgs on public.organizations;

-- A row-level BEFORE trigger with a WHEN clause: the two ids are named here
-- rather than tested inside the function so the check costs nothing for the
-- millions of deletes that are not these two rows.
create trigger protect_library_orgs
  before delete on public.organizations
  for each row
  when (old.id in (
    '00000000-0000-4000-8000-00000000111b',  -- READING_LIBRARY_ORG_ID
    '00000000-0000-4000-8000-00000000111c'   -- the listening twin
  ))
  execute function public.refuse_library_org_delete();

-- ── put the two rows back ───────────────────────────────────────────────────
-- Recreating the OWNER is not the same as recreating the library: these are
-- empty shells, and the catalogues still have to be reseeded. But the seed
-- scripts insert rows that reference these ids, so without them a reseed fails
-- on the foreign key before it generates anything.
--
-- Same shape as the original definitions (20260809140000 for listening,
-- ensureReadingLibraryOrg() in lib/reading/service.ts for reading), so a
-- database that still has them is unchanged.
insert into public.organizations (id, name, slug, plan)
values
  ('00000000-0000-4000-8000-00000000111b', 'IELTS Practice Library', 'ielts-practice-library', 'enterprise'),
  ('00000000-0000-4000-8000-00000000111c', 'IELTS Listening Library', 'ielts-listening-library', 'enterprise')
on conflict (id) do nothing;
