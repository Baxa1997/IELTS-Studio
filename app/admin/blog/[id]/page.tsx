import { notFound } from "next/navigation";

import { Surface } from "@/app/admin/_components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { postToForm } from "@/lib/blog/form";
import { absoluteUrl } from "@/lib/seo";

import { PostEditor } from "../_components/post-editor";
import { CATEGORY_OPTIONS } from "../_lib/editor-props";
import { getStoredPost } from "../_lib/posts";

export const dynamic = "force-dynamic";

/** One post in the editor — draft or published. */
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperAdmin();
  const post = await getStoredPost((await params).id);
  if (!post) notFound();
  return (
    <Surface>
      <PostEditor
        id={post.id}
        status={post.status}
        initial={postToForm(post)}
        categories={CATEGORY_OPTIONS}
        blogUrl={absoluteUrl("/blog")}
      />
    </Surface>
  );
}
