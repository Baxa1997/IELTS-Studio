"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { notifyAssignmentTelegram } from "@/lib/telegram/send";

/**
 * What a teacher does to a lesson after reading it.
 *
 * Every write goes through the RLS client and every one of them ends in
 * `.select()`. That is not decoration: an UPDATE the policy filters out reports
 * success with zero rows touched, so without it "Published" would appear on
 * screen for a lesson that never changed — the exact silent-failure this schema
 * has bitten us with before.
 */

export interface LessonActionState {
  error?: string;
  ok?: string;
}

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function refresh(id: string): void {
  revalidatePath(`/console/practice-ai/${id}`);
  revalidatePath("/console/practice-ai");
}

export async function setLessonStatus(
  _prev: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher") return { error: "Only a teacher can change a lesson." };

  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id) return { error: "Nothing to change." };
  if (!["draft", "published", "archived"].includes(status)) {
    return { error: "That is not a valid state." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .update({ status })
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "That lesson isn't yours to change." };

  refresh(id);
  return {
    ok:
      status === "published"
        ? "Published — you can set it to a class now."
        : status === "archived"
          ? "Archived. Anyone who already did it keeps their result."
          : "Back to draft.",
  };
}

/**
 * Turn the public link on or off.
 *
 * The token is minted once and kept, so switching sharing off and on again does
 * not silently break a link a teacher already sent to thirty people. Rotating
 * is a separate, explicit act — see `rotateShareLink`.
 */
export async function setLessonSharing(
  _prev: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher") return { error: "Only a teacher can share a lesson." };

  const id = str(formData, "id");
  const enable = str(formData, "enable") === "on";
  if (!id) return { error: "Nothing to share." };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("lessons")
    .select("share_token, status")
    .eq("id", id)
    .maybeSingle();
  if (!existing) return { error: "That lesson no longer exists." };

  if (enable && existing.status !== "published") {
    return { error: "Publish it first — a draft isn't ready to hand to anyone." };
  }

  const patch: Record<string, unknown> = { share_enabled: enable };
  if (enable && !existing.share_token) patch.share_token = newToken();

  const { data, error } = await supabase
    .from("lessons")
    .update(patch)
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "That lesson isn't yours to change." };

  refresh(id);
  return { ok: enable ? "Link is on. Anyone with it can do this lesson." : "Link is off." };
}

/** Mint a new token, killing every link already handed out. */
export async function rotateShareLink(
  _prev: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher") return { error: "Only a teacher can change a lesson." };

  const id = str(formData, "id");
  if (!id) return { error: "Nothing to change." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .update({ share_token: newToken() })
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "That lesson isn't yours to change." };

  refresh(id);
  return { ok: "New link created. Every old link has stopped working." };
}

/**
 * Set a lesson as homework for a class.
 *
 * This is the door that makes the whole thing work: a student can only reach
 * /learn/[id] because an assignment row exists (the RLS policy checks exactly
 * that), and it is also the "centre students only" gate for AI marking, since
 * groups exist only inside centres. One row grants both.
 *
 * Publishing first is required — a draft set to thirty people is a
 * half-finished lesson with your name on it.
 */
export async function assignLessonToGroup(
  _prev: LessonActionState,
  formData: FormData,
): Promise<LessonActionState> {
  const { profile } = await requireOrgUser();
  // Setting practice is a teaching decision, so it is the teacher's alone —
  // the same rule createAssignment follows for writing and reading.
  if (profile.role !== "teacher") {
    return { error: "Only a teacher can set practice for a class." };
  }

  const id = str(formData, "id");
  const groupIds = formData.getAll("group_id").map((v) => String(v)).filter(Boolean);
  if (!id) return { error: "Nothing to set." };
  if (groupIds.length === 0) return { error: "Choose at least one class." };

  const dueRaw = str(formData, "due_at");
  const dueAt = dueRaw ? new Date(dueRaw) : null;
  if (dueAt && Number.isNaN(dueAt.getTime())) return { error: "That due date isn't valid." };
  const instructions = str(formData, "instructions") || null;

  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, status")
    .eq("id", id)
    .maybeSingle();
  if (!lesson) return { error: "That lesson no longer exists." };
  if (lesson.status !== "published") {
    return { error: "Publish it first — a draft isn't ready to set to a class." };
  }

  // RLS hides other teachers' groups, so reading them back IS the permission
  // check: anything that comes back is a class this teacher may set work for.
  const { data: groups } = await supabase
    .from("groups")
    .select("id, name")
    .in("id", groupIds);
  const allowed = groups ?? [];
  if (allowed.length === 0) return { error: "Those classes aren't yours to set work for." };

  // Skip classes that already have it rather than stacking duplicates — a
  // teacher pressing the button twice means "make sure it is set", not "set it
  // again".
  const { data: existing } = await supabase
    .from("assignments")
    .select("group_id")
    .eq("lesson_id", id)
    .in("group_id", allowed.map((g) => g.id as string));
  const already = new Set((existing ?? []).map((a) => a.group_id as string));
  const fresh = allowed.filter((g) => !already.has(g.id as string));

  if (fresh.length === 0) {
    refresh(id);
    return { ok: "Already set to those classes." };
  }

  const { data: created, error } = await supabase
    .from("assignments")
    .insert(
      fresh.map((g) => ({
        organization_id: profile.organization_id,
        group_id: g.id as string,
        kind: "lesson" as const,
        lesson_id: id,
        title: lesson.title as string,
        instructions,
        due_at: dueAt ? dueAt.toISOString() : null,
        created_by: profile.id,
      })),
    )
    .select("id");
  if (error) return { error: error.message };
  if (!created || created.length === 0) {
    return { error: "You do not have permission to set work for those classes." };
  }

  // ANNOUNCE IT WHERE THE CLASS ACTUALLY IS. Every other way of setting work —
  // the groups console, the practices console — has told the group's Telegram
  // channel since those were built. Practice AI grew its own assignment path
  // and was never wired to it, so a lesson set from here landed silently and a
  // teacher who had come to rely on the announcement assumed the assignment had
  // not worked.
  //
  // Failures are swallowed inside the notifier: a channel that has been deleted
  // must not undo an assignment that is already in the table.
  await notifyAssignmentTelegram({
    organizationId: profile.organization_id,
    groupIds: fresh.map((g) => g.id as string),
    kind: "lesson",
    title: lesson.title as string,
    siteUrl: serverEnv.outboundSiteUrl,
    note: instructions,
    dueAt: dueAt ? dueAt.toISOString() : null,
  });

  refresh(id);
  revalidatePath("/console/groups");
  for (const g of fresh) revalidatePath(`/console/groups/${g.id as string}`);
  const names = fresh.map((g) => g.name as string).join(", ");
  return { ok: `Set to ${names}. Students will see it in their assignments.` };
}

/** 128 bits, url-safe. Unguessable IS the security model of a no-login link. */
function newToken(): string {
  return randomBytes(16).toString("base64url");
}
