import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";

import { MultilevelClient } from "./multilevel-client";

export const dynamic = "force-dynamic";

/**
 * Multilevel (Uzbekistan DTM) practice hub — the third track, distinct from the
 * IELTS-band and CEFR(A1–C2) tracks. It assesses B1→C1 in one sitting: a 5-part /
 * 35-question Reading paper and a 3-task Writing paper. Generation + grading run
 * on the AI engine (browser-direct, off Vercel's 60s cap), so this is a thin
 * client that calls those endpoints with the learner's Supabase token. Students
 * only — the onboarding gate lives in the layout.
 */
export default async function MultilevelPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  return <MultilevelClient />;
}
