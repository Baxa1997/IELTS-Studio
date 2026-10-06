/*
 * The blog editor's second shape: SEO keywords on a post, and a bucket for the
 * pictures the editor uploads.
 *
 * KEYWORDS are the searches a post is written for — `meta keywords`, the
 * BlogPosting `keywords`, and what the editor's SEO panel checks the title,
 * standfirst and opening paragraph against. Lower-case, at most ten; the
 * editor's publish check (lib/blog/validate.ts) holds that, not a constraint,
 * so the reason comes back in words.
 *
 * ⚠️ SAFE TO APPLY AFTER THE APP DEPLOYS. Every read of blog_posts retries
 * without `keywords` when the column is missing (LEGACY_POST_COLUMNS in
 * lib/blog/store.ts), so the site never goes blank waiting for this file.
 * Saving a post DOES need it — the editor says so if it is missing.
 */
alter table public.blog_posts
  add column if not exists keywords text[] not null default '{}';

/*
 * THE `blog` BUCKET — public, because an article's pictures are read by every
 * visitor, every crawler and every feed reader, and a signed URL expires inside
 * an article that does not.
 *
 * The same host and path are the ONLY remote images next.config.ts lets
 * next/image load (the cover goes through it), and `isBlogImageSrc` in
 * lib/blog/validate.ts refuses any other host on publish. Rename the bucket and
 * all three must move together.
 *
 * No SVG on purpose: an SVG is a document that can carry script, served from
 * our storage domain. Raster formats only.
 */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog',
  'blog',
  true,
  5 * 1024 * 1024,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do nothing;

-- Uploads go through /api/admin/blog/images on the service-role client after
-- requireSuperAdmin(), which bypasses storage RLS — so there are deliberately
-- no storage policies here. Reads need none: the bucket is public.
