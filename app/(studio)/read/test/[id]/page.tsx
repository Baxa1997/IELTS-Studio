import { redirect } from "next/navigation";

import { requireOrgUser, roleHome } from "@/lib/auth";
import type { ReadingQuestionType } from "@/lib/reading/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import type { DeliveredQuestion } from "../../_shared/question-inputs";
import { ReadingTestRunner, type TestPassage } from "./test-runner";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * The full reading-test runner: 3 passages + ~40 questions. Students only.
 *
 * The test + its passages load through the RLS client (served only if approved and
 * in the student's org). Questions live in a table students CANNOT read (it holds
 * the answer keys), so we load them with the service-role client and project an
 * ANSWER-FREE shape — no key/proof/explanation reaches the browser until submit.
 */
export default async function ReadingTestPage({ params }: PageProps) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect(roleHome(profile.role));
  const { id } = await params;

  const supabase = await createClient();
  const { data: test } = await supabase
    .from("reading_tests")
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (!test) redirect("/read"); // hidden/rejected/cross-tenant → not available

  const { data: passages } = await supabase
    .from("reading_passages")
    .select("id, title, body, topic, order_in_test")
    .eq("test_id", id)
    .order("order_in_test", { ascending: true });
  if (!passages || passages.length === 0) redirect("/read");

  const admin = createAdminClient();
  const { data: questions } = await admin
    .from("reading_questions")
    .select("id, question_type, order_index, prompt, options, passage_id") // answer-free
    .in("passage_id", passages.map((p) => p.id as string))
    .eq("organization_id", profile.organization_id)
    .order("order_index", { ascending: true });

  const byPassage = new Map<string, DeliveredQuestion[]>();
  for (const q of questions ?? []) {
    const pid = q.passage_id as string;
    const list = byPassage.get(pid) ?? [];
    list.push({
      id: q.id as string,
      question_type: q.question_type as ReadingQuestionType,
      order_index: q.order_index as number,
      prompt: (q.prompt as string) ?? "",
      options: (q.options as string[] | null) ?? null,
    });
    byPassage.set(pid, list);
  }

  const testPassages: TestPassage[] = passages
    .map((p, i) => ({
      id: p.id as string,
      order: (p.order_in_test as number | null) ?? i + 1,
      title: (p.title as string) ?? "",
      body: (p.body as string) ?? "",
      topic: (p.topic as string | null) ?? null,
      questions: (byPassage.get(p.id as string) ?? []).sort((a, b) => a.order_index - b.order_index),
    }))
    .filter((p) => p.questions.length > 0);

  if (testPassages.length === 0) redirect("/read");

  // Full-screen, no sidebar — the focused exam experience.
  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(180deg,#FBFAF3,#F3F1E5)" }}>
      <ReadingTestRunner testId={id} passages={testPassages} />
    </div>
  );
}
