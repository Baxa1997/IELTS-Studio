-- ============================================================================
-- 20260921120000_marketing_broadcasts.sql
--
-- Super-admin marketing broadcasts: tell learners about new practice content.
--
-- ⚠️ THIS IS THE FIRST NON-TRANSACTIONAL EMAIL THE PLATFORM SENDS, and that is
-- the whole reason `marketing_opt_out` exists. Everything before it — a centre
-- approval, a referral notice, a password reset — is mail somebody's own action
-- asked for, which needs no opt-out. Bulk promotional mail does, and not only
-- legally: complaints damage the SENDING DOMAIN, and the same Brevo sender
-- carries the password resets and centre approvals the product cannot work
-- without. An unsubscribe link is what protects the transactional mail.
--
-- WHAT IS DELIBERATELY NOT HERE: a subscriber list. The audience is derived
-- from `profiles` at send time, so there is no second copy of who exists to
-- drift out of step with the real one. The only stored preference is the
-- refusal, because that is the fact nothing else can imply.
-- ============================================================================

-- ── the opt-out ─────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists marketing_opt_out boolean not null default false;

comment on column public.profiles.marketing_opt_out is
  'True once this person has unsubscribed from marketing email. Transactional mail (approvals, resets, referral notices) ignores it — those are not promotional and must keep arriving.';

/*
 * NOT CLIENT-WRITABLE, WHICH LOOKS BACKWARDS FOR A PREFERENCE.
 *
 * Unsubscribing happens from a LINK IN AN EMAIL, where there is no session —
 * the person may not even be signed in, and a one-click opt-out that demands a
 * login is one people complain about instead of using. So the write happens
 * server-side through the service-role client, after the route has verified a
 * signed token. Granting the column to `authenticated` as well would add a
 * second, weaker path to the same bit for no gain.
 */

-- ── the send record ─────────────────────────────────────────────────────────
-- One row per broadcast. Kept because "what did we already tell people, and who
-- actually received it" is unanswerable afterwards otherwise, and because the
-- per-recipient table below is what makes a send resumable.
create table if not exists public.marketing_broadcasts (
  id            uuid primary key default gen_random_uuid(),
  subject       text not null,
  -- The composer's plain text. The HTML that actually ships is rendered from
  -- this at send time rather than stored twice: two copies of the same message
  -- is two things to keep in step, and only one of them would be.
  body          text not null,
  -- Public URLs of anything attached, in the order they should be listed.
  links         jsonb not null default '[]'::jsonb,
  created_by    uuid,
  created_at    timestamptz not null default now(),
  -- draft → sending → sent. A broadcast that dies mid-send stays `sending`,
  -- which is exactly the state a human needs to see.
  status        text not null default 'draft'
                check (status in ('draft', 'sending', 'sent')),
  started_at    timestamptz,
  finished_at   timestamptz
);

create index if not exists marketing_broadcasts_created_idx
  on public.marketing_broadcasts (created_at desc);

/*
 * ONE ROW PER RECIPIENT, WRITTEN BEFORE ANYTHING IS SENT.
 *
 * THE POINT IS IDEMPOTENCY. 180 emails cannot go out inside one serverless
 * invocation — the function times out long before SMTP finishes — so a send is
 * a loop of small batches, and any batch may be retried after a timeout, a
 * deploy, or a closed browser tab. Without a per-recipient row there is no way
 * to know who already got it, and a retry mails the whole list twice.
 *
 * The resolved `email` is FROZEN here rather than looked up per batch: a centre
 * account's real inbox lives on `contact_email` and can change, and a broadcast
 * half-sent to one address and half to another is not one broadcast.
 */
create table if not exists public.marketing_broadcast_recipients (
  broadcast_id  uuid not null references public.marketing_broadcasts (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  email         text not null,
  status        text not null default 'queued'
                check (status in ('queued', 'sent', 'failed', 'skipped')),
  -- Why it did not go: the SMTP error, or the reason it was skipped.
  detail        text,
  sent_at       timestamptz,
  primary key (broadcast_id, profile_id)
);

create index if not exists marketing_recipients_pending_idx
  on public.marketing_broadcast_recipients (broadcast_id, status);

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Both tables are super-admin-only, and super_admin has NO profile row and no
-- org — it is a JWT claim. There is therefore no policy that could describe it
-- here, so RLS is enabled with NO POLICY AT ALL: deny everything to
-- `authenticated`, and let the service-role client behind requireSuperAdmin()
-- be the only way in. Same shape as `referral_attributions`.
alter table public.marketing_broadcasts            enable row level security;
alter table public.marketing_broadcast_recipients  enable row level security;

grant all on public.marketing_broadcasts           to service_role;
grant all on public.marketing_broadcast_recipients to service_role;

-- ── the asset bucket ────────────────────────────────────────────────────────
/*
 * PUBLIC, AND THAT IS THE OPPOSITE CALL TO `avatars` ON PURPOSE.
 *
 * The avatars bucket is private because a student's face is personal data that
 * should not be guessable from a URL. A marketing PDF is the reverse: its
 * entire job is to be opened by a few hundred people from an email client,
 * forwarded, and still work next month. A signed URL cannot do that — it
 * expires, and the link in an email that has already been delivered cannot be
 * re-signed. So the bucket is public and nothing personal may go in it.
 *
 * The 20 MB ceiling is for the STORAGE side; the email itself only ever carries
 * a link, which is why the size can be this generous without touching
 * deliverability.
 */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'marketing',
  'marketing',
  true,
  20 * 1024 * 1024,
  array[
    'application/pdf',
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

-- Uploads go through the server action on the service-role client, which
-- bypasses storage RLS — so there are deliberately no storage policies here.
-- Reads need none either: the bucket is public.
