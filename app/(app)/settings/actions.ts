"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hasPasswordLogin } from "@/lib/account/password";
import { deleteLearnerAccount } from "@/lib/account/delete";
import { DELETE_CONFIRMATION } from "@/lib/account/deletion-rules";
import { isHomeworkOnlyStudent, requireOrgUser, roleHome } from "@/lib/auth";
import { phoneKey } from "@/lib/phone";
import { saveStudyPlan } from "@/lib/plan/service";
import { studyPlanInputSchema, type StudyPlanInput } from "@/lib/plan/types";
import { createClient } from "@/lib/supabase/server";

export interface SettingsState {
  error?: string;
  ok?: string;
}

/** Solo learners only. Staff and center students never reach these actions. */
async function requireSoloLearner() {
  const { user, profile } = await requireOrgUser();
  if (profile.role !== "student") redirect(roleHome(profile.role));
  if (isHomeworkOnlyStudent(profile)) redirect("/assignments");
  return { user, profile };
}

const MAX_NAME = 80;

/** Name and phone. The sign-in email is not editable here. */
export async function saveProfileDetails(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { profile } = await requireSoloLearner();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!fullName) return { error: "Enter your name." };
  if (fullName.length > MAX_NAME)
    return { error: `Your name can be at most ${MAX_NAME} characters.` };
  if (phone && phoneKey(phone) == null) {
    return { error: "Enter a full phone number, for example +998 90 123 45 67." };
  }

  const supabase = await createClient();
  // `.select()` because an update RLS filters out reports success with no rows.
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", profile.id)
    .select("id");
  if (error || !data || data.length === 0) {
    if (error) console.error("[settings] profile update failed:", error.message);
    return { error: "Your details couldn't be saved. Try again in a moment." };
  }

  revalidatePath("/", "layout");
  return { ok: "Saved." };
}

/** Target band, current level and test date — the same plan onboarding sets. */
export async function saveStudyGoal(input: StudyPlanInput): Promise<SettingsState> {
  const { profile } = await requireSoloLearner();

  const parsed = studyPlanInputSchema.safeParse(input);
  if (!parsed.success) return { error: "Check your goal and try again." };
  const today = new Date().toISOString().slice(0, 10);
  if (parsed.data.examDate && parsed.data.examDate < today) {
    return { error: "Your test date is in the past — pick a future date or leave it blank." };
  }

  try {
    await saveStudyPlan(
      { studentId: profile.id, organizationId: profile.organization_id },
      parsed.data,
    );
  } catch (err) {
    console.error("[settings] study goal save failed:", err);
    return { error: "Your goal couldn't be saved. Try again in a moment." };
  }

  revalidatePath("/plan");
  revalidatePath("/dashboard");
  revalidatePath("/settings", "layout");
  return { ok: "Goal saved — your plan has been updated to match." };
}

/**
 * Delete this learner's account and everything in it, permanently.
 *
 * Three locks before anything happens: the password (a signed-in laptop is not
 * proof of who is sitting at it), the typed confirmation, and the database check
 * inside `deleteLearnerAccount` that this is a single-person personal workspace.
 */
export async function deleteMyAccount(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const { user, profile } = await requireSoloLearner();

  if (String(formData.get("confirmation") ?? "").trim() !== DELETE_CONFIRMATION) {
    return { error: `Type ${DELETE_CONFIRMATION} to confirm.` };
  }

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser || authUser.id !== user.id) {
    return { error: "Your session has expired. Sign in again first." };
  }

  if (hasPasswordLogin(authUser)) {
    const password = String(formData.get("password") ?? "");
    if (!password) return { error: "Enter your password." };
    if (!authUser.email) return { error: "This account's password can't be checked." };
    const { error: wrong } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password,
    });
    if (wrong) return { error: "That isn't your password." };
  }

  const result = await deleteLearnerAccount({
    userId: user.id,
    organizationId: profile.organization_id,
  });
  if (!result.ok) return { error: result.error };

  // The auth user is gone, so this can fail on the server; it still clears the
  // cookies, which is the part that matters.
  await supabase.auth.signOut().catch(() => undefined);
  redirect("/?account=deleted");
}
