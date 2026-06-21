"use server";

import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { recordLevelCheck } from "@/lib/plan/service";

/**
 * Start an explicit level re-check: record it (which reschedules the next check by
 * the current cadence) and send the learner to a fresh task — submitting it rolls
 * the conservative estimate forward.
 */
export async function startLevelCheck(): Promise<void> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  await recordLevelCheck(profile.id);
  redirect("/write");
}
