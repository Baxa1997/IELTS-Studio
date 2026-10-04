import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { relatedPosts } from "@/lib/blog";
import { loadPosts, rowToStored, STORED_COLUMNS } from "@/lib/blog/store";
import { requireSuperAdmin } from "@/lib/auth";
import { absoluteUrl } from "@/lib/seo";
import { createAdminClient } from "@/lib/supabase/admin";

import { ArticleView } from "../../_components/article-view";

/**
 * /blog/preview/[id] — a post exactly as it will publish, draft or not, for the
 * super_admin writing it in /admin/blog.
 *
 * UNDER /blog, NOT /admin, so it is drawn in the public site's frame by the
 * same `ArticleView` the real article uses — a preview inside the admin shell
 * would be a preview of a different page. Being under /blog makes it publicly
 * ROUTABLE (the proxy lets /blog through), so this page is its own gate:
 * `requireSuperAdmin()` before anything is read, and never indexed.
 *
 * By id, not slug: a draft's slug can change while it is written, and the
 * preview tab should keep showing the same post.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

export default async function BlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data } = await createAdminClient().from("blog_posts").select(STORED_COLUMNS).eq("id", id).maybeSingle();
  if (!data) notFound();
  const post = rowToStored(data);
  const published = await loadPosts();

  return (
    <div style={{ padding: "clamp(28px,4.5vw,56px) clamp(16px,4vw,28px) 72px" }}>
      <p
        role="note"
        style={{
          maxWidth: 720,
          margin: "0 auto 24px",
          fontSize: 13.5,
          fontWeight: 600,
          textAlign: "center",
        }}
      >
        {post.status === "published" ? "Preview of a published post." : "Draft preview — not published."}{" "}
        <a href={`/admin/blog/${post.id}`}>Back to the editor</a>
      </p>
      <ArticleView post={post} url={absoluteUrl(`/blog/${post.slug}`)} related={relatedPosts(published, post)} />
    </div>
  );
}
