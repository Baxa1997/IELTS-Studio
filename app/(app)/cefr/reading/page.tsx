import { redirect } from "next/navigation";

/**
 * The CEFR Reading launcher is now folded into the unified hub (one level pick, a
 * Writing/Reading toggle, the reading generator inline). This route just forwards
 * there, preserving any chosen level.
 */
export default async function CefrReadingPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const sp = await searchParams;
  const level = typeof sp.level === "string" ? `&level=${encodeURIComponent(sp.level)}` : "";
  redirect(`/cefr?skill=reading${level}`);
}
