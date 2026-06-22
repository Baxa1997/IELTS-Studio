import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { isCefrLevel, type CefrLevel } from "@/lib/cefr/levels";
import { loadStudyPlan } from "@/lib/plan/service";

import { CefrWriting } from "./cefr-writing";

export const dynamic = "force-dynamic";

/**
 * CEFR Writing practice — pick a level + task, write, and get a CEFR-level grade
 * with four-subscale feedback (the distinct CEFR track, not IELTS bands). Students
 * only; renders inside the (app) shell.
 */
export default async function CefrWritingPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; task?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const plan = await loadStudyPlan(profile.id);
  if (!plan) return null;

  const sp = await searchParams;
  const level: CefrLevel = sp.level && isCefrLevel(sp.level) ? sp.level : "B1";
  const taskId = typeof sp.task === "string" ? sp.task : null;

  return <CefrWriting initialLevel={level} initialTaskId={taskId} />;
}
