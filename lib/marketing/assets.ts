import "server-only";

import { clientEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Files that go OUT with a broadcast.
 *
 * ⚠️ THESE BECOME PUBLIC URLS, AND THAT IS THE DESIGN — see the bucket note in
 * 20260921120000_marketing_broadcasts.sql. A signed URL cannot work here: it
 * expires, and the link inside an email that has already been delivered can
 * never be re-signed, so a learner opening the message next month would get an
 * error. The rule that follows is the one to hold on to: NOTHING PERSONAL GOES
 * IN THIS BUCKET. It is for promotional material, not for anything about a
 * specific learner.
 *
 * The email carries a link, never the file itself. Real attachments on a bulk
 * send are a strong spam signal and hit Brevo's size ceiling; a link costs
 * neither and survives forwarding.
 */

const BUCKET = "marketing";

/** Mirrors `allowed_mime_types` on the bucket. Kept here too so a bad file is
 *  refused with a sentence rather than a storage error code. */
const ALLOWED = new Map<string, string>([
  ["application/pdf", "pdf"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["video/mp4", "mp4"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
]);

export const MARKETING_MAX_BYTES = 20 * 1024 * 1024;

/** A filename that is safe in a URL and still recognisable in a download. */
function slugify(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return stem || "file";
}

export async function uploadMarketingAsset(
  file: File,
): Promise<{ url?: string; label?: string; error?: string }> {
  const ext = ALLOWED.get(file.type);
  if (!ext) return { error: `${file.name}: that file type isn't allowed.` };
  if (file.size > MARKETING_MAX_BYTES) return { error: `${file.name}: must be 20 MB or smaller.` };

  const admin = createAdminClient();
  /* A random prefix, so two uploads of "practice.pdf" cannot overwrite one
     another and a URL from an old broadcast keeps pointing at what it pointed
     at when it was sent. `upsert: false` for the same reason. */
  const path = `${crypto.randomUUID()}/${slugify(file.name)}.${ext}`;

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: `Could not upload ${file.name}: ${error.message}` };

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    return { error: `Uploaded ${file.name} but could not build its link.` };
  }
  return { url: data.publicUrl, label: file.name };
}

/** Sanity check used by the page: is the bucket actually there? A missing
 *  bucket is the one failure that looks like a broken upload button. */
export async function marketingBucketExists(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.storage.from(BUCKET).list("", { limit: 1 });
    return !error;
  } catch {
    return false;
  }
}

/** Only used to spot a link that points at our own bucket, for the composer's
 *  "this is an uploaded file" hint. */
export function isMarketingAssetUrl(url: string): boolean {
  return url.startsWith(`${clientEnv.supabaseUrl}/storage/v1/object/public/${BUCKET}/`);
}
