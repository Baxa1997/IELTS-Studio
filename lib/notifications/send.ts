import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Fan-out for in-app notifications.
 *
 * Always service-role: a notification is the system stating that something
 * happened, so no client may write one (RLS grants clients only `read_at`).
 *
 * Always best-effort. Delivering the news must never break the thing the news is
 * about — a failed insert here cannot be allowed to fail a grading, an
 * assignment, or a submission. Failures are logged and swallowed.
 */

export type NotificationType =
  | "assignment_published"
  | "assignment_due_soon"
  | "attempt_graded"
  | "grading_queued"
  | "grading_failed"
  | "quota_warning"
  | "quota_exhausted"
  /** A center-wide message from the center admin. */
  | "announcement";

interface NotifyInput {
  organizationId: string;
  recipientIds: string[];
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  payload?: Record<string, unknown>;
}

export async function notify(input: NotifyInput): Promise<void> {
  const recipients = [...new Set(input.recipientIds)].filter(Boolean);
  if (recipients.length === 0) return;

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert(
      recipients.map((recipient_id) => ({
        organization_id: input.organizationId,
        recipient_id,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        href: input.href ?? null,
        payload: input.payload ?? {},
      })),
    );
    if (error) console.error("[notify] insert failed:", input.type, error.message);
  } catch (err) {
    console.error("[notify] failed:", input.type, err);
  }
}

/**
 * A teacher set practice for a class → tell everyone in it.
 *
 * The href is the runner deep link, the same one the Assignments page uses, so
 * the notification lands the student on the work rather than on a list.
 */
export async function notifyAssignment(args: {
  organizationId: string;
  groupIds: string[];
  title: string;
  href: string;
  dueAt?: string | null;
  groupNameById?: Map<string, string>;
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

    await notify({
      organizationId: args.organizationId,
      recipientIds: ((members ?? []) as { student_id: string }[]).map((m) => m.student_id),
      type: "assignment_published",
      title: "New homework",
      body: `${args.title}.${due}`,
      href: args.href,
    });
  } catch (err) {
    console.error("[notify] assignment fan-out failed:", err);
  }
}

/** A grading finished → tell the learner, with a link to the feedback. */
export async function notifyGraded(args: {
  organizationId: string;
  studentId: string;
  band: number | null;
  href: string;
}): Promise<void> {
  await notify({
    organizationId: args.organizationId,
    recipientIds: [args.studentId],
    type: "attempt_graded",
    title: "Your essay has been marked",
    body:
      args.band != null
        ? `Band ${args.band.toFixed(1)}. Open it to see what capped it and what to fix.`
        : "Open it to see the feedback.",
    href: args.href,
  });
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
