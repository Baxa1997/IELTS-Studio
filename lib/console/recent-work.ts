import "server-only";

import { type Profile } from "@/lib/auth";
import { loadGroups } from "@/lib/console/groups";
import { createClient } from "@/lib/supabase/server";

/**
 * What the students actually handed in, newest first — the thing a teacher
 * opens the console to look at.
 *
 * WHY THIS WAS MISSING. Every piece is a row in `essays`, `reading_attempts`,
 * `listening_attempts` or `speaking_sessions`, and each one already has a
 * feedback page a teacher is allowed to open (those pages gate on RLS, not on
 * role, so staff and student read the same view). But nothing in the console
 * ever LISTED them. A teacher could reach one student's work by opening their
 * class, finding them in the roster and clicking Report — three navigations to
 * answer "did anyone do the homework I set last night".
 *
 * ONE QUERY PER SKILL FOR THE WHOLE CLASS LIST, not per student. The per-student
 * report (`loadStudentReport`) does the same job one person at a time, which is
 * right for a profile page and would be dozens of round trips here.
 *
 * A row with no `reportHref` is work in progress — an essay still grading, an
 * abandoned mock. It is listed rather than hidden, because "Asilbek started
 * four essays and finished none" is exactly the thing a teacher needs to see.
 */

export type WorkSkill = "writing" | "reading" | "listening" | "speaking";

export interface RecentWorkRow {
  id: string;
  studentId: string;
  studentName: string;
  skill: WorkSkill;
  when: string;
  /** Band where one exists. Listening is scored, not banded. */
  band: number | null;
  /** `32/40` for listening, else null. */
  score: string | null;
  /** True when this content was set as homework to one of their groups. */
  assigned: boolean;
  /** The full feedback page, or null while the work is unfinished/ungraded. */
  reportHref: string | null;
  /** `graded` | `in progress` — what to show instead of a band. */
  state: "graded" | "pending";
}

/** One student, rolled up — the row a teacher scans down. */
export interface StudentSummary {
  studentId: string;
  name: string;
  groupName: string | null;
  /** Latest band from graded work, across skills. */
  latestBand: number | null;
  /** Finished and graded in the window. */
  done: number;
  /** Started but not finished — the number that explains a low `done`. */
  unfinished: number;
  lastActive: string | null;
  reportHref: string;
}

export interface WorkOverview {
  recent: RecentWorkRow[];
  students: StudentSummary[];
}

/**
 * Both views of the same fetch: the stream of work, and the per-student
 * roll-up over it.
 *
 * Returned together because they come from identical queries — asking twice
 * would double every round trip to show two arrangements of one answer.
 */
export async function loadWorkOverview(profile: Profile, limit = 30): Promise<WorkOverview> {
  const recent = await loadRecentWork(profile, 500);

  // Which class each student belongs to, for the row's second line. A student
  // in two of a teacher's classes shows the first — the report link covers both.
  const supabase = await createClient();
  const { groups } = await loadGroups(profile);
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const { data: members } = await supabase
    .from("group_members")
    .select("group_id, student_id")
    .in(
      "group_id",
      groups.map((g) => g.id),
    );

  const classOf = new Map<string, { id: string; name: string }>();
  for (const m of (members ?? []) as { group_id: string; student_id: string }[]) {
    if (classOf.has(m.student_id)) continue;
    classOf.set(m.student_id, { id: m.group_id, name: groupName.get(m.group_id) ?? "—" });
  }

  const byStudent = new Map<string, StudentSummary>();
  for (const [studentId, cls] of classOf) {
    byStudent.set(studentId, {
      studentId,
      name: "—",
      groupName: cls.name,
      latestBand: null,
      done: 0,
      unfinished: 0,
      lastActive: null,
      reportHref: `/console/groups/${cls.id}/students/${studentId}`,
    });
  }
  for (const w of recent) {
    const row = byStudent.get(w.studentId);
    if (!row) continue;
    row.name = w.studentName;
    if (w.state === "graded") {
      row.done += 1;
      if (row.latestBand == null && w.band != null) row.latestBand = w.band;
    } else {
      row.unfinished += 1;
    }
    if (!row.lastActive || w.when > row.lastActive) row.lastActive = w.when;
  }

  // Whoever needs looking at first: nobody-has-done-anything, then least done.
  const students = [...byStudent.values()].sort(
    (a, b) => a.done - b.done || (a.lastActive ?? "").localeCompare(b.lastActive ?? ""),
  );

  return { recent: recent.slice(0, limit), students };
}

export async function loadRecentWork(profile: Profile, limit = 30): Promise<RecentWorkRow[]> {
  const supabase = await createClient();

  // Scope follows the classes this person may see: RLS narrows a teacher's
  // groups to their own, so the roster derived from them is already correct.
  const { groups } = await loadGroups(profile);
  if (groups.length === 0) return [];

  const { data: members } = await supabase
    .from("group_members")
    .select("student_id")
    .in(
      "group_id",
      groups.map((g) => g.id),
    );
  const studentIds = [...new Set((members ?? []).map((m) => m.student_id as string))];
  if (studentIds.length === 0) return [];

  const [nameRes, essaysRes, readingRes, listeningRes, assignmentsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", studentIds),
    supabase
      .from("essays")
      .select("id, student_id, prompt_id, status, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(limit * 2),
    supabase
      .from("reading_attempts")
      .select("id, student_id, test_id, band, correct_count, total_questions, status, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(limit * 2),
    supabase
      .from("listening_attempts")
      .select("id, student_id, score, max_score, created_at")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false })
      .limit(limit * 2),
    supabase.from("assignments").select("prompt_id, reading_test_id, listening_library_id"),
  ]);

  const nameOf = new Map(
    ((nameRes.data ?? []) as { id: string; full_name: string | null }[]).map((p) => [
      p.id,
      p.full_name ?? "—",
    ]),
  );
  const assigned = {
    prompts: new Set(
      (assignmentsRes.data ?? []).map((a) => a.prompt_id as string | null).filter(Boolean),
    ),
    tests: new Set(
      (assignmentsRes.data ?? []).map((a) => a.reading_test_id as string | null).filter(Boolean),
    ),
    listening: new Set(
      (assignmentsRes.data ?? [])
        .map((a) => a.listening_library_id as string | null)
        .filter(Boolean),
    ),
  };

  const rows: RecentWorkRow[] = [];

  // ── writing ──────────────────────────────────────────────────────────────
  const essays = (essaysRes.data ?? []) as Record<string, unknown>[];
  const bandOf = new Map<string, number>();
  if (essays.length > 0) {
    const { data: gradings } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, created_at")
      .in(
        "essay_id",
        essays.map((e) => e.id as string),
      )
      .order("created_at", { ascending: true });
    // Ascending, so a re-grade of the same essay overwrites and the LAST one
    // wins — the revision loop means an essay can be graded more than once.
    for (const g of gradings ?? []) {
      if (g.overall_band != null) bandOf.set(g.essay_id as string, Number(g.overall_band));
    }
  }
  for (const e of essays) {
    const id = e.id as string;
    const band = bandOf.get(id) ?? null;
    rows.push({
      id,
      studentId: e.student_id as string,
      studentName: nameOf.get(e.student_id as string) ?? "—",
      skill: "writing",
      when: String(e.created_at),
      band,
      score: null,
      assigned: assigned.prompts.has(e.prompt_id as string),
      reportHref: band != null ? `/activities/essay/${id}` : null,
      state: band != null ? "graded" : "pending",
    });
  }

  // ── reading ──────────────────────────────────────────────────────────────
  for (const r of (readingRes.data ?? []) as Record<string, unknown>[]) {
    const done = r.status === "submitted" || r.band != null;
    rows.push({
      id: r.id as string,
      studentId: r.student_id as string,
      studentName: nameOf.get(r.student_id as string) ?? "—",
      skill: "reading",
      when: String(r.created_at),
      band: r.band == null ? null : Number(r.band),
      score: r.correct_count == null ? null : `${r.correct_count}/${r.total_questions ?? "?"}`,
      assigned: assigned.tests.has(r.test_id as string),
      reportHref: done ? `/activities/reading/${r.id as string}` : null,
      state: done ? "graded" : "pending",
    });
  }

  // ── listening ────────────────────────────────────────────────────────────
  // Scored out of 40 rather than banded, so it never carries a band.
  for (const l of (listeningRes.data ?? []) as Record<string, unknown>[]) {
    const scored = l.score != null;
    rows.push({
      id: l.id as string,
      studentId: l.student_id as string,
      studentName: nameOf.get(l.student_id as string) ?? "—",
      skill: "listening",
      when: String(l.created_at),
      band: null,
      score: scored ? `${l.score}/${l.max_score ?? 40}` : null,
      assigned: false,
      reportHref: scored ? `/listen/results/${l.id as string}` : null,
      state: scored ? "graded" : "pending",
    });
  }

  return rows.sort((a, b) => b.when.localeCompare(a.when)).slice(0, limit);
}
