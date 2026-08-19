-- One invite per class, so a whole roster can connect from a single message.
--
-- WHY NOT A CODE PER STUDENT. There already is one (telegram_students.link_code)
-- and it does not scale to a classroom: thirty codes is thirty slips to print,
-- cut and hand out, and the teacher who has just imported a spreadsheet wants
-- one action, not thirty.
--
-- This code is deliberately NOT a credential. On its own it identifies a class
-- and nothing else — holding it lets you ask the bot "who am I?", and the bot
-- answers only if the phone number Telegram reports matches a student on that
-- roster. So posting it in the class channel is safe in a way that posting
-- per-student codes would not be: the secret that decides the bind is the
-- student's own phone, which the code does not contain and cannot reveal.

create table if not exists public.telegram_group_invites (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  group_id         uuid not null,

  code             text not null,
  expires_at       timestamptz not null,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),

  -- One live invite per class. Re-inviting replaces it, which also revokes the
  -- old code — the behaviour a teacher expects from "make a new link".
  unique (group_id),
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete cascade
);

create unique index if not exists telegram_group_invites_code_idx
  on public.telegram_group_invites (code);

alter table public.telegram_group_invites enable row level security;

-- Staff who manage the class. Students never read this table: they present the
-- code to the bot, which runs service-role.
drop policy if exists telegram_group_invites_rw on public.telegram_group_invites;
create policy telegram_group_invites_rw on public.telegram_group_invites
  for all to authenticated
  using (
    organization_id = (select public.current_org_id())
    and public.can_manage_group(group_id)
  )
  with check (
    organization_id = (select public.current_org_id())
    and public.can_manage_group(group_id)
  );

comment on table public.telegram_group_invites is
  'A per-class code students present to the bot. Not a credential on its own — '
  'the bind is decided by matching the phone Telegram reports against the roster, '
  'so this code is safe to post in the class channel.';
