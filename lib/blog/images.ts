import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import { BLOG_BUCKET } from "./validate";

/**
 * Pictures for the blog — uploaded by the editor's Media tab into the public
 * `blog` bucket (migration 20261006130000), listed back as its gallery.
 *
 * Called only from /api/admin/blog/images, after `requireSuperAdmin()`.
 */

/** 4 MB: under Vercel's 4.5 MB request ceiling for a function, with room for
 *  the multipart framing. The bucket allows 5; this is the tighter of the two. */
export const BLOG_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

const EXT = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
]);

/**
 * What the file's first bytes say it is.
 *
 * ⚠️ THE BROWSER'S `type` IS A CLAIM. A file named photo.png that is really
 * HTML would be served from our storage domain as whatever type it was stored
 * under; checking the bytes means only real pictures go in a public bucket.
 */
export function sniffImage(head: Uint8Array): string | null {
  const at = (i: number, ...bytes: number[]) => bytes.every((b, k) => head[i + k] === b);
  const ascii = (i: number, s: string) => at(i, ...[...s].map((c) => c.charCodeAt(0)));
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (ascii(0, "GIF87a") || ascii(0, "GIF89a")) return "image/gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  if (ascii(4, "ftypavif") || ascii(4, "ftypavis")) return "image/avif";
  return null;
}

function stem(name: string): string {
  const dot = name.lastIndexOf(".");
  return (
    (dot > 0 ? name.slice(0, dot) : name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "image"
  );
}

export interface BlogImage {
  url: string;
  name: string;
}

export async function uploadBlogImage(file: File): Promise<{ image?: BlogImage; error?: string }> {
  if (file.size > BLOG_IMAGE_MAX_BYTES) return { error: `${file.name} is over 4 MB — resize it first.` };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes.subarray(0, 16));
  if (!type) return { error: `${file.name} is not a JPEG, PNG, WebP, GIF or AVIF picture.` };

  /* Dated folder + random prefix: two uploads called photo.jpg never collide,
     and a published article's picture is never overwritten (`upsert: false`). */
  const month = new Date().toISOString().slice(0, 7);
  const path = `${month}/${crypto.randomUUID().slice(0, 8)}-${stem(file.name)}.${EXT.get(type)}`;
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BLOG_BUCKET).upload(path, bytes, {
    contentType: type,
    upsert: false,
    // A year: the path is unique, so the file at it never changes.
    cacheControl: "31536000",
  });
  if (error) {
    return {
      error: /bucket not found/i.test(error.message)
        ? "The blog image bucket does not exist yet — apply migration 20261006130000_blog_keywords_and_images.sql."
        : `Could not upload ${file.name}: ${error.message}`,
    };
  }
  return { image: { url: admin.storage.from(BLOG_BUCKET).getPublicUrl(path).data.publicUrl, name: path } };
}

/** The newest uploads, across the dated folders — the Media tab's gallery. */
export async function listBlogImages(limit = 40): Promise<{ images: BlogImage[]; error?: string }> {
  const admin = createAdminClient();
  const bucket = admin.storage.from(BLOG_BUCKET);
  const { data: folders, error } = await bucket.list("", { limit: 24, sortBy: { column: "name", order: "desc" } });
  if (error) return { images: [], error: error.message };
  const images: BlogImage[] = [];
  // Folders are `YYYY-MM`, so name-descending is newest first.
  for (const f of (folders ?? []).filter((x) => /^\d{4}-\d{2}$/.test(x.name))) {
    if (images.length >= limit) break;
    const { data: files } = await bucket.list(f.name, { limit, sortBy: { column: "created_at", order: "desc" } });
    for (const file of files ?? []) {
      if (!file.id) continue; // a sub-folder, not a file
      const name = `${f.name}/${file.name}`;
      images.push({ url: bucket.getPublicUrl(name).data.publicUrl, name });
    }
  }
  return { images: images.slice(0, limit) };
}
