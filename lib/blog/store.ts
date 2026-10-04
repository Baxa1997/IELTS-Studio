import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { createAdminClient } from "@/lib/supabase/admin";

import type { Block, BlogCategory, BlogPost, BlogSkill, PostStatus, StoredPost } from "./types";

/**
 * Where the site reads the blog from: `public.blog_posts` (migration
 * 20261004120000), published rows only.
 *
 * CACHED ACROSS REQUESTS, under the `blog` tag. The blog, the landing section,
 * the sitemap, both llms files and the feed all read this list; without the
 * cache every one of them would be a database round trip per render, for text
 * that changes a few times a month. The editor's save calls
 * `updateTag(BLOG_TAG)`, so a publish shows at once; the hour is only the
 * backstop for a row changed by hand in the SQL editor.
 *
 * Read with the service role because the cache is shared by every visitor and
 * so must not depend on any one of them. RLS would allow the same rows to
 * `anon`; filtering on `status` here is what keeps drafts out.
 */
export const BLOG_TAG = "blog";

/** Every column a rendered post needs. */
export const POST_COLUMNS =
  "slug, category, skill, title, standfirst, author, published, updated, cover_kicker, image, featured, summary, faq, body, cta";

/** …and what only the editor needs on top. */
export const STORED_COLUMNS = `id, status, position, updated_at, ${POST_COLUMNS}`;

type Row = Record<string, unknown>;

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

/** A row as the renderer's `BlogPost`. Optional fields stay absent rather than
 *  null, as they were when posts were code — `post.faq?.length` and friends
 *  depend on it. */
export function rowToPost(r: Row): BlogPost {
  const faq = arr<{ q: string; a: string }>(r.faq);
  const image = r.image as BlogPost["image"] | null;
  const cta = r.cta as BlogPost["cta"] | null;
  return {
    slug: str(r.slug),
    category: str(r.category) as BlogCategory,
    title: str(r.title),
    standfirst: str(r.standfirst),
    published: str(r.published),
    ...(r.updated ? { updated: str(r.updated) } : {}),
    author: str(r.author),
    cover: { kicker: str(r.cover_kicker) },
    ...(image?.src ? { image } : {}),
    ...(r.featured ? { featured: true } : {}),
    ...(r.skill ? { skill: str(r.skill) as BlogSkill } : {}),
    summary: arr<string>(r.summary),
    ...(faq.length ? { faq } : {}),
    body: arr<Block>(r.body),
    // Any field keeps it: a draft's half-written panel must survive a reload.
    ...(cta && (cta.title || cta.text || cta.href || cta.label) ? { cta } : {}),
  };
}

export function rowToStored(r: Row): StoredPost {
  return {
    ...rowToPost(r),
    id: str(r.id),
    status: (str(r.status) || "draft") as PostStatus,
    position: typeof r.position === "number" ? r.position : 0,
    savedAt: str(r.updated_at),
  };
}

/** The columns a post is written back as — the inverse of `rowToPost`. */
export function postToRow(post: BlogPost): Row {
  return {
    slug: post.slug,
    category: post.category,
    skill: post.skill ?? null,
    title: post.title,
    standfirst: post.standfirst,
    author: post.author,
    published: post.published,
    updated: post.updated ?? null,
    cover_kicker: post.cover.kicker,
    image: post.image ?? null,
    featured: Boolean(post.featured),
    summary: post.summary,
    faq: post.faq ?? [],
    body: post.body,
    cta: post.cta ?? null,
  };
}

/* The cached half THROWS on a failed read rather than returning an empty
   list, so a database blip is not cached as "the blog has no posts" for an
   hour. `loadPosts` below catches it for the one render. */
const loadPublished = unstable_cache(
  async (): Promise<BlogPost[]> => {
    const { data, error } = await createAdminClient()
      .from("blog_posts")
      .select(POST_COLUMNS)
      .eq("status", "published")
      .order("published", { ascending: false })
      .order("position", { ascending: true })
      .order("slug", { ascending: true });
    if (error) throw new Error(`blog_posts: ${error.message}`);
    return (data ?? []).map(rowToPost);
  },
  ["blog-posts-v1"],
  { tags: [BLOG_TAG], revalidate: 3600 },
);

/**
 * Every published post, newest first. Never throws: a page that lists posts
 * renders without them rather than failing — the blog is never the reason the
 * landing page is down.
 */
export const loadPosts = cache(async (): Promise<BlogPost[]> => {
  try {
    return await loadPublished();
  } catch (err) {
    console.error("[blog] could not load posts:", err);
    return [];
  }
});

export async function loadPost(slug: string): Promise<BlogPost | undefined> {
  return (await loadPosts()).find((p) => p.slug === slug);
}
