import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Read models for the platform console (`/admin`).
 *
 * Everything here runs on the service-role client on purpose: a super_admin has
 * no organization, so RLS — which scopes every table by org — would return
 * nothing. This is the one place in the app allowed to read across tenants, and
 * `requireSuperAdmin` is what earns it. Never import these into an org-scoped
 * page.
 *
 * Counting strategy: a few bulk selects folded up in JS, rather than a count
 * query per organization. At today's scale either works; this keeps it to a
 * fixed number of round trips as centers multiply.
 */

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY).toISOString();
}

/** Tally values into a Map, skipping nullish keys. */
function tally<T>(rows: T[] | null, key: (row: T) => string | null | undefined): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows ?? []) {
    const k = key(row);
    if (!k) continue;
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

export interface PlatformStats {
  learners: number;
  teachers: number;
  centerAdmins: number;
  centers: number;
  pendingCenters: number;
  personalWorkspaces: number;
  newUsers7d: number;
  practice30d: { writing: number; reading: number; listening: number; speaking: number; total: number };
}

export async function loadPlatformStats(): Promise<PlatformStats> {
  const admin = createAdminClient();
  const since = daysAgo(30);
  const week = daysAgo(7);

  const [orgs, profiles, essays, reading, listening, speaking] = await Promise.all([
    admin.from("organizations").select("id, kind, status"),
    admin.from("profiles").select("id, role, created_at"),
    admin.from("essays").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("reading_attempts").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("listening_attempts").select("id", { count: "exact", head: true }).gte("created_at", since),
    admin.from("speaking_sessions").select("id", { count: "exact", head: true }).gte("started_at", since),
  ]);

  const byRole = tally(profiles.data, (p) => p.role);
  const orgRows = orgs.data ?? [];
  const centers = orgRows.filter((o) => o.kind === "center");

  const practice = {
    writing: essays.count ?? 0,
    reading: reading.count ?? 0,
    listening: listening.count ?? 0,
    speaking: speaking.count ?? 0,
    total: 0,
  };
  practice.total = practice.writing + practice.reading + practice.listening + practice.speaking;

  return {
    learners: byRole.get("student") ?? 0,
    teachers: byRole.get("teacher") ?? 0,
    centerAdmins: byRole.get("center_admin") ?? 0,
    centers: centers.length,
    pendingCenters: centers.filter((o) => o.status === "pending").length,
    personalWorkspaces: orgRows.filter((o) => o.kind === "personal").length,
    newUsers7d: (profiles.data ?? []).filter((p) => p.created_at >= week).length,
    practice30d: practice,
  };
}

export interface DayPoint {
  /** ISO date, YYYY-MM-DD. */
  day: string;
  value: number;
}

export interface PlatformTrends {
  /** New accounts per day. */
  signups: DayPoint[];
  /** All practice per day, and the same split by skill. */
  practice: DayPoint[];
  bySkill: { writing: DayPoint[]; reading: DayPoint[]; listening: DayPoint[]; speaking: DayPoint[] };
  /** Totals over the window, and over the window before it, for a delta. */
  totals: { signups: number; practice: number };
  previous: { signups: number; practice: number };
}

/** Bucket ISO timestamps into a dense day series — days with nothing still
 *  appear as zero, or the chart lies about the shape of the week. */
function series(stamps: (string | null | undefined)[], days: number): DayPoint[] {
  const counts = new Map<string, number>();
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
    counts.set(day, 0);
    out.push({ day, value: 0 });
  }
  for (const s of stamps) {
    if (!s) continue;
    const day = s.slice(0, 10);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  for (const point of out) point.value = counts.get(point.day) ?? 0;
  return out;
}

/** Daily activity for the dashboard charts. `days` is the visible window; the
 *  same span before it is fetched too, purely to compute the change. */
export async function loadPlatformTrends(days = 30): Promise<PlatformTrends> {
  const admin = createAdminClient();
  const windowStart = daysAgo(days);
  const priorStart = daysAgo(days * 2);

  const [profiles, essays, reading, listening, speaking] = await Promise.all([
    admin.from("profiles").select("created_at").gte("created_at", priorStart),
    admin.from("essays").select("created_at").gte("created_at", priorStart),
    admin.from("reading_attempts").select("created_at").gte("created_at", priorStart),
    admin.from("listening_attempts").select("created_at").gte("created_at", priorStart),
    admin.from("speaking_sessions").select("started_at").gte("started_at", priorStart),
  ]);

  const signupStamps = (profiles.data ?? []).map((r) => r.created_at);
  const skillStamps = {
    writing: (essays.data ?? []).map((r) => r.created_at),
    reading: (reading.data ?? []).map((r) => r.created_at),
    listening: (listening.data ?? []).map((r) => r.created_at),
    speaking: (speaking.data ?? []).map((r) => r.started_at),
  };
  const allPractice = [
    ...skillStamps.writing,
    ...skillStamps.reading,
    ...skillStamps.listening,
    ...skillStamps.speaking,
  ];

  const inWindow = (s: string | null | undefined) => Boolean(s && s >= windowStart);
  const inPrior = (s: string | null | undefined) =>
    Boolean(s && s >= priorStart && s < windowStart);

  return {
    signups: series(signupStamps, days),
    practice: series(allPractice, days),
    bySkill: {
      writing: series(skillStamps.writing, days),
      reading: series(skillStamps.reading, days),
      listening: series(skillStamps.listening, days),
      speaking: series(skillStamps.speaking, days),
    },
    totals: {
      signups: signupStamps.filter(inWindow).length,
      practice: allPractice.filter(inWindow).length,
    },
    previous: {
      signups: signupStamps.filter(inPrior).length,
      practice: allPractice.filter(inPrior).length,
    },
  };
}

export interface CenterRow {
  id: string;
  name: string;
  status: "pending" | "active" | "rejected" | "suspended";
  plan: string;
  contactEmail: string | null;
  createdAt: string;
  approvedAt: string | null;
  billingEnforced: boolean;
  admins: number;
  teachers: number;
  students: number;
  groups: number;
  practice30d: number;
}

/** Every center, with the counts the owner asked to see per center. */
export async function loadCenters(): Promise<CenterRow[]> {
  const admin = createAdminClient();
  const since = daysAgo(30);

  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name, status, plan, contact_email, created_at, approved_at, billing_enforced")
    .eq("kind", "center")
    .order("created_at", { ascending: false });

  const centerIds = (orgs ?? []).map((o) => o.id);
  if (centerIds.length === 0) return [];

  const [profiles, groups, essays, reading, listening, speaking] = await Promise.all([
    admin.from("profiles").select("organization_id, role").in("organization_id", centerIds),
    admin.from("groups").select("organization_id").in("organization_id", centerIds),
    admin.from("essays").select("organization_id").in("organization_id", centerIds).gte("created_at", since),
    admin.from("reading_attempts").select("organization_id").in("organization_id", centerIds).gte("created_at", since),
    admin.from("listening_attempts").select("organization_id").in("organization_id", centerIds).gte("created_at", since),
    admin.from("speaking_sessions").select("organization_id").in("organization_id", centerIds).gte("started_at", since),
  ]);

  const roleCount = new Map<string, { admins: number; teachers: number; students: number }>();
  for (const p of profiles.data ?? []) {
    const bucket = roleCount.get(p.organization_id) ?? { admins: 0, teachers: 0, students: 0 };
    if (p.role === "center_admin") bucket.admins++;
    else if (p.role === "teacher") bucket.teachers++;
    else bucket.students++;
    roleCount.set(p.organization_id, bucket);
  }

  const groupCount = tally(groups.data, (g) => g.organization_id);
  const practice = new Map<string, number>();
  for (const set of [essays.data, reading.data, listening.data, speaking.data]) {
    for (const row of set ?? []) {
      practice.set(row.organization_id, (practice.get(row.organization_id) ?? 0) + 1);
    }
  }

  return (orgs ?? []).map((o) => {
    const roles = roleCount.get(o.id) ?? { admins: 0, teachers: 0, students: 0 };
    return {
      id: o.id,
      name: o.name,
      status: o.status,
      plan: o.plan,
      contactEmail: o.contact_email,
      createdAt: o.created_at,
      approvedAt: o.approved_at,
      billingEnforced: o.billing_enforced,
      admins: roles.admins,
      teachers: roles.teachers,
      students: roles.students,
      groups: groupCount.get(o.id) ?? 0,
      practice30d: practice.get(o.id) ?? 0,
    };
  });
}

export interface CenterStaff {
  id: string;
  name: string;
  role: "center_admin" | "teacher";
  username: string | null;
  groups: number;
  students: number;
}

export interface CenterGroup {
  id: string;
  name: string;
  teacherName: string | null;
  students: number;
  assignments: number;
}

export interface CenterStudent {
  id: string;
  name: string;
  username: string | null;
  /** Every group they're in — usually one, occasionally none. */
  groups: string[];
  practiceCount: number;
}

export interface CenterDetail {
  center: CenterRow;
  staff: CenterStaff[];
  groups: CenterGroup[];
  students: CenterStudent[];
  /** Practice in the last 30 days, split by skill. */
  practice30d: { writing: number; reading: number; listening: number; speaking: number };
  /** Students who belong to no group — invisible to every teacher report. */
  ungroupedStudents: number;
}

export async function loadCenterDetail(orgId: string): Promise<CenterDetail | null> {
  const admin = createAdminClient();
  const since = daysAgo(30);

  const centers = await loadCenters();
  const center = centers.find((c) => c.id === orgId);
  if (!center) return null;

  const [profiles, groups, members, assignments, essays, reading, listening, speaking] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, role, username")
        .eq("organization_id", orgId),
      admin.from("groups").select("id, name, teacher_id").eq("organization_id", orgId),
      admin.from("group_members").select("group_id, student_id").eq("organization_id", orgId),
      admin.from("assignments").select("group_id").eq("organization_id", orgId),
      admin.from("essays").select("id", { count: "exact", head: true }).eq("organization_id", orgId).gte("created_at", since),
      admin.from("reading_attempts").select("id", { count: "exact", head: true }).eq("organization_id", orgId).gte("created_at", since),
      admin.from("listening_attempts").select("id", { count: "exact", head: true }).eq("organization_id", orgId).gte("created_at", since),
      admin.from("speaking_sessions").select("id", { count: "exact", head: true }).eq("organization_id", orgId).gte("started_at", since),
    ]);

  const nameById = new Map((profiles.data ?? []).map((p) => [p.id, p.full_name]));
  const membersByGroup = tally(members.data, (m) => m.group_id);
  const assignmentsByGroup = tally(assignments.data, (a) => a.group_id);
  const groupsByTeacher = tally(groups.data, (g) => g.teacher_id);

  // Students a teacher can actually see = those in the groups they own.
  const groupOwner = new Map((groups.data ?? []).map((g) => [g.id, g.teacher_id]));
  const studentsByTeacher = new Map<string, Set<string>>();
  for (const m of members.data ?? []) {
    const owner = groupOwner.get(m.group_id);
    if (!owner) continue;
    const set = studentsByTeacher.get(owner) ?? new Set<string>();
    set.add(m.student_id);
    studentsByTeacher.set(owner, set);
  }

  const enrolled = new Set((members.data ?? []).map((m) => m.student_id));
  const ungroupedStudents = (profiles.data ?? []).filter(
    (p) => p.role === "student" && !enrolled.has(p.id),
  ).length;

  // Lifetime practice per student in this center, so an idle roster is obvious.
  const studentIds = (profiles.data ?? []).filter((p) => p.role === "student").map((p) => p.id);
  const perStudent = new Map<string, number>();
  if (studentIds.length > 0) {
    const sets = await Promise.all([
      admin.from("essays").select("student_id").in("student_id", studentIds),
      admin.from("reading_attempts").select("student_id").in("student_id", studentIds),
      admin.from("listening_attempts").select("student_id").in("student_id", studentIds),
      admin.from("speaking_sessions").select("student_id").in("student_id", studentIds),
    ]);
    for (const s of sets) {
      for (const row of s.data ?? []) {
        perStudent.set(row.student_id, (perStudent.get(row.student_id) ?? 0) + 1);
      }
    }
  }

  const groupNameById = new Map((groups.data ?? []).map((g) => [g.id, g.name]));
  const groupsByStudent = new Map<string, string[]>();
  for (const m of members.data ?? []) {
    const name = groupNameById.get(m.group_id);
    if (!name) continue;
    groupsByStudent.set(m.student_id, [...(groupsByStudent.get(m.student_id) ?? []), name]);
  }

  const students: CenterStudent[] = (profiles.data ?? [])
    .filter((p) => p.role === "student")
    .map((p) => ({
      id: p.id,
      name: p.full_name ?? "Unnamed",
      username: p.username,
      groups: groupsByStudent.get(p.id) ?? [],
      practiceCount: perStudent.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.practiceCount - a.practiceCount);

  const staff: CenterStaff[] = (profiles.data ?? [])
    .filter((p): p is typeof p & { role: "center_admin" | "teacher" } =>
      p.role === "center_admin" || p.role === "teacher",
    )
    .map((p) => ({
      id: p.id,
      name: p.full_name ?? "Unnamed",
      role: p.role,
      username: p.username,
      groups: groupsByTeacher.get(p.id) ?? 0,
      students: studentsByTeacher.get(p.id)?.size ?? 0,
    }))
    .sort((a, b) => (a.role === b.role ? b.students - a.students : a.role === "center_admin" ? -1 : 1));

  const groupRows: CenterGroup[] = (groups.data ?? [])
    .map((g) => ({
      id: g.id,
      name: g.name,
      teacherName: g.teacher_id ? (nameById.get(g.teacher_id) ?? null) : null,
      students: membersByGroup.get(g.id) ?? 0,
      assignments: assignmentsByGroup.get(g.id) ?? 0,
    }))
    .sort((a, b) => b.students - a.students);

  return {
    center,
    staff,
    groups: groupRows,
    students,
    practice30d: {
      writing: essays.count ?? 0,
      reading: reading.count ?? 0,
      listening: listening.count ?? 0,
      speaking: speaking.count ?? 0,
    },
    ungroupedStudents,
  };
}

export interface PlatformUser {
  id: string;
  name: string;
  role: string;
  username: string | null;
  orgName: string;
  orgKind: "personal" | "center";
  createdAt: string;
  practiceCount: number;
}

/**
 * Every user on the platform, newest first, with how much practice they own —
 * the number that matters before deleting one.
 */
export async function loadUsers(query?: string): Promise<PlatformUser[]> {
  const admin = createAdminClient();

  let select = admin
    .from("profiles")
    .select("id, full_name, role, username, organization_id, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (query) {
    const q = `%${query}%`;
    select = select.or(`full_name.ilike.${q},username.ilike.${q}`);
  }

  const [{ data: profiles }, { data: orgs }] = await Promise.all([
    select,
    admin.from("organizations").select("id, name, kind"),
  ]);

  const ids = (profiles ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  const [essays, reading, listening, speaking] = await Promise.all([
    admin.from("essays").select("student_id").in("student_id", ids),
    admin.from("reading_attempts").select("student_id").in("student_id", ids),
    admin.from("listening_attempts").select("student_id").in("student_id", ids),
    admin.from("speaking_sessions").select("student_id").in("student_id", ids),
  ]);

  const practice = new Map<string, number>();
  for (const set of [essays.data, reading.data, listening.data, speaking.data]) {
    for (const row of set ?? []) {
      practice.set(row.student_id, (practice.get(row.student_id) ?? 0) + 1);
    }
  }

  const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));

  return (profiles ?? []).map((p) => {
    const org = orgById.get(p.organization_id);
    return {
      id: p.id,
      name: p.full_name ?? "Unnamed",
      role: p.role,
      username: p.username,
      orgName: org?.name ?? "—",
      orgKind: (org?.kind ?? "personal") as "personal" | "center",
      createdAt: p.created_at,
      practiceCount: practice.get(p.id) ?? 0,
    };
  });
}
