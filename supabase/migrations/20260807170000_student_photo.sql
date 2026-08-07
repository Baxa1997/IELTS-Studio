-- ============================================================================
-- 20260807170000_student_photo.sql
-- Optional student photo. A teacher adding a class can attach a picture so the
-- roster is recognisable; leaving it out is always fine (the column is
-- nullable and the form field is optional).
--
-- The bucket is PRIVATE and has no storage RLS policies on purpose: nothing
-- client-side ever touches it. Uploads go through the server action on the
-- service-role client, and every render signs a short-lived URL server-side.
-- A student photo is personal data — it should not be guessable from a URL.
-- ============================================================================

alter table public.profiles
  add column if not exists avatar_path text;

comment on column public.profiles.avatar_path is
  'Storage object path in the private "avatars" bucket, or null. Render via a signed URL — never expose the path to the browser.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  false,
  2 * 1024 * 1024,                                   -- 2 MB is plenty for a face
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
