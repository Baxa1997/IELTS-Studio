-- ============================================================================
-- 20260809130000_profile_contact_email.sql
-- Separate "where we write to you" from "how you sign in".
--
-- The problem this solves: `auth.users.email` is globally unique, so an address
-- already used by a personal account could never be attached to a center
-- account. A learner who practises solo and then joins a center as a teacher hit
-- a hard wall — "already has an account on the platform" — with no way through.
--
-- The decision (2026-08-09): a center-created account NEVER occupies the global
-- email namespace. Its auth address is always synthetic (<login>@students.
-- engprogress.com, a domain we own with no MX), and it signs in by login. The
-- real address lives here instead: plain text, NOT unique, no authentication
-- meaning whatsoever. Two accounts, one inbox, no collision.
--
-- Consequence to keep in mind: a center account cannot reset its password by
-- email, because its auth address cannot receive mail. The center resets it.
-- That was already true for students created without an address; it is now
-- true for every center-created account, deliberately.
-- ============================================================================

alter table public.profiles
  add column if not exists contact_email text;

comment on column public.profiles.contact_email is
  'Delivery address for credentials and notices. NOT a sign-in identity and NOT unique — the sign-in identity is username, and auth.users.email is synthetic for center-created accounts. Never authenticate against this column.';

-- Let people maintain their own address. Safe to widen: the column carries no
-- authentication meaning, so writing it cannot take over anything — the worst
-- case is that your own centre emails the wrong inbox. The columns NOT listed
-- here (role, organization_id, username) stay unwritable by any client, which
-- is what stops someone renaming into another person's login or moving org.
grant update (full_name, phone, contact_email) on public.profiles to authenticated;
