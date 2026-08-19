"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createStudentInvite } from "@/lib/telegram/student";

export interface InviteState {
  error?: string;
  ok?: string;
  url?: string;
  code?: string;
}

/**
 * Mint the link that binds a student's Telegram.
 *
 * STAFF ONLY, AND ONLY FOR THEIR OWN STUDENTS. The code this returns is the
 * authority to receive that student's sign-in details, so who may create one is
 * the whole security question. A center_admin may do it for anyone in the
 * centre; a teacher only for a learner in a group they manage — proved by
 * reading `group_members` under RLS, which returns nothing for a group they do
 * not manage, exactly as the student report page does it.
 */
export async function createTelegramInvite(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return { error: "Not allowed." };

  const studentId = String(formData.get("student_id") ?? "").trim();
  if (!studentId) return { error: "No student given." };

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, organization_id")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) return { error: "That student no longer exists." };

  if (profile.role === "teacher") {
    const { data: shared } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("student_id", studentId)
      .limit(1);
    if (!shared || shared.length === 0) {
      return { error: "That student isn't in a group you manage." };
    }
  }

  if (!process.env.TELEGRAM_BOT_USERNAME) {
    return { error: "The Telegram bot isn't configured for this environment yet." };
  }

  const invite = await createStudentInvite({
    organizationId: student.organization_id as string,
    profileId: studentId,
  });

  revalidatePath(`/console/students/${studentId}`);
  return {
    ok: "Link ready — send it to the student. It works for 7 days.",
    url: invite.url ?? undefined,
    code: invite.code,
  };
}
