import { redirect } from "next/navigation";

import { requireOrgUser, roleHome } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { parseFigure } from "@/lib/writing/figure";

import { WritingStudio, type ServedPrompt } from "../writing-studio";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * The writing editor ("inside") for one prompt. Students only.
 *
 * The prompt is loaded through the RLS client, so it's served only if it's
 * approved and in the learner's org (otherwise we bounce back to the library).
 *
 * Every open is a fresh, timed attempt — we never resume a prior draft. Leaving
 * the studio discards the unsubmitted draft (see the discard route), so coming
 * back always starts from a blank page. Past graded work lives in Activities.
 */
export default async function WriteStudioPage({ params }: PageProps) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect(roleHome(profile.role));
  const { id } = await params;

  const supabase = await createClient();
  const { data: p } = await supabase
    .from("writing_prompts")
    .select("id, task_type, prompt_text, figure, category, topic_family, difficulty")
    .eq("id", id)
    .maybeSingle();
  if (!p) redirect("/write"); // hidden / rejected / cross-tenant → not available

  const prompt: ServedPrompt = {
    id: p.id as string,
    task_type: p.task_type as ServedPrompt["task_type"],
    prompt_text: p.prompt_text as string,
    figure: parseFigure(p.figure), // Academic Task 1 only; null otherwise
    category: (p.category as string | null) ?? null,
    topic_family: (p.topic_family as string | null) ?? null,
    difficulty: (p.difficulty as number | null) ?? null,
  };

  // Full-screen, no sidebar — a focused single detail page for the actual writing.
  // Always a clean, timed attempt: no draft is resumed.
  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(180deg,#FBFAF3,#F3F1E5)" }}>
      <WritingStudio prompt={prompt} essayId={null} initialContent="" resumed={false} />
    </div>
  );
}
