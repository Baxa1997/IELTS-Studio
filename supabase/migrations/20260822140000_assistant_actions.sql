-- What the assistant actually did.
--
-- WHY A SEPARATE TABLE, AND NOT THE THREAD. The conversation records what was
-- SAID; this records what CHANGED. They diverge constantly: a proposal offered
-- and never pressed leaves a thread entry and no effect, and the same thread
-- read back a week later cannot tell you which of the two happened. Three
-- questions need this and none of them can be answered from prose —
-- "what has it done today", "who created this class", and "did that actually
-- go through".
--
-- IT RECORDS OUTCOMES, INCLUDING FAILURES. An action that was refused is the
-- more interesting row: it is the one somebody will ask about, and a log that
-- keeps only successes answers "did it work?" with silence in exactly the case
-- where silence is ambiguous.
--
-- ORG-WIDE READ, unlike a thread. A thread is somebody's private working notes
-- and is theirs alone; an action changed the centre's data, and the centre gets
-- to see it. A teacher who moved a student cannot then be the only person who
-- knows.

create table if not exists public.assistant_actions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  -- Who pressed the button. Kept when they leave: "nobody" is a worse answer to
  -- "who did this" than the name of somebody who has since gone.
  profile_id       uuid references public.profiles (id) on delete set null,
  actor_name       text,

  -- The allow-listed id, e.g. `create_group`. Text rather than an enum: the
  -- list grows with the assistant, and a migration per action would be a
  -- migration nobody writes.
  action           text not null,
  -- What it was given, after vetting — so this is the argument that ran, not
  -- the one the model first suggested.
  args             jsonb not null default '{}'::jsonb,

  ok               boolean not null,
  -- The sentence the person saw, success or refusal, verbatim.
  outcome          text,
  created_at       timestamptz not null default now()
);

create index if not exists assistant_actions_org_idx
  on public.assistant_actions (organization_id, created_at desc);

alter table public.assistant_actions enable row level security;

-- Anyone on staff reads their centre's; a student sees nothing. Writes go
-- through service-role from the action itself, so nothing client-side can
-- fabricate a record of something that did not happen.
drop policy if exists assistant_actions_staff_read on public.assistant_actions;
create policy assistant_actions_staff_read on public.assistant_actions
  for select to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('center_admin', 'administrator', 'teacher'));

grant select on public.assistant_actions to authenticated;
grant all on public.assistant_actions to service_role;
