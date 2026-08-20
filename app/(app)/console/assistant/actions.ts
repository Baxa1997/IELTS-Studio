"use server";

import { requireOrgUser } from "@/lib/auth";
import { actionById } from "@/lib/console/assistant";
import { createClient } from "@/lib/supabase/server";

import { inviteGroupToTelegram } from "../groups/actions";

export interface RunState {
  ok?: string;
  error?: string;
}

/**
 * Run an action the assistant proposed.
 *
 * NOTHING THE MODEL SAID IS TRUSTED HERE. This re-derives the caller from the
 * session, re-checks the action against the allow-list, re-checks their role
 * against it, and re-resolves the class BY NAME through the RLS client — so an
 * id cannot be smuggled in, and a name belonging to another centre resolves to
 * nothing. The proposal is a suggestion that arrived over the wire, and this
 * treats it as untrusted input, because that is what it is.
 */
export async function runProposal(_prev: RunState, formData: FormData): Promise<RunState> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return { error: "Not allowed." };

  const spec = actionById(String(formData.get("action") ?? ""));
  if (!spec) return { error: "That action no longer exists." };
  if (!spec.roles.includes(profile.role)) return { error: "Your role cannot do that." };

  const groupName = String(formData.get("group") ?? "").trim();
  if (!groupName) return { error: "Which class?" };

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, name")
    .eq("organization_id", profile.organization_id)
    .ilike("name", groupName)
    .maybeSingle();
  if (!group) return { error: `I can't find a class called "${groupName}".` };

  if (spec.id === "invite_class_telegram") {
    const fd = new FormData();
    fd.set("group_id", group.id as string);
    const result = await inviteGroupToTelegram({}, fd);
    if (result.error) return { error: result.error };
    return {
      ok: result.posted
        ? `Invite posted to ${group.name}'s channel.`
        : `${group.name} has no Telegram channel connected, so nothing was posted — connect one first.`,
    };
  }

  return { error: "That action isn't wired up yet." };
}
