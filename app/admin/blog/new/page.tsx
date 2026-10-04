import { PageTitle, Surface } from "@/app/admin/_components/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { emptyForm } from "@/lib/blog/form";

import { PostEditor } from "../_components/post-editor";
import { CATEGORY_OPTIONS, todayInTashkent } from "../_lib/editor-props";

export const dynamic = "force-dynamic";

/** A new post. It is a draft until "Publish" — nothing here is public. */
export default async function NewPostPage() {
  await requireSuperAdmin();
  return (
    <Surface>
      <PageTitle eyebrow="Blog" title="New post" subtitle="Saved as a draft until you publish it. Written in English, every word." />
      <PostEditor id={null} status="draft" initial={emptyForm(todayInTashkent())} categories={CATEGORY_OPTIONS} />
    </Surface>
  );
}
