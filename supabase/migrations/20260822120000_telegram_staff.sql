-- Running the centre from Telegram.
--
-- A BINDING IS A WEAKER CREDENTIAL THAN A SESSION, and the whole design follows
-- from admitting that. A web session expires and can be re-authenticated; a
-- Telegram chat id does neither, so whoever holds the unlocked phone is that
-- member of staff until somebody revokes it. Three consequences, all enforced:
--
--   1. It is only ever created from a ONE-TIME CODE generated inside the
--      console by somebody already signed in. There is no way to bind by
--      knowing a phone number, a name, or anything else guessable.
--   2. The code is short-lived and single-use, and `verified_at` records the
--      moment it stopped being a code and became a binding.
--   3. Nothing downstream trusts the chat id for anything but LOOKUP. Every
--      message re-reads the profile and its role from the database, so a staff
--      member demoted to teacher this morning is a teacher on Telegram this
--      afternoon, and one whose profile is gone can do nothing at all.
--
-- Separate from `telegram_students` on purpose. That table answers "which
-- learner is this chat", is populated by a phone match against a class roster,
-- and is read on paths a student can reach. Staff authority has no business
-- sharing a row shape with it — a mistaken join between the two would be a
-- privilege escalation rather than a display bug.

create table if not exists public.telegram_staff (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  profile_id       uuid not null references public.profiles (id) on delete cascade,

  -- Null until the code is used. A row with a code and no chat is an invitation.
  chat_id          bigint,
  link_code        text,
  code_expires_at  timestamptz,
  verified_at      timestamptz,
  created_at       timestamptz not null default now(),

  -- One binding per person: re-linking replaces it, which is what "connect this
  -- phone instead" means. And one chat cannot be two members of staff.
  unique (profile_id),
  foreign key (profile_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);

create unique index if not exists telegram_staff_code_idx
  on public.telegram_staff (link_code) where link_code is not null;
create unique index if not exists telegram_staff_chat_idx
  on public.telegram_staff (chat_id) where chat_id is not null;

alter table public.telegram_staff enable row level security;

-- Their own row and nobody else's — not the owner's, not a colleague's. A
-- binding is a credential, and a credential somebody else can list is a
-- credential somebody else can reason about.
drop policy if exists telegram_staff_own on public.telegram_staff;
create policy telegram_staff_own on public.telegram_staff
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid())
              and organization_id = (select public.current_org_id()));

grant select, insert, update, delete on public.telegram_staff to authenticated;
grant all on public.telegram_staff to service_role;
