import "server-only";

import { type MemberStatus } from "@/lib/console/status";
import { resolveWindow, type RangeKey, type Window } from "@/lib/console/window";
import { createClient } from "@/lib/supabase/server";

/**
 * The center report: how each group is doing, where the marks are being lost,
 * and who has stopped practising.
 *
 * Two scopes, one query set — a center_admin sees every group, a teacher sees
 * the ones they own. RLS narrows most of it already (a teacher can only read
 * their own students' work since 20260808130000); the group filter here decides
 * whose columns appear, not what is readable.
 *
 * NOTHING IS AVERAGED ACROSS SKILLS. This file used to claim that in a comment
 * while doing the opposite: writing, reading and speaking bands went into one
 * pool for the trend line, the distribution and every group's "average band". A
 * 6.5 in Reading and a 5.0 in Writing are not two measurements of one quantity,
 * and their mean is a number nobody can act on — a group told it averages 5.75
 * learns nothing about what to teach on Thursday. Every figure below is either
 * per-skill and carries its sample size, or it is not a band at all.
 *
 * SAMPLE SIZE TRAVELS WITH THE BAND, always. `1.0` from a single essay is noise
 * presented as fact, and under three attempts a figure is marked provisional so
 * it cannot be quoted at a parent.
 */

/** One skill's standing, and how much it rests on. Never combined with another. */
export interface SkillFigure {
  skill: SkillName;
  band: number | null;
  /** Graded pieces of work behind the band. */
  attempts: number;
  /** Distinct students behind it — three essays by one person is one opinion. */
  students: number;
  /** Under three attempts. The band still shows, greyed and labelled. */
  provisional: boolean;
}

export const SKILLS = ["Writing", "Reading", "Listening", "Speaking"] as const;
export type SkillName = (typeof SKILLS)[number];

/** Below this, a band is displayed but must be marked as provisional. */
export const PROVISIONAL_BELOW = 3;

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
  /** Per skill, in `SKILLS` order. Skills with no work have a null band. */
  bySkill: SkillFigure[];
  /** The headline: Writing, because it is graded most and means the most. */
  writing: SkillFigure;
}

export interface CenterReport {
  scope: "center" | "teacher";
  /** The range every figure below was measured over, so captions can say it
   *  once and cannot drift from what was actually counted. */
  window: { key: RangeKey; label: string; days: number };
  totals: { students: number; groups: number; gradedPractices: number };
  groups: GroupReportRow[];
  /** Band distribution per skill — a histogram, never a mean. */
  bandBuckets: Record<SkillName, { label: string; value: number }[]>;
  /** Mean band per calendar month, per skill. */
  bandTrend: Record<SkillName, { key: string; label: string; band: number | null; samples: number }[]>;
  /** Where each skill stands across the whole scope. */
  skillAverages: SkillFigure[];
  /** How often each writing criterion was the one capping the essay. */
  writingCaps: { label: string; value: number; hint: string; students: number }[];
  /** Students with at least one graded essay — the denominator `writingCaps`
   *  is a share of. Without it a count of 8 has nothing to be 8 out of. */
  writersGraded: number;
  /** Reading question types by total wrong answers. */
  readingMisses: { label: string; value: number }[];
  /** Students with no graded practice in the last 14 days. Paused students are
   *  excluded — they are on a break, not slipping away. */
  atRisk: { id: string; name: string; lastActive: string | null }[];
  /** Distinct students who have practised since Monday, out of those enrolled.
   *  Always relative to now — this one deliberately ignores any date picker. */
  practisedThisWeek: { students: number; of: number };
}

const CRITERION_LABEL: Record<string, string> = {
  TR: "Task Response",
  TA: "Task Achievement",
  CC: "Coherence & Cohesion",
  LR: "Lexical Resource",
  GRA: "Grammatical Range & Accuracy",
};

/**
 * DELIBERATELY FIXED, and it must stay that way (R1).
 *
 * "Gone quiet" answers "who should someone ring this week". Letting the page's
 * date picker widen it to a year would turn a call list into a history lesson,
 * and a reader who moved the picker would have no way to tell which of the
 * numbers in front of them had moved with it. Anything on this page that
 * ignores the picker says `always current` beside itself.
 */
const AT_RISK_DAYS = 14;

export async function loadCenterReport(opts: {
  role: string;
  profileId: string;
  /** The page's date range. Governs every band, count and completion below. */
  range?: RangeKey;
  now?: Date;
}): Promise<CenterReport> {
  const supabase = await createClient();
  const now = opts.now ?? new Date();
  const isAdmin = opts.role === "center_admin";
  const window: Window = resolveWindow(opts.range, now);
  const since = window.since;

  const [groupsRes, membersRes, assignmentsRes, staffRes] = await Promise.all([
    // Active groups only. A course that finished in June is not a group with no
    // practice set, and counting it made every "idle groups" figure wrong.
    supabase.from("groups").select("id, name, teacher_id").eq("status", "active").order("name"),
    supabase.from("group_members").select("group_id, student_id"),
    supabase
      .from("assignments")
      .select("id, group_id, kind, prompt_id, reading_test_id, listening_library_id"),
    supabase.from("profiles").select("id, full_name, role, member_status"),
  ]);

  const allGroups = (groupsRes.data ?? []) as { id: string; name: string; teacher_id: string | null }[];
  const groups = isAdmin ? allGroups : allGroups.filter((g) => g.teacher_id === opts.profileId);
  const groupIds = new Set(groups.map((g) => g.id));

  const people = (staffRes.data ?? []) as {
    id: string;
    full_name: string | null;
    role: string;
    member_status: string | null;
  }[];
  const staffName = new Map(people.map((p) => [p.id, p.full_name ?? "Unnamed"]));
  const statusOf = new Map(people.map((p) => [p.id, (p.member_status as MemberStatus) ?? "active"]));

  // A student who LEFT is off the roster. Their history stays in the database
  // and on their own page; what it must not do is sit in a completion
  // denominator making a group look like it never hands anything in.
  const membersOf = new Map<string, string[]>();
  for (const m of (membersRes.data ?? []) as { group_id: string; student_id: string }[]) {
    if (!groupIds.has(m.group_id)) continue;
    if (statusOf.get(m.student_id) === "left") continue;
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
      window: { key: window.key, label: window.label, days: window.days },
      totals: { students: 0, groups: groups.length, gradedPractices: 0 },
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        teacherId: g.teacher_id,
        teacherName: g.teacher_id ? (staffName.get(g.teacher_id) ?? null) : null,
        students: 0,
        assignments: assignments.filter((a) => a.group_id === g.id).length,
        completionPct: null,
        bySkill: SKILLS.map(emptyFigure),
        writing: emptyFigure("Writing"),
      })),
      bandBuckets: emptyBySkill(() => []),
      bandTrend: emptyBySkill(() => []),
      skillAverages: SKILLS.map(emptyFigure),
      writingCaps: [],
      writersGraded: 0,
      readingMisses: [],
      atRisk: [],
      practisedThisWeek: { students: 0, of: 0 },
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
      .select("id, student_id, test_id, band, type_breakdown, created_at")
      .in("student_id", studentIds)
      .eq("status", "graded")
      .gte("created_at", since),
    supabase
      .from("listening_attempts")
      .select("id, student_id, library_id, score, max_score, result, created_at")
      .in("student_id", studentIds)
      .gte("created_at", since),
    supabase
      .from("speaking_sessions")
      .select("id, student_id, result, started_at")
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

  // --- every band, kept in its own skill -------------------------------------
  // One flat list of (skill, student, band, when). Every figure below is a
  // filter over it, which is what makes accidental cross-skill mixing hard: to
  // combine two skills you would have to write code that looks wrong.
  const listening = (listeningRes.data ?? []) as {
    id: string;
    student_id: string;
    library_id: string | null;
    score: number | null;
    max_score: number | null;
    result: { band?: unknown } | null;
    created_at: string;
  }[];
  const listeningScored = listening.filter((l) => l.score != null && (l.max_score ?? 0) > 0);

  // THE CENTRE'S BAND WINS WHERE THERE IS ONE.
  //
  // A teacher who corrects a 5.5 to a 6.0 and then sees the centre report still
  // averaging 5.5 has been told their correction does not count. Every figure
  // below reads the reviewed band when a review exists and the AI's otherwise,
  // which is exactly what "final band" is supposed to mean.
  const reviewed = new Map<string, number>();
  {
    const { data: reviews } = await supabase
      .from("attempt_reviews")
      .select("kind, ref_id, final_band")
      .in("student_id", studentIds);
    for (const r of (reviews ?? []) as { kind: string; ref_id: string; final_band: number }[]) {
      reviewed.set(`${r.kind}:${r.ref_id}`, Number(r.final_band));
    }
  }
  const verdict = (kind: string, refId: string, aiBand: number): number =>
    reviewed.get(`${kind}:${refId}`) ?? aiBand;

  const marks: { skill: SkillName; student: string; band: number; at: string }[] = [];
  for (const e of essays) {
    const b = essayBand.get(e.id);
    if (b != null)
      marks.push({
        skill: "Writing",
        student: e.student_id,
        band: verdict("writing", e.id, b),
        at: e.created_at,
      });
  }
  for (const r of (readingRes.data ?? []) as {
    id: string;
    student_id: string;
    band: number | null;
    created_at: string;
  }[]) {
    if (r.band != null)
      marks.push({
        skill: "Reading",
        student: r.student_id,
        band: verdict("reading", r.id, Number(r.band)),
        at: r.created_at,
      });
  }
  for (const l of listening) {
    // The band lives in `result.band`; score/max is the raw mark behind it.
    const b = Number(l.result?.band);
    if (Number.isFinite(b) && b > 0)
      marks.push({
        skill: "Listening",
        student: l.student_id,
        band: verdict("listening", l.id, b),
        at: l.created_at,
      });
  }
  for (const s of (speakingRes.data ?? []) as {
    id: string;
    student_id: string;
    result: { overall_band?: number } | null;
    started_at: string;
  }[]) {
    const b = s.result?.overall_band;
    if (typeof b === "number")
      marks.push({
        skill: "Speaking",
        student: s.student_id,
        band: verdict("speaking", s.id, b),
        at: s.started_at,
      });
  }

  const figureFor = (skill: SkillName, pool = marks): SkillFigure => {
    const mine = pool.filter((m) => m.skill === skill);
    return {
      skill,
      band: mean(mine.map((m) => m.band)),
      attempts: mine.length,
      students: new Set(mine.map((m) => m.student)).size,
      provisional: mine.length > 0 && mine.length < PROVISIONAL_BELOW,
    };
  };

  const skillAverages = SKILLS.map((s) => figureFor(s));

  // Distribution per skill: a histogram answers "who is where", which is what a
  // center acts on. A mean answers nothing and hides the two students at 4.5.
  const bandBuckets = emptyBySkill<{ label: string; value: number }[]>((skill) => {
    const bucket = new Map<number, number>();
    for (const m of marks.filter((x) => x.skill === skill)) {
      const half = Math.round(m.band * 2) / 2;
      bucket.set(half, (bucket.get(half) ?? 0) + 1);
    }
    return [...bucket.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([band, count]) => ({ label: `Band ${band.toFixed(1)}`, value: count }));
  });

  const bandTrend = emptyBySkill<
    { key: string; label: string; band: number | null; samples: number }[]
  >((skill) => {
    const byMonth = new Map<string, number[]>();
    for (const m of marks.filter((x) => x.skill === skill)) {
      const key = m.at.slice(0, 7); // YYYY-MM
      byMonth.set(key, [...(byMonth.get(key) ?? []), m.band]);
    }
    return [...byMonth.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, xs]) => ({
        key,
        label: new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-GB", {
          month: "short",
          timeZone: "UTC",
        }),
        band: mean(xs),
        samples: xs.length,
      }));
  });

  // --- what keeps costing marks ----------------------------------------------
  // Counted by STUDENTS as well as by essays. "Coherence & Cohesion capped 12
  // essays" could be one student who wrote twelve of them; "lowest for 8 of 11
  // students" is the sentence that turns into a workshop on Thursday.
  const capTally = new Map<string, number>();
  const capStudents = new Map<string, Set<string>>();
  const ownerOfEssay = new Map(essays.map((e) => [e.id, e.student_id]));
  for (const [essayId, cap] of essayCap.entries()) {
    capTally.set(cap, (capTally.get(cap) ?? 0) + 1);
    const owner = ownerOfEssay.get(essayId);
    if (owner) capStudents.set(cap, (capStudents.get(cap) ?? new Set()).add(owner));
  }
  const writersGraded = new Set(
    [...essayBand.keys()].map((id) => ownerOfEssay.get(id)).filter(Boolean),
  ).size;
  const writingCaps = [...capTally.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => {
      const students = capStudents.get(label)?.size ?? 0;
      return {
        label,
        value: count,
        students,
        hint:
          writersGraded > 0
            ? `lowest for ${students} of ${writersGraded} student${writersGraded === 1 ? "" : "s"}`
            : `${count} essay${count === 1 ? "" : "s"}`,
      };
    });

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

  // --- per-group completion + per-skill standing -----------------------------
  const doneByContent = new Map<string, Set<string>>();
  const note = (contentId: string | null, student: string) => {
    if (!contentId) return;
    const set = doneByContent.get(contentId) ?? new Set<string>();
    set.add(student);
    doneByContent.set(contentId, set);
  };
  for (const e of essays) note(e.prompt_id, e.student_id);
  for (const r of (readingRes.data ?? []) as { student_id: string; test_id: string | null }[]) {
    note(r.test_id, r.student_id);
  }
  for (const l of listeningScored) note(l.library_id, l.student_id);

  const groupRows: GroupReportRow[] = groups.map((g) => {
    const members = membersOf.get(g.id) ?? [];
    const groupAssignments = assignments.filter((a) => a.group_id === g.id);
    const roster = new Set(members);

    let expected = 0;
    let completed = 0;
    for (const a of groupAssignments) {
      const contentId = a.prompt_id ?? a.reading_test_id ?? a.listening_library_id;
      if (!contentId) continue;
      expected += members.length;
      const finishers = doneByContent.get(contentId);
      if (finishers) completed += members.filter((m) => finishers.has(m)).length;
    }

    // A group's bands are ITS STUDENTS' bands, whether the work was homework or
    // their own practice. Scoping to assigned content only was undercounting
    // every group whose students practise on their own — which is the group
    // doing best.
    const ourMarks = marks.filter((m) => roster.has(m.student));
    const bySkill = SKILLS.map((s) => figureFor(s, ourMarks));

    return {
      id: g.id,
      name: g.name,
      teacherId: g.teacher_id,
      teacherName: g.teacher_id ? (staffName.get(g.teacher_id) ?? null) : null,
      students: members.length,
      assignments: groupAssignments.length,
      completionPct: expected > 0 ? Math.round((completed / expected) * 100) : null,
      bySkill,
      writing: bySkill.find((s) => s.skill === "Writing") ?? emptyFigure("Writing"),
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

  // A PAUSED student has not gone quiet — someone already knows why they are
  // away. Chasing them is how a center learns to ignore this list.
  const cutoff = new Date(now.getTime() - AT_RISK_DAYS * 86400_000).toISOString();
  const atRisk = studentIds
    .filter((id) => statusOf.get(id) !== "paused")
    .map((id) => ({ id, name: staffName.get(id) ?? "Unnamed", lastActive: lastActive.get(id) ?? null }))
    .filter((s) => s.lastActive == null || s.lastActive < cutoff)
    .sort((a, b) => (a.lastActive ?? "").localeCompare(b.lastActive ?? ""));

  return {
    scope: isAdmin ? "center" : "teacher",
    window: { key: window.key, label: window.label, days: window.days },
    totals: {
      students: studentIds.length,
      groups: groups.length,
      gradedPractices: marks.length,
    },
    groups: groupRows,
    bandBuckets,
    bandTrend,
    skillAverages,
    writingCaps,
    writersGraded,
    readingMisses,
    atRisk,
    practisedThisWeek: {
      students: studentIds.filter((id) => (lastActive.get(id) ?? "") >= mondayISO(now)).length,
      // Out of everyone expected to practise. Paused students are not, so
      // counting them would make a full week look like a bad one.
      of: studentIds.filter((id) => statusOf.get(id) !== "paused").length,
    },
  };
}

/** Midnight on the Monday of the current week, ISO. The week a center thinks in. */
function mondayISO(now: Date): string {
  const d = new Date(now);
  const back = (d.getUTCDay() + 6) % 7; // Sunday is the 7th day here, not the 1st
  d.setUTCDate(d.getUTCDate() - back);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/* ── shared shapes ─────────────────────────────────────────────────────────── */

const emptyFigure = (skill: SkillName): SkillFigure => ({
  skill,
  band: null,
  attempts: 0,
  students: 0,
  provisional: false,
});

/** Build a `Record<SkillName, T>` without repeating the four keys. */
function emptyBySkill<T>(make: (skill: SkillName) => T): Record<SkillName, T> {
  return Object.fromEntries(SKILLS.map((s) => [s, make(s)])) as Record<SkillName, T>;
}

/**
 * How a band is written down when it is shown to a human.
 *
 * Never the number alone. `5.5` is a claim; `5.5 · 12 essays · 8 students` is
 * evidence, and `5.5 · 2 essays · provisional` is an admission. R3 of the
 * restructure exists because the console was making the first kind of claim
 * off one essay.
 */
export function describeFigure(f: SkillFigure, unit = "attempts"): string {
  if (f.band == null) return "not measured yet";
  const pieces = [
    f.band.toFixed(1),
    `${f.attempts} ${f.attempts === 1 ? unit.replace(/s$/, "") : unit}`,
  ];
  if (f.students > 1) pieces.push(`${f.students} students`);
  if (f.provisional) pieces.push("provisional");
  return pieces.join(" · ");
}

/** The unit each skill's work is counted in — essays, not "attempts". */
export const SKILL_UNIT: Record<SkillName, string> = {
  Writing: "essays",
  Reading: "tests",
  Listening: "tests",
  Speaking: "mocks",
};

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
