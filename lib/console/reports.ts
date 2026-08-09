import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * The center report: how each class is doing, where the marks are being lost,
 * and who has stopped practising.
 *
 * Two scopes, one query set — a center_admin sees every class, a teacher sees
 * the ones they own. RLS narrows most of it already (a teacher can only read
 * their own students' work since 20260808130000); the group filter here decides
 * whose columns appear, not what is readable.
 *
 * Every number is graded work only, the same definition the roster uses
 * (v_practice_activity). Nothing is averaged across skills — an "overall band"
 * built from whichever skills a student happened to practise would be a number
 * we invented, and this report exists to be defensible in front of a center
 * owner.
 */

export interface GroupReportRow {
  id: string;
  name: string;
  /** Join key for per-teacher roll-ups — names are not unique, ids are. */
  teacherId: string | null;
  teacherName: string | null;
  students: number;
  assignments: number;
  /** Share of (member × assignment) pairs that have a graded attempt, 0–100. */
  completionPct: number | null;
  averageBand: number | null;
}

export interface CenterReport {
  scope: "center" | "teacher";
  totals: { students: number; groups: number; gradedPractices: number };
  groups: GroupReportRow[];
  /** Bands awarded in the window, bucketed by half band. */
  bandBuckets: { label: string; value: number }[];
  /** Mean band per skill, with how many gradings it rests on. */
  skillAverages: { skill: string; band: number | null; samples: number }[];
  /** How often each writing criterion was the one capping the essay. */
  writingCaps: { label: string; value: number; hint: string }[];
  /** Reading question types by total wrong answers. */
  readingMisses: { label: string; value: number }[];
  /** Students with no graded practice in the last 14 days. */
  atRisk: { id: string; name: string; lastActive: string | null }[];
}

const CRITERION_LABEL: Record<string, string> = {
  TR: "Task Response",
  TA: "Task Achievement",
  CC: "Coherence & Cohesion",
  LR: "Lexical Resource",
  GRA: "Grammatical Range & Accuracy",
};

const WINDOW_DAYS = 90;
const AT_RISK_DAYS = 14;

export async function loadCenterReport(opts: {
  role: string;
  profileId: string;
  now?: Date;
}): Promise<CenterReport> {
  const supabase = await createClient();
  const now = opts.now ?? new Date();
  const isAdmin = opts.role === "center_admin";
  const since = new Date(now.getTime() - WINDOW_DAYS * 86400_000).toISOString();

  const [groupsRes, membersRes, assignmentsRes, staffRes] = await Promise.all([
    supabase.from("groups").select("id, name, teacher_id").order("name"),
    supabase.from("group_members").select("group_id, student_id"),
    supabase
      .from("assignments")
      .select("id, group_id, kind, prompt_id, reading_test_id, listening_library_id"),
    supabase.from("profiles").select("id, full_name, role"),
  ]);

  const allGroups = (groupsRes.data ?? []) as { id: string; name: string; teacher_id: string | null }[];
  const groups = isAdmin ? allGroups : allGroups.filter((g) => g.teacher_id === opts.profileId);
  const groupIds = new Set(groups.map((g) => g.id));

  const staffName = new Map(
    ((staffRes.data ?? []) as { id: string; full_name: string | null; role: string }[]).map((p) => [
      p.id,
      p.full_name ?? "Unnamed",
    ]),
  );

  const membersOf = new Map<string, string[]>();
  for (const m of (membersRes.data ?? []) as { group_id: string; student_id: string }[]) {
    if (!groupIds.has(m.group_id)) continue;
    membersOf.set(m.group_id, [...(membersOf.get(m.group_id) ?? []), m.student_id]);
  }
  const studentIds = [...new Set([...membersOf.values()].flat())];

  const assignments = ((assignmentsRes.data ?? []) as {
    id: string;
    group_id: string;
    kind: string;
    prompt_id: string | null;
    reading_test_id: string | null;
    listening_library_id: string | null;
  }[]).filter((a) => groupIds.has(a.group_id));

  if (studentIds.length === 0) {
    return {
      scope: isAdmin ? "center" : "teacher",
      totals: { students: 0, groups: groups.length, gradedPractices: 0 },
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        teacherId: g.teacher_id,
        teacherName: g.teacher_id ? (staffName.get(g.teacher_id) ?? null) : null,
        students: 0,
        assignments: assignments.filter((a) => a.group_id === g.id).length,
        completionPct: null,
        averageBand: null,
      })),
      bandBuckets: [],
      skillAverages: [],
      writingCaps: [],
      readingMisses: [],
      atRisk: [],
    };
  }

  // --- graded work in scope --------------------------------------------------
  const [essaysRes, readingRes, listeningRes, speakingRes] = await Promise.all([
    supabase
      .from("essays")
      .select("id, student_id, prompt_id, created_at")
      .in("student_id", studentIds)
      .eq("status", "graded")
      .gte("created_at", since),
    supabase
      .from("reading_attempts")
      .select("student_id, test_id, band, type_breakdown, created_at")
      .in("student_id", studentIds)
      .eq("status", "graded")
      .gte("created_at", since),
    supabase
      .from("listening_attempts")
      .select("student_id, library_id, score, max_score, created_at")
      .in("student_id", studentIds)
      .gte("created_at", since),
    supabase
      .from("speaking_sessions")
      .select("student_id, result, started_at")
      .in("student_id", studentIds)
      .eq("state", "graded")
      .gte("started_at", since),
  ]);

  const essays = (essaysRes.data ?? []) as {
    id: string;
    student_id: string;
    prompt_id: string | null;
    created_at: string;
  }[];

  // Latest grading per essay: band + which criterion capped it.
  const essayBand = new Map<string, number>();
  const essayCap = new Map<string, string>();
  if (essays.length > 0) {
    const { data: gradings } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, criteria, created_at")
      .in(
        "essay_id",
        essays.map((e) => e.id),
      )
      .order("created_at", { ascending: true });
    for (const g of (gradings ?? []) as {
      essay_id: string;
      overall_band: number | null;
      criteria: Record<string, { band?: number }> | null;
    }[]) {
      if (g.overall_band == null) continue;
      essayBand.set(g.essay_id, Number(g.overall_band));
      const cap = weakestCriterion(g.criteria ?? {});
      if (cap) essayCap.set(g.essay_id, cap);
    }
  }

  // --- band distribution + per-skill averages --------------------------------
  const bands: number[] = [];
  const bySkill: Record<string, number[]> = { writing: [], reading: [], speaking: [] };
  for (const e of essays) {
    const b = essayBand.get(e.id);
    if (b != null) {
      bands.push(b);
      bySkill.writing.push(b);
    }
  }
  for (const r of (readingRes.data ?? []) as { band: number | null }[]) {
    if (r.band != null) {
      bands.push(Number(r.band));
      bySkill.reading.push(Number(r.band));
    }
  }
  for (const s of (speakingRes.data ?? []) as { result: { overall_band?: number } | null }[]) {
    const b = s.result?.overall_band;
    if (typeof b === "number") {
      bands.push(b);
      bySkill.speaking.push(b);
    }
  }

  const bucket = new Map<number, number>();
  for (const b of bands) {
    const half = Math.round(b * 2) / 2;
    bucket.set(half, (bucket.get(half) ?? 0) + 1);
  }
  const bandBuckets = [...bucket.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([band, count]) => ({ label: `Band ${band.toFixed(1)}`, value: count }));

  // Listening is scored, not banded — it stays out of the band chart and gets
  // its own line as a percentage.
  const listening = (listeningRes.data ?? []) as {
    student_id: string;
    library_id: string | null;
    score: number | null;
    max_score: number | null;
    created_at: string;
  }[];
  const listeningScored = listening.filter((l) => l.score != null && (l.max_score ?? 0) > 0);

  const skillAverages = [
    { skill: "Writing", band: mean(bySkill.writing), samples: bySkill.writing.length },
    { skill: "Reading", band: mean(bySkill.reading), samples: bySkill.reading.length },
    { skill: "Speaking", band: mean(bySkill.speaking), samples: bySkill.speaking.length },
  ];

  // --- what keeps costing marks ----------------------------------------------
  const capTally = new Map<string, number>();
  for (const cap of essayCap.values()) capTally.set(cap, (capTally.get(cap) ?? 0) + 1);
  const gradedEssays = essayBand.size;
  const writingCaps = [...capTally.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({
      label,
      value: count,
      hint:
        gradedEssays > 0
          ? `${Math.round((count / gradedEssays) * 100)}% of graded essays`
          : `${count}`,
    }));

  const missTally = new Map<string, number>();
  for (const r of (readingRes.data ?? []) as {
    type_breakdown: Record<string, { attempted?: number; correct?: number }> | null;
  }[]) {
    for (const [type, v] of Object.entries(r.type_breakdown ?? {})) {
      const wrong = (v?.attempted ?? 0) - (v?.correct ?? 0);
      if (wrong > 0) missTally.set(type, (missTally.get(type) ?? 0) + wrong);
    }
  }
  const readingMisses = [...missTally.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([type, count]) => ({ label: type.replaceAll("_", " "), value: count }));

  // --- per-group completion + average band -----------------------------------
  const doneByContent = new Map<string, Set<string>>();
  const bandByContent = new Map<string, number[]>();
  const note = (contentId: string | null, student: string, band: number | null) => {
    if (!contentId) return;
    const set = doneByContent.get(contentId) ?? new Set<string>();
    set.add(student);
    doneByContent.set(contentId, set);
    if (band != null) bandByContent.set(contentId, [...(bandByContent.get(contentId) ?? []), band]);
  };
  for (const e of essays) note(e.prompt_id, e.student_id, essayBand.get(e.id) ?? null);
  for (const r of (readingRes.data ?? []) as {
    student_id: string;
    test_id: string | null;
    band: number | null;
  }[]) {
    note(r.test_id, r.student_id, r.band != null ? Number(r.band) : null);
  }
  for (const l of listeningScored) note(l.library_id, l.student_id, null);

  const groupRows: GroupReportRow[] = groups.map((g) => {
    const members = membersOf.get(g.id) ?? [];
    const groupAssignments = assignments.filter((a) => a.group_id === g.id);

    let expected = 0;
    let completed = 0;
    const groupBands: number[] = [];
    for (const a of groupAssignments) {
      const contentId = a.prompt_id ?? a.reading_test_id ?? a.listening_library_id;
      if (!contentId) continue;
      expected += members.length;
      const finishers = doneByContent.get(contentId);
      if (finishers) completed += members.filter((m) => finishers.has(m)).length;
      groupBands.push(...(bandByContent.get(contentId) ?? []));
    }

    return {
      id: g.id,
      name: g.name,
      teacherId: g.teacher_id,
      teacherName: g.teacher_id ? (staffName.get(g.teacher_id) ?? null) : null,
      students: members.length,
      assignments: groupAssignments.length,
      completionPct: expected > 0 ? Math.round((completed / expected) * 100) : null,
      averageBand: mean(groupBands),
    };
  });

  // --- who has gone quiet ----------------------------------------------------
  const lastActive = new Map<string, string>();
  const seen = (student: string, at: string | null) => {
    if (!at) return;
    if (!lastActive.has(student) || at > lastActive.get(student)!) lastActive.set(student, at);
  };
  for (const e of essays) seen(e.student_id, e.created_at);
  for (const r of (readingRes.data ?? []) as { student_id: string; created_at: string }[]) {
    seen(r.student_id, r.created_at);
  }
  for (const l of listening) seen(l.student_id, l.created_at);
  for (const s of (speakingRes.data ?? []) as { student_id: string; started_at: string }[]) {
    seen(s.student_id, s.started_at);
  }

  const cutoff = new Date(now.getTime() - AT_RISK_DAYS * 86400_000).toISOString();
  const atRisk = studentIds
    .map((id) => ({ id, name: staffName.get(id) ?? "Unnamed", lastActive: lastActive.get(id) ?? null }))
    .filter((s) => s.lastActive == null || s.lastActive < cutoff)
    .sort((a, b) => (a.lastActive ?? "").localeCompare(b.lastActive ?? ""));

  return {
    scope: isAdmin ? "center" : "teacher",
    totals: {
      students: studentIds.length,
      groups: groups.length,
      gradedPractices:
        essayBand.size +
        ((readingRes.data ?? []) as { band: number | null }[]).filter((r) => r.band != null).length +
        listeningScored.length +
        (speakingRes.data ?? []).length,
    },
    groups: groupRows,
    bandBuckets,
    skillAverages,
    writingCaps,
    readingMisses,
    atRisk,
  };
}

function mean(xs: number[]): number | null {
  if (xs.length === 0) return null;
  return Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10;
}

/** The lowest-scoring criterion — the thing that capped this essay's band. */
function weakestCriterion(criteria: Record<string, { band?: number }>): string | null {
  let worst: { key: string; band: number } | null = null;
  for (const [key, value] of Object.entries(criteria ?? {})) {
    const band = Number(value?.band);
    if (!Number.isFinite(band)) continue;
    if (!worst || band < worst.band) worst = { key, band };
  }
  return worst ? (CRITERION_LABEL[worst.key] ?? worst.key) : null;
}
