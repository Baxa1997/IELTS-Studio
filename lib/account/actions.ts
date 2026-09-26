"use server";

import { hasPasswordLogin, passwordChangeProblem } from "@/lib/account/password";
import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface PasswordState {
  error?: string;
  ok?: string;
}

/**
 * Change the signed-in person's own password. Shared by the console's
 * "My account" section and the learner's settings page.
 *
 * THE CURRENT PASSWORD IS CHECKED BY SIGNING IN WITH IT. A session alone is not
 * enough to change a password — a laptop left open in a classroom has a session.
 * Supabase has no "verify this password" call, so the check is a real sign-in as
 * the same user, which also gives `updateUser` the fresh session it wants if the
 * project ever turns on secure password change.
 *
 * Center accounts sign in with a synthetic address (login@students…); that is
 * still their auth email, so the same sign-in works for them.
 */
export async function changePassword(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const { user } = await requireOrgUser();

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser || authUser.id !== user.id) {
    return { error: "Your session has expired. Sign in again, then change your password." };
  }

  const needsCurrent = hasPasswordLogin(authUser);
  const current = needsCurrent ? String(formData.get("current") ?? "") : null;
  const next = String(formData.get("next") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  const problem = passwordChangeProblem({ current, next, confirmation });
  if (problem) return { error: problem };

  if (current !== null) {
    if (!authUser.email) {
      return { error: "This account has no sign-in address, so its password can't be checked." };
    }
    const { error: wrong } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: current,
    });
    // One message for every failure, including rate limiting: the form must not
    // become a way to learn anything about the password beyond "not that".
    if (wrong) return { error: "That isn't your current password." };
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) {
    console.error("[account] password change failed:", error.message);
    return { error: "Your password couldn't be changed. Try again in a moment." };
  }

  return {
    ok: needsCurrent
      ? "Password changed. Use the new one next time you sign in."
      : "Password set. You can now also sign in with your email and this password.",
  };
}
