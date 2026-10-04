import Link from "next/link";

import {
  Card,
  CardHead,
  clip,
  Empty,
  FAINT,
  Notice,
  PageTitle,
  Pill,
  Surface,
  TableHead,
  TableRow,
} from "@/app/admin/_components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { CATEGORY_LABEL, formatPostDate } from "@/lib/blog";
import { en } from "@/lib/i18n/messages/en";
import { INDIGO_FILL, ON_INDIGO } from "@/lib/theme/tokens";

import { listStoredPosts } from "./_lib/posts";

export const dynamic = "force-dynamic";

/**
 * Every blog post, drafts included — the way into the editor.
 *
 * Posts are rows in `blog_posts` (lib/blog/store). Publishing one here puts it
 * on /blog, the landing page, the sitemap, the RSS feed and both llms files at
 * once, with no deploy; the editor refuses a post that would break any of the
 * rules a reader or a crawler depends on (lib/blog/validate).
 */
const COLS = "minmax(0,1fr) 110px 120px 130px";

export default async function AdminBlogPage() {
  await requireSuperAdmin();
  const { posts, error } = await listStoredPosts();

  return (
    <Surface>
      <PageTitle
        eyebrow="Platform"
        title="Blog"
        subtitle="Write, publish and edit the articles on /blog. Every article is written in English — the editor will not publish one that is not."
        actions={
          <Link
            href="/admin/blog/new"
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              padding: "10px 18px",
              borderRadius: 10,
              background: INDIGO_FILL,
              color: ON_INDIGO,
              textDecoration: "none",
            }}
          >
            New post
          </Link>
        }
      />

      {error ? (
        <Notice
          tone="amber"
          title="The blog table is not there yet"
          detail={
            <>
              Apply migration <code>20261004120000_blog_posts.sql</code> in the Supabase SQL editor. It creates
              the table and moves the existing articles into it. ({error})
            </>
          }
        />
      ) : null}

      <Card>
        <CardHead title="Posts" note="Newest first. The lead story is marked ★." />
        <TableHead cols={COLS}>
          <span>TITLE</span>
          <span>STATUS</span>
          <span>CATEGORY</span>
          <span>PUBLISHED</span>
        </TableHead>
        {posts.length === 0 ? <Empty>No posts yet.</Empty> : null}
        {posts.map((p) => (
          <TableRow key={p.id} cols={COLS} href={`/admin/blog/${p.id}`}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 500, ...clip }}>
                {p.featured ? "★ " : ""}
                {p.title || "Untitled"}
              </div>
              <div style={{ fontSize: 11.5, color: FAINT, ...clip }}>/blog/{p.slug}</div>
            </div>
            <span>
              <Pill tone={p.status === "published" ? "green" : "amber"}>
                {p.status === "published" ? "Published" : "Draft"}
              </Pill>
            </span>
            <span>{en[CATEGORY_LABEL[p.category]] ?? p.category}</span>
            <span>{p.published ? formatPostDate(p.published, "en-GB") : "—"}</span>
          </TableRow>
        ))}
      </Card>
    </Surface>
  );
}
