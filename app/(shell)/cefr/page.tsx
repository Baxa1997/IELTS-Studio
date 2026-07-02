import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";

import { MultilevelClient } from "./multilevel-client";

export const dynamic = "force-dynamic";

/**
 * CEFR practice hub. CEFR here IS the Uzbekistan Multilevel (State Testing Centre /
 * DTM) exam — a single B1→C1 sitting: a 5-part / 35-question Reading paper and a
 * 3-task Writing paper. Generation + grading run on the AI engine (browser-direct,
 * off Vercel's 60s cap), so this is a thin client that calls those endpoints with
 * the learner's Supabase token. Students only — the onboarding gate lives in the
 * layout. (The former A1–C2 level-ladder hub was retired in favour of this paper.)
 */
export default async function CefrPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  return <MultilevelClient />;
}
