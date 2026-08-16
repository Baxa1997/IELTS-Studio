import "server-only";

import { type Profile } from "@/lib/auth";
import { reportHref, type AttemptKind } from "@/lib/console/attempts";
import { createClient } from "@/lib/supabase/server";

/**
 * What still needs a human, and what a human already said.
 *
 * The queue is DERIVED, not a table: it is every graded attempt by a student in
 * a group that carries no review row. Nothing has to be enqueued, nothing can
 * be missed because an insert failed, and marking an attempt simply removes it
 * — a queue you cannot get out of sync with reality.
 */

/* The vocabulary lives in `attempts.ts` so the client panel can share it —
   importing it from here drags `next/headers` into the browser bundle. */
export { KIND_LABEL, WRITING_CRITERIA, reportHref, type AttemptKind } from "@/lib/console/attempts";

export interface QueueItem {
  kind: AttemptKind;
  refId: string;
  studentId: string;
  studentName: string;
  groupId: string | null;
  groupName: string | null;
  teacherId: string | null;
  teacherName: string | null;
  submittedAt: string;
  aiBand: number | null;
  /** Hours since it was handed in — the doc's alert fires past 48. */
  waitingHours: number;
  href: string;
}

export const OVERDUE_HOURS = 48;

/**
 * Everything waiting for a verdict.
 *
 * A teacher sees their own groups' students; a centre admin sees the centre.
 * RLS narrows the underlying attempt tables already, but group attribution is
 * done here because a student can sit in two groups and the queue has to name
 * one teacher rather than duplicate the row.
 */
export async function loadMarkingQueue(profile: Profile): Promise<QueueItem[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("v_marking_queue")
    .select("kind, ref_id, student_id, submitted_at, ai_band")
    .order("submitted_at", { ascending: true })
    .limit(500);
  // An empty queue and a broken query look identical from here, and this one is
  // a view over four tables — exactly the shape that fails silently.
  if (error) {
    console.error("[loadMarkingQueue] failed:", error.message);
    return [];
  }
  if (!rows?.length) return [];

  const studentIds = [...new Set(rows.map((r) => r.student_id as string))];
  const [{ data: members }, { data: groups }, { data: people }] = await Promise.all([
    supabase.from("group_members").select("group_id, student_id").in("student_id", studentIds),
    supabase.from("groups").select("id, name, teacher_id"),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const nameOf = new Map(
    ((people ?? []) as { id: string; full_name: string | null }[]).map((p) => [
      p.id,
      p.full_name ?? "Unnamed",
    ]),
  );
  const groupOf = new Map(
    ((groups ?? []) as { id: string; name: string; teacher_id: string | null }[]).map((g) => [
      g.id,
      g,
    ]),
  );
  // First group wins. A student in two of a teacher's groups is one row of work,
  // not two, and the report link reaches the same place either way.
  const homeGroup = new Map<string, string>();
  for (const m of (members ?? []) as { group_id: string; student_id: string }[]) {
    if (!homeGroup.has(m.student_id)) homeGroup.set(m.student_id, m.group_id);
  }

  const now = Date.now();
  const isTeacher = profile.role === "teacher";

  return rows
    .map((r) => {
      const kind = r.kind as AttemptKind;
      const studentId = r.student_id as string;
      const gid = homeGroup.get(studentId) ?? null;
      const group = gid ? groupOf.get(gid) : undefined;
      const submittedAt = r.submitted_at as string;
      return {
        kind,
        refId: r.ref_id as string,
        studentId,
        studentName: nameOf.get(studentId) ?? "Unnamed",
        groupId: gid,
        groupName: group?.name ?? null,
        teacherId: group?.teacher_id ?? null,
        teacherName: group?.teacher_id ? (nameOf.get(group.teacher_id) ?? null) : null,
        submittedAt,
        aiBand: r.ai_band != null ? Number(r.ai_band) : null,
        waitingHours: Math.max(0, Math.round((now - Date.parse(submittedAt)) / 3600_000)),
        href: reportHref(kind, r.ref_id as string),
      };
    })
    // A teacher's queue is their own. RLS lets them read the work of students in
    // their groups, so without this they would also see work by a student who
    // happens to sit in a colleague's class as well as theirs.
    .filter((item) => !isTeacher || item.teacherId === profile.id);
}

export interface AttemptReview {
  aiBand: number | null;
  finalBand: number;
  criteria: Record<string, { band: number; was: number | null }> | null;
  reason: string;
  reviewedBy: string;
  reviewerName: string | null;
  reviewedAt: string;
}

/** The verdict on one attempt, or null when nobody has given one. */
export async function loadReview(
  kind: AttemptKind,
  refId: string,
): Promise<AttemptReview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attempt_reviews")
    .select("ai_band, final_band, criteria, reason, reviewed_by, reviewed_at")
    .eq("kind", kind)
    .eq("ref_id", refId)
    .maybeSingle();
  if (error) {
    console.error("[loadReview] failed:", error.message);
    return null;
  }
  if (!data) return null;

  const { data: reviewer } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", data.reviewed_by as string)
    .maybeSingle();

  return {
    aiBand: data.ai_band != null ? Number(data.ai_band) : null,
    finalBand: Number(data.final_band),
    criteria:
      (data.criteria as Record<string, { band: number; was: number | null }> | null) ?? null,
    reason: data.reason as string,
    reviewedBy: data.reviewed_by as string,
    reviewerName: (reviewer?.full_name as string | null) ?? null,
    reviewedAt: data.reviewed_at as string,
  };
}

/**
 * The stamp a report carries — the doc's `Marked by AI · reviewed by … · 13 Aug`.
 *
 * Said in that order on purpose. The AI marked it: pretending otherwise is the
 * thing that would actually damage a centre when a parent asks. The human's
 * name is what makes the centre accountable for it anyway.
 */
export function provenance(review: AttemptReview | null): string {
  if (!review) return "Marked by AI · not yet reviewed";
  const when = new Date(review.reviewedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  const who = review.reviewerName ?? "a teacher";
  const moved =
    review.aiBand != null && review.aiBand !== review.finalBand
      ? ` · corrected from ${review.aiBand.toFixed(1)}`
      : "";
  return `Marked by AI · reviewed by ${who} · ${when}${moved}`;
}
