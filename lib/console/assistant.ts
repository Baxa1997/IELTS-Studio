import "server-only";

import { canManagePeople, type Profile } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { loadMarkingQueue } from "@/lib/console/marking";
import { phoneKey } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";

/**
 * What the console assistant is allowed to know, and what it is allowed to
 * offer to do.
 *
 * TWO RULES HOLD THIS TOGETHER.
 *
 * 1. THE MODEL NEVER TOUCHES THE DATABASE. It receives a snapshot of facts and
 *    returns prose plus, at most, a PROPOSAL naming an action from the list
 *    below. Running it is a separate, deliberate step behind a Confirm button,
 *    and the server re-checks the caller's role and re-resolves every id inside
 *    their own org before anything happens. A model that misreads a sentence
 *    therefore produces a wrong SUGGESTION, never a wrong write.
 *
 * 2. THE SNAPSHOT IS BUILT THROUGH RLS. Every query below runs on the caller's
 *    own client, so a teacher's snapshot contains their groups and a
 *    center_admin's contains the centre — the same boundary the pages enforce.
 *    Nothing here widens it, and no organisation id is ever taken from the
 *    request.
 */

export interface CentreSnapshot {
  role: string;
  centreName: string;
  /** Rendered into the prompt. Deliberately prose, not JSON: the model reads it
   *  better, and it keeps ids out of the text the model might echo back. */
  text: string;
  /** Name → id, resolved server-side when a proposal is confirmed. Never sent
   *  to the model. */
  groupIds: Map<string, string>;
}

const MAX_GROUPS = 25;

export async function loadCentreSnapshot(profile: Profile): Promise<CentreSnapshot> {
  const supabase = await createClient();
  const isAdmin = canManagePeople(profile.role);

  const [{ groups }, marking, orgRes] = await Promise.all([
    loadGroups(profile),
    loadMarkingQueue(profile),
    supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
  ]);

  const shown = groups.slice(0, MAX_GROUPS);
  const groupIds = new Map(shown.map((g) => [g.name.toLowerCase(), g.id]));

  // Phone coverage per class, because it is the single reason the Telegram
  // sign-in flow fails and the question a teacher asks it most ("why did
  // nobody get their login?").
  const memberPhones = new Map<string, { total: number; withPhone: number }>();
  if (shown.length > 0) {
    const { data: members } = await supabase
      .from("group_members")
      .select("group_id, student_id")
      .in(
        "group_id",
        shown.map((g) => g.id),
      );
    const ids = [...new Set((members ?? []).map((m) => m.student_id as string))];
    const { data: people } =
      ids.length > 0
        ? await supabase.from("profiles").select("id, phone").in("id", ids)
        : { data: [] as { id: string; phone: string | null }[] };
    const hasPhone = new Set(
      ((people ?? []) as { id: string; phone: string | null }[])
        .filter((p) => phoneKey(p.phone) != null)
        .map((p) => p.id),
    );
    for (const m of (members ?? []) as { group_id: string; student_id: string }[]) {
      const row = memberPhones.get(m.group_id) ?? { total: 0, withPhone: 0 };
      row.total += 1;
      if (hasPhone.has(m.student_id)) row.withPhone += 1;
      memberPhones.set(m.group_id, row);
    }
  }

  const lines: string[] = [];
  lines.push(`CENTRE: ${(orgRes.data?.name as string | null) ?? "this centre"}`);
  lines.push(`YOU ARE TALKING TO: a ${profile.role.replace("_", " ")}`);
  lines.push("");

  lines.push(`CLASSES (${groups.length}${groups.length > MAX_GROUPS ? `, showing ${MAX_GROUPS}` : ""}):`);
  if (shown.length === 0) {
    lines.push("  none yet");
  } else {
    for (const g of shown) {
      const p = memberPhones.get(g.id);
      const phoneNote =
        p && p.total > 0
          ? p.withPhone === p.total
            ? "all have a phone on file"
            : `${p.withPhone} of ${p.total} have a phone on file`
          : "nobody enrolled";
      lines.push(
        `  • ${g.name} — ${g.memberCount} student${g.memberCount === 1 ? "" : "s"}` +
          `${g.teacherName ? `, taught by ${g.teacherName}` : ", no teacher assigned"}` +
          `${g.status !== "active" ? `, ${g.status}` : ""} — ${phoneNote}`,
      );
    }
  }
  lines.push("");
  lines.push(
    marking.length > 0
      ? `MARKING WAITING: ${marking.length} piece${marking.length === 1 ? "" : "s"} of work graded by the model and not yet signed off.`
      : "MARKING WAITING: nothing.",
  );

  if (!isAdmin) {
    lines.push("");
    lines.push(
      "NOTE: this person is a teacher. They see only their own classes, and cannot see money, payroll or other teachers' groups.",
    );
  }

  return {
    role: profile.role,
    centreName: (orgRes.data?.name as string | null) ?? "this centre",
    text: lines.join("\n"),
    groupIds,
  };
}

/* ── what it may offer to do ───────────────────────────────────────────────
   Small on purpose. Each entry is something that is safe to get WRONG once,
   because a human reads the proposal first and the worst case is a message
   nobody needed. Password resets, removals and anything that deletes are
   deliberately absent: those are one confirm away from being irreversible, and
   the row's own Manage menu is the right place for them. */

export interface ActionSpec {
  id: string;
  /** Shown on the confirm button. */
  verb: string;
  /** What the model is told this does. */
  describe: string;
  /** Which roles may run it at all — re-checked server-side on confirm. */
  roles: readonly string[];
  /** Named arguments the model must supply. */
  args: readonly string[];
}

export const ACTIONS: readonly ActionSpec[] = [
  {
    id: "invite_class_telegram",
    verb: "Invite the class",
    describe:
      "Post the sign-in invite to a class's Telegram channel, so every student can collect their own login. Needs a connected channel and phone numbers on the roster. Argument: group (the class name, exactly as listed).",
    roles: ["center_admin", "teacher", "administrator"],
    args: ["group"],
  },
] as const;

/* ONE ACTION IN v1, DELIBERATELY. The shape being proven here is
   propose → confirm → re-validate → run, not the size of the menu; a second
   half-wired action would prove it worse rather than twice.
   `remindNonSubmitters` was the obvious candidate and is not here for a
   concrete reason: it needs a specific assignment and an explicit student
   list, which a class name cannot supply — so the model would have had to
   guess at exactly the point where guessing sends real messages to real
   students. Actions that take only a class id are the ones that fit this
   pattern cleanly. */

export function actionById(id: string): ActionSpec | null {
  return ACTIONS.find((a) => a.id === id) ?? null;
}
