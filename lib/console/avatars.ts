import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "avatars";
const SIGNED_URL_TTL = 60 * 60; // an hour — long enough for a page, short enough to not leak

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

/**
 * Store a student's photo and return its object path (or an error message).
 * The bucket is private and has no client-facing policies, so this runs on the
 * service-role client — callers must already have checked the caller's right to
 * manage this student.
 */
export async function uploadAvatar(
  file: File,
  organizationId: string,
  studentId: string,
): Promise<{ path?: string; error?: string }> {
  const ext = ALLOWED.get(file.type);
  if (!ext) return { error: "Photo must be a JPEG, PNG or WebP image." };
  if (file.size > AVATAR_MAX_BYTES) return { error: "Photo must be 2 MB or smaller." };

  const admin = createAdminClient();
  const path = `${organizationId}/${studentId}.${ext}`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) return { error: `Could not upload the photo: ${error.message}` };
  return { path };
}

/** Signed URL for one stored photo, or null. */
export async function signAvatar(path: string | null): Promise<string | null> {
  if (!path) return null;
  const [url] = await signAvatars([path]);
  return url ?? null;
}

/**
 * Sign several photos at once (one API call), preserving input order. Missing
 * or failed entries come back as null so a broken image never breaks a roster.
 */
export async function signAvatars(paths: (string | null)[]): Promise<(string | null)[]> {
  const real = paths.filter((p): p is string => Boolean(p));
  if (real.length === 0) return paths.map(() => null);

  const admin = createAdminClient();
  const { data } = await admin.storage.from(BUCKET).createSignedUrls(real, SIGNED_URL_TTL);

  const byPath = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.path && row.signedUrl) byPath.set(row.path, row.signedUrl);
  }
  return paths.map((p) => (p ? (byPath.get(p) ?? null) : null));
}
