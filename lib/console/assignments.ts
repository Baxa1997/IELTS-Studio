import "server-only";

import { weakestCriteria } from "@/lib/console/criteria";
import { createClient } from "@/lib/supabase/server";

export type AssignmentKind = "writing" | "reading" | "listening" | "lesson";

export interface AssignmentSummary {
  id: string;
  kind: AssignmentKind;
  title: string;
  dueAt: string | null;
  createdAt: string;
  /** Group members who have a graded attempt at this content. */
  completed: number;
  /** Members who have STARTED it — a superset of `completed`. The board needs
   *  both: 3 of 3 submitted with 1 marked is a different sentence from 1 of 3
   *  handed in, and `completed` alone cannot tell them apart. */
  submitted: number;
  /** Mean band across the members who have one, rounded to the IELTS half.
   *  Null where the kind has no band at all (listening stores a raw score;
   *  lessons store marks out of a maximum) — an averaged number in a column
   *  headed "Band" has to BE a band. */
  band: number | null;
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
  /**
   * The learner's OWN feedback page for this piece of work — the marked-up
   * essay, the per-answer reading explanations, the listening transcript.
   *
   * This report used to stop at a band and a capping criterion, which tells a
   * teacher that Dilnoza is a 6.0 held back by Coherence but not one word she
   * actually wrote. Null until the work is graded; those four pages gate on RLS
   * rather than role, so staff and student read the identical page.
   */
  reportHref: string | null;
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
  /**
   * The content behind this assignment, so it can be kept (§9). Null for
   * listening, which the library does not hold yet.
   */
  source: { kind: "writing_prompt" | "reading_test"; refId: string } | null;
  /** Already on the shelf — the button says "Saved" rather than offering again. */
  inLibrary: boolean;
  /** Mean band across graded attempts, or null when nobody has finished. */
  averageBand: number | null;
  /** Lessons only: the class's mean mark, e.g. "6.4 / 10". A lesson has no
   *  band, so `averageBand` is null for one and this carries the headline
   *  number instead. */
  averageMark: string | null;
  /** Most common weaknesses across the group, worst first. */
  commonMistakes: { label: string; count: number }[];
}

/** Assignments for one group, newest first, with a completion count. */
export async function loadGroupAssignments(groupId: string): Promise<AssignmentSummary[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("assignments")
    .select(
      "id, kind, title, due_at, created_at, prompt_id, reading_test_id, listening_library_id, lesson_id",
    )
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
  const lessonIds = rows.filter((r) => r.lesson_id).map((r) => r.lesson_id as string);

  // A few queries for the whole list rather than one per assignment.
  const [essaysRes, attemptsRes, listeningRes, lessonRes] = await Promise.all([
    promptIds.length > 0 && memberIds.length > 0
      ? supabase
          .from("essays")
          .select("id, prompt_id, student_id, status")
          .in("prompt_id", promptIds)
          .in("student_id", memberIds)
      : Promise.resolve({ data: [] }),
    testIds.length > 0 && memberIds.length > 0
      ? supabase
          .from("reading_attempts")
          .select("test_id, student_id, status, band")
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
    lessonIds.length > 0 && memberIds.length > 0
      ? supabase
          .from("lesson_attempts")
          .select("lesson_id, student_id, score, max_score")
          .in("lesson_id", lessonIds)
          .in("student_id", memberIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Writing is the one kind whose band is not on the attempt: `gradings` holds
  // one row per marking run, so the essays have to be resolved in a second
  // pass. Only graded essays are asked for, which is usually a short list.
  const essays = (essaysRes.data ?? []) as {
    id: string;
    prompt_id: string;
    student_id: string;
    status: string;
  }[];
  const bandByEssay = new Map<string, number>();
  const gradedEssayIds = essays.filter((e) => e.status === "graded").map((e) => e.id);
  if (gradedEssayIds.length > 0) {
    const { data: gradings } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, created_at")
      .in("essay_id", gradedEssayIds)
      .order("created_at", { ascending: true });
    // Ascending, so the last write wins: after a revision is re-marked, the
    // current band is the newest run, not the first.
    for (const g of (gradings ?? []) as { essay_id: string; overall_band: number | null }[]) {
      if (g.overall_band != null) bandByEssay.set(g.essay_id, Number(g.overall_band));
    }
  }

  const done = new Map<string, Set<string>>();
  const started = new Map<string, Set<string>>();
  const bands = new Map<string, number[]>();
  const mark = (key: string, student: string) => {
    const set = done.get(key) ?? new Set<string>();
    set.add(student);
    done.set(key, set);
  };
  const touch = (key: string, student: string) => {
    const set = started.get(key) ?? new Set<string>();
    set.add(student);
    started.set(key, set);
  };
  const score = (key: string, band: number) => bands.set(key, [...(bands.get(key) ?? []), band]);

  for (const e of essays) {
    touch(e.prompt_id, e.student_id);
    if (e.status !== "graded") continue;
    mark(e.prompt_id, e.student_id);
    const band = bandByEssay.get(e.id);
    if (band != null) score(e.prompt_id, band);
  }
  for (const a of (attemptsRes.data ?? []) as {
    test_id: string;
    student_id: string;
    status: string;
    band: number | null;
  }[]) {
    touch(a.test_id, a.student_id);
    if (a.status !== "graded") continue;
    mark(a.test_id, a.student_id);
    if (a.band != null) score(a.test_id, Number(a.band));
  }
  // Listening has no status column — a score is the grade. It has no band
  // either, so it contributes nothing to the average.
  for (const l of (listeningRes.data ?? []) as {
    library_id: string;
    student_id: string;
    score: number | null;
  }[]) {
    touch(l.library_id, l.student_id);
    if (l.score != null) mark(l.library_id, l.student_id);
  }
  // A lesson attempt row IS the hand-in: it is written when the student
  // submits, and it is marked out of a maximum rather than banded.
  for (const l of (lessonRes.data ?? []) as {
    lesson_id: string;
    student_id: string;
    max_score: number | null;
  }[]) {
    touch(l.lesson_id, l.student_id);
    mark(l.lesson_id, l.student_id);
  }

  return rows.map((r) => {
    // `lesson_id` belongs in this chain. Without it every practice-AI lesson
    // set to a class resolved to `undefined`, found nothing, and reported nobody
    // had done it — for ever, however many students had.
    const key = (r.prompt_id ??
      r.reading_test_id ??
      r.listening_library_id ??
      r.lesson_id) as string;
    const measured = bands.get(key) ?? [];
    return {
      id: r.id as string,
      kind: r.kind as AssignmentKind,
      title: r.title as string,
      dueAt: (r.due_at as string | null) ?? null,
      createdAt: r.created_at as string,
      completed: done.get(key)?.size ?? 0,
      submitted: started.get(key)?.size ?? 0,
      band:
        measured.length > 0
          ? Math.round((measured.reduce((n, b) => n + b, 0) / measured.length) * 2) / 2
          : null,
    };
  });
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
      "id, kind, title, instructions, due_at, group_id, prompt_id, reading_test_id, listening_library_id, lesson_id",
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
        : a.kind === "lesson"
          ? await lessonRows(supabase, a.lesson_id as string, memberIds, names)
          : await listeningRows(supabase, a.listening_library_id as string, memberIds, names);

  const graded = rows.filter((r) => r.band != null);
  const averageBand =
    graded.length > 0
      ? Math.round((graded.reduce((s, r) => s + (r.band ?? 0), 0) / graded.length) * 10) / 10
      : null;

  // A lesson's headline number. Read back out of the score strings rather than
  // threaded through a second return value: the format is this file's own and
  // one regex here is cheaper than a shape every other kind has to carry null in.
  let averageMark: string | null = null;
  if (a.kind === "lesson") {
    const marks = rows
      .map((r) => /^(\d+(?:\.\d+)?) \/ (\d+)$/.exec(r.score ?? ""))
      .filter((m): m is RegExpExecArray => m != null)
      .map((m) => ({ got: Number(m[1]), max: Number(m[2]) }));
    if (marks.length > 0) {
      const mean = marks.reduce((n, m) => n + m.got, 0) / marks.length;
      averageMark = `${Math.round(mean * 10) / 10} / ${marks[0].max}`;
    }
  }

  const tally = new Map<string, number>();
  for (const r of rows) {
    if (!r.weakness) continue;
    // Reading rows list several types ("matching headings (3), true/false (2)");
    // a writing row carries one criterion, or two joined by "+" when the essay
    // was held back equally by both. Splitting on only one separator would
    // tally "Coherence & Cohesion + Lexical Resource" as a third category that
    // is neither of them.
    for (const part of r.weakness.split(/,\s|\s\+\s/)) {
      tally.set(part, (tally.get(part) ?? 0) + 1);
    }
  }

  const source =
    a.kind === "writing" && a.prompt_id
      ? ({ kind: "writing_prompt", refId: a.prompt_id as string } as const)
      : a.kind === "reading" && a.reading_test_id
        ? ({ kind: "reading_test", refId: a.reading_test_id as string } as const)
        : null;

  const { data: shelved } = source
    ? await supabase
        .from("practice_library")
        .select("id")
        .eq("kind", source.kind)
        .eq("ref_id", source.refId)
        .is("archived_at", null)
        .maybeSingle()
    : { data: null };

  return {
    id: a.id as string,
    kind: a.kind as AssignmentKind,
    title: a.title as string,
    source,
    inLibrary: Boolean(shelved),
    instructions: (a.instructions as string | null) ?? null,
    dueAt: (a.due_at as string | null) ?? null,
    groupId: a.group_id as string,
    groupName: (groupRes.data as { name: string } | null)?.name ?? "Group",
    rows: rows.sort(byBandThenName),
    averageBand,
    averageMark,
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
      return { studentId: id, name: names.get(id) ?? "—", status: "not_started" as const, band: null, score: null, weakness: null, reportHref: null };
    }
    if (!grading) {
      return {
        studentId: id,
        name: names.get(id) ?? "—",
        status: "in_progress" as const,
        band: null,
        score: `${essay.wordCount} words`,
        weakness: null,
        // Written but not marked — there is no feedback page to open yet.
        reportHref: null,
      };
    }
    return {
      studentId: id,
      name: names.get(id) ?? "—",
      status: "graded" as const,
      band: grading.band,
      score: `${essay.wordCount} words`,
      weakness: weakestCriterion(grading.criteria),
      reportHref: `/activities/essay/${essay.id}`,
    };
  });
}

/**
 * A practice-AI lesson's results.
 *
 * THIS BRANCH DID NOT EXIST, and its absence was invisible: `loadAssignmentReport`
 * fell through to `listeningRows` with an undefined library id, which found
 * nothing and reported a class of students who had all done the work as having
 * none of them started. Attempts have been recorded since the feature shipped —
 * marks, and a per-tag breakdown of exactly which point each student missed —
 * and nothing has ever read them back.
 *
 * NO BAND, DELIBERATELY. A lesson is marked out of a maximum, not banded. The
 * band column stays null and the score column carries "7 / 10", because a
 * number invented to fill a column headed Band is worse than an empty cell.
 *
 * The weakness column carries the tags the student actually got wrong, in the
 * same comma-separated shape reading uses — which is what lets the report's
 * existing "most missed" tally work on lessons without touching it.
 */
async function lessonRows(
  supabase: RlsClient,
  lessonId: string,
  memberIds: string[],
  names: Map<string, string>,
): Promise<AssignmentReportRow[]> {
  if (memberIds.length === 0 || !lessonId) return [];

  const { data: attempts } = await supabase
    .from("lesson_attempts")
    .select("id, student_id, score, max_score, tag_breakdown, created_at")
    .eq("lesson_id", lessonId)
    .in("student_id", memberIds)
    .order("created_at", { ascending: true });

  // Latest attempt per student: a lesson can be redone, and the current
  // understanding is the most recent one, not the first.
  const byStudent = new Map<
    string,
    { score: number; max: number; tags: Record<string, { attempted?: number; correct?: number }> | null }
  >();
  for (const at of (attempts ?? []) as {
    student_id: string;
    score: number | null;
    max_score: number | null;
    tag_breakdown: Record<string, { attempted?: number; correct?: number }> | null;
  }[]) {
    byStudent.set(at.student_id, {
      score: at.score ?? 0,
      max: at.max_score ?? 0,
      tags: at.tag_breakdown,
    });
  }

  return memberIds.map((id) => {
    const name = names.get(id) ?? "—";
    const at = byStudent.get(id);
    if (!at) {
      return {
        studentId: id,
        name,
        status: "not_started" as const,
        band: null,
        score: null,
        weakness: null,
        reportHref: null,
      };
    }
    // A row with no maximum is a lesson opened and abandoned before anything
    // was marked — handed in is what `max_score` records, not merely started.
    if (at.max === 0) {
      return {
        studentId: id,
        name,
        status: "in_progress" as const,
        band: null,
        score: null,
        weakness: null,
        reportHref: null,
      };
    }
    return {
      studentId: id,
      name,
      status: "graded" as const,
      band: null,
      score: `${at.score} / ${at.max}`,
      weakness: missedTags(at.tags),
      reportHref: null,
    };
  });
}

/** The points this student got wrong, worst first, at most three. More than
 *  that stops being a diagnosis and becomes the whole lesson back. */
function missedTags(
  breakdown: Record<string, { attempted?: number; correct?: number }> | null,
): string | null {
  if (!breakdown) return null;
  const missed = Object.entries(breakdown)
    .map(([tag, v]) => ({ tag, wrong: (v.attempted ?? 0) - (v.correct ?? 0) }))
    .filter((t) => t.wrong > 0)
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 3)
    // The tally that consumes this splits on ", ", so a tag may not contain one.
    .map((t) => t.tag.replace(/[-_]+/g, " ").replace(/,/g, " ").trim())
    .filter((t) => t.length > 0);
  return missed.length > 0 ? missed.join(", ") : null;
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
    .select("id, student_id, status, band, correct_count, total_questions, type_breakdown, created_at")
    .eq("test_id", testId)
    .in("student_id", memberIds)
    .order("created_at", { ascending: true });

  const byStudent = new Map<string, (typeof attempts extends null ? never : NonNullable<typeof attempts>[number])>();
  for (const at of attempts ?? []) byStudent.set(at.student_id as string, at);

  return memberIds.map((id) => {
    const at = byStudent.get(id);
    if (!at) {
      return { studentId: id, name: names.get(id) ?? "—", status: "not_started" as const, band: null, score: null, weakness: null, reportHref: null };
    }
    if (at.status !== "graded" || at.band == null) {
      return { studentId: id, name: names.get(id) ?? "—", status: "in_progress" as const, band: null, score: null, weakness: null, reportHref: null };
    }
    return {
      studentId: id,
      name: names.get(id) ?? "—",
      status: "graded" as const,
      band: Number(at.band),
      score: `${at.correct_count ?? 0} / ${at.total_questions ?? 0}`,
      weakness: worstQuestionTypes(at.type_breakdown as Record<string, { attempted?: number; correct?: number }> | null),
      reportHref: `/activities/reading/${at.id as string}`,
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
    .select("id, student_id, score, max_score, created_at")
    .eq("library_id", libraryId)
    .in("student_id", memberIds)
    .order("created_at", { ascending: true });

  const byStudent = new Map<string, { id: string; score: number | null; max: number | null }>();
  for (const at of (attempts ?? []) as {
    id: string;
    student_id: string;
    score: number | null;
    max_score: number | null;
  }[]) {
    byStudent.set(at.student_id, { id: at.id, score: at.score, max: at.max_score });
  }

  return memberIds.map((id) => {
    const at = byStudent.get(id);
    const name = names.get(id) ?? "—";
    if (!at) {
      return { studentId: id, name, status: "not_started" as const, band: null, score: null, weakness: null, reportHref: null };
    }
    if (at.score == null) {
      return { studentId: id, name, status: "in_progress" as const, band: null, score: null, weakness: null, reportHref: null };
    }
    return {
      studentId: id,
      name,
      status: "graded" as const,
      band: null,
      score: `${at.score} / ${at.max ?? 0}`,
      weakness: null,
      reportHref: `/listen/results/${at.id}`,
    };
  });
}

/**
 * What capped this essay — the THIRD copy of the tie-break bug, and the one on
 * the page a teacher actually plans a lesson from.
 *
 * The old rule walked `Object.entries` and kept the first strict minimum, and
 * the grader always writes CC first. So every essay scoring the same on all
 * four criteria — 47 of 74 on the real corpus — was reported as capped by
 * Coherence & Cohesion, both in this row and in `commonMistakes`, the panel
 * headed "What the group struggled with". A whole class could be told to work
 * on cohesion because of JSON key order.
 *
 * Two criteria tied at the bottom are both named; all four tied names none,
 * because a uniformly 5.0 essay has no weak spot.
 */
function weakestCriterion(criteria: Record<string, unknown>): string | null {
  const capping = weakestCriteria(criteria as Record<string, { band?: number }>);
  return capping.length > 0 ? capping.join(" + ") : null;
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
