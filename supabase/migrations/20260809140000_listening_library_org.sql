-- ============================================================================
-- 20260809140000_listening_library_org.sql
-- Give the listening library an owner, so a teacher's generated item can be
-- assigned without leaking it to every other center.
--
-- The problem: `assignments.listening_library_id` references
-- `listening_library`, but that table had NO organization_id — it is the single
-- shared catalogue the engine serves to everyone. A teacher-generated item
-- lives in `listening_items` (per org, per student), so it could never be
-- attached; and copying it into the shared library would have published one
-- center's content to all of them.
--
-- The fix follows the pattern reading already uses: the shared catalogue lives
-- under a reserved organization id, and center-owned rows carry their own. See
-- READING_LIBRARY_ORG_ID in lib/reading/service.ts — this is the listening twin
-- of it, deliberately the same shape so there is one idea to learn, not two.
--
-- ⚠️ THE ENGINE READS THIS TABLE DIRECTLY (service-role) for its catalogue and
-- render calls. After this migration it MUST filter to
--   organization_id in (LISTENING_LIBRARY_ORG_ID, <caller's org>)
-- or every center will see every other center's generated items. Nothing here
-- can enforce that, because the engine bypasses RLS by design. The change is
-- specified in docs/engine-changes-2026-08-09.md.
-- ============================================================================

-- The reserved owner of the 45 shared, QA'd tests. A fixed uuid rather than a
-- lookup so app, engine and SQL can all name the same thing without a join.
-- (Reading's equivalent is …111b; this is …111c.)
do $$
declare
  library_org constant uuid := '00000000-0000-4000-8000-00000000111c';
begin
  -- A real organizations row, so the FK below has something to point at. Marked
  -- `personal`/`active` because those columns are NOT NULL and no other kind
  -- describes "nobody's center"; nothing ever signs into it.
  insert into public.organizations (id, name, kind, status, plan, billing_enforced)
  values (library_org, 'Listening library', 'personal', 'active', 'free', false)
  on conflict (id) do nothing;

  alter table public.listening_library
    add column if not exists organization_id uuid references public.organizations (id) on delete cascade;

  -- Everything that exists today IS the shared catalogue.
  update public.listening_library
     set organization_id = library_org
   where organization_id is null;

  alter table public.listening_library
    alter column organization_id set not null;

  -- Cloned rows record where they came from, so a center can tell its own
  -- generated content apart from the shared set at a glance.
  alter table public.listening_library
    add column if not exists source_item_id uuid;
end $$;

create index if not exists listening_library_org_idx
  on public.listening_library (organization_id, part, difficulty);

comment on column public.listening_library.organization_id is
  'Owner. 00000000-0000-4000-8000-00000000111c = the shared QA''d catalogue every center sees; any other value = that center''s own cloned item. The ENGINE must filter on (shared, caller org) — it reads this table with the service-role key and RLS does not apply to it.';

-- RLS stays as it was: no `authenticated` policy at all, because the content
-- column holds the answer key and the browser must never read it. Staff reach
-- listening through the engine, which signs audio per request. Adding a policy
-- here would be a correctness bug, not a convenience.
grant all on public.listening_library to service_role;
