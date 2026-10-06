"use server";

import { revalidatePath, updateTag } from "next/cache";

import { recordAdminAction } from "@/lib/admin/audit";
import { requireSuperAdmin } from "@/lib/auth";
import type { PostStatus } from "@/lib/blog";
import { formToPost, type PostForm } from "@/lib/blog/form";
import { BLOG_TAG, isMissingColumn, postToRow } from "@/lib/blog/store";
import { draftProblems, publishProblems } from "@/lib/blog/validate";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Writing, publishing and deleting blog posts.
 *
 * EVERY ACTION CALLS `requireSuperAdmin()` ITSELF. A server action is an RPC
 * endpoint anybody can POST to — the guard on the page protects the form, not
 * the action behind it. A post is a public statement in the company's name.
 *
 * ⚠️ A PUBLISHED POST IS VALIDATED ON EVERY SAVE, not only when it is first
 * published. Editing a live article is publishing it again; letting "Update"
 * skip the checks "Publish" runs would be the way around them.
 */

/** "save" keeps the post's status; the other two change it. */
export type SaveIntent = "save" | "publish" | "unpublish";

export interface SaveResult {
  ok: boolean;
  id?: string;
  status?: PostStatus;
  /** Everything wrong, in words, when the save was refused. */
  problems?: string[];
}

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * After any write: the site's cached post list, and every page drawn from it.
 * `updateTag` expires the list now (this request reads its own write);
 * `revalidatePath` on the root layout re-renders the static pages built from
 * it — the blog, the landing section, the sitemap, the feeds, the skill
 * pages' "From the blog". Heavy, and fine: posts change a few times a month.
 */
function refreshSite() {
  updateTag(BLOG_TAG);
  revalidatePath("/", "layout");
}

export async function savePost(id: string | null, form: Partial<PostForm>, intent: SaveIntent): Promise<SaveResult> {
  const { user } = await requireSuperAdmin();
  if (id !== null && !UUID.test(id)) return { ok: false, problems: ["Unknown post."] };

  const admin = createAdminClient();
  const post = formToPost(form);

  const { data: others, error: listErr } = await admin.from("blog_posts").select("id, slug, status");
  if (listErr) return { ok: false, problems: [`Could not read the blog: ${listErr.message}`] };
  const current = id ? others?.find((r) => r.id === id) : undefined;
  if (id && !current) return { ok: false, problems: ["This post no longer exists."] };

  const status: PostStatus =
    intent === "publish" ? "published" : intent === "unpublish" ? "draft" : ((current?.status as PostStatus) ?? "draft");

  const otherSlugs = (others ?? []).filter((r) => r.id !== id).map((r) => r.slug as string);
  const problems = status === "published" ? publishProblems(post, otherSlugs) : draftProblems(post);
  if (otherSlugs.includes(post.slug)) problems.unshift(`Another post already uses the slug "${post.slug}".`);
  if (problems.length) return { ok: false, problems };

  /* At most one lead story — a unique index holds it, so the old one is
     cleared first. Not atomic with the save below; the worst case is a moment
     with no lead, when the newest post leads instead. */
  if (post.featured) {
    const clear = admin.from("blog_posts").update({ featured: false }).eq("featured", true);
    const { error } = await (id ? clear.neq("id", id) : clear);
    if (error) return { ok: false, problems: [`Could not move the lead story: ${error.message}`] };
  }

  const row = { ...postToRow(post), status };
  /* ⚠️ `.select()` AFTER EVERY WRITE: an update that matches no row reports
     success with nothing written, and only the returned rows say whether it
     happened. */
  const write = id
    ? admin.from("blog_posts").update(row).eq("id", id).select("id")
    : admin.from("blog_posts").insert(row).select("id");
  const { data, error } = await write;
  if (isMissingColumn(error)) {
    return { ok: false, problems: ["The database is missing the keywords column — apply migration 20261006130000_blog_keywords_and_images.sql in the Supabase SQL editor, then save again."] };
  }
  if (error || !data?.length) return { ok: false, problems: [`Could not save: ${error?.message ?? "no row written"}`] };
  const savedId = data[0].id as string;

  if (status !== current?.status && (status === "published" || current?.status === "published")) {
    await recordAdminAction({
      action: status === "published" ? "blog.publish" : "blog.unpublish",
      targetKind: "platform",
      targetId: savedId,
      targetLabel: post.title,
      detail: { slug: post.slug },
      actor: { id: user.id, email: user.email },
    });
  }

  refreshSite();
  revalidatePath("/admin/blog");
  return { ok: true, id: savedId, status };
}

export async function deletePost(id: string): Promise<SaveResult> {
  const { user } = await requireSuperAdmin();
  if (!UUID.test(id)) return { ok: false, problems: ["Unknown post."] };

  const { data, error } = await createAdminClient()
    .from("blog_posts")
    .delete()
    .eq("id", id)
    .select("id, slug, title, status");
  if (error || !data?.length) return { ok: false, problems: [`Could not delete: ${error?.message ?? "no such post"}`] };

  await recordAdminAction({
    action: "blog.delete",
    targetKind: "platform",
    targetId: id,
    targetLabel: data[0].title as string,
    detail: { slug: data[0].slug, was: data[0].status },
    actor: { id: user.id, email: user.email },
  });

  refreshSite();
  revalidatePath("/admin/blog");
  return { ok: true };
}
