import "server-only";

import { type Profile } from "@/lib/auth";
import { signAvatars } from "@/lib/console/avatars";
import { type MemberStatus } from "@/lib/console/status";
import { createClient } from "@/lib/supabase/server";

/** A course that finished, versus one that is running. Never a deletion — a
 *  closed group keeps its roster, its registers and its invoices. */
export type GroupStatus = "active" | "closed";

export interface GroupSummary {
  id: string;
  name: string;
  status: GroupStatus;
  teacherId: string | null;
  teacherName: string | null;
  /** The site this group is taught at. Required since 20260810170000. */
  branchId: string;
  branchName: string | null;
  /** Enrolled and countable: students who have left are not on the roster. */
  memberCount: number;
  /** Of those, how many are paused — enrolled but not to be chased. */
  pausedCount: number;
  /** Seats. Null = nobody has sized this group. */
  capacity: number | null;
}

/** The sites a class can belong to. */
export interface BranchOption {
  id: string;
  name: string;
}

/** A bookable room, carrying its site so the form can offer only the ones the
 *  chosen branch owns — `lesson_slot_branch_guard` rejects the rest anyway. */
export interface RoomOption {
  id: string;
  name: string;
  branchId: string;
}

export interface StaffOption {
  id: string;
  name: string;
}

export interface GroupMemberRow {
  id: string;
  name: string;
  /** How they sign in. Center students have no email, so this is the identity
   *  a teacher reads out and the one a password reset is against. */
  login: string | null;
  /** Where credentials are delivered, when they gave a real address. */
  contactEmail: string | null;
  /** Enrolled / on a break / gone. Drives every denominator they appear in. */
  status: MemberStatus;
  joinedAt: string;
  /** Signed URL for their photo, or null when they don't have one. */
  photoUrl: string | null;
}

export interface GroupDetail {
  id: string;
  name: string;
  status: GroupStatus;
  capacity: number | null;
  teacherId: string | null;
  teacherName: string | null;
  /** Everyone ever enrolled, including those who left — the roster filters. */
  members: GroupMemberRow[];
  pendingInvites: { email: string; expiresAt: string }[];
}

/**
 * Groups for the console list. A center_admin sees every group in the org; a
 * teacher sees only the groups assigned to them (which is also the only set
 * whose membership RLS lets them read, so the counts stay truthful).
 *
 * `include` decides whether finished courses come back. The default is ACTIVE
 * ONLY, because every operational question — what meets today, which groups
 * have no practice set, who has no teacher — is about groups that are running.
 * A page that wants the archive asks for it.
 */
export async function loadGroups(
  profile: Profile,
  opts: { include?: "active" | "all" } = {},
): Promise<{
  groups: GroupSummary[];
  teachers: StaffOption[];
  branches: BranchOption[];
  rooms: RoomOption[];
}> {
  const supabase = await createClient();

  let groupQuery = supabase
    .from("groups")
    .select("id, name, status, teacher_id, branch_id, capacity")
    .order("name", { ascending: true });
  if (profile.role === "teacher") groupQuery = groupQuery.eq("teacher_id", profile.id);
  if (opts.include !== "all") groupQuery = groupQuery.eq("status", "active");

  const [groupsRes, staffRes, branchesRes, roomsRes] = await Promise.all([
    groupQuery,
    supabase.from("profiles").select("id, full_name, role").in("role", ["teacher", "center_admin"]),
    supabase
      .from("branches")
      .select("id, name")
      .eq("active", true)
      .order("sort", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("rooms")
      .select("id, name, branch_id")
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);
  // Same reasoning as loadGroupDetail: an empty list is a legitimate answer, so
  // a rejected query is invisible unless it is logged. Every console page that
  // scopes itself by class starts here, so one bad column empties all of them.
  if (groupsRes.error) console.error("[loadGroups] failed:", groupsRes.error.message);

  const groups = groupsRes.data ?? [];
  const staff = staffRes.data ?? [];
  const branches = ((branchesRes.data ?? []) as Record<string, unknown>[]).map((b) => ({
    id: b.id as string,
    name: b.name as string,
  }));
  const branchName = new Map(branches.map((b) => [b.id, b.name]));
  const staffName = new Map(
    staff.map((s) => [s.id as string, (s.full_name as string | null) ?? "—"]),
  );

  // One grouped count query instead of N: fetch the visible membership rows for
  // these groups and tally in memory (a center's rosters are small).
  //
  // A student who LEFT is not on the roster. Counting them was making every
  // class look fuller than it is and every attendance percentage look worse.
  const ids = groups.map((g) => g.id as string);
  const counts = new Map<string, number>();
  const paused = new Map<string, number>();
  if (ids.length > 0) {
    const [{ data: members }, { data: statuses }] = await Promise.all([
      supabase.from("group_members").select("group_id, student_id").in("group_id", ids),
      supabase.from("profiles").select("id, member_status").eq("role", "student"),
    ]);
    const statusOf = new Map(
      ((statuses ?? []) as { id: string; member_status: string }[]).map((p) => [
        p.id,
        (p.member_status as MemberStatus) ?? "active",
      ]),
    );
    for (const m of (members ?? []) as { group_id: string; student_id: string }[]) {
      // Unknown means the profile is outside this caller's read scope; count it
      // rather than silently shrinking a teacher's own roster.
      const status = statusOf.get(m.student_id) ?? "active";
      if (status === "left") continue;
      counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
      if (status === "paused") paused.set(m.group_id, (paused.get(m.group_id) ?? 0) + 1);
    }
  }

  return {
    groups: groups.map((g) => ({
      id: g.id as string,
      name: g.name as string,
      status: ((g.status as GroupStatus | null) ?? "active") as GroupStatus,
      teacherId: (g.teacher_id as string | null) ?? null,
      teacherName: g.teacher_id ? (staffName.get(g.teacher_id as string) ?? null) : null,
      branchId: g.branch_id as string,
      branchName: branchName.get(g.branch_id as string) ?? null,
      memberCount: counts.get(g.id as string) ?? 0,
      pausedCount: paused.get(g.id as string) ?? 0,
      capacity: (g.capacity as number | null) ?? null,
    })),
    teachers: staff
      .filter((s) => s.role === "teacher")
      .map((s) => ({ id: s.id as string, name: (s.full_name as string | null) ?? "—" })),
    branches,
    rooms: ((roomsRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      branchId: r.branch_id as string,
    })),
  };
}

/** One group's roster + its outstanding invites. Returns null when the caller
 *  can't see the group (RLS) — the page turns that into a 404. */
export async function loadGroupDetail(groupId: string): Promise<GroupDetail | null> {
  const supabase = await createClient();

  const { data: group, error } = await supabase
    .from("groups")
    .select("id, name, status, teacher_id, capacity")
    .eq("id", groupId)
    .maybeSingle();
  // A null row means "you may not see this class", and the caller turns that
  // into a 404 — which is right for RLS and badly wrong for anything else. An
  // unapplied migration makes PostgREST reject the whole select ("column
  // groups.capacity does not exist"), and swallowing that error rendered a
  // page-not-found for a class that exists and is yours. Say it out loud.
  if (error) console.error("[loadGroupDetail] group select failed:", groupId, error.message);
  if (!group) return null;

  const [membersRes, invitesRes, teacherRes] = await Promise.all([
    supabase
      .from("group_members")
      .select("student_id, joined_at")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true }),
    // v_pending_invites IS the definition of pending (unaccepted + unexpired);
    // re-deriving it per page is how /console ended up counting dead invites.
    supabase.from("v_pending_invites").select("email, expires_at").eq("group_id", groupId),
    group.teacher_id
      ? supabase.from("profiles").select("full_name").eq("id", group.teacher_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const memberRows = membersRes.data ?? [];
  const studentIds = memberRows.map((m) => m.student_id as string);
  const names = new Map<string, string>();
  const logins = new Map<string, string>();
  const emails = new Map<string, string>();
  const photos = new Map<string, string>();
  const statuses = new Map<string, MemberStatus>();
  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_path, username, contact_email, member_status")
      .in("id", studentIds);
    const rows = profiles ?? [];
    for (const p of rows) {
      names.set(p.id as string, (p.full_name as string | null) ?? "—");
      logins.set(p.id as string, (p.username as string | null) ?? "");
      emails.set(p.id as string, (p.contact_email as string | null) ?? "");
      statuses.set(p.id as string, ((p.member_status as MemberStatus) ?? "active") as MemberStatus);
    }
    // One signing call for the whole roster.
    const signed = await signAvatars(rows.map((p) => (p.avatar_path as string | null) ?? null));
    rows.forEach((p, i) => {
      const url = signed[i];
      if (url) photos.set(p.id as string, url);
    });
  }

  return {
    id: group.id as string,
    name: group.name as string,
    status: ((group.status as GroupStatus | null) ?? "active") as GroupStatus,
    capacity: (group.capacity as number | null) ?? null,
    teacherId: (group.teacher_id as string | null) ?? null,
    teacherName: (teacherRes.data as { full_name: string | null } | null)?.full_name ?? null,
    members: memberRows.map((m) => ({
      id: m.student_id as string,
      name: names.get(m.student_id as string) ?? "—",
      login: logins.get(m.student_id as string) || null,
      contactEmail: emails.get(m.student_id as string) || null,
      status: statuses.get(m.student_id as string) ?? "active",
      joinedAt: m.joined_at as string,
      photoUrl: photos.get(m.student_id as string) ?? null,
    })),
    pendingInvites: (invitesRes.data ?? []).map((i) => ({
      email: i.email as string,
      expiresAt: i.expires_at as string,
    })),
  };
}
