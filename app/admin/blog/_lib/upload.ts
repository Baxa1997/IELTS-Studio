/**
 * The editor's side of /api/admin/blog/images. A route handler rather than a
 * server action because an action's body is capped at 1 MB.
 */
export interface UploadedImage {
  url: string;
  name: string;
}

export async function uploadImage(file: File): Promise<{ image?: UploadedImage; error?: string }> {
  const body = new FormData();
  body.append("file", file);
  try {
    const res = await fetch("/api/admin/blog/images", { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as { image?: UploadedImage; error?: string };
    return res.ok && json.image ? { image: json.image } : { error: json.error ?? `Upload failed (${res.status}).` };
  } catch {
    return { error: "Upload failed — check the connection and try again." };
  }
}

export async function listImages(): Promise<{ images: UploadedImage[]; error?: string }> {
  try {
    const res = await fetch("/api/admin/blog/images", { cache: "no-store" });
    const json = (await res.json().catch(() => ({}))) as { images?: UploadedImage[]; error?: string | null };
    return { images: json.images ?? [], ...(json.error ? { error: json.error } : {}) };
  } catch {
    return { images: [], error: "Could not load the gallery." };
  }
}
