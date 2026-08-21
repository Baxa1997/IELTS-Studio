"use server";

import { requireOrgUser } from "@/lib/auth";
import { actionById } from "@/lib/console/assistant";
import { loadGroups } from "@/lib/console/groups";
import { createClient } from "@/lib/supabase/server";

import { sendAnnouncement } from "../center-actions";
import {
  addStudentAccount,
  createAssignment,
  createGroup,
  inviteGroupToTelegram,
  moveMember,
  setGroupStatus,
  setStudentStatus,
} from "../groups/actions";

export interface RunState {
  ok?: string;
  error?: string;
}

/**
 * Run an action the assistant proposed.
 *
 * NOTHING THE MODEL SAID IS TRUSTED HERE, and that is the whole design. This
 * re-derives the caller from the session, re-checks the action against the
 * allow-list, re-checks their role against it, and re-resolves every class and
 * student BY NAME through the RLS client — so no id can be smuggled in, and a
 * name belonging to another centre resolves to nothing. Then it hands off to
 * the SAME server action the button on the page calls, which does its own
 * permission check again. The proposal is untrusted input that arrived over the
 * wire, because that is exactly what it is.
 */
export async function runProposal(_prev: RunState, formData: FormData): Promise<RunState> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return { error: "Not allowed." };

  const spec = actionById(String(formData.get("action") ?? ""));
  if (!spec) return { error: "That action no longer exists." };
  if (!spec.roles.includes(profile.role)) return { error: "Your role cannot do that." };

  const arg = (name: string) => String(formData.get(name) ?? "").trim();
  for (const a of spec.args) {
    if (a.required && !arg(a.name)) return { error: `Missing ${a.name}.` };
  }

  const supabase = await createClient();

  /** A class this person can actually reach, found by name. */
  const findGroup = async (name: string) => {
    const { data } = await supabase
      .from("groups")
      .select("id, name, organization_id")
      .eq("organization_id", profile.organization_id)
      .ilike("name", name)
      .maybeSingle();
    return data as { id: string; name: string } | null;
  };

  /** A student on one of this person's rosters, found by name. Scoped through
   *  group membership rather than a bare profile lookup: `profiles` is readable
   *  org-wide by staff, and a teacher must not move somebody else's student. */
  const findStudent = async (name: string) => {
    const { groups } = await loadGroups(profile, { include: "all" });
    const ids = groups.map((g) => g.id);
    if (ids.length === 0) return null;
    const { data: members } = await supabase
      .from("group_members")
      .select("student_id, group_id")
      .in("group_id", ids);
    const studentIds = [...new Set((members ?? []).map((m) => m.student_id as string))];
    if (studentIds.length === 0) return null;
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", studentIds)
      .ilike("full_name", name);
    const hit = (people ?? [])[0] as { id: string; full_name: string } | undefined;
    if (!hit) return null;
    const membership = (members ?? []).find((m) => m.student_id === hit.id);
    return { id: hit.id, name: hit.full_name, groupId: membership?.group_id as string };
  };

  const fd = new FormData();

  switch (spec.id) {
    case "invite_class_telegram": {
      const g = await findGroup(arg("group"));
      if (!g) return { error: notFound(arg("group")) };
      fd.set("group_id", g.id);
      const r = await inviteGroupToTelegram({}, fd);
      if (r.error) return { error: r.error };
      return {
        ok: r.posted
          ? `Invite posted to ${g.name}'s channel.`
          : `${g.name} has no Telegram channel connected, so nothing was posted — connect one first.`,
      };
    }

    case "add_student": {
      const g = await findGroup(arg("group"));
      if (!g) return { error: notFound(arg("group")) };
      fd.set("group_id", g.id);
      fd.set("full_name", arg("full_name"));
      if (arg("phone")) fd.set("phone", arg("phone"));
      const r = await addStudentAccount({}, fd);
      if (r.error) return { error: r.error };
      return { ok: `${arg("full_name")} added to ${g.name}. Their login is on the class roster.` };
    }

    case "assign_practice": {
      const g = await findGroup(arg("group"));
      if (!g) return { error: notFound(arg("group")) };
      fd.set("group_id", g.id);
      fd.set("kind", arg("skill"));
      if (arg("due")) fd.set("due_at", arg("due"));
      const r = await createAssignment({}, fd);
      if (r.error) return { error: r.error };
      return { ok: `${arg("skill")} practice set for ${g.name}.` };
    }

    case "move_student": {
      const s = await findStudent(arg("student"));
      if (!s) return { error: notFound(arg("student")) };
      const to = await findGroup(arg("to_group"));
      if (!to) return { error: notFound(arg("to_group")) };
      fd.set("student_id", s.id);
      fd.set("group_id", s.groupId);
      fd.set("to_group_id", to.id);
      const r = await moveMember({}, fd);
      if (r.error) return { error: r.error };
      return { ok: `${s.name} moved to ${to.name}.` };
    }

    case "mark_student_left": {
      const s = await findStudent(arg("student"));
      if (!s) return { error: notFound(arg("student")) };
      fd.set("student_id", s.id);
      fd.set("status", "left");
      if (arg("note")) fd.set("note", arg("note"));
      const r = await setStudentStatus({}, fd);
      if (r.error) return { error: r.error };
      return { ok: `${s.name} marked as left. Their history and balance are untouched.` };
    }

    case "send_announcement": {
      fd.set("subject", arg("subject"));
      fd.set("body", arg("body"));
      if (arg("group")) {
        const g = await findGroup(arg("group"));
        if (!g) return { error: notFound(arg("group")) };
        fd.set("audience", "group");
        fd.set("group_id", g.id);
      } else {
        fd.set("audience", "everyone");
      }
      const r = await sendAnnouncement({}, fd);
      if (r.error) return { error: r.error };
      return { ok: r.ok ?? "Announcement sent." };
    }

    case "create_group": {
      // A class must belong to a branch. One branch means there is nothing to
      // ask about; several means the model has to have named one, because
      // picking for them puts a class at the wrong site.
      const { branches, teachers } = await loadGroups(profile, { include: "all" });
      const named = arg("branch");
      const branch = named
        ? branches.find((b) => b.name.toLowerCase() === named.toLowerCase())
        : branches.length === 1
          ? branches[0]
          : null;
      if (!branch) {
        return {
          error:
            branches.length > 1
              ? `Which branch? This centre has ${branches.map((b) => b.name).join(", ")}.`
              : "This centre has no branch set up yet — add one in Settings first.",
        };
      }
      fd.set("name", arg("name"));
      fd.set("branch_id", branch.id);
      const teacherName = arg("teacher");
      if (teacherName) {
        const t = teachers.find(
          (x) => (x.name ?? "").toLowerCase() === teacherName.toLowerCase(),
        );
        if (!t) return { error: notFound(teacherName) };
        fd.set("teacher_id", t.id);
      }
      const r = await createGroup({}, fd);
      if (r.error) return { error: r.error };
      return { ok: `${arg("name")} created.` };
    }

    case "close_group":
    case "reopen_group": {
      const g = await findGroup(arg("group"));
      if (!g) return { error: notFound(arg("group")) };
      fd.set("group_id", g.id);
      fd.set("status", spec.id === "close_group" ? "closed" : "active");
      const r = await setGroupStatus({}, fd);
      if (r.error) return { error: r.error };
      return {
        ok:
          spec.id === "close_group"
            ? `${g.name} closed. Every report and invoice is kept.`
            : `${g.name} is open again.`,
      };
    }
  }

  return { error: "That action isn't wired up yet." };
}

function notFound(name: string): string {
  return `I can't find "${name}" — check the spelling, or do it from the page itself.`;
}
