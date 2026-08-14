"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

/** 128 bits, url-safe. Unguessable IS the security model of a no-login link. */
function newToken(): string {
  return randomBytes(16).toString("base64url");
}
