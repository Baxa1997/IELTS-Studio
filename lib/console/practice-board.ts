import "server-only";

import { type Profile } from "@/lib/auth";
import { type AttemptKind } from "@/lib/console/attempts";
import { createClient } from "@/lib/supabase/server";

/**
 * Everything set across the centre, and whether it is landing.
 *
 * WHY THIS PAGE EXISTS. §2 of the restructure names the gap exactly: "there is
 * nowhere to see practice across the center, so the Overview alert '2 classes
 * have no practice set' has no destination". Per-group and per-assignment
 * reports already exist; what nobody could answer was the centre-wide one — is
 * the work being set, and is it coming back?
 *
 * HANDED IN IS COUNTED BY CONTENT, NOT BY ASSIGNMENT. An assignment carries no
 * id on the essay or the attempt (deliberately — it keeps the four runners
 * untouched), so completion is group member × content id. A student who did the
 * task on their own initiative rather than through the homework link still
 * counts as having done it, which is correct: the teacher wanted the work done,
 * not the link clicked.
 */

export type PracticeStatus = "set" | "overdue" | "complete";

export interface PracticeBoardRow {
  assignmentId: string;
  title: string;
  skill: AttemptKind;
  groupId: string;
  groupName: string;
  teacherId: string | null;
  teacherName: string | null;
  setOn: string;
  dueAt: string | null;
  /** Group members expected to do it — the enrolled roster, not everyone ever. */
  expected: number;
  handedIn: number;
  /** Of those handed in, how many carry a teacher's verdict. */
  marked: number;
  /** Median, not mean: one abandoned attempt at 1.0 should not move it. */
  medianBand: number | null;
  status: PracticeStatus;
  /** Students who have not handed it in — the "remind them" list. */
  missing: { id: string; name: string }[];
}

export interface PracticeBoard {
  rows: PracticeBoardRow[];
  /** Active groups with nothing set at all — the alert's real destination. */
  groupsWithNothingSet: { id: string; name: string; teacherName: string | null }[];
  teachers: { id: string; name: string }[];
  groups: { id: string; name: string }[];
}

/** A practice is overdue when its due date has passed and someone still owes it. */
const OVERDUE_AFTER_DAYS = 7;

function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  const m = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  return Math.round(m * 10) / 10;
}

export async function loadPracticeBoard(profile: Profile): Promise<PracticeBoard> {
  const supabase = await createClient();

  const [{ data: groupRows }, { data: assignmentRows }, { data: members }, { data: people }] =
    await Promise.all([
      supabase.from("groups").select("id, name, teacher_id").eq("status", "active").order("name"),
      supabase
        .from("assignments")
        .select(
          "id, group_id, kind, title, due_at, created_at, prompt_id, reading_test_id, listening_library_id",
        )
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("group_members").select("group_id, student_id"),
      supabase.from("profiles").select("id, full_name, role, member_status"),
    ]);

  const isTeacher = profile.role === "teacher";
  const groups = ((groupRows ?? []) as { id: string; name: string; teacher_id: string | null }[])
    .filter((g) => !isTeacher || g.teacher_id === profile.id);
  const groupById = new Map(groups.map((g) => [g.id, g]));

  const person = new Map(
    ((people ?? []) as { id: string; full_name: string | null; role: string; member_status: string | null }[]).map(
      (p) => [p.id, p],
    ),
  );

  // The enrolled roster per group. A student who LEFT is not expected to hand
  // anything in, and counting them makes every completion figure look worse
  // than the group is doing — for ever.
  const roster = new Map<string, string[]>();
  for (const m of (members ?? []) as { group_id: string; student_id: string }[]) {
    if (!groupById.has(m.group_id)) continue;
    if ((person.get(m.student_id)?.member_status ?? "active") === "left") continue;
    roster.set(m.group_id, [...(roster.get(m.group_id) ?? []), m.student_id]);
  }

  const assignments = ((assignmentRows ?? []) as {
    id: string;
    group_id: string;
    kind: string;
    title: string | null;
    due_at: string | null;
    created_at: string;
    prompt_id: string | null;
    reading_test_id: string | null;
    listening_library_id: string | null;
  }[]).filter((a) => groupById.has(a.group_id));

  const studentIds = [...new Set([...roster.values()].flat())];
  if (studentIds.length === 0 || assignments.length === 0) {
    return {
      rows: [],
      groupsWithNothingSet: groups
        .filter((g) => !assignments.some((a) => a.group_id === g.id))
        .map((g) => ({
          id: g.id,
          name: g.name,
          teacherName: g.teacher_id ? (person.get(g.teacher_id)?.full_name ?? null) : null,
        })),
      teachers: staffList(groups, person),
      groups: groups.map((g) => ({ id: g.id, name: g.name })),
    };
  }

  // Who has done which piece of content, and what they got. Four queries for
  // the whole page rather than one per assignment.
  const [{ data: essays }, { data: reading }, { data: listening }, { data: reviews }] =
    await Promise.all([
      supabase.from("essays").select("id, student_id, prompt_id").in("student_id", studentIds).eq("status", "graded"),
      supabase
        .from("reading_attempts")
        .select("id, student_id, test_id, band")
        .in("student_id", studentIds)
        .eq("status", "graded"),
      supabase
        .from("listening_attempts")
        .select("id, student_id, library_id, result")
        .in("student_id", studentIds),
      supabase.from("attempt_reviews").select("kind, ref_id, final_band").in("student_id", studentIds),
    ]);

  const essayList = (essays ?? []) as { id: string; student_id: string; prompt_id: string | null }[];
  const essayBand = new Map<string, number>();
  if (essayList.length > 0) {
    const { data: gradings } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, created_at")
      .in("essay_id", essayList.map((e) => e.id))
      .not("overall_band", "is", null)
      .order("created_at", { ascending: true });
    for (const g of (gradings ?? []) as { essay_id: string; overall_band: number }[]) {
      essayBand.set(g.essay_id, Number(g.overall_band));
    }
  }

  const reviewed = new Map<string, number>();
  for (const r of (reviews ?? []) as { kind: string; ref_id: string; final_band: number }[]) {
    reviewed.set(`${r.kind}:${r.ref_id}`, Number(r.final_band));
  }

  /** content id → student → { band, marked } */
  const done = new Map<string, Map<string, { band: number | null; marked: boolean }>>();
  const note = (
    contentId: string | null,
    student: string,
    kind: AttemptKind,
    refId: string,
    aiBand: number | null,
  ) => {
    if (!contentId) return;
    const key = `${kind}:${refId}`;
    const inner = done.get(contentId) ?? new Map();
    inner.set(student, { band: reviewed.get(key) ?? aiBand, marked: reviewed.has(key) });
    done.set(contentId, inner);
  };
  for (const e of essayList) note(e.prompt_id, e.student_id, "writing", e.id, essayBand.get(e.id) ?? null);
  for (const r of (reading ?? []) as { id: string; student_id: string; test_id: string | null; band: number | null }[]) {
    note(r.test_id, r.student_id, "reading", r.id, r.band != null ? Number(r.band) : null);
  }
  for (const l of (listening ?? []) as {
    id: string;
    student_id: string;
    library_id: string | null;
    result: { band?: unknown } | null;
  }[]) {
    const b = Number(l.result?.band);
    note(l.library_id, l.student_id, "listening", l.id, Number.isFinite(b) ? b : null);
  }

  const now = Date.now();
  const rows: PracticeBoardRow[] = assignments.map((a) => {
    const group = groupById.get(a.group_id)!;
    const members = roster.get(a.group_id) ?? [];
    const contentId = a.prompt_id ?? a.reading_test_id ?? a.listening_library_id;
    const finishers = contentId ? (done.get(contentId) ?? new Map()) : new Map();

    const handedIn = members.filter((m) => finishers.has(m));
    const bands = handedIn
      .map((m) => finishers.get(m)?.band)
      .filter((b): b is number => typeof b === "number");
    const marked = handedIn.filter((m) => finishers.get(m)?.marked).length;

    const missing = members
      .filter((m) => !finishers.has(m))
      .map((m) => ({ id: m, name: person.get(m)?.full_name ?? "Unnamed" }));

    // Overdue means someone still owes it AND the moment has passed — its due
    // date, or a week since it was set when nobody gave one. "Set yesterday and
    // not done" is not late; calling it late is how a status column stops
    // meaning anything.
    const deadline = a.due_at
      ? Date.parse(a.due_at)
      : Date.parse(a.created_at) + OVERDUE_AFTER_DAYS * 86400_000;
    const status: PracticeStatus =
      members.length > 0 && handedIn.length >= members.length
        ? "complete"
        : now > deadline
          ? "overdue"
          : "set";

    return {
      assignmentId: a.id,
      title: a.title?.trim() || `${a.kind} practice`,
      skill: a.kind as AttemptKind,
      groupId: a.group_id,
      groupName: group.name,
      teacherId: group.teacher_id,
      teacherName: group.teacher_id ? (person.get(group.teacher_id)?.full_name ?? null) : null,
      setOn: a.created_at,
      dueAt: a.due_at,
      expected: members.length,
      handedIn: handedIn.length,
      marked,
      medianBand: median(bands),
      status,
      missing,
    };
  });

  return {
    rows,
    groupsWithNothingSet: groups
      .filter((g) => !assignments.some((a) => a.group_id === g.id))
      .map((g) => ({
        id: g.id,
        name: g.name,
        teacherName: g.teacher_id ? (person.get(g.teacher_id)?.full_name ?? null) : null,
      })),
    teachers: staffList(groups, person),
    groups: groups.map((g) => ({ id: g.id, name: g.name })),
  };
}

/** The teachers who actually own one of these groups — not every staff member. */
function staffList(
  groups: { teacher_id: string | null }[],
  person: Map<string, { full_name: string | null }>,
): { id: string; name: string }[] {
  const ids = [...new Set(groups.map((g) => g.teacher_id).filter((id): id is string => id != null))];
  return ids
    .map((id) => ({ id, name: person.get(id)?.full_name ?? "Unnamed" }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
