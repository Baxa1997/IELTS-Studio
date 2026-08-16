import "server-only";

import { autoMessageEnabled, sendAutoMessage } from "@/lib/console/auto-message-service";
import { notify, type NotificationType } from "@/lib/notifications/notify";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The event-shaped notification helpers — "an essay was graded", "practice was
 * set" — layered over the `notify` primitive next door.
 *
 * Re-exported here because every existing caller imports them from this path,
 * and the split was made to break an import cycle, not to move the API.
 */
export { notify, type NotificationType };

/**
 * A teacher set practice for a class → tell everyone in it.
 *
 * The href is the runner deep link, the same one the Assignments page uses, so
 * the notification lands the student on the work rather than on a list.
 *
 * ROUTED THROUGH §12's `practice_set` SETTING. A centre that switches "New
 * practice set" off must stop receiving it — a toggle that does not stop the
 * send is a lie told to the person who flipped it. The default is ON, so a
 * centre that never opens that page sees exactly today's behaviour.
 *
 * SENT PER GROUP, not once for the union. `{group}` is a placeholder a centre
 * can put in the wording, and one assignment can span several classes; a single
 * fan-out could only name one of them, or none.
 */
export async function notifyAssignment(args: {
  organizationId: string;
  groupIds: string[];
  title: string;
  href: string;
  dueAt?: string | null;
  groupNameById?: Map<string, string>;
  /** Distinguishes two different assignments so neither dedupes the other. */
  assignmentKey?: string;
}): Promise<void> {
  if (args.groupIds.length === 0) return;

  try {
    const admin = createAdminClient();
    const { data: members } = await admin
      .from("group_members")
      .select("student_id, group_id")
      .in("group_id", args.groupIds);

    const due = args.dueAt
      ? ` Due ${new Date(args.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.`
      : "";

    const byGroup = new Map<string, string[]>();
    for (const m of (members ?? []) as { student_id: string; group_id: string }[]) {
      byGroup.set(m.group_id, [...(byGroup.get(m.group_id) ?? []), m.student_id]);
    }

    for (const [groupId, studentIds] of byGroup) {
      await sendAutoMessage({
        organizationId: args.organizationId,
        key: "practice_set",
        recipientIds: studentIds,
        values: {
          practice: `${args.title}${due}`,
          group: args.groupNameById?.get(groupId) ?? "your class",
        },
        href: args.href,
        subjectKey: `${args.assignmentKey ?? args.href}:${groupId}`,
      });
    }
  } catch (err) {
    console.error("[notify] assignment fan-out failed:", err);
  }
}

/**
 * A grading finished → tell the learner, with a link to the feedback.
 *
 * Routed through §12's `results_ready` setting, default ON.
 *
 * THE BAND-LESS CASE IS WHY `composeAutoMessage` REFUSES RATHER THAN GUESSES.
 * The default wording names the band, and not every marked attempt has one — a
 * reading quick practice has a score instead. Rather than sending "came back at
 * band ." the message is skipped, and this function falls back to the plain
 * notification that never mentioned a band in the first place. The learner is
 * still told; they are just not told a number that does not exist.
 */
export async function notifyGraded(args: {
  organizationId: string;
  studentId: string;
  band: number | null;
  href: string;
  /** What was marked, for `{practice}`. */
  practice?: string | null;
}): Promise<void> {
  if (args.band != null) {
    const sent = await sendAutoMessage({
      organizationId: args.organizationId,
      key: "results_ready",
      recipientIds: [args.studentId],
      values: { practice: args.practice ?? "Your work", band: args.band.toFixed(1) },
      href: args.href,
      subjectKey: args.href,
    });
    if (sent > 0) return;
    // Nothing sent means the centre switched it off — respect that rather than
    // falling through to the hardcoded notice, which would make the toggle a
    // lie. The fallback below is only for the case the template cannot serve.
    const on = await autoMessageEnabled(args.organizationId, "results_ready");
    if (!on) return;
  }

  await notify({
    organizationId: args.organizationId,
    recipientIds: [args.studentId],
    type: "attempt_graded",
    title: "Your work has been marked",
    body:
      args.band != null
        ? `Band ${args.band.toFixed(1)}. Open it to see what capped it and what to fix.`
        : "Open it to see the feedback.",
    href: args.href,
  });
}

/**
 * A register recorded an absence → tell the student (§12 `absent_today`).
 *
 * Off by default. A centre that wants it turns it on, because a message saying
 * "you were marked absent" arriving after a lesson the student attended — a
 * mis-tapped register — is the kind of thing that gets a centre a phone call,
 * and it should be the centre's choice to accept that risk.
 *
 * The subject key is the LESSON DATE, so correcting a register and saving it
 * again does not send a second copy.
 */
export async function notifyAbsent(args: {
  organizationId: string;
  absentees: { studentId: string; name: string }[];
  groupId: string;
  groupName: string;
  heldOn: string;
}): Promise<void> {
  for (const student of args.absentees) {
    await sendAutoMessage({
      organizationId: args.organizationId,
      key: "absent_today",
      recipientIds: [student.studentId],
      values: { student: student.name, group: args.groupName },
      href: "/assignments",
      subjectKey: `${args.groupId}:${args.heldOn}`,
    });
  }
}

/**
 * Two consecutive absences → tell the teacher and the centre admin
 * (§12 `two_absences`).
 *
 * Goes to STAFF, not the student: §12's audience column, and the right one —
 * this is the point where somebody should ring home, which is not a thing a
 * notification to the absent student achieves.
 */
export async function notifyTwoAbsences(args: {
  organizationId: string;
  studentId: string;
  studentName: string;
  groupId: string;
  groupName: string;
  heldOn: string;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    const [{ data: group }, { data: admins }] = await Promise.all([
      admin.from("groups").select("teacher_id").eq("id", args.groupId).maybeSingle(),
      admin
        .from("profiles")
        .select("id")
        .eq("organization_id", args.organizationId)
        .eq("role", "center_admin"),
    ]);

    const staff = [
      ...((group?.teacher_id as string | null) ? [group!.teacher_id as string] : []),
      ...((admins ?? []) as { id: string }[]).map((a) => a.id),
    ];
    if (staff.length === 0) return;

    await sendAutoMessage({
      organizationId: args.organizationId,
      key: "two_absences",
      recipientIds: staff,
      values: { student: args.studentName, group: args.groupName },
      href: `/console/attendance/${args.groupId}`,
      subjectKey: `${args.studentId}:${args.heldOn}`,
    });
  } catch (err) {
    console.error("[notify] two-absences fan-out failed:", err);
  }
}

/**
 * Grading could not be done now → say so, and say it isn't lost. Spec 01 §3.5:
 * never silently drop an attempt.
 */
export async function notifyQueued(args: {
  organizationId: string;
  studentId: string;
  reason: "busy" | "quota";
  retryAt?: string | null;
}): Promise<void> {
  const when = args.retryAt
    ? ` It will be marked after ${new Date(args.retryAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.`
    : " It will be marked shortly.";
  await notify({
    organizationId: args.organizationId,
    recipientIds: [args.studentId],
    type: "grading_queued",
    title: args.reason === "quota" ? "Marking is queued" : "Marking is busy",
    body:
      (args.reason === "quota"
        ? "Your center has used its marking allowance for this month, so your essay is waiting in line."
        : "Marking is under heavy load, so your essay is waiting in line.") + when,
    href: "/activities",
  });
}

/**
 * Retries exhausted. The learner is told plainly, and every teacher who owns a
 * group they're in is told too — this is the one failure a human has to pick up.
 */
export async function notifyGradingFailed(args: {
  organizationId: string;
  studentId: string;
  essayId: string;
}): Promise<void> {
  await notify({
    organizationId: args.organizationId,
    recipientIds: [args.studentId],
    type: "grading_failed",
    title: "Your essay couldn't be marked",
    body: "Something went wrong on our side. Your teacher has been told and it can be re-run.",
    href: "/activities",
  });

  try {
    const admin = createAdminClient();
    const { data: groups } = await admin
      .from("group_members")
      .select("group_id")
      .eq("student_id", args.studentId);
    const groupIds = ((groups ?? []) as { group_id: string }[]).map((g) => g.group_id);
    if (groupIds.length === 0) return;

    const { data: owners } = await admin
      .from("groups")
      .select("teacher_id")
      .in("id", groupIds)
      .not("teacher_id", "is", null);

    await notify({
      organizationId: args.organizationId,
      recipientIds: ((owners ?? []) as { teacher_id: string }[]).map((g) => g.teacher_id),
      type: "grading_failed",
      title: "A student's essay couldn't be marked",
      body: "It ran out of retries. Open it and re-run the marking.",
      href: `/activities/essay/${args.essayId}`,
    });
  } catch (err) {
    console.error("[notify] grading-failed teacher fan-out failed:", err);
  }
}

/**
 * Tell the teachers that a student's work came back — with the verdict, not
 * just the fact.
 *
 * WHY THE TEACHER GETS MORE THAN THE STUDENT. The student is told "your essay
 * is ready" and goes to read it; that is the right message for the person who
 * wrote it. A teacher is not going to open twenty feedback pages to find out
 * how the class did, so the notification carries the answer — the band and the
 * criterion that capped it — and the page is there for when they want the
 * working. Getting the conclusion into the notification is the difference
 * between a teacher who reads these and one who mutes them.
 *
 * Best-effort throughout: a notification that fails must never fail a grading
 * that has already been written.
 */
export async function notifyGradedToTeachers(args: {
  organizationId: string;
  studentId: string;
  href: string;
  skill: string;
  band: number | null;
  /** The criterion holding the work back, when the grader named one. */
  capping?: string | null;
  /** True when this content was set as homework, not self-directed practice. */
  assigned?: boolean;
}): Promise<void> {
  try {
    const admin = createAdminClient();

    // The teachers who own a class this student is in. Not every teacher in the
    // center: authority over a student follows the class, everywhere else in
    // this app, and a notification is not the place to widen it.
    const { data: memberships } = await admin
      .from("group_members")
      .select("group_id")
      .eq("student_id", args.studentId);
    const groupIds = (memberships ?? []).map((m) => m.group_id as string);
    if (groupIds.length === 0) return;

    const { data: groups } = await admin
      .from("groups")
      .select("teacher_id")
      .in("id", groupIds)
      .not("teacher_id", "is", null);
    const teacherIds = [
      ...new Set((groups ?? []).map((g) => g.teacher_id as string).filter(Boolean)),
    ];
    if (teacherIds.length === 0) return;

    const { data: student } = await admin
      .from("profiles")
      .select("full_name")
      .eq("id", args.studentId)
      .maybeSingle();
    const who = (student?.full_name as string | null) ?? "A student";

    const verdict = args.band != null ? `Band ${args.band.toFixed(1)}` : "Marked";
    const body = [
      verdict,
      args.capping ? `held back by ${args.capping}` : null,
      args.assigned ? "· homework" : null,
    ]
      .filter(Boolean)
      .join(" · ");

    await notify({
      organizationId: args.organizationId,
      recipientIds: teacherIds,
      type: "attempt_graded",
      title: `${who} finished ${args.skill}`,
      body,
      href: args.href,
      payload: { studentId: args.studentId, band: args.band, skill: args.skill },
    });
  } catch (err) {
    console.error("[notify] teacher grading notice failed:", err);
  }
}
