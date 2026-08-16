-- ============================================================================
-- 20260816180000_auto_messages.sql
-- The six automatic messages (§12).
--
-- THE POINT §12 MAKES. Manual announcements are rare; automatic messages are
-- what change behaviour. A centre owner writes maybe one broadcast a month, but
-- "your homework has been set" fires every time a teacher sets work, and it is
-- the message that decides whether the work gets done.
--
-- WHAT THIS TABLE IS. Six rows at most per centre — an on/off switch and the
-- wording. Explicitly NOT an automation builder: no conditions, no schedules,
-- no branching. §12 says "that's the whole feature", and the reason to hold
-- that line is that every automation builder starts as six toggles.
--
-- DEFAULTS LIVE IN CODE, NOT IN ROWS. A centre that never opens this page has
-- no rows here and still gets sensible wording from `AUTO_MESSAGES` in
-- lib/console/auto-messages.ts. That means adding a seventh message later needs
-- no backfill, and a centre cannot end up with a message whose template is an
-- empty string because a migration inserted one.
--
-- WHAT DEFAULTS ON, AND WHY IT MATTERS. Two of these already fire today
-- (practice set, results ready) and their `enabled` default is TRUE, so
-- applying this migration does not silently switch off notifications students
-- are already receiving. The three NEW ones default FALSE: they are outbound
-- messages to real people, and no migration should start messaging a centre's
-- students because a column appeared. The centre turns them on.
--
-- Idempotent: safe to re-run in the Supabase SQL editor.
-- ============================================================================

do $$ begin
  create type public.auto_message_key as enum (
    'practice_set',    -- a teacher set practice        → group students (+ Telegram)
    'results_ready',   -- a final band was saved        → the student
    'absent_today',    -- a register recorded an absence→ the student (+ Telegram)
    'gone_quiet',      -- 7 days with no attempt        → the student
    'two_absences',    -- two consecutive absences      → teacher + admin
    'invoice_due'      -- reserved; not wired to anything yet
  );
exception when duplicate_object then null; end $$;

create table if not exists public.auto_messages (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  key             public.auto_message_key not null,
  enabled         boolean not null default false,
  -- Null means "use the default wording in code". Storing the default text here
  -- would freeze it: improving a default would then only reach centres created
  -- after the change.
  template        text,
  updated_at      timestamptz not null default now(),
  updated_by      uuid,
  primary key (organization_id, key),
  foreign key (updated_by, organization_id)
    references public.profiles (id, organization_id) on delete set null
);

comment on table public.auto_messages is
  'Per-centre on/off and wording for the six automatic messages. Absent row = the code default.';
comment on column public.auto_messages.template is
  'Null = use the default in lib/console/auto-messages.ts. Placeholders: {student} {group} {practice} {band}.';

alter table public.auto_messages enable row level security;

-- Staff see what their centre has switched on. A student never reads this table
-- — they receive the message itself through `notifications`.
drop policy if exists auto_messages_read on public.auto_messages;
create policy auto_messages_read on public.auto_messages
  for select to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('center_admin', 'teacher', 'administrator'));

-- WRITING IS THE OWNER'S ALONE. These messages go out over the centre's name to
-- every student in it, which is the centre speaking — the same reason §12's
-- centre-wide broadcast is center_admin only while a teacher may address their
-- own class. There is no per-class variant of an automatic message, so there is
-- no teacher-scoped case to allow.
drop policy if exists auto_messages_write on public.auto_messages;
create policy auto_messages_write on public.auto_messages
  for all to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) = 'center_admin')
  with check (organization_id = (select public.current_org_id())
              and (select public.current_app_role()) = 'center_admin');

grant select, insert, update, delete on public.auto_messages to authenticated;
grant all on public.auto_messages to service_role;

-- ---------- Stamp who changed the wording ------------------------------------
-- Same shape as every other audited edit here: the client cannot claim to be
-- somebody else, because the trigger overwrites whatever it sent.

create or replace function public.stamp_auto_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  -- auth.uid() is null under the service role, which is legitimate here: the
  -- job runner never edits templates, but a support fix through the SQL editor
  -- should not fabricate an author.
  if auth.uid() is not null then
    new.updated_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists auto_messages_stamp on public.auto_messages;
create trigger auto_messages_stamp
  before insert or update on public.auto_messages
  for each row execute function public.stamp_auto_message();

-- ---------- Do not send the same nudge twice ---------------------------------
-- The gone-quiet nudge and the two-absences alert are the two that run from a
-- schedule rather than from an event, and a schedule that runs twice — a retried
-- cron, an overlapping invocation, a manual re-run — would send the same message
-- again. A student told twice in one day that they have gone quiet learns to
-- ignore the channel.
--
-- The unique index IS the guard: the sender inserts before it sends, and a
-- duplicate key means somebody already did.

create table if not exists public.auto_message_sends (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  key             public.auto_message_key not null,
  recipient_id    uuid not null,
  -- What this send was ABOUT: a date for the scheduled nudges, an attempt id for
  -- the event-driven ones. Two nudges about different days are two messages;
  -- two about the same day are one.
  subject_key     text not null,
  sent_at         timestamptz not null default now(),
  foreign key (recipient_id, organization_id)
    references public.profiles (id, organization_id) on delete cascade
);

create unique index if not exists auto_message_sends_once
  on public.auto_message_sends (organization_id, key, recipient_id, subject_key);
create index if not exists auto_message_sends_recent
  on public.auto_message_sends (organization_id, sent_at desc);

alter table public.auto_message_sends enable row level security;

-- Read-only to staff, so the console can show "last sent". Writes are
-- service-role only: this is the system recording what it did, and a client
-- that could insert here could silence a nudge for somebody else.
drop policy if exists auto_message_sends_read on public.auto_message_sends;
create policy auto_message_sends_read on public.auto_message_sends
  for select to authenticated
  using (organization_id = (select public.current_org_id())
         and (select public.current_app_role()) in ('center_admin', 'teacher', 'administrator'));

grant select on public.auto_message_sends to authenticated;
grant all on public.auto_message_sends to service_role;
