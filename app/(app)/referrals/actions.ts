"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { applyToRefer } from "@/lib/referrals/service";

export interface ApplyState {
  error?: string;
  notice?: string;
}

/**
 * File a referral application for the signed-in account.
 *
 * The role check is deliberately absent: any account may apply, on any plan,
 * because approval is the gate rather than a tier. What is NOT absent is where
 * the identity comes from — `requireOrgUser()`, never the form. A profile_id in
 * the body would let anyone apply as anyone.
 */
export async function submitApplication(
  _prev: ApplyState,
  formData: FormData,
): Promise<ApplyState> {
  const { profile } = await requireOrgUser();

  const { error } = await applyToRefer({
    profileId: profile.id,
    organizationId: profile.organization_id,
    pitch: String(formData.get("pitch") ?? ""),
    audienceUrl: String(formData.get("audience_url") ?? "") || null,
  });

  if (error) return { error };
  revalidatePath("/referrals");
  return { notice: "Sent. We review applications by hand, so give us a day or two." };
}
