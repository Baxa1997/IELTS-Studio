import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AssignmentKind = "writing" | "reading" | "listening";

export interface AssignmentSummary {
  id: string;
  kind: AssignmentKind;
  title: string;
  dueAt: string | null;
  createdAt: string;
  /** Group members who have a graded attempt at this content. */
  completed: number;
}

export interface AssignmentReportRow {
  studentId: string;
  name: string;
  status: "not_started" | "in_progress" | "graded";
  band: number | null;
  /** Score line — "32 / 40" for reading, word count for writing. */
  score: string | null;
  /** What went wrong: the capping criterion, or the worst question types. */
  weakness: string | null;
}

export interface AssignmentReport {
  id: string;
  kind: AssignmentKind;
  title: string;
  instructions: string | null;
  dueAt: string | null;
  groupId: string;
  groupName: string;
  rows: AssignmentReportRow[];
  /** Mean band across graded attempts, or null when nobody has finished. */
  averageBand: number | null;
  /** Most common weaknesses across the group, worst first. */
  commonMistakes: { label: string; count: number }[];
}

const CRITERION_LABEL: Record<string, string> = {
  TR: "Task Response",
  TA: "Task Achievement",
  CC: "Coherence & Cohesion",
  LR: "Lexical Resource",
  GRA: "Grammatical Range & Accuracy",
};

/** Assignments for one group, newest first, with a completion count. */
export async function loadGroupAssignments(groupId: string): Promise<AssignmentSummary[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("assignments")
    .select("id, kind, title, due_at, created_at, prompt_id, reading_test_id, listening_library_id")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (!rows || rows.length === 0) return [];

  const { data: members } = await supabase
    .from("group_members")
    .select("student_id")
    .eq("group_id", groupId);
  const memberIds = (members ?? []).map((m) => m.student_id as string);

  const promptIds = rows.filter((r) => r.prompt_id).map((r) => r.prompt_id as string);
  const testIds = rows.filter((r) => r.reading_test_id).map((r) => r.reading_test_id as string);
  const listeningIds = rows
    .filter((r) => r.listening_library_id)
    .map((r) => r.listening_library_id as string);

  // A few queries for the whole list rather than one per assignment.
  const [essaysRes, attemptsRes, listeningRes] = await Promise.all([
    promptIds.length > 0 && memberIds.length > 0
      ? supabase
          .from("essays")
          .select("prompt_id, student_id, status")
          .in("prompt_id", promptIds)
          .in("student_id", memberIds)
      : Promise.resolve({ data: [] }),
    testIds.length > 0 && memberIds.length > 0
      ? supabase
          .from("reading_attempts")
          .select("test_id, student_id, status")
          .in("test_id", testIds)
          .in("student_id", memberIds)
      : Promise.resolve({ data: [] }),
    listeningIds.length > 0 && memberIds.length > 0
      ? supabase
          .from("listening_attempts")
          .select("library_id, student_id, score")
          .in("library_id", listeningIds)
          .in("student_id", memberIds)
      : Promise.resolve({ data: [] }),
  ]);

  const done = new Map<string, Set<string>>();
  const mark = (key: string, student: string) => {
    const set = done.get(key) ?? new Set<string>();
    set.add(student);
    done.set(key, set);
  };
  for (const e of (essaysRes.data ?? []) as { prompt_id: string; student_id: string; status: string }[]) {
    if (e.status === "graded") mark(e.prompt_id, e.student_id);
  }
  for (const a of (attemptsRes.data ?? []) as { test_id: string; student_id: string; status: string }[]) {
    if (a.status === "graded") mark(a.test_id, a.student_id);
  }
  // Listening has no status column — a score is the grade.
  for (const l of (listeningRes.data ?? []) as {
    library_id: string;
    student_id: string;
    score: number | null;
  }[]) {
    if (l.score != null) mark(l.library_id, l.student_id);
  }

  return rows.map((r) => ({
    id: r.id as string,
    kind: r.kind as AssignmentKind,
    title: r.title as string,
    dueAt: (r.due_at as string | null) ?? null,
    createdAt: r.created_at as string,
    completed:
      done.get((r.prompt_id ?? r.reading_test_id ?? r.listening_library_id) as string)?.size ?? 0,
  }));
}

/**
 * The teacher's results table for one assignment: every group member, whether
 * they've done it, the band, and what cost them marks.
 *
 * Everything reads through the RLS client — a teacher can see their org's essays
 * and reading attempts, and can only reach this assignment at all if they manage
 * the group. Returns null when the assignment isn't visible.
 */
export async function loadAssignmentReport(assignmentId: string): Promise<AssignmentReport | null> {
  const supabase = await createClient();

  const { data: a } = await supabase
    .from("assignments")
    .select(
      "id, kind, title, instructions, due_at, group_id, prompt_id, reading_test_id, listening_library_id",
    )
    .eq("id", assignmentId)
    .maybeSingle();
  if (!a) return null;

  const [groupRes, membersRes] = await Promise.all([
    supabase.from("groups").select("name").eq("id", a.group_id).maybeSingle(),
    supabase.from("group_members").select("student_id").eq("group_id", a.group_id),
  ]);

  const memberIds = (membersRes.data ?? []).map((m) => m.student_id as string);
  const names = new Map<string, string>();
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", memberIds);
    for (const p of profiles ?? []) names.set(p.id as string, (p.full_name as string | null) ?? "—");
  }

  const rows: AssignmentReportRow[] =
    a.kind === "writing"
      ? await writingRows(supabase, a.prompt_id as string, memberIds, names)
      : a.kind === "reading"
        ? await readingRows(supabase, a.reading_test_id as string, memberIds, names)
        : await listeningRows(supabase, a.listening_library_id as string, memberIds, names);

  const graded = rows.filter((r) => r.band != null);
  const averageBand =
    graded.length > 0
      ? Math.round((graded.reduce((s, r) => s + (r.band ?? 0), 0) / graded.length) * 10) / 10
      : null;

  const tally = new Map<string, number>();
  for (const r of rows) {
    if (!r.weakness) continue;
    // Reading rows list several types; writing rows carry one criterion.
    for (const part of r.weakness.split(", ")) {
      tally.set(part, (tally.get(part) ?? 0) + 1);
    }
  }

  return {
    id: a.id as string,
    kind: a.kind as AssignmentKind,
    title: a.title as string,
    instructions: (a.instructions as string | null) ?? null,
    dueAt: (a.due_at as string | null) ?? null,
    groupId: a.group_id as string,
    groupName: (groupRes.data as { name: string } | null)?.name ?? "Group",
    rows: rows.sort(byBandThenName),
    averageBand,
    commonMistakes: [...tally.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((x, y) => y.count - x.count || x.label.localeCompare(y.label))
      .slice(0, 5),
  };
}

type RlsClient = Awaited<ReturnType<typeof createClient>>;

async function writingRows(
  supabase: RlsClient,
  promptId: string,
  memberIds: string[],
  names: Map<string, string>,
): Promise<AssignmentReportRow[]> {
  if (memberIds.length === 0) return [];

  const { data: essays } = await supabase
    .from("essays")
    .select("id, student_id, status, word_count, created_at")
    .eq("prompt_id", promptId)
    .in("student_id", memberIds)
    .order("created_at", { ascending: true });

  // Latest essay per student (a resubmit makes a new grading on the same essay).
  const byStudent = new Map<string, { id: string; status: string; wordCount: number }>();
  for (const e of essays ?? []) {
    byStudent.set(e.student_id as string, {
      id: e.id as string,
      status: e.status as string,
      wordCount: (e.word_count as number) ?? 0,
    });
  }

  const essayIds = [...byStudent.values()].map((e) => e.id);
  const gradingByEssay = new Map<string, { band: number; criteria: Record<string, unknown> }>();
  if (essayIds.length > 0) {
    const { data: gradings } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, criteria, created_at")
      .in("essay_id", essayIds)
      .order("created_at", { ascending: true });
    for (const g of gradings ?? []) {
      if (g.overall_band == null) continue;
      gradingByEssay.set(g.essay_id as string, {
        band: Number(g.overall_band),
        criteria: (g.criteria ?? {}) as Record<string, unknown>,
      });
    }
  }

  return memberIds.map((id) => {
    const essay = byStudent.get(id);
    const grading = essay ? gradingByEssay.get(essay.id) : undefined;
    if (!essay) {
      return { studentId: id, name: names.get(id) ?? "—", status: "not_started" as const, band: null, score: null, weakness: null };
    }
    if (!grading) {
      return {
        studentId: id,
        name: names.get(id) ?? "—",
        status: "in_progress" as const,
        band: null,
        score: `${essay.wordCount} words`,
        weakness: null,
      };
    }
    return {
      studentId: id,
      name: names.get(id) ?? "—",
      status: "graded" as const,
      band: grading.band,
      score: `${essay.wordCount} words`,
      weakness: weakestCriterion(grading.criteria),
    };
  });
}

async function readingRows(
  supabase: RlsClient,
  testId: string,
  memberIds: string[],
  names: Map<string, string>,
): Promise<AssignmentReportRow[]> {
  if (memberIds.length === 0) return [];

  const { data: attempts } = await supabase
    .from("reading_attempts")
    .select("student_id, status, band, correct_count, total_questions, type_breakdown, created_at")
    .eq("test_id", testId)
    .in("student_id", memberIds)
    .order("created_at", { ascending: true });

  const byStudent = new Map<string, (typeof attempts extends null ? never : NonNullable<typeof attempts>[number])>();
  for (const at of attempts ?? []) byStudent.set(at.student_id as string, at);

  return memberIds.map((id) => {
    const at = byStudent.get(id);
    if (!at) {
      return { studentId: id, name: names.get(id) ?? "—", status: "not_started" as const, band: null, score: null, weakness: null };
    }
    if (at.status !== "graded" || at.band == null) {
      return { studentId: id, name: names.get(id) ?? "—", status: "in_progress" as const, band: null, score: null, weakness: null };
    }
    return {
      studentId: id,
      name: names.get(id) ?? "—",
      status: "graded" as const,
      band: Number(at.band),
      score: `${at.correct_count ?? 0} / ${at.total_questions ?? 0}`,
      weakness: worstQuestionTypes(at.type_breakdown as Record<string, { attempted?: number; correct?: number }> | null),
    };
  });
}

/**
 * Listening rows. There is no band on the attempt and no per-question type
 * breakdown to rank, so the report is honest about what it has: raw score out of
 * the maximum, and nothing invented in the weakness column.
 */
async function listeningRows(
  supabase: RlsClient,
  libraryId: string,
  memberIds: string[],
  names: Map<string, string>,
): Promise<AssignmentReportRow[]> {
  if (memberIds.length === 0) return [];

  const { data: attempts } = await supabase
    .from("listening_attempts")
    .select("student_id, score, max_score, created_at")
    .eq("library_id", libraryId)
    .in("student_id", memberIds)
    .order("created_at", { ascending: true });

  const byStudent = new Map<string, { score: number | null; max: number | null }>();
  for (const at of (attempts ?? []) as {
    student_id: string;
    score: number | null;
    max_score: number | null;
  }[]) {
    byStudent.set(at.student_id, { score: at.score, max: at.max_score });
  }

  return memberIds.map((id) => {
    const at = byStudent.get(id);
    const name = names.get(id) ?? "—";
    if (!at) {
      return { studentId: id, name, status: "not_started" as const, band: null, score: null, weakness: null };
    }
    if (at.score == null) {
      return { studentId: id, name, status: "in_progress" as const, band: null, score: null, weakness: null };
    }
    return {
      studentId: id,
      name,
      status: "graded" as const,
      band: null,
      score: `${at.score} / ${at.max ?? 0}`,
      weakness: null,
    };
  });
}

/** The lowest-scoring criterion — the thing capping this essay's band. */
function weakestCriterion(criteria: Record<string, unknown>): string | null {
  let worst: { key: string; band: number } | null = null;
  for (const [key, value] of Object.entries(criteria ?? {})) {
    const band = Number((value as { band?: unknown })?.band);
    if (!Number.isFinite(band)) continue;
    if (!worst || band < worst.band) worst = { key, band };
  }
  return worst ? (CRITERION_LABEL[worst.key] ?? worst.key) : null;
}

/** Question types this student got wrong most often (at most two). */
function worstQuestionTypes(
  breakdown: Record<string, { attempted?: number; correct?: number }> | null,
): string | null {
  if (!breakdown) return null;
  const missed = Object.entries(breakdown)
    .map(([type, v]) => ({ type, wrong: (v?.attempted ?? 0) - (v?.correct ?? 0) }))
    .filter((t) => t.wrong > 0)
    .sort((x, y) => y.wrong - x.wrong)
    .slice(0, 2)
    .map((t) => `${t.type.replaceAll("_", " ")} (${t.wrong})`);
  return missed.length > 0 ? missed.join(", ") : null;
}

/** Lowest band first — the students who need attention are the point of this table. */
function byBandThenName(a: AssignmentReportRow, b: AssignmentReportRow): number {
  if (a.band == null && b.band == null) return a.name.localeCompare(b.name);
  if (a.band == null) return 1;
  if (b.band == null) return -1;
  return a.band - b.band || a.name.localeCompare(b.name);
}
