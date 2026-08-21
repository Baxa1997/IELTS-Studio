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
  /** Lower-cased class names this person can see. A proposal naming anything
   *  else is refused before it reaches the screen. Ids are NOT kept here and
   *  never travel: the confirm step re-resolves the name through RLS, so the
   *  only thing that can be acted on is something they could already reach. */
  groupIds: Map<string, string>;
  /** Lower-cased student names, same purpose. */
  studentNames: Set<string>;
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
  const roster = new Map<string, string[]>();
  const studentNames = new Set<string>();
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
        ? await supabase.from("profiles").select("id, full_name, phone").in("id", ids)
        : { data: [] as { id: string; full_name: string | null; phone: string | null }[] };
    const person = new Map(
      ((people ?? []) as { id: string; full_name: string | null; phone: string | null }[]).map(
        (p) => [p.id, p],
      ),
    );
    const hasPhone = new Set(
      [...person.values()].filter((p) => phoneKey(p.phone) != null).map((p) => p.id),
    );
    const byGroup = new Map(shown.map((g) => [g.id, g.name]));
    for (const m of (members ?? []) as { group_id: string; student_id: string }[]) {
      const row = memberPhones.get(m.group_id) ?? { total: 0, withPhone: 0 };
      row.total += 1;
      if (hasPhone.has(m.student_id)) row.withPhone += 1;
      memberPhones.set(m.group_id, row);

      // NAMES, because the assistant cannot be asked to move somebody it has
      // never heard of — and a name it has not seen is refused, which is what
      // stops a misheard one turning into an action on the wrong person.
      const who = person.get(m.student_id);
      const name = who?.full_name?.trim();
      if (!name) continue;
      studentNames.add(name.toLowerCase());
      const list = roster.get(byGroup.get(m.group_id) ?? "") ?? [];
      if (list.length < 40) {
        list.push(`${name}${hasPhone.has(m.student_id) ? "" : " (no phone)"}`);
      }
      roster.set(byGroup.get(m.group_id) ?? "", list);
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
      const names = roster.get(g.name);
      if (names && names.length > 0) lines.push(`      ${names.join(", ")}`);
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

  if (isAdmin) {
    const { data: staff } = await supabase
      .from("profiles")
      .select("full_name, role")
      .in("role", ["teacher", "administrator"]);
    const teachers = ((staff ?? []) as { full_name: string | null; role: string }[])
      .map((t) => `${t.full_name ?? "—"} (${t.role})`)
      .slice(0, 30);
    lines.push("");
    lines.push(`STAFF: ${teachers.length > 0 ? teachers.join(", ") : "nobody but you"}`);
  }

  return {
    role: profile.role,
    centreName: (orgRes.data?.name as string | null) ?? "this centre",
    text: lines.join("\n"),
    groupIds,
    studentNames,
  };
}

/* ── what it may offer to do ───────────────────────────────────────────────

   THE LINE THIS LIST IS DRAWN ON. Everything here is something a person can
   look at, understand and undo — or at worst, something whose worst case is a
   message nobody needed. Deleting a group, deleting an assignment, resetting a
   password and importing a spreadsheet of accounts are deliberately absent:
   each is one confirm away from being irreversible, and each already has a
   purpose-built screen where the consequences are spelled out in context. An
   assistant that can undo nothing should not be the fastest route to the
   things that cannot be undone. */

export type ArgKind = "group" | "student" | "text" | "choice" | "date";

export interface ArgSpec {
  name: string;
  kind: ArgKind;
  /** What the model is told to put here. */
  describe: string;
  required?: boolean;
  choices?: readonly string[];
}

export interface ActionSpec {
  id: string;
  /** Shown on the confirm button. */
  verb: string;
  /** What the model is told this does. */
  describe: string;
  /** Which roles may run it — re-checked server-side on confirm. */
  roles: readonly string[];
  args: readonly ArgSpec[];
}

const STAFF = ["center_admin", "teacher", "administrator"] as const;
const OWNER = ["center_admin"] as const;
const TEACHING = ["center_admin", "teacher"] as const;

export const ACTIONS: readonly ActionSpec[] = [
  {
    id: "invite_class_telegram",
    verb: "Invite the class",
    describe:
      "Post the sign-in invite to a class's Telegram channel so every student can collect their own login. Needs a connected channel and phone numbers on the roster.",
    roles: STAFF,
    args: [{ name: "group", kind: "group", describe: "the class name", required: true }],
  },
  {
    id: "add_student",
    verb: "Add the student",
    describe:
      "Create an account for one new student and put them in a class. A login and password are generated; give the phone number and they can collect them from Telegram themselves.",
    roles: TEACHING,
    args: [
      { name: "group", kind: "group", describe: "the class they join", required: true },
      { name: "full_name", kind: "text", describe: "their full name", required: true },
      { name: "phone", kind: "text", describe: "their phone number, if it was given" },
    ],
  },
  {
    id: "assign_practice",
    verb: "Assign it",
    describe:
      "Set a class a fresh piece of practice. Writing generates a new Task 2 prompt; reading pins a shared library test. Everyone gets identical content.",
    roles: TEACHING,
    args: [
      { name: "group", kind: "group", describe: "the class", required: true },
      {
        name: "skill",
        kind: "choice",
        describe: "which skill",
        choices: ["writing", "reading"],
        required: true,
      },
      { name: "due", kind: "date", describe: "due date as YYYY-MM-DD, if one was asked for" },
    ],
  },
  {
    id: "move_student",
    verb: "Move them",
    describe:
      "Move one student from the class they are in into another. They keep every mark, register and invoice.",
    roles: TEACHING,
    args: [
      { name: "student", kind: "student", describe: "the student's name", required: true },
      { name: "to_group", kind: "group", describe: "the class they move to", required: true },
    ],
  },
  {
    id: "mark_student_left",
    verb: "Mark as left",
    describe:
      "Record that a student has stopped coming. They stay on the roster with their history and balance intact, and invoicing stops. This is almost always what is meant by removing somebody.",
    roles: TEACHING,
    args: [
      { name: "student", kind: "student", describe: "the student's name", required: true },
      { name: "note", kind: "text", describe: "why, for whoever asks later" },
    ],
  },
  {
    id: "send_announcement",
    verb: "Send it",
    describe:
      "Send an announcement to a class, or to the whole centre when no class is named.",
    roles: TEACHING,
    args: [
      { name: "subject", kind: "text", describe: "a short subject line", required: true },
      { name: "body", kind: "text", describe: "the message itself", required: true },
      { name: "group", kind: "group", describe: "the class, if it is for one class only" },
    ],
  },
  {
    id: "create_group",
    verb: "Create the class",
    describe: "Start a new class. Name it, and name the teacher if one was given.",
    roles: OWNER,
    args: [
      { name: "name", kind: "text", describe: "the class name", required: true },
      { name: "teacher", kind: "text", describe: "the teacher's name, if one was given" },
      { name: "branch", kind: "text", describe: "the branch, if the centre has more than one" },
    ],
  },
  {
    id: "close_group",
    verb: "Close the class",
    describe:
      "Close a class that has finished. Every report, band and invoice is kept; it leaves timetables and can no longer be set practice.",
    roles: OWNER,
    args: [{ name: "group", kind: "group", describe: "the class name", required: true }],
  },
  {
    id: "reopen_group",
    verb: "Reopen the class",
    describe: "Put a closed class back into service.",
    roles: OWNER,
    args: [{ name: "group", kind: "group", describe: "the class name", required: true }],
  },
] as const;

export function actionById(id: string): ActionSpec | null {
  return ACTIONS.find((a) => a.id === id) ?? null;
}

/** How the actions are described to the model: id, what it does, and exactly
 *  which arguments it must supply. */
export function describeActions(role: string): string {
  return ACTIONS.filter((a) => a.roles.includes(role))
    .map((a) => {
      const args = a.args
        .map((x) => `${x.name}${x.required ? "" : "?"}=<${x.describe}${x.choices ? `: ${x.choices.join("|")}` : ""}>`)
        .join(", ");
      return `  • ${a.id} — ${a.describe}\n    args: ${args}`;
    })
    .join("\n");
}

/* ── the gate between what the model said and what appears on screen ───────── */

export interface RawProposal {
  action: string;
  args: Record<string, unknown>;
  why: string;
}

export interface VettedProposal {
  action: string;
  verb: string;
  why: string;
  args: Record<string, string>;
}

/** What the vetting needs to know about the caller's world. Passed in rather
 *  than queried, so this stays pure and testable — it is the security boundary,
 *  and a boundary nobody can write a test against is a boundary nobody checks. */
export interface VetContext {
  role: string;
  groups: ReadonlySet<string>;
  students: ReadonlySet<string>;
}

/**
 * Turn what the model returned into at most one proposal that is safe to show.
 *
 * FAILS CLOSED, EVERY TIME. An unknown action id, an action this role may not
 * run, a missing required argument, a class or student not already visible to
 * this person, a choice outside its list — any of these drops the proposal
 * entirely. It never repairs, substitutes or guesses, because the repair a
 * model needs is exactly the one a person would not have asked for: showing a
 * button for the nearest class it could find is how the wrong class gets the
 * message.
 *
 * At most one, because a screenful of buttons is not a decision.
 */
export function vetProposals(raw: RawProposal[], ctx: VetContext): VettedProposal[] {
  const out: VettedProposal[] = [];
  for (const p of raw) {
    const spec = actionById(p.action);
    if (!spec || !spec.roles.includes(ctx.role)) continue;

    const args: Record<string, string> = {};
    let ok = true;
    for (const arg of spec.args) {
      const value = String(p.args?.[arg.name] ?? "").trim();
      if (!value) {
        if (arg.required) {
          ok = false;
          break;
        }
        continue;
      }
      if (arg.kind === "group" && !ctx.groups.has(value.toLowerCase())) {
        ok = false;
        break;
      }
      if (arg.kind === "student" && !ctx.students.has(value.toLowerCase())) {
        ok = false;
        break;
      }
      if (arg.kind === "choice" && !(arg.choices ?? []).includes(value)) {
        ok = false;
        break;
      }
      // A malformed date is dropped rather than fatal: "sometime next week" is
      // a fine thing to say and a bad thing to guess at, and the action treats
      // a missing due date as no deadline.
      if (arg.kind === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) continue;
      args[arg.name] = value.slice(0, 500);
    }
    if (!ok) continue;

    out.push({ action: spec.id, verb: spec.verb, why: String(p.why ?? "").slice(0, 300), args });
    if (out.length === 1) break;
  }
  return out;
}
