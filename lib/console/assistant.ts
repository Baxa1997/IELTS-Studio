import "server-only";

import { canManagePeople, type Profile } from "@/lib/auth";
import { classAttendance } from "@/lib/console/attendance-marks";
import {
  describeDays,
  listDays,
  parseClockTime,
  parseWeekdays,
  trimTime,
} from "@/lib/console/timetable-days";
import { TASK2_CATEGORIES, TOPIC_FAMILIES } from "@/lib/prompts/constants";
import { loadGroups } from "@/lib/console/groups";
import { loadMarkingQueue } from "@/lib/console/marking";
import { loadDebtors, loadFinanceSettings } from "@/lib/finance/load";
import { loadPayrollHistory } from "@/lib/finance/payroll";
import { formatMoney } from "@/lib/finance/money";
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
  /** Lower-cased name → id, for building a link to somebody's own report. The
   *  id is resolved SERVER-SIDE and never shown to the model; it reaches the
   *  browser only inside a URL that RLS gates anyway. */
  studentIds: Map<string, string>;
}

const MAX_GROUPS = 25;

export async function loadCentreSnapshot(profile: Profile): Promise<CentreSnapshot> {
  const supabase = await createClient();
  const isAdmin = canManagePeople(profile.role);

  const [{ groups, branches, rooms }, marking, orgRes] = await Promise.all([
    loadGroups(profile),
    loadMarkingQueue(profile),
    supabase.from("organizations").select("name").eq("id", profile.organization_id).maybeSingle(),
  ]);

  const shown = groups.slice(0, MAX_GROUPS);
  const groupIds = new Map(shown.map((g) => [g.name.toLowerCase(), g.id]));

  /* WHEN EACH CLASS MEETS. Absent from the snapshot until now, so "when does 9A
     meet?" got "I can't see that from here" about the single most-asked fact in
     a centre — and, worse, the assistant could not tell that a class it had
     just created had no timetable at all. Read straight off `lesson_slots`
     rather than through `loadTimetable`, which pulls a whole week of grid data
     this does not need. No embeds: `lesson_slots` reaches rooms through a
     composite FK and PostgREST cannot resolve those (see lib/finance/names.ts). */
  const scheduleByGroup = new Map<string, string[]>();
  if (shown.length > 0) {
    const { data: slots } = await supabase
      .from("lesson_slots")
      .select("group_id, series_id, room_id, weekday, starts_at, ends_at")
      .in(
        "group_id",
        shown.map((g) => g.id),
      );
    const roomName = new Map(rooms.map((r) => [r.id, r.name]));
    // One line per BOOKING, not per day: a class running Tue+Wed at 08:00 and
    // again at 15:30 is two bookings, and flattening them into one day list
    // would describe a class that does not exist.
    const series = new Map<
      string,
      { group: string; days: number[]; from: string; to: string; room: string | null }
    >();
    for (const sl of (slots ?? []) as Record<string, unknown>[]) {
      const key = (sl.series_id as string | null) ?? `${sl.group_id}:${sl.starts_at}`;
      const row = series.get(key) ?? {
        group: sl.group_id as string,
        days: [],
        from: trimTime(String(sl.starts_at ?? "")),
        to: trimTime(String(sl.ends_at ?? "")),
        room: roomName.get(sl.room_id as string) ?? null,
      };
      row.days.push(Number(sl.weekday));
      series.set(key, row);
    }
    for (const row of series.values()) {
      const list = scheduleByGroup.get(row.group) ?? [];
      list.push(
        `${describeDays(row.days)} ${row.from}–${row.to}${row.room ? ` in ${row.room}` : ""}`,
      );
      scheduleByGroup.set(row.group, list);
    }
  }

  // Phone coverage per class, because it is the single reason the Telegram
  // sign-in flow fails and the question a teacher asks it most ("why did
  // nobody get their login?").
  const memberPhones = new Map<string, { total: number; withPhone: number }>();
  const roster = new Map<string, string[]>();
  const studentNames = new Set<string>();
  const studentIds = new Map<string, string>();
  /** group id → its members, so attendance and homework can be reported per
   *  class rather than as one centre-wide number nobody can act on. */
  const membersByGroup = new Map<string, string[]>();
  const nameOfStudent = new Map<string, string>();
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
      membersByGroup.set(m.group_id, [...(membersByGroup.get(m.group_id) ?? []), m.student_id]);

      // NAMES, because the assistant cannot be asked to move somebody it has
      // never heard of — and a name it has not seen is refused, which is what
      // stops a misheard one turning into an action on the wrong person.
      const who = person.get(m.student_id);
      const name = who?.full_name?.trim();
      if (!name) continue;
      studentNames.add(name.toLowerCase());
      studentIds.set(name.toLowerCase(), m.student_id);
      nameOfStudent.set(m.student_id, name);
      const list = roster.get(byGroup.get(m.group_id) ?? "") ?? [];
      if (list.length < 40) {
        list.push(`${name}${hasPhone.has(m.student_id) ? "" : " (no phone)"}`);
      }
      roster.set(byGroup.get(m.group_id) ?? "", list);
    }
  }

  const { data: subjectRows } = await supabase
    .from("subjects")
    .select("name")
    .eq("active", true)
    .order("name")
    .limit(30);
  const subjects = ((subjectRows ?? []) as { name: string }[]).map((r) => r.name);

  /* ── WHO IS TURNING UP ──────────────────────────────────────────────────
     "How is 9A's attendance?" and "who keeps missing?" were unanswerable:
     the snapshot knew who was enrolled and never whether any of them came.
     Both are daily questions in a centre, and the second one is the whole
     point of taking a register — an attendance record nobody can query is
     data entry for its own sake.

     `v_student_attendance` carries `sessions` and `attended` per student, so a
     class rate is a true sum over its members rather than an average of
     averages. It is security_invoker, so a teacher reads only their own. */
  const attendanceOf = new Map<string, { sessions: number; attended: number }>();
  const openRegisters: { group: string; on: string }[] = [];
  if (shown.length > 0) {
    const memberIds = [...new Set([...membersByGroup.values()].flat())];
    const since = new Date(Date.now() - 45 * 86_400_000).toISOString().slice(0, 10);
    const [rateRes, sessionRes] = await Promise.all([
      memberIds.length > 0
        ? supabase
            .from("v_student_attendance")
            .select("student_id, sessions, attended")
            .in("student_id", memberIds)
        : Promise.resolve({ data: [] }),
      // An unmarked register is the reason an attendance rate is wrong, so it
      // is reported as a fault rather than left to be inferred from a low
      // number. Recent only: a register from last term is not a to-do.
      supabase
        .from("attendance_sessions")
        .select("group_id, held_on, state")
        .in(
          "group_id",
          shown.map((g) => g.id),
        )
        .neq("state", "marked")
        .gte("held_on", since)
        .order("held_on", { ascending: false })
        .limit(20),
    ]);
    for (const r of (rateRes.data ?? []) as {
      student_id: string;
      sessions: number | null;
      attended: number | null;
    }[]) {
      attendanceOf.set(r.student_id, {
        sessions: Number(r.sessions ?? 0),
        attended: Number(r.attended ?? 0),
      });
    }
    const groupName = new Map(shown.map((g) => [g.id, g.name]));
    for (const sess of (sessionRes.data ?? []) as { group_id: string; held_on: string }[]) {
      const name = groupName.get(sess.group_id);
      if (name) openRegisters.push({ group: name, on: sess.held_on });
    }
  }

  /** A class's rate and its worst-attending members, worded for the prompt.
   *  The arithmetic lives beside the definition of what a mark means, so this
   *  and the pages cannot drift apart on it. */
  function attendanceFor(groupId: string): { rate: number | null; poor: string[] } {
    const { rate, poor } = classAttendance(
      (membersByGroup.get(groupId) ?? []).map((id) => ({ id, tally: attendanceOf.get(id) })),
    );
    return {
      rate,
      poor: poor.slice(0, 6).map((p) => `${nameOfStudent.get(p.id) ?? "somebody"} ${p.rate}%`),
    };
  }

  /* ── WHAT IS STILL OUTSTANDING ──────────────────────────────────────────
     "Has 9A done the homework?" is the other question a teacher asks daily,
     and the assistant could set an assignment and then never speak of it
     again. Only LIVE work is counted — set in the last fortnight, or still to
     come due whenever it was set — because a term's back-catalogue is not a
     to-do list and would crowd out everything else in the prompt. Both halves
     are needed: a fortnight-old cutoff on its own loses the long project set a
     month ago and due tomorrow, which is the one most worth chasing. */
  const homeworkByGroup = new Map<string, string[]>();
  if (shown.length > 0) {
    const cutoff = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const { data: work } = await supabase
      .from("assignments")
      .select(
        "id, group_id, kind, title, due_at, created_at, prompt_id, reading_test_id, listening_library_id, lesson_id",
      )
      .in(
        "group_id",
        shown.map((g) => g.id),
      )
      .or(`created_at.gte.${cutoff},due_at.gte.${new Date().toISOString()}`)
      .order("created_at", { ascending: false })
      .limit(24);
    const rows = (work ?? []) as Record<string, unknown>[];
    if (rows.length > 0) {
      const pick = (key: string) =>
        rows.map((r) => r[key] as string | null).filter((v): v is string => !!v);
      const promptIds = pick("prompt_id");
      const testIds = pick("reading_test_id");
      const listeningIds = pick("listening_library_id");
      const lessonIds = pick("lesson_id");
      const memberIds = [...new Set([...membersByGroup.values()].flat())];
      const empty = Promise.resolve({ data: [] as Record<string, unknown>[] });
      const [essays, reading, listening, lessons] = await Promise.all([
        promptIds.length > 0 && memberIds.length > 0
          ? supabase
              .from("essays")
              .select("prompt_id, student_id")
              .in("prompt_id", promptIds)
              .in("student_id", memberIds)
          : empty,
        testIds.length > 0 && memberIds.length > 0
          ? supabase
              .from("reading_attempts")
              .select("test_id, student_id")
              .in("test_id", testIds)
              .in("student_id", memberIds)
          : empty,
        listeningIds.length > 0 && memberIds.length > 0
          ? supabase
              .from("listening_attempts")
              .select("library_id, student_id")
              .in("library_id", listeningIds)
              .in("student_id", memberIds)
          : empty,
        lessonIds.length > 0 && memberIds.length > 0
          ? supabase
              .from("lesson_attempts")
              .select("lesson_id, student_id")
              .in("lesson_id", lessonIds)
              .in("student_id", memberIds)
          : empty,
      ]);
      // content id → the members who have touched it. Handed-in, not marked:
      // "3 of 12 have done it" is the teacher's question, and whether the
      // model has finished grading is a different one.
      const handedIn = new Map<string, Set<string>>();
      const note = (key: unknown, student: unknown) => {
        if (typeof key !== "string" || typeof student !== "string") return;
        const set = handedIn.get(key) ?? new Set<string>();
        set.add(student);
        handedIn.set(key, set);
      };
      for (const e of (essays.data ?? []) as Record<string, unknown>[])
        note(e.prompt_id, e.student_id);
      for (const r of (reading.data ?? []) as Record<string, unknown>[])
        note(r.test_id, r.student_id);
      for (const l of (listening.data ?? []) as Record<string, unknown>[])
        note(l.library_id, l.student_id);
      for (const l of (lessons.data ?? []) as Record<string, unknown>[])
        note(l.lesson_id, l.student_id);

      const today = new Date().toISOString().slice(0, 10);
      for (const r of rows) {
        const gid = r.group_id as string;
        const contentId =
          (r.prompt_id as string | null) ??
          (r.reading_test_id as string | null) ??
          (r.listening_library_id as string | null) ??
          (r.lesson_id as string | null);
        const total = (membersByGroup.get(gid) ?? []).length;
        const done = contentId ? (handedIn.get(contentId)?.size ?? 0) : 0;
        const due = (r.due_at as string | null)?.slice(0, 10);
        // Overdue is said outright. A teacher scanning a list will not compare
        // a date to today in their head, and this is the row they need to see.
        const when = due
          ? due < today
            ? `was due ${due} — OVERDUE`
            : `due ${due}`
          : "no due date";
        const list = homeworkByGroup.get(gid) ?? [];
        if (list.length < 4) {
          list.push(
            `${r.kind as string} "${String(r.title ?? "untitled").slice(0, 60)}" — ${done} of ${total} handed in, ${when}`,
          );
        }
        homeworkByGroup.set(gid, list);
      }
    }
  }

  const lines: string[] = [];
  lines.push(`CENTRE: ${(orgRes.data?.name as string | null) ?? "this centre"}`);
  lines.push(`YOU ARE TALKING TO: a ${profile.role.replace("_", " ")}`);
  lines.push("");

  lines.push(
    `CLASSES (${groups.length}${groups.length > MAX_GROUPS ? `, showing ${MAX_GROUPS}` : ""}):`,
  );
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
      // "not on the timetable" is stated, never left as silence: it is a real
      // fault (no register, no prorated billing) and the assistant can fix it
      // in one action, but only if it can see it.
      const when = scheduleByGroup.get(g.id);
      lines.push(
        `  • ${g.name} — ${g.memberCount} student${g.memberCount === 1 ? "" : "s"}` +
          `${g.teacherName ? `, taught by ${g.teacherName}` : ", no teacher assigned"}` +
          `${g.branchName ? `, at ${g.branchName}` : ""}` +
          `${g.status !== "active" ? `, ${g.status}` : ""} — ${phoneNote}`,
      );
      lines.push(
        when && when.length > 0
          ? `      meets ${when.join("; ")}`
          : "      NOT ON THE TIMETABLE — no lesson days set, so there is no register and nothing to prorate",
      );
      const names = roster.get(g.name);
      if (names && names.length > 0) lines.push(`      ${names.join(", ")}`);
      const att = attendanceFor(g.id);
      if (att.rate != null) {
        lines.push(
          `      attendance ${att.rate}%` +
            (att.poor.length > 0 ? ` — struggling to turn up: ${att.poor.join(", ")}` : ""),
        );
      } else if (g.memberCount > 0) {
        lines.push("      attendance: no register has been taken yet");
      }
      for (const hw of homeworkByGroup.get(g.id) ?? []) lines.push(`      homework: ${hw}`);
    }
  }
  /* THE NAMES ITS OWN ARGUMENTS ARE CHECKED AGAINST. `create_group` takes a
     branch and a room, and the snapshot listed neither — so in a centre with
     two sites the model could not name one, and every Confirm came back
     "Which branch? This centre has …". A capability whose argument is
     unknowable is not a capability. */
  if (openRegisters.length > 0) {
    lines.push("");
    lines.push(
      `REGISTERS NOT TAKEN (${openRegisters.length}): ` +
        openRegisters
          .slice(0, 10)
          .map((r) => `${r.group} on ${r.on}`)
          .join(", ") +
        ". Until these are marked the attendance figures above are incomplete, and a per-student-lesson salary is short.",
    );
  }

  lines.push("");
  lines.push(
    `BRANCHES: ${branches.length > 0 ? branches.map((b) => b.name).join(", ") : "none set up yet — a class cannot be created without one"}`,
  );
  if (rooms.length > 0) {
    const byBranch = new Map(branches.map((b) => [b.id, b.name]));
    lines.push(
      `ROOMS: ${rooms
        .slice(0, 30)
        .map((r) => `${r.name}${byBranch.has(r.branchId) ? ` (${byBranch.get(r.branchId)})` : ""}`)
        .join(", ")}`,
    );
  }
  if (subjects.length > 0) lines.push(`SUBJECTS: ${subjects.join(", ")}`);

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

  /* ── the money, for the people who handle it ─────────────────────────────
     WHO OWES WHAT WAS THE BIGGEST BLIND SPOT. The assistant could hand over the
     debtors spreadsheet and then not say a word about what was in it, which is
     the shape of answer that makes somebody stop asking.

     OWNER AND FRONT DESK ONLY. `canManagePeople` is centre_admin and
     administrator — the two roles that take payments — and a teacher is
     deliberately outside it. A teacher can already see their students' bands
     and attendance; what a family owes is not theirs, and putting it in the
     snapshot would put it one sentence away from being said out loud.

     Read through the RLS client like everything else here, so even this gate
     is belt and braces: `v_student_finance` is security_invoker, and a teacher
     reading it gets nothing regardless of what this code does. */
  if (isAdmin) {
    try {
      const [debtors, settings] = await Promise.all([loadDebtors(12), loadFinanceSettings()]);
      const owing = debtors.filter((d) => d.owedMinor > 0);
      lines.push("");
      if (owing.length === 0) {
        lines.push("MONEY: nobody is carrying a balance.");
      } else {
        const total = owing.reduce((n, d) => n + d.owedMinor, 0);
        lines.push(
          `MONEY: ${owing.length} student${owing.length === 1 ? "" : "s"} owing ${formatMoney(total, settings.currency)} in total.`,
        );
        // Named, worst first, because "who should I ring today" is the question
        // this actually gets asked — a total alone cannot answer it.
        for (const d of owing.slice(0, 8)) {
          lines.push(`  • ${d.studentName} — ${formatMoney(d.owedMinor, settings.currency)}`);
        }
        if (owing.length > 8) lines.push(`  …and ${owing.length - 8} more.`);
      }
    } catch {
      // A centre with the finance side untouched is not a centre with a
      // problem. Say nothing rather than apologise for a feature they are
      // not using.
    }

    /* ⚠️ WHY THIS LINE EXISTS. Asked about salaries, the assistant handed over
       the payroll spreadsheet and it came out blank. It was not a bug in the
       export: a payroll report is built from a RUN, and a run only exists once
       the owner has pressed Run for that month. With no run there are no
       sheets to write. The model had no way to know that — nothing about
       payroll was in the snapshot at all — so it offered the file with
       confidence every time. Now it can say which months are actually there.

       Owner-gated with the rest of the money, and read through RLS like
       everything else here. */
    try {
      const runs = await loadPayrollHistory();
      const thisMonth = new Date().toISOString().slice(0, 7);
      const done = runs.find((r) => r.periodMonth.slice(0, 7) === thisMonth);
      lines.push("");
      lines.push(
        done
          ? `PAYROLL: this month (${thisMonth}) is computed and ${done.status}.`
          : `PAYROLL: this month (${thisMonth}) has NOT been computed yet, so its report would come out empty — it has to be run on the payroll page first.`,
      );
      const others = runs
        .filter((r) => r.periodMonth.slice(0, 7) !== thisMonth)
        .slice(0, 6)
        .map((r) => `${r.periodMonth.slice(0, 7)} (${r.status})`);
      if (others.length > 0) {
        lines.push(`  Months with a computed run: ${others.join(", ")}.`);
      } else if (!done) {
        lines.push("  No month has ever been computed here.");
      }
    } catch {
      /* same reasoning as the debtors block above */
    }

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
    studentIds,
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

export type ArgKind =
  | "group"
  | "student"
  | "text"
  | "choice"
  | "date"
  | "month"
  /** A list of weekdays in any of the three languages typed here, normalised
   *  to "Monday, Wednesday, Friday" so the confirm card stays editable. */
  | "days"
  /** A clock time, normalised to 24-hour `HH:MM`. */
  | "time"
  /** A whole number, bounded per argument. */
  | "number";

export interface ArgSpec {
  name: string;
  kind: ArgKind;
  /** What the model is told to put here. */
  describe: string;
  required?: boolean;
  choices?: readonly string[];
  /** Inclusive bounds for `number`. */
  min?: number;
  max?: number;
  /**
   * Which roles this ARGUMENT is for, when it is narrower than the action.
   *
   * A teacher may create their own class, but `createGroup` ignores the two
   * price fields unless the caller owns the centre. Describing them to a
   * teacher anyway would have the assistant accept a fee, show it on the
   * confirm card, and drop it — which is the exact failure this whole pass is
   * about. Omitted means "same as the action".
   */
  roles?: readonly string[];
}

/** The arguments of `spec` that this role may actually supply. */
export function argsFor(spec: { args: readonly ArgSpec[] }, role: string): ArgSpec[] {
  return spec.args.filter((a) => !a.roles || a.roles.includes(role));
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

/* ⚠️ THESE MIRROR THE SERVER ACTIONS' OWN GATES, AND MIRRORING IS A HAZARD.
   Each action re-checks the caller itself, so a mistake here can only ever be
   the assistant being MORE restrictive than the product — never less. That is
   still a real failure, and it shipped: `create_group` was owner-only here
   while `createGroup` has always allowed teachers, and CLAUDE.md says in so
   many words that teachers create their own groups. A teacher asking for a new
   class was told the assistant could not see how, which reads as broken rather
   than as forbidden. `assistant.test.ts` pins the mapping so drift has to be
   deliberate; the gate each one mirrors is named beside it. */
const STAFF = ["center_admin", "administrator", "teacher"] as const; // canManagePeople || teacher
const MANAGE = ["center_admin", "administrator"] as const; //            canManagePeople
const OWNER = ["center_admin"] as const; //                              center_admin only
const TEACHER_ONLY = ["teacher"] as const; //                            teacher only
const ANNOUNCE = ["center_admin", "teacher"] as const; //                center_admin || teacher
/* createGroup writes monthly_fee_minor/teacher_rate_minor only for a
   center_admin and silently ignores them for anyone else — so nobody else is
   offered the field. */
const MANAGE_FEES = ["center_admin"] as const;

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
    roles: STAFF,
    args: [
      { name: "group", kind: "group", describe: "the class they join", required: true },
      { name: "full_name", kind: "text", describe: "their full name", required: true },
      { name: "phone", kind: "text", describe: "their phone number, if it was given" },
      {
        name: "email",
        kind: "text",
        describe: "their email, if it was given — the credentials get sent there",
      },
      { name: "login", kind: "text", describe: "a login, only if they asked for a particular one" },
      { name: "guardian_name", kind: "text", describe: "a parent or guardian's name, if given" },
      { name: "guardian_phone", kind: "text", describe: "the guardian's phone, if given" },
    ],
  },
  {
    id: "assign_practice",
    verb: "Assign it",
    describe:
      "Set a class a fresh piece of practice. Writing generates a new Task 2 prompt; reading pins a shared library test. Everyone gets identical content. Only the class's own teacher can do this — if an owner asks, say that plainly.",
    roles: TEACHER_ONLY,
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
      // WRITING WILL NOT GENERATE WITHOUT THESE. `createAssignment` refuses a
      // writing task with no question type and no topic, so an assistant that
      // never sent them could not set a single essay — it proposed, the person
      // pressed Confirm, and got "Choose a valid question type."
      {
        name: "category",
        kind: "choice",
        describe: "writing only: the Task 2 question shape",
        choices: TASK2_CATEGORIES,
      },
      {
        name: "topic_family",
        kind: "choice",
        describe: "writing only: what the essay is about",
        choices: TOPIC_FAMILIES,
      },
      {
        name: "band",
        kind: "text",
        describe: "reading only: the band the test should be pitched at, e.g. 6.5",
      },
      { name: "instructions", kind: "text", describe: "anything to tell the class about it" },
    ],
  },
  {
    id: "move_student",
    verb: "Move them",
    describe:
      "Move one student from the class they are in into another. They keep every mark, register and invoice.",
    roles: STAFF,
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
    roles: STAFF,
    args: [
      { name: "student", kind: "student", describe: "the student's name", required: true },
      { name: "note", kind: "text", describe: "why, for whoever asks later" },
    ],
  },
  {
    id: "send_announcement",
    verb: "Send it",
    describe:
      "Send an announcement to a class, or to the whole centre when no class is named. It always reaches everyone's account; say yes to telegram to ALSO post it in the class channel, which is where the parents are.",
    roles: ANNOUNCE,
    args: [
      { name: "subject", kind: "text", describe: "a short subject line", required: true },
      { name: "body", kind: "text", describe: "the message itself", required: true },
      { name: "group", kind: "group", describe: "the class, if it is for one class only" },
      {
        // Found by the drift test, not by anybody noticing: `sendAnnouncement`
        // has always taken this and the assistant never sent it, so an
        // announcement asked for "in the Telegram group" went to the app only
        // and the parents it was meant for never saw it.
        name: "telegram",
        kind: "choice",
        describe: "post it in the class's Telegram channel too — only for one named class",
        choices: ["yes", "no"],
      },
    ],
  },
  {
    id: "add_students_bulk",
    verb: "Add them all",
    describe:
      "Add a whole roster of students at once from the spreadsheet the person attached, and put them in a class. Propose this whenever a roster is attached and they name a class. You are told only HOW MANY students are in the file — never their names, and you do not need them.",
    roles: STAFF,
    args: [{ name: "group", kind: "group", describe: "the class they all join", required: true }],
  },
  {
    id: "add_teacher",
    verb: "Add them",
    describe:
      "Create a staff account. A login and password are generated for them the same way a student's are.",
    roles: OWNER,
    args: [
      { name: "full_name", kind: "text", describe: "their full name", required: true },
      {
        name: "staff_role",
        kind: "choice",
        describe: "what they do",
        choices: ["teacher", "administrator"],
        required: true,
      },
      { name: "email", kind: "text", describe: "their email, if it was given" },
      { name: "login", kind: "text", describe: "a login, only if they asked for a particular one" },
    ],
  },
  {
    id: "assign_teacher",
    verb: "Assign them",
    describe: "Put a teacher in charge of a class, or change who teaches it.",
    roles: MANAGE,
    args: [
      { name: "group", kind: "group", describe: "the class", required: true },
      { name: "teacher", kind: "text", describe: "the teacher's name", required: true },
    ],
  },
  {
    id: "create_group",
    verb: "Create the class",
    /* ⚠️ EVERY ARGUMENT HERE IS ONE THE PERSON MAY HAVE SAID OUT LOUD. This
       list used to be three items long while `createGroup` read eleven, so
       "Mon, Wed, Fri, 15:30 to 17:00, room 2, 300 000 a month" created a class
       called nothing but its name. The schedule was the expensive one to lose:
       it is the timetable, it is what the register offers to mark, and it is
       the denominator every prorated fee and salary divides by. */
    describe:
      "Start a new class. Fill in EVERYTHING they told you: the name, the teacher, which days it meets and between what times, the room, the branch, how many seats, and the prices. Days and times go together — a class with days and no times cannot be put on the timetable.",
    roles: STAFF,
    args: [
      { name: "name", kind: "text", describe: "the class name", required: true },
      { name: "teacher", kind: "text", describe: "the teacher's name, if one was given" },
      { name: "branch", kind: "text", describe: "the branch, if the centre has more than one" },
      { name: "subject", kind: "text", describe: "what it teaches, if the centre uses subjects" },
      {
        name: "days",
        kind: "days",
        describe: "the days it meets, e.g. 'Monday, Wednesday, Friday' — any language",
      },
      { name: "starts_at", kind: "time", describe: "what time the lesson starts, e.g. 15:30" },
      { name: "ends_at", kind: "time", describe: "what time it ends, e.g. 17:00" },
      { name: "room", kind: "text", describe: "the room it is taught in, if one was named" },
      { name: "capacity", kind: "number", describe: "how many seats", min: 1, max: 500 },
      {
        name: "monthly_fee",
        kind: "text",
        describe: "what a student pays a month, if they said",
        roles: MANAGE_FEES,
      },
      {
        name: "teacher_rate",
        kind: "text",
        describe: "what the teacher is paid for it, if they said",
        roles: MANAGE_FEES,
      },
    ],
  },
  {
    id: "set_schedule",
    verb: "Save the timetable",
    /* The other half of the same hole. Getting the days into `create_group`
       does nothing for the classes already created without them, and "put 9A
       on Monday and Thursday too" is the follow-on sentence. `setGroupSchedule`
       has existed all along; nothing was wired to it. */
    describe:
      "Set or change which days and times a class meets. This replaces its current weekly booking, and the whole timetable, register and prorated billing follow from it.",
    roles: STAFF,
    args: [
      { name: "group", kind: "group", describe: "the class", required: true },
      {
        name: "days",
        kind: "days",
        describe: "the days it meets, e.g. 'Monday, Wednesday, Friday' — any language",
        required: true,
      },
      {
        name: "starts_at",
        kind: "time",
        describe: "what time it starts, e.g. 15:30",
        required: true,
      },
      { name: "ends_at", kind: "time", describe: "what time it ends, e.g. 17:00", required: true },
      { name: "room", kind: "text", describe: "the room, if one was named" },
    ],
  },
  {
    id: "close_group",
    verb: "Close the class",
    describe:
      "Close a class that has finished. Every report, band and invoice is kept; it leaves timetables and can no longer be set practice.",
    roles: MANAGE,
    args: [{ name: "group", kind: "group", describe: "the class name", required: true }],
  },
  {
    id: "reopen_group",
    verb: "Reopen the class",
    describe: "Put a closed class back into service.",
    roles: MANAGE,
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
      const args = argsFor(a, role)
        .map(
          (x) =>
            `${x.name}${x.required ? "" : "?"}=<${x.describe}${x.choices ? `: ${x.choices.join("|")}` : ""}>`,
        )
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

export interface ProposalField {
  name: string;
  label: string;
  kind: ArgKind;
  value: string;
  choices?: readonly string[];
  required: boolean;
}

export interface VettedProposal {
  action: string;
  verb: string;
  why: string;
  args: Record<string, string>;
  /** The same arguments, with enough about each to draw an input. THE DRAFT IS
   *  EDITABLE: the model is guessing at a name or a date from one sentence, and
   *  correcting it in place is far better than arguing with it in prose. Safe
   *  because nothing typed here is trusted either — `runProposal` re-resolves
   *  every class and student by name through RLS whatever the field says. */
  fields: ProposalField[];
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

    const allowed = argsFor(spec, ctx.role);
    const args: Record<string, string> = {};
    let ok = true;
    for (const arg of allowed) {
      const raw = String(p.args?.[arg.name] ?? "").trim();
      if (!raw) {
        if (arg.required) {
          ok = false;
          break;
        }
        continue;
      }
      if (arg.kind === "group" && !ctx.groups.has(raw.toLowerCase())) {
        ok = false;
        break;
      }
      if (arg.kind === "student" && !ctx.students.has(raw.toLowerCase())) {
        ok = false;
        break;
      }
      if (arg.kind === "choice" && !(arg.choices ?? []).includes(raw)) {
        ok = false;
        break;
      }
      // A malformed date is dropped rather than fatal: "sometime next week" is
      // a fine thing to say and a bad thing to guess at, and the action treats
      // a missing due date as no deadline.
      if (arg.kind === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) continue;

      /* THE THREE NORMALISING KINDS. Each one is stored back in its canonical
         written form rather than as a number, because the confirm card puts it
         in a text box somebody may correct — and "Monday, Wednesday, Friday" is
         a far better thing to hand back than "1,3,5". A required one that will
         not parse fails the whole proposal; an optional one is simply dropped,
         on the same reasoning as the date above. */
      if (arg.kind === "days") {
        const days = parseWeekdays(raw);
        if (days.length === 0) {
          if (arg.required) {
            ok = false;
            break;
          }
          continue;
        }
        args[arg.name] = listDays(days);
        continue;
      }
      if (arg.kind === "time") {
        const time = parseClockTime(raw);
        if (!time) {
          if (arg.required) {
            ok = false;
            break;
          }
          continue;
        }
        args[arg.name] = time;
        continue;
      }
      if (arg.kind === "number") {
        const n = Number(raw);
        const withinBounds =
          Number.isInteger(n) && n >= (arg.min ?? 0) && n <= (arg.max ?? Number.MAX_SAFE_INTEGER);
        if (!withinBounds) {
          if (arg.required) {
            ok = false;
            break;
          }
          continue;
        }
        args[arg.name] = String(n);
        continue;
      }
      args[arg.name] = raw.slice(0, 500);
    }
    if (!ok) continue;

    out.push({
      action: spec.id,
      verb: spec.verb,
      why: String(p.why ?? "").slice(0, 300),
      args,
      fields: allowed.map((a) => ({
        name: a.name,
        label: a.name.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
        kind: a.kind,
        value: args[a.name] ?? "",
        choices: a.choices,
        required: a.required === true,
      })),
    });
    if (out.length === 1) break;
  }
  return out;
}

/* ── files it can hand you ──────────────────────────────────────────────────

   A THIRD KIND OF REPLY, next to prose and a proposal. A document changes
   nothing, so it does NOT get a confirm step: making somebody press twice for
   a read-only report is friction dressed up as safety. What it does get is the
   same role check as the route behind it — finance is the owner's alone, and a
   teacher must never be handed a debtors sheet.

   Nothing here generates a file. Each entry points at a route that already
   exists and already authenticates; this is only a vetted way to reach one. */

export interface DocSpec {
  id: string;
  /** Shown on the download button. */
  verb: string;
  describe: string;
  roles: readonly string[];
  args: readonly ArgSpec[];
  /** Built from vetted args plus anything the caller's own snapshot resolves. */
  href: (args: Record<string, string>, ctx: { studentIds: Map<string, string> }) => string | null;
}

const REPORTS = ["summary", "ledger", "expenses", "payroll", "debtors"] as const;

export const DOCUMENTS: readonly DocSpec[] = [
  {
    id: "finance_report",
    verb: "Download",
    describe:
      "A finance report as a spreadsheet or a PDF: summary, ledger, expenses, payroll or debtors, for one month. Only the centre owner can have these.",
    roles: ["center_admin"],
    args: [
      {
        name: "report",
        kind: "choice",
        describe: "which report",
        choices: REPORTS,
        required: true,
      },
      {
        name: "format",
        kind: "choice",
        describe: "the file type",
        choices: ["xlsx", "pdf"],
        required: true,
      },
      { name: "month", kind: "month", describe: "the month as YYYY-MM", required: true },
    ],
    href: (a) =>
      `/api/console/finance/export?report=${a.report}&format=${a.format}&month=${a.month}-01`,
  },
  {
    /* ⚠️ THE ANSWER TO "WHAT DO I OWE MY TEACHERS?" — and the one payroll file
       that is never blank. `finance_report` with report=payroll reads a saved
       RUN, so a month nobody has pressed Run for exports as an empty sheet;
       that is what made the assistant hand over a blank spreadsheet in the
       first place. This grid COMPUTES a month that has no run and marks the
       column provisional, so the honest answer to "salaries this month" on the
       20th is a real number with a caveat rather than nothing at all.

       It is also the only way to answer "who am I still behind with, and since
       when", which is unanswerable one month at a time. */
    id: "teacher_pay_grid",
    verb: "Download",
    describe:
      "Teacher pay across several months side by side, as a spreadsheet — what each teacher earned per month and whether it was paid, part-paid or still owed. Unlike the payroll report this one still works for a month that has not been calculated yet: it computes it and marks it provisional. Only the centre owner can have it.",
    roles: ["center_admin"],
    args: [
      { name: "from", kind: "month", describe: "the first month, as YYYY-MM", required: true },
      {
        name: "to",
        kind: "month",
        describe: "the last month as YYYY-MM; leave out for a single month",
      },
    ],
    href: (a) => {
      const months = monthSpan(a.from, a.to ?? a.from);
      return months.length > 0 ? `/api/console/finance/export?months=${months.join(",")}` : null;
    },
  },
  {
    id: "student_report",
    verb: "Download the PDF",
    describe:
      "One student's progress report as a PDF — their bands across the four skills, what keeps coming up, and every practice they have done.",
    roles: ["center_admin", "administrator", "teacher"],
    args: [{ name: "student", kind: "student", describe: "the student's name", required: true }],
    href: (a, ctx) => {
      const id = ctx.studentIds.get((a.student ?? "").toLowerCase());
      return id ? `/api/console/students/${id}/report` : null;
    },
  },
] as const;

/**
 * Every month from `from` to `to` inclusive, oldest first.
 *
 * Capped at 12 because the export caps at 12, and a request for five years
 * should come back as five columns of the right end rather than as a silently
 * truncated sheet of the wrong one. Backwards input is swapped rather than
 * refused — "from July back to May" is a thing people say.
 */
export function monthSpan(from: string, to: string): string[] {
  // BOTH ends are checked for a real month, not just the shape. `2026-13`
  // satisfies the pattern, and the walk below would never reach it — it would
  // run to the cap and return twelve months nobody asked for.
  const real = (m: string) =>
    /^\d{4}-\d{2}$/.test(m) && Number(m.slice(5, 7)) >= 1 && Number(m.slice(5, 7)) <= 12;
  if (!real(from) || !real(to)) return [];
  const [a, b] = from <= to ? [from, to] : [to, from];
  const out: string[] = [];
  let year = Number(a.slice(0, 4));
  let month = Number(a.slice(5, 7));
  while (out.length < 120) {
    const stamp = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
    out.push(stamp);
    if (stamp === b) break;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return out.slice(-12);
}

export function documentById(id: string): DocSpec | null {
  return DOCUMENTS.find((d) => d.id === id) ?? null;
}

export function describeDocuments(role: string): string {
  return DOCUMENTS.filter((d) => d.roles.includes(role))
    .map((d) => {
      const args = d.args
        .map(
          (x) =>
            `${x.name}${x.required ? "" : "?"}=<${x.describe}${x.choices ? `: ${x.choices.join("|")}` : ""}>`,
        )
        .join(", ");
      return `  • ${d.id} — ${d.describe}\n    args: ${args}`;
    })
    .join("\n");
}

export interface VettedDocument {
  doc: string;
  verb: string;
  label: string;
  href: string;
}

/**
 * The same gate as `vetProposals`, for files. Fails closed on an unknown id, a
 * role that may not have it, a missing argument, a choice outside its list, a
 * malformed month, or a student this person cannot already see.
 */
export function vetDocuments(
  raw: { doc: string; args: Record<string, unknown> }[],
  ctx: VetContext & { studentIds: Map<string, string> },
): VettedDocument[] {
  const out: VettedDocument[] = [];
  for (const d of raw) {
    const spec = documentById(d.doc);
    if (!spec || !spec.roles.includes(ctx.role)) continue;

    const args: Record<string, string> = {};
    let ok = true;
    for (const arg of spec.args) {
      const value = String(d.args?.[arg.name] ?? "").trim();
      if (!value) {
        if (arg.required) ok = false;
        if (!ok) break;
        continue;
      }
      if (arg.kind === "student" && !ctx.students.has(value.toLowerCase())) {
        ok = false;
        break;
      }
      if (arg.kind === "choice" && !(arg.choices ?? []).includes(value)) {
        ok = false;
        break;
      }
      if (arg.kind === "month" && !/^\d{4}-\d{2}$/.test(value)) {
        ok = false;
        break;
      }
      args[arg.name] = value.slice(0, 120);
    }
    if (!ok) continue;

    const href = spec.href(args, ctx);
    if (!href) continue;

    out.push({
      doc: spec.id,
      verb: spec.verb,
      label: Object.values(args).join(" · "),
      href,
    });
    if (out.length === 1) break;
  }
  return out;
}
