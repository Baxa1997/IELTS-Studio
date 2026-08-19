-- A student's own Telegram chat, so credentials and notices can reach them
-- privately and for free.
--
-- WHY NOT REUSE telegram_links. That table is for CHANNELS: it carries
-- `unique (organization_id, group_id)` and treats a null group_id as the
-- centre-wide link, neither of which describes one learner's DMs. Its whole
-- design also assumes a chat several people can see — the announcements it
-- carries are deliberately contentless for that reason. This table is the
-- opposite: one person, and the thing we send them is a password.
--
-- WHY A CODE RATHER THAN A CHAT ID. Same reasoning as the channel table. A bot
-- cannot start a conversation in Telegram, so the student has to open the bot
-- once regardless; making that first tap carry a one-time code means the bind
-- proves two things at once — that the person holds a secret the app only
-- showed to staff who manage them, and that they control that Telegram account.
-- A typed-in chat id would prove neither, and would let anyone who guessed one
-- redirect another student's credentials to themselves.

create table if not exists public.telegram_students (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  profile_id       uuid not null references public.profiles (id) on delete cascade,

  -- Null until the student opens the bot. Positive for a private chat.
  chat_id          bigint,
  verified_at      timestamptz,

  -- Burned on use, like the channel codes.
  link_code        text,
  code_expires_at  timestamptz,

  created_at       timestamptz not null default now(),

  -- One binding per student. Re-inviting replaces the row rather than stacking.
  unique (profile_id),
  -- And one student per Telegram account inside a centre, so two learners
  -- cannot both point at the same chat and race for each other's messages.
  unique (organization_id, chat_id)
);

-- The lookup the webhook does on every /start, and the reason an unused code
-- cannot collide with a live one.
create unique index if not exists telegram_students_code_idx
  on public.telegram_students (link_code)
  where link_code is not null and verified_at is null;

alter table public.telegram_students enable row level security;

-- READ: staff who may see the student, and the student themselves. Reusing
-- can_view_student keeps this in step with the rest of the console — a teacher
-- sees the learners in groups they own, a center_admin sees the centre.
drop policy if exists telegram_students_read on public.telegram_students;
create policy telegram_students_read on public.telegram_students
  for select to authenticated
  using (
    organization_id = (select public.current_org_id())
    and (
      profile_id = (select auth.uid())
      or public.can_view_student(profile_id)
    )
  );

-- WRITE: staff only. A student cannot mint their own code — the code is what
-- authorises the bind, so being able to create one would let anyone bind
-- anyone. They participate by opening the link, which is the webhook's job and
-- runs service-role.
drop policy if exists telegram_students_write on public.telegram_students;
create policy telegram_students_write on public.telegram_students
  for all to authenticated
  using (
    organization_id = (select public.current_org_id())
    and public.can_view_student(profile_id)
  )
  with check (
    organization_id = (select public.current_org_id())
    and public.can_view_student(profile_id)
  );

comment on table public.telegram_students is
  'Binds one student to their private Telegram chat, so credentials and personal '
  'notices reach them free of charge. Distinct from telegram_links, which is for '
  'group channels and deliberately carries nothing personal.';
