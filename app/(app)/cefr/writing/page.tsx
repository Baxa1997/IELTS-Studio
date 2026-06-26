import { redirect } from "next/navigation";

/**
 * The CEFR Writing launcher is now folded into the unified hub (one level pick, a
 * Writing/Reading toggle, tasks inline). This route just forwards there, preserving
 * any chosen level. The graded-feedback view still lives at /cefr/writing/[id].
 */
export default async function CefrWritingPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const sp = await searchParams;
  const level = typeof sp.level === "string" ? `&level=${encodeURIComponent(sp.level)}` : "";
  redirect(`/cefr?skill=writing${level}`);
}
