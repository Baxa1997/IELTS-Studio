import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { isCefrLevel, type CefrLevel } from "@/lib/cefr/levels";
import { loadStudyPlan } from "@/lib/plan/service";

import { CefrReading } from "./cefr-reading";

export const dynamic = "force-dynamic";

/**
 * CEFR Reading — pick a level and generate one short, level-graded passage with
 * comprehension questions, marked instantly and reported as a CEFR level. The
 * passage opens in the same reader as the IELTS practice (/read/[id]).
 */
export default async function CefrReadingPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const plan = await loadStudyPlan(profile.id);
  if (!plan) return null;

  const sp = await searchParams;
  const level: CefrLevel = sp.level && isCefrLevel(sp.level) ? sp.level : "B1";

  return <CefrReading initialLevel={level} />;
}
