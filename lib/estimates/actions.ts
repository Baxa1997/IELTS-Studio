"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { MAX_TARGET_BAND, MIN_TARGET_BAND, SKILLS, type Skill } from "@/lib/estimates/compute";
import { createAdminClient } from "@/lib/supabase/admin";

export interface SetTargetResult {
  error?: string;
  targetBand?: number;
}

/**
 * A student sets their own target band for a skill. Routed through the server
 * (service_role) so it can upsert the estimate row without granting students a
 * direct write to skill_estimates — current_band/baseline_band stay tamper-proof,
 * and a target can be set even before the skill has been measured.
 */
export async function setTargetBand(skill: Skill, band: number): Promise<SetTargetResult> {
  const session = await getSession();
  if (!session?.profile) return { error: "You are not signed in." };
  if (session.profile.role !== "student") return { error: "Only students set a target." };
  if (!SKILLS.includes(skill)) return { error: "Unknown skill." };

  const target = Math.round(band * 2) / 2; // snap to the 0.5 grid
  if (!(target >= MIN_TARGET_BAND && target <= MAX_TARGET_BAND)) {
    return { error: `Pick a target between ${MIN_TARGET_BAND.toFixed(1)} and ${MAX_TARGET_BAND.toFixed(1)}.` };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("skill_estimates").upsert(
    {
      student_id: session.profile.id,
      organization_id: session.profile.organization_id,
      skill,
      target_band: target,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "student_id,skill" },
  );
  if (error) return { error: "Couldn't save your target. Please try again." };

  revalidatePath("/dashboard");
  revalidatePath("/diagnostic");
  return { targetBand: target };
}
