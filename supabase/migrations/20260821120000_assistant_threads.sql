-- The console assistant remembers the conversation.
--
-- WHY IT HAS TO. The assistant's job is to answer questions about pages you
-- then go and look at — "which classes can't collect their logins?" is followed
-- by opening one of them. Losing the thread the moment you act on its advice
-- made it useless for the one thing it is for. It was briefly mirrored into
-- sessionStorage instead; that has to be read during render to avoid setting
-- state in an effect, and then disagrees with the server's first paint, so it
-- was taken back out rather than shipped badly.
--
-- STRICTLY PRIVATE TO THE PERSON, and this is the one policy decision that
-- matters here. Not the org, not "staff can see staff" — a teacher's thread is
-- their own working notes, and somebody who suspects an owner reads them will
-- stop asking the candid questions ("am I behind?", "why is my class failing?")
-- that make the thing worth having. The organisation id is carried for tenancy
-- and cascade only; it never widens who can read.
--
-- A THREAD, NOT A FLAT LOG, so "New chat" starts a fresh one instead of
-- deleting what came before. Nothing in the interface lists old threads yet —
-- the id is there so that can be added without moving any data.

create table if not exists public.assistant_threads (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  created_at       timestamptz not null default now()
);

create index if not exists assistant_threads_owner_idx
  on public.assistant_threads (profile_id, created_at desc);

create table if not exists public.assistant_messages (
  id               uuid primary key default gen_random_uuid(),
  thread_id        uuid not null references public.assistant_threads (id) on delete cascade,
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  profile_id       uuid not null references public.profiles (id) on delete cascade,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null,
  -- What was offered alongside the reply. Kept so a reloaded thread still shows
  -- the button — a proposal that vanishes on refresh is a proposal a person
  -- stops trusting. It is re-vetted on confirm regardless: `runProposal`
  -- re-checks the action, the role and every name, so a stored proposal is no
  -- more trusted than a fresh one.
  proposals        jsonb,
  created_at       timestamptz not null default now()
);

create index if not exists assistant_messages_thread_idx
  on public.assistant_messages (thread_id, created_at);

alter table public.assistant_threads  enable row level security;
alter table public.assistant_messages enable row level security;

drop policy if exists assistant_threads_own on public.assistant_threads;
create policy assistant_threads_own on public.assistant_threads
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid())
              and organization_id = (select public.current_org_id()));

drop policy if exists assistant_messages_own on public.assistant_messages;
create policy assistant_messages_own on public.assistant_messages
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid())
              and organization_id = (select public.current_org_id()));

grant select, insert, update, delete on public.assistant_threads  to authenticated;
grant select, insert, update, delete on public.assistant_messages to authenticated;
grant all on public.assistant_threads  to service_role;
grant all on public.assistant_messages to service_role;
