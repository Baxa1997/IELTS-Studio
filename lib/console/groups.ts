import "server-only";

import { type Profile } from "@/lib/auth";
import { signAvatars } from "@/lib/console/avatars";
import { createClient } from "@/lib/supabase/server";

export interface GroupSummary {
  id: string;
  name: string;
  teacherId: string | null;
  teacherName: string | null;
  memberCount: number;
}

export interface StaffOption {
  id: string;
  name: string;
}

export interface GroupMemberRow {
  id: string;
  name: string;
  joinedAt: string;
  /** Signed URL for their photo, or null when they don't have one. */
  photoUrl: string | null;
}

export interface GroupDetail {
  id: string;
  name: string;
  teacherId: string | null;
  teacherName: string | null;
  members: GroupMemberRow[];
  pendingInvites: { email: string; expiresAt: string }[];
}

/**
 * Groups for the console list. A center_admin sees every group in the org; a
 * teacher sees only the groups assigned to them (which is also the only set
 * whose membership RLS lets them read, so the counts stay truthful).
 */
export async function loadGroups(
  profile: Profile,
): Promise<{ groups: GroupSummary[]; teachers: StaffOption[] }> {
  const supabase = await createClient();

  let groupQuery = supabase
    .from("groups")
    .select("id, name, teacher_id")
    .order("name", { ascending: true });
  if (profile.role === "teacher") groupQuery = groupQuery.eq("teacher_id", profile.id);

  const [groupsRes, staffRes] = await Promise.all([
    groupQuery,
    supabase.from("profiles").select("id, full_name, role").in("role", ["teacher", "center_admin"]),
  ]);

  const groups = groupsRes.data ?? [];
  const staff = staffRes.data ?? [];
  const staffName = new Map(staff.map((s) => [s.id as string, (s.full_name as string | null) ?? "—"]));

  // One grouped count query instead of N: fetch the visible membership rows for
  // these groups and tally in memory (a center's rosters are small).
  const ids = groups.map((g) => g.id as string);
  const counts = new Map<string, number>();
  if (ids.length > 0) {
    const { data: members } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", ids);
    for (const m of members ?? []) {
      const key = m.group_id as string;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  return {
    groups: groups.map((g) => ({
      id: g.id as string,
      name: g.name as string,
      teacherId: (g.teacher_id as string | null) ?? null,
      teacherName: g.teacher_id ? (staffName.get(g.teacher_id as string) ?? null) : null,
      memberCount: counts.get(g.id as string) ?? 0,
    })),
    teachers: staff
      .filter((s) => s.role === "teacher")
      .map((s) => ({ id: s.id as string, name: (s.full_name as string | null) ?? "—" })),
  };
}

/** One group's roster + its outstanding invites. Returns null when the caller
 *  can't see the group (RLS) — the page turns that into a 404. */
export async function loadGroupDetail(groupId: string): Promise<GroupDetail | null> {
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, teacher_id")
    .eq("id", groupId)
    .maybeSingle();
  if (!group) return null;

  const [membersRes, invitesRes, teacherRes] = await Promise.all([
    supabase
      .from("group_members")
      .select("student_id, joined_at")
      .eq("group_id", groupId)
      .order("joined_at", { ascending: true }),
    supabase
      .from("invites")
      .select("email, expires_at")
      .eq("group_id", groupId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString()),
    group.teacher_id
      ? supabase.from("profiles").select("full_name").eq("id", group.teacher_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const memberRows = membersRes.data ?? [];
  const studentIds = memberRows.map((m) => m.student_id as string);
  const names = new Map<string, string>();
  const photos = new Map<string, string>();
  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_path")
      .in("id", studentIds);
    const rows = profiles ?? [];
    for (const p of rows) {
      names.set(p.id as string, (p.full_name as string | null) ?? "—");
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
    teacherId: (group.teacher_id as string | null) ?? null,
    teacherName: (teacherRes.data as { full_name: string | null } | null)?.full_name ?? null,
    members: memberRows.map((m) => ({
      id: m.student_id as string,
      name: names.get(m.student_id as string) ?? "—",
      joinedAt: m.joined_at as string,
      photoUrl: photos.get(m.student_id as string) ?? null,
    })),
    pendingInvites: (invitesRes.data ?? []).map((i) => ({
      email: i.email as string,
      expiresAt: i.expires_at as string,
    })),
  };
}
