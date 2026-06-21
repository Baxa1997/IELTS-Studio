import { redirect } from "next/navigation";

import { requireOrgUser, roleHome } from "@/lib/auth";
import type { ReadingQuestionType } from "@/lib/reading/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { ReadingRunner, type DeliveredQuestion, type RunnerPassage } from "./reading-runner";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * The reading runner for one passage. Students only.
 *
 * The passage is loaded through the RLS client, so it's served only if it's
 * approved and in the student's org (otherwise we bounce back to the picker). The
 * questions, however, live in a table students CANNOT read (it holds the answer
 * keys), so we load them with the service-role client and project an ANSWER-FREE
 * shape — no answer_key, supporting_sentence, or explanation reaches the browser
 * until they submit.
 */
export default async function ReadingRunnerPage({ params }: PageProps) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect(roleHome(profile.role));
  const { id } = await params;

  const supabase = await createClient();
  const { data: passage } = await supabase
    .from("reading_passages")
    .select("id, title, body, module, topic, difficulty")
    .eq("id", id)
    .maybeSingle();
  if (!passage) redirect("/read"); // hidden/rejected/cross-tenant → not available

  const admin = createAdminClient();
  const { data: questions } = await admin
    .from("reading_questions")
    .select("id, question_type, order_index, prompt, options") // deliberately answer-free
    .eq("passage_id", id)
    .eq("organization_id", profile.organization_id)
    .order("order_index", { ascending: true });

  if (!questions || questions.length === 0) redirect("/read");

  const delivered: DeliveredQuestion[] = questions.map((q) => ({
    id: q.id as string,
    question_type: q.question_type as ReadingQuestionType,
    order_index: q.order_index as number,
    prompt: (q.prompt as string) ?? "",
    options: (q.options as string[] | null) ?? null,
  }));

  // Full-screen, no sidebar — a focused single detail page for the actual reading.
  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(180deg,#FBFAF3,#F3F1E5)" }}>
      <ReadingRunner passage={passage as RunnerPassage} questions={delivered} />
    </div>
  );
}
