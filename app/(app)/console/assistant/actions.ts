"use server";

import { requireOrgUser, type Profile } from "@/lib/auth";
import { actionById } from "@/lib/console/assistant";
import { recordAction } from "@/lib/console/assistant-actions";
import { loadGroups, type RoomOption } from "@/lib/console/groups";
import { listDays, parseClockTime, parseWeekdays } from "@/lib/console/timetable-days";
import { READING_LIBRARY_ORG_ID } from "@/lib/reading/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { sendAnnouncement } from "../center-actions";
import {
  addStudentAccount,
  addStudentsBulk,
  addTeacherAccount,
  assignTeacher,
  createAssignment,
  createGroup,
  inviteGroupToTelegram,
  moveMember,
  setGroupSchedule,
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

  const result = await run(profile, formData);

  // EVERY OUTCOME, INCLUDING THE REFUSALS. A refused action is the more
  // interesting row — it is the one somebody asks about — and a log that keeps
  // only successes answers "did that go through?" with silence in exactly the
  // case where silence is ambiguous. Recorded here, once, rather than beside
  // each `return`, because a return statement added later would not get one.
  await recordAction({
    profile,
    action: String(formData.get("action") ?? "unknown"),
    args: Object.fromEntries(
      [...formData.entries()]
        .filter(([k, v]) => k !== "action" && k !== "roster" && typeof v === "string")
        .map(([k, v]) => [k, String(v).slice(0, 200)]),
    ),
    ok: result.ok != null,
    outcome: result.ok ?? result.error ?? "",
  });

  return result;
}

async function run(profile: Profile, formData: FormData): Promise<RunState> {
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
      // Everything they were told, not just the two fields that used to fit:
      // an address given and dropped means the student never gets emailed the
      // login they were promised.
      for (const field of ["phone", "email", "login", "guardian_name", "guardian_phone"]) {
        if (arg(field)) fd.set(field, arg(field));
      }
      const r = await addStudentAccount({}, fd);
      if (r.error) return { error: r.error };
      const delivered = r.emailNote ? ` ${r.emailNote}` : "";
      return {
        ok: `${arg("full_name")} added to ${g.name}. Their login is on the class roster.${delivered}`,
      };
    }

    case "add_students_bulk": {
      const g = await findGroup(arg("group"));
      if (!g) return { error: notFound(arg("group")) };
      // THE ROSTER NEVER WENT THROUGH THE MODEL. It is parsed in the browser
      // and posted straight here with the confirm, so a sheet of real names and
      // phone numbers is never sent to a language model to be summarised back.
      // All the model was told is how many rows there were.
      const roster = arg("roster");
      if (!roster) return { error: "No roster came through — attach the file again." };
      fd.set("group_id", g.id);
      fd.set("roster", roster);
      const r = await addStudentsBulk({}, fd);
      if (r.error) return { error: r.error };
      const count = roster.split("\n").filter((l) => l.trim()).length;
      return { ok: `${count} student${count === 1 ? "" : "s"} added to ${g.name}.` };
    }

    case "add_teacher": {
      fd.set("full_name", arg("full_name"));
      fd.set("staff_role", arg("staff_role"));
      if (arg("email")) fd.set("email", arg("email"));
      if (arg("login")) fd.set("login", arg("login"));
      const r = await addTeacherAccount({}, fd);
      if (r.error) return { error: r.error };
      return { ok: `${arg("full_name")} added as a ${arg("staff_role")}.` };
    }

    case "assign_teacher": {
      const g = await findGroup(arg("group"));
      if (!g) return { error: notFound(arg("group")) };
      const { teachers } = await loadGroups(profile, { include: "all" });
      const wanted = arg("teacher").toLowerCase();
      const t = teachers.find((x) => (x.name ?? "").toLowerCase() === wanted);
      if (!t) return { error: notFound(arg("teacher")) };
      fd.set("group_id", g.id);
      fd.set("teacher_id", t.id);
      const r = await assignTeacher({}, fd);
      if (r.error) return { error: r.error };
      return { ok: `${t.name} now teaches ${g.name}.` };
    }

    case "assign_practice": {
      const g = await findGroup(arg("group"));
      if (!g) return { error: notFound(arg("group")) };
      fd.set("group_id", g.id);
      fd.set("kind", arg("skill"));
      if (arg("due")) fd.set("due_at", arg("due"));
      if (arg("instructions")) fd.set("instructions", arg("instructions"));

      /* ⚠️ THIS ACTION COULD NEVER HAVE WORKED. `createAssignment` refuses a
         writing task without a question type AND a topic family, and a reading
         task without a library test id — and only the group, the kind and the
         due date were ever sent. Every Confirm came back "Choose a valid
         question type." or "Pick a reading test."

         So the missing three are supplied here. The two writing ones fall back
         to a default rather than refusing, because "set 9A an essay" is a
         complete instruction in a staff room and the reply says what was
         chosen. The reading one cannot be defaulted blind — it is an id — so
         it is resolved from the shared shelf, preferring the band asked for. */
      if (arg("skill") === "writing") {
        const category = arg("category") || "opinion";
        const topic = arg("topic_family") || "education";
        fd.set("category", category);
        fd.set("topic_family", topic);
        const r = await createAssignment({}, fd);
        if (r.error) return { error: r.error };
        return {
          ok: `Writing set for ${g.name} — a ${category.replace(/_/g, " ")} task on ${topic}. Say a different type or topic and I'll set another.`,
        };
      }

      const test = await pickLibraryTest(arg("band"));
      if (!test) {
        return { error: "There are no reading tests on the shared shelf yet, so I can't set one." };
      }
      fd.set("library_test_id", test.id);
      const r = await createAssignment({}, fd);
      if (r.error) return { error: r.error };
      return {
        ok: `Reading set for ${g.name}${test.band ? ` — a band ${test.band} level test` : ""}. Everyone sits the same paper.`,
      };
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
      const wantsTelegram = arg("telegram") === "yes";
      if (arg("group")) {
        const g = await findGroup(arg("group"));
        if (!g) return { error: notFound(arg("group")) };
        fd.set("audience", "group");
        fd.set("group_id", g.id);
        if (wantsTelegram) fd.set("telegram", "on");
      } else {
        fd.set("audience", "everyone");
        // Deliberately NOT set for a centre-wide message. `sendAnnouncement`
        // takes its destinations from the ticked list the composer sends, and
        // an empty list posts nowhere — so switching this on here would be a
        // promise of delivery with nothing behind it. Naming every channel
        // instead is a decision about which parents hear what, and that stays
        // on the announcements page where the boxes are drawn.
      }
      const r = await sendAnnouncement({}, fd);
      if (r.error) return { error: r.error };
      const caveat =
        wantsTelegram && !arg("group")
          ? " I couldn't post it to Telegram from here — that needs one named class, or pick the channels on the announcements page."
          : "";
      return { ok: `${r.ok ?? "Announcement sent."}${caveat}` };
    }

    case "create_group": {
      // A class must belong to a branch. One branch means there is nothing to
      // ask about; several means the model has to have named one, because
      // picking for them puts a class at the wrong site.
      const { branches, teachers, rooms } = await loadGroups(profile, { include: "all" });
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
        const t = teachers.find((x) => (x.name ?? "").toLowerCase() === teacherName.toLowerCase());
        if (!t) return { error: notFound(teacherName) };
        fd.set("teacher_id", t.id);
      }
      if (arg("capacity")) fd.set("capacity", arg("capacity"));
      // The prices are the owner's; `createGroup` ignores them for anybody else
      // and the fields are not offered to anybody else either.
      if (arg("monthly_fee")) fd.set("monthly_fee", arg("monthly_fee"));
      if (arg("teacher_rate")) fd.set("teacher_rate", arg("teacher_rate"));

      const subjectError = await applySubject(supabase, fd, arg("subject"));
      if (subjectError) return { error: subjectError };

      // ⭐ THE WHOLE POINT OF THIS ACTION GROWING. Told "Mon, Wed, Fri, 15:30 to
      // 17:00", the assistant used to create a class with no timetable and say
      // nothing — no register to mark, and no lesson count for any prorated fee
      // or salary to divide by. Refused BEFORE the insert when it is half a
      // schedule, so nobody ends up with a class they were told meets on days
      // it does not.
      const scheduleError = applySchedule(fd, rooms, branch.id, {
        days: arg("days"),
        startsAt: arg("starts_at"),
        endsAt: arg("ends_at"),
        room: arg("room"),
      });
      if (typeof scheduleError === "string") return { error: scheduleError };

      const r = await createGroup({}, fd);
      if (r.error) return { error: r.error };
      // `createGroup` already says how many lessons a week it put on the
      // timetable; passing its notice through beats restating it worse.
      return { ok: r.notice ?? `${arg("name")} created.` };
    }

    case "set_schedule": {
      const g = await findGroup(arg("group"));
      if (!g) return { error: notFound(arg("group")) };
      const { rooms, groups: manageable } = await loadGroups(profile, { include: "all" });
      const branchId = manageable.find((x) => x.id === g.id)?.branchId ?? null;

      fd.set("group_id", g.id);
      const scheduleError = applySchedule(fd, rooms, branchId, {
        days: arg("days"),
        startsAt: arg("starts_at"),
        endsAt: arg("ends_at"),
        room: arg("room"),
      });
      if (typeof scheduleError === "string") return { error: scheduleError };

      // No series id: this adds the booking rather than editing one, because
      // the assistant has no way to say WHICH of a class's bookings is meant
      // and picking one would silently delete the other. Reworking an existing
      // booking stays on the class page, where they are drawn separately.
      const r = await setGroupSchedule({}, fd);
      if (r.error) return { error: r.error };
      // Read back what was WRITTEN, not what was typed: the field is editable,
      // so "mon/wed" is a perfectly likely thing to find in it and a poor thing
      // to repeat back as confirmation.
      return {
        ok: `${g.name} now meets ${listDays(parseWeekdays(arg("days")))}, ${parseClockTime(
          arg("starts_at"),
        )}–${parseClockTime(arg("ends_at"))}.`,
      };
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

/* ── the details that used to be dropped ──────────────────────────────────── */

/**
 * Put a weekly booking on the form `createGroup` / `setGroupSchedule` reads.
 *
 * Returns an error STRING when it is half a schedule, and `null` when there was
 * no schedule to write. Half is refused rather than ignored: a class created
 * with days and no times is a class whose register has nothing to mark and
 * whose prorated fees have no denominator, and the person who said the days out
 * loud has no reason to suspect any of that happened.
 */
function applySchedule(
  fd: FormData,
  rooms: RoomOption[],
  branchId: string | null,
  input: { days: string; startsAt: string; endsAt: string; room: string },
): string | null {
  const days = parseWeekdays(input.days);
  const startsAt = parseClockTime(input.startsAt);
  const endsAt = parseClockTime(input.endsAt);

  if (days.length === 0 && !startsAt && !endsAt && !input.room) return null;
  if (days.length === 0) return "Which days does it meet? I need those to put it on the timetable.";
  if (!startsAt || !endsAt) {
    return `I have ${listDays(days)}, but not the times — what time does the lesson start and finish?`;
  }
  if (endsAt <= startsAt) return "The lesson has to end after it starts.";

  for (const day of days) fd.append("weekdays", String(day));
  fd.set("starts_at", startsAt);
  fd.set("ends_at", endsAt);

  if (input.room) {
    // Only the chosen site's rooms: `lesson_slot_branch_guard` rejects the rest
    // anyway, and matching one at another branch would fail at the database
    // with a message nobody can act on.
    const here = branchId ? rooms.filter((r) => r.branchId === branchId) : rooms;
    const hit = here.find((r) => r.name.toLowerCase() === input.room.toLowerCase());
    if (!hit) {
      return here.length > 0
        ? `I can't find a room called "${input.room}" there — this site has ${here.map((r) => r.name).join(", ")}.`
        : `I can't find a room called "${input.room}".`;
    }
    fd.set("room_id", hit.id);
  }
  return null;
}

/** Resolve a subject by name onto the form. A centre that has not set subjects
 *  up never reaches this — the argument is simply absent. */
async function applySubject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fd: FormData,
  name: string,
): Promise<string | null> {
  if (!name) return null;
  const { data } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("active", true)
    .ilike("name", name)
    .maybeSingle();
  if (!data) return notFound(name);
  fd.set("subject_id", data.id as string);
  return null;
}

/**
 * A test off the shared reading shelf, at the band asked for if there is one.
 *
 * Read with service-role because the library lives under its own organisation
 * — the same read the class page makes. Nothing org-scoped is touched, and the
 * id only ever reaches `createAssignment`, which re-checks the caller owns the
 * class before it pins anything to it.
 */
async function pickLibraryTest(band: string): Promise<{ id: string; band: number | null } | null> {
  const { data } = await createAdminClient()
    .from("reading_tests")
    .select("id, target_band")
    .eq("organization_id", READING_LIBRARY_ORG_ID)
    .eq("is_library", true)
    .order("target_band", { ascending: true })
    .limit(12);

  const tests = ((data ?? []) as { id: string; target_band: number | null }[]).map((t) => ({
    id: t.id,
    band: t.target_band,
  }));
  if (tests.length === 0) return null;

  const wanted = Number(band);
  if (Number.isFinite(wanted)) {
    // Nearest, not exact: a shelf pitched at 6 and 7 should still answer "give
    // them something around 6.5" rather than shrugging.
    const sorted = [...tests].sort(
      (a, b) => Math.abs((a.band ?? 0) - wanted) - Math.abs((b.band ?? 0) - wanted),
    );
    return sorted[0];
  }
  return tests[0];
}
