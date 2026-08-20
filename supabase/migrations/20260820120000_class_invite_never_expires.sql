-- A class invite stops expiring.
--
-- WHY IT CAN. This code is not a credential and never was: on its own it names
-- a class and nothing more. Holding it lets somebody ask the bot "who am I?",
-- and the bot answers only if the phone number Telegram reports matches a
-- student on that roster, is not shared with a second student, and is not
-- already bound to another account. The secret that decides the bind is the
-- student's own phone — which this code neither contains nor can reveal. An
-- expiry was therefore buying almost nothing.
--
-- WHY IT SHOULD. It was buying a support message instead. The invite is posted
-- once, in the class channel, and then scrolls away up the chat — so the
-- student who joins in week three, or who reinstalls Telegram in month two,
-- finds a dead link and has to ask a teacher to re-post. Re-inviting also
-- REPLACES the code, which revokes the one everybody else still has in their
-- history. A code that simply keeps working removes both.
--
-- Revocation is unchanged and still deliberate: re-inviting the class issues a
-- new code and the old row is gone.

alter table public.telegram_group_invites
  alter column expires_at drop not null;

comment on column public.telegram_group_invites.expires_at is
  'Null means the code never expires, which is the normal case. Kept nullable rather than dropped so a centre that wants a time-boxed code later can have one without a migration.';

-- Codes already handed out stop expiring too, rather than leaving a cohort of
-- classes on the old rule that nobody can tell apart from the new one.
update public.telegram_group_invites set expires_at = null;
