import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * What has actually happened inside one centre, newest first.
 *
 * There is no event table behind this and it does not need one: every fact it
 * reports is already a timestamped row somewhere. A group has a `created_at`, a
 * membership has a `joined_at`, a profile has the day it appeared, and the
 * organization records when it was approved. Merging those in date order is a
 * truthful history for free — and the alternative, a new events table written
 * by hand at every call site, is the kind that quietly stops being written.
 *
 * WHAT IT CANNOT SHOW, and why that is fine here: only creations. Nothing
 * records a rename or a deletion, so a group that was removed leaves no line.
 * The question this feed answers is "did this centre ever get going?", and for
 * that, creations are the whole story.
 */

export interface ActivityRow {
  when: string;
  what: string;
  who: string;
}

export async function loadCenterActivity(orgId: string, limit = 8): Promise<ActivityRow[]> {
  const admin = createAdminClient();

  const [orgRes, profilesRes, groupsRes, membersRes, assignmentsRes] = await Promise.all([
    admin.from("organizations").select("name, created_at, approved_at").eq("id", orgId).maybeSingle(),
    admin
      .from("profiles")
      .select("id, full_name, role, username, created_at")
      .eq("organization_id", orgId),
    admin
      .from("groups")
      .select("id, name, created_at, created_by")
      .eq("organization_id", orgId),
    admin
      .from("group_members")
      .select("group_id, student_id, joined_at, added_by")
      .eq("organization_id", orgId),
    admin
      .from("assignments")
      .select("title, group_id, created_at, created_by")
      .eq("organization_id", orgId),
  ]);

  const people = new Map(
    (profilesRes.data ?? []).map((p) => [
      p.id as string,
      ((p.full_name as string | null) ?? (p.username as string | null) ?? "someone") as string,
    ]),
  );
  const groupName = new Map(
    (groupsRes.data ?? []).map((g) => [g.id as string, g.name as string]),
  );
  const nameOf = (id: string | null | undefined) => (id ? (people.get(id) ?? "—") : "—");

  const rows: ActivityRow[] = [];

  const org = orgRes.data;
  if (org?.approved_at) {
    rows.push({
      when: org.approved_at as string,
      what: `${org.name} was approved and opened`,
      who: "super admin",
    });
  }

  for (const p of profilesRes.data ?? []) {
    const role = p.role as string;
    const label =
      role === "center_admin"
        ? "Center admin"
        : role === "teacher"
          ? "Teacher"
          : role === "administrator"
            ? "Administrator"
            : "Student";
    rows.push({
      when: p.created_at as string,
      what: `${label} ${(p.full_name as string | null) ?? "—"} joined`,
      who: (p.username as string | null) ?? "—",
    });
  }

  for (const g of groupsRes.data ?? []) {
    rows.push({
      when: g.created_at as string,
      what: `Group ${g.name} created`,
      who: nameOf(g.created_by as string | null),
    });
  }

  for (const m of membersRes.data ?? []) {
    rows.push({
      when: m.joined_at as string,
      what: `${nameOf(m.student_id as string)} added to ${groupName.get(m.group_id as string) ?? "a group"}`,
      who: nameOf(m.added_by as string | null),
    });
  }

  for (const a of assignmentsRes.data ?? []) {
    rows.push({
      when: a.created_at as string,
      what: `“${a.title}” set to ${groupName.get(a.group_id as string) ?? "a group"}`,
      who: nameOf(a.created_by as string | null),
    });
  }

  return rows
    .filter((r) => r.when)
    .sort((a, b) => b.when.localeCompare(a.when))
    .slice(0, limit);
}
