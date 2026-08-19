-- Where a half-finished Telegram sign-up lives between two messages.
--
-- WHY IT CANNOT BE IN MEMORY. Joining takes two updates — the class code, then
-- the shared phone number — and every webhook call is a separate serverless
-- invocation that may run on a different instance. A Map held in module scope
-- is therefore empty for the second message almost every time, and the student
-- is told "send me your class code first" immediately after doing exactly that.
--
-- Deliberately keyed by CHAT rather than by student: at the moment the code
-- arrives nobody knows who is asking, which is the entire point of the phone
-- step that follows.
--
-- Nothing here is sensitive. A chat id and a class id, for ten minutes.

create table if not exists public.telegram_pending (
  chat_id          bigint primary key,
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  group_id         uuid not null,

  -- Kept once a number has been shared but matched more than one student, so
  -- the name they send next can finish the job without asking for the number
  -- again.
  phone            text,

  expires_at       timestamptz not null,
  created_at       timestamptz not null default now(),

  foreign key (group_id, organization_id)
    references public.groups (id, organization_id) on delete cascade
);

create index if not exists telegram_pending_expiry_idx
  on public.telegram_pending (expires_at);

-- Written and read ONLY by the webhook, which runs service-role. No policy
-- grants anybody else access: RLS on with no permissive policy denies everyone,
-- which is exactly right for a table nothing in the app should read.
alter table public.telegram_pending enable row level security;

comment on table public.telegram_pending is
  'A Telegram chat part-way through joining a class. Service-role only; rows '
  'live for minutes. Exists because the two steps of the handshake arrive as '
  'separate serverless invocations that share no memory.';
