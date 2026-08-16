import "server-only";

import { type OrgPlan } from "@/lib/billing/plans";
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
  /** Best address to actually reach this person: the center contact where one
   *  was given, otherwise the sign-in address. Null when there is neither. */
  email: string | null;
  /** True when `email` is a synthetic sign-in address that cannot receive mail
   *  (`…@students.engprogress.com`) — so the console can say so rather than
   *  showing an address a support reply would silently bounce off. */
  emailUndeliverable: boolean;
  orgName: string;
  orgKind: "personal" | "center";
  orgPlan: OrgPlan;
  /** Per-org overrides of the plan's monthly allowances. Null = use the plan's
   *  default. These already existed in the schema; nothing surfaced them. */
  gradingLimit: number | null;
  generationLimit: number | null;
  /** How many profiles share this organization — 1 for an individual learner,
   *  and the whole roll for anyone in a center. The controls use it to warn
   *  before a plan change lands on everybody. */
  orgMemberCount: number;
  createdAt: string;
  practiceCount: number;
}

/** The domain center-created accounts get when they have no real address; see
 *  migration 20260809130000. Mail to it goes nowhere by design. */
const SYNTHETIC_EMAIL_DOMAIN = "@students.engprogress.com";

/**
 * id → sign-in address, for every auth user.
 *
 * `auth.users` is not reachable through PostgREST, which is why the console has
 * never shown an email and why searching for one found nothing. The Admin API
 * is the supported way in. It pages, so this drains it rather than trusting one
 * call — at a few hundred users that is a single request anyway.
 */
async function loadAuthEmails(
  admin: ReturnType<typeof createAdminClient>,
): Promise<Map<string, string>> {
  const byId = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("[admin/platform] listUsers failed:", error.message);
      break;
    }
    const users = data?.users ?? [];
    for (const u of users) {
      if (u.email) byId.set(u.id, u.email);
    }
    if (users.length < perPage) break;
  }
  return byId;
}

/**
 * Every user on the platform, newest first, with how much practice they own —
 * the number that matters before deleting one.
 */
export async function loadUsers(query?: string): Promise<PlatformUser[]> {
  const admin = createAdminClient();

  // Emails first: they are needed to DISPLAY a row, and also to search by one.
  // `auth.users` can't be filtered from here, so an email search resolves to a
  // set of ids and joins the same `or` as name and login — which keeps the
  // search running across every account rather than only the newest 500.
  const emailById = await loadAuthEmails(admin);

  let select = admin
    .from("profiles")
    .select("id, full_name, role, username, contact_email, organization_id, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (query) {
    const q = `%${query}%`;
    const needle = query.toLowerCase();
    const ors = [`full_name.ilike.${q}`, `username.ilike.${q}`, `contact_email.ilike.${q}`];
    // Cap the id list so one broad query (e.g. "@") can't build a URL long
    // enough for PostgREST to reject. Name/login/contact matching is unaffected.
    const idMatches = [...emailById.entries()]
      .filter(([, email]) => email.toLowerCase().includes(needle))
      .slice(0, 200)
      .map(([id]) => id);
    if (idMatches.length > 0) ors.push(`id.in.(${idMatches.join(",")})`);
    select = select.or(ors.join(","));
  }

  const [{ data: profiles }, { data: orgs }] = await Promise.all([
    select,
    admin
      .from("organizations")
      .select("id, name, kind, plan, grading_monthly_limit, generation_monthly_limit"),
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

  // The roll per organization, so a plan change can say how many people it is
  // about to affect. Counted over ALL profiles, not the (filtered, capped) page
  // of rows on screen — a search for one name must still report the true size
  // of the center behind them.
  const { data: allMemberships } = await admin.from("profiles").select("organization_id");
  const memberCount = tally(allMemberships, (m) => m.organization_id as string);

  return (profiles ?? []).map((p) => {
    const org = orgById.get(p.organization_id);
    const authEmail = emailById.get(p.id) ?? null;
    // A center account's sign-in address is deliberately fake, so the contact
    // address wins wherever one was given (migration 20260809130000).
    const email = (p.contact_email as string | null) || authEmail;
    return {
      id: p.id,
      name: p.full_name ?? "Unnamed",
      role: p.role,
      username: p.username,
      email,
      emailUndeliverable: Boolean(email && email.endsWith(SYNTHETIC_EMAIL_DOMAIN)),
      orgName: org?.name ?? "—",
      orgKind: (org?.kind ?? "personal") as "personal" | "center",
      orgPlan: (org?.plan ?? "trial") as OrgPlan,
      gradingLimit: (org?.grading_monthly_limit as number | null) ?? null,
      generationLimit: (org?.generation_monthly_limit as number | null) ?? null,
      orgMemberCount: memberCount.get(p.organization_id) ?? 1,
      createdAt: p.created_at,
      practiceCount: practice.get(p.id) ?? 0,
    };
  });
}

export interface Engagement {
  /** Learner profiles in total. */
  learners: number;
  /** Learners who have never produced a single piece of graded work. */
  neverPractised: number;
  /** Learners with at least one attempt in the last 30 days. */
  activeLast30: number;
  /** …and in the last 7, which is the number that moves week to week. */
  activeLast7: number;
}

/**
 * How many people who signed up have actually done anything.
 *
 * The single most useful number on the platform and the least flattering: a
 * console that only counts sign-ups will always look like it is growing. This
 * asks the harder question — of everyone who registered, how many produced one
 * piece of work?
 *
 * Four id-only selects folded in memory rather than a join per table. The
 * practice tables key on `student_id` (NOT `user_id` — they reference profiles,
 * not auth users), which is the thing to check first if these ever read zero.
 */
export async function loadEngagement(): Promise<Engagement> {
  const admin = createAdminClient();
  const since = daysAgo(30);
  const week = daysAgo(7);

  const [profiles, essays, reading, listening, speaking] = await Promise.all([
    admin.from("profiles").select("id").eq("role", "student"),
    admin.from("essays").select("student_id, created_at"),
    admin.from("reading_attempts").select("student_id, created_at"),
    admin.from("listening_attempts").select("student_id, created_at"),
    admin.from("speaking_sessions").select("student_id, started_at"),
  ]);

  const everyone = (profiles.data ?? []).map((p) => p.id as string);
  const touched = new Set<string>();
  const recent = new Set<string>();
  const thisWeek = new Set<string>();

  const absorb = (rows: { student_id?: string | null }[] | null, stamp: (r: never) => string) => {
    for (const row of rows ?? []) {
      const id = row.student_id;
      if (!id) continue;
      touched.add(id);
      const at = stamp(row as never);
      if (at >= since) recent.add(id);
      if (at >= week) thisWeek.add(id);
    }
  };

  absorb(essays.data, (r: { created_at: string }) => r.created_at);
  absorb(reading.data, (r: { created_at: string }) => r.created_at);
  absorb(listening.data, (r: { created_at: string }) => r.created_at);
  absorb(speaking.data, (r: { started_at: string }) => r.started_at);

  return {
    learners: everyone.length,
    neverPractised: everyone.filter((id) => !touched.has(id)).length,
    activeLast30: everyone.filter((id) => recent.has(id)).length,
    activeLast7: everyone.filter((id) => thisWeek.has(id)).length,
  };
}
