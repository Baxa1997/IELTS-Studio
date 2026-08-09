-- ============================================================================
-- 20260809150000_telegram_links.sql
-- Wire a center's group to a Telegram channel, so attaching practice announces
-- itself where the class already talks.
--
-- Why a handshake and not just a pasted id: Telegram gives no way to look a
-- channel up by name, and a chat_id is not a secret. If the app accepted one
-- typed into a box, anyone who knew (or guessed) another center's chat_id could
-- point their group at it and start posting. So the bot has to LEARN the id
-- from a code posted inside the channel — which simultaneously proves the
-- person linking it can post there. `link_code` + `verified_at` are that
-- handshake; a row with no `verified_at` has never been confirmed and is never
-- sent to.
--
-- See docs/telegram-channels-options.md for the options this settles.
-- ============================================================================

create table if not exists public.telegram_links (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  -- null = a center-wide channel (announcements); set = that class's channel.
  group_id        uuid,
  -- Telegram chat ids are int64 and NEGATIVE for groups/channels, so bigint.
  chat_id         bigint,
  chat_title      text,
  -- The handshake: shown in the app, posted in the channel, matched by the bot.
  link_code       text,
  code_expires_at timestamptz,
  verified_at     timestamptz,
  linked_by       uuid,
  created_at      timestamptz not null default now(),
  -- One channel per group. Re-linking replaces rather than stacks.
  unique (organization_id, group_id),
  -- ...and one group per channel, so two classes can't post into the same place
  -- by accident. Scoped to the org on purpose: a GLOBAL unique would leak the
  -- existence of another tenant's channel through a constraint error.
  unique (organization_id, chat_id),
  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete cascade,
  foreign key (linked_by, organization_id)
    references public.profiles (id, organization_id) on delete set null
);

-- The webhook looks a pending link up by its code, and the sender looks live
-- links up by group. Both are hot paths on every assignment.
create unique index if not exists telegram_links_code_idx
  on public.telegram_links (link_code)
  where link_code is not null and verified_at is null;
create index if not exists telegram_links_group_idx
  on public.telegram_links (group_id)
  where verified_at is not null;

alter table public.telegram_links enable row level security;

-- Staff read their own center's links. Students never see them: which channel a
-- class posts to is an operational detail, not something the roster needs.
drop policy if exists telegram_links_read on public.telegram_links;
create policy telegram_links_read on public.telegram_links
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (select public.current_app_role()) in ('center_admin', 'teacher')
  );

-- Writes follow the same rule as everything else about a class: a teacher
-- manages the groups they own, a center_admin manages any of them. A
-- center-wide link (group_id is null) is the admin's alone.
drop policy if exists telegram_links_write on public.telegram_links;
create policy telegram_links_write on public.telegram_links
  for all to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (
      (group_id is not null and public.can_manage_group(group_id))
      or (group_id is null and (select public.current_app_role()) = 'center_admin')
    )
  )
  with check (
    organization_id = (select public.current_org_id())
    and (
      (group_id is not null and public.can_manage_group(group_id))
      or (group_id is null and (select public.current_app_role()) = 'center_admin')
    )
  );

grant select, insert, update, delete on public.telegram_links to authenticated;
grant all on public.telegram_links to service_role;

comment on table public.telegram_links is
  'A verified Telegram channel for a group (or the whole center when group_id is null). Rows without verified_at are half-finished handshakes and must never be posted to.';
