import { NextResponse } from "next/server";

import { requireSuperAdmin } from "@/lib/auth";
import { listBlogImages, uploadBlogImage } from "@/lib/blog/images";

/**
 * The blog editor's pictures: GET lists the gallery, POST uploads one file
 * (multipart field `file`).
 *
 * A ROUTE HANDLER, NOT A SERVER ACTION, because a server action's body is
 * capped at 1 MB by default and a photo is usually more. super_admin only —
 * the guard runs first, as on every /api/admin route.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  await requireSuperAdmin();
  const { images, error } = await listBlogImages();
  return NextResponse.json({ images, error: error ?? null });
}

export async function POST(request: Request) {
  await requireSuperAdmin();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "No picture was sent." }, { status: 400 });
  }
  const { image, error } = await uploadBlogImage(file);
  if (error || !image) return NextResponse.json({ error: error ?? "Upload failed." }, { status: 400 });
  return NextResponse.json({ image });
}
