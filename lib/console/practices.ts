import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * The teacher's practice library: everything they have made, in one place, with
 * what happened to it.
 *
 * "Practice" here means a piece of CONTENT (a Task 2 prompt, a reading test),
 * not an assignment — the same prompt can be set to three groups, and the row
 * shows all three. Completion is counted the way every other report counts it:
 * group member × content id (assignments carry no id on the attempt), so a
 * student who did the work outside the homework still counts as done.
 */

export type PracticeKind = "writing" | "reading";
export type PracticeTab = "drafts" | "published" | "archived";

export interface PracticeRow {
  id: string;
  kind: PracticeKind;
  /** Full prompt text for writing; a label for reading. */
  title: string;
  tab: PracticeTab;
  category: string | null;
  topicFamily: string | null;
  targetBand: number | null;
  createdAt: string;
  /** Groups this content is assigned to, by name. */
  groups: string[];
  /** Students across those groups, and how many have a graded attempt. */
  assigned: number;
  completed: number;
  averageBand: number | null;
}

const TAB_OF: Record<string, PracticeTab> = {
  pending: "drafts",
  approved: "published",
  archived: "archived",
  rejected: "archived",
};

/**
 * A teacher's library is their own work — only what they made. `writing_prompts`
 * is readable org-wide by any staff member, so the narrowing happens here; it is
 * a scoping choice, not a security boundary (the content belongs to the center
 * either way — whose list it appears on is the question).
 */
export async function loadPractices(opts: { profileId: string }): Promise<PracticeRow[]> {
  const supabase = await createClient();

  const [promptsRes, testsRes, assignmentsRes] = await Promise.all([
    supabase
      .from("writing_prompts")
      .select("id, prompt_text, category, topic_family, difficulty, status, created_at, created_by")
      .eq("task_type", "task2")
      .eq("created_by", opts.profileId)
      .order("created_at", { ascending: false })
      .limit(200),
    // Reading tests are cloned into the org when they're assigned, so every row
    // here is already published by definition — there is no reading draft.
    supabase
      .from("reading_tests")
      .select("id, target_band, status, created_at")
      .eq("is_library", false)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("assignments").select("prompt_id, reading_test_id, group_id"),
  ]);

  const assignments = assignmentsRes.data ?? [];
  const groupIds = [...new Set(assignments.map((a) => a.group_id as string))];

  const [groupsRes, membersRes] = await Promise.all([
    groupIds.length > 0
      ? supabase.from("groups").select("id, name").in("id", groupIds)
      : Promise.resolve({ data: [] }),
    groupIds.length > 0
      ? supabase.from("group_members").select("group_id, student_id").in("group_id", groupIds)
      : Promise.resolve({ data: [] }),
  ]);

  const groupName = new Map(
    ((groupsRes.data ?? []) as { id: string; name: string }[]).map((g) => [g.id, g.name]),
  );
  const membersOf = new Map<string, string[]>();
  for (const m of (membersRes.data ?? []) as { group_id: string; student_id: string }[]) {
    membersOf.set(m.group_id, [...(membersOf.get(m.group_id) ?? []), m.student_id]);
  }

  // content id → the groups it was set to, and everyone in them
  const reach = new Map<string, { groups: Set<string>; students: Set<string> }>();
  for (const a of assignments) {
    const contentId = (a.prompt_id ?? a.reading_test_id) as string | null;
    if (!contentId) continue;
    const entry = reach.get(contentId) ?? { groups: new Set<string>(), students: new Set<string>() };
    const name = groupName.get(a.group_id as string);
    if (name) entry.groups.add(name);
    for (const s of membersOf.get(a.group_id as string) ?? []) entry.students.add(s);
    reach.set(contentId, entry);
  }

  const promptIds = (promptsRes.data ?? []).map((p) => p.id as string);
  const testIds = (testsRes.data ?? []).map((t) => t.id as string);

  const [essaysRes, attemptsRes] = await Promise.all([
    promptIds.length > 0
      ? supabase
          .from("essays")
          .select("id, prompt_id, student_id, status")
          .in("prompt_id", promptIds)
          .eq("status", "graded")
      : Promise.resolve({ data: [] }),
    testIds.length > 0
      ? supabase
          .from("reading_attempts")
          .select("test_id, student_id, band, status")
          .in("test_id", testIds)
          .eq("status", "graded")
      : Promise.resolve({ data: [] }),
  ]);

  const essays = (essaysRes.data ?? []) as {
    id: string;
    prompt_id: string;
    student_id: string;
  }[];

  // Bands for those essays, in one query rather than one per practice.
  let bandByEssay = new Map<string, number>();
  if (essays.length > 0) {
    const { data: gradings } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, created_at")
      .in(
        "essay_id",
        essays.map((e) => e.id),
      )
      .order("created_at", { ascending: true });
    bandByEssay = new Map(
      ((gradings ?? []) as { essay_id: string; overall_band: number | null }[])
        .filter((g) => g.overall_band != null)
        .map((g) => [g.essay_id, Number(g.overall_band)]),
    );
  }

  // content id → who finished it, and their bands
  const done = new Map<string, { students: Set<string>; bands: number[] }>();
  const note = (contentId: string, student: string, band: number | null) => {
    const entry = done.get(contentId) ?? { students: new Set<string>(), bands: [] };
    entry.students.add(student);
    if (band != null) entry.bands.push(band);
    done.set(contentId, entry);
  };
  for (const e of essays) note(e.prompt_id, e.student_id, bandByEssay.get(e.id) ?? null);
  for (const a of (attemptsRes.data ?? []) as {
    test_id: string;
    student_id: string;
    band: number | null;
  }[]) {
    note(a.test_id, a.student_id, a.band != null ? Number(a.band) : null);
  }

  const row = (args: {
    id: string;
    kind: PracticeKind;
    title: string;
    status: string;
    category: string | null;
    topicFamily: string | null;
    targetBand: number | null;
    createdAt: string;
  }): PracticeRow => {
    const r = reach.get(args.id);
    const d = done.get(args.id);
    // Completion is only meaningful among the students it was actually set to.
    const finished = r ? [...(d?.students ?? [])].filter((s) => r.students.has(s)).length : 0;
    const bands = d?.bands ?? [];
    return {
      id: args.id,
      kind: args.kind,
      title: args.title,
      tab: TAB_OF[args.status] ?? "drafts",
      category: args.category,
      topicFamily: args.topicFamily,
      targetBand: args.targetBand,
      createdAt: args.createdAt,
      groups: [...(r?.groups ?? [])].sort(),
      assigned: r?.students.size ?? 0,
      completed: finished,
      averageBand:
        bands.length > 0
          ? Math.round((bands.reduce((s, b) => s + b, 0) / bands.length) * 10) / 10
          : null,
    };
  };

  const rows: PracticeRow[] = [
    ...(promptsRes.data ?? []).map((p) =>
      row({
        id: p.id as string,
        kind: "writing",
        title: (p.prompt_text as string) ?? "",
        status: p.status as string,
        category: (p.category as string | null) ?? null,
        topicFamily: (p.topic_family as string | null) ?? null,
        targetBand: (p.difficulty as number | null) ?? null,
        createdAt: p.created_at as string,
      }),
    ),
    ...(testsRes.data ?? []).map((t) =>
      row({
        id: t.id as string,
        kind: "reading",
        title: t.target_band ? `Reading test — band ${t.target_band} level` : "Reading test",
        status: t.status as string,
        category: null,
        topicFamily: null,
        targetBand: (t.target_band as number | null) ?? null,
        createdAt: t.created_at as string,
      }),
    ),
  ];

  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** One writing practice for the preview page, or null when it isn't visible. */
export async function loadPractice(id: string): Promise<{
  id: string;
  promptText: string;
  category: string | null;
  topicFamily: string | null;
  difficulty: number | null;
  status: string;
  createdAt: string;
  assignedGroups: string[];
} | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("writing_prompts")
    .select("id, prompt_text, category, topic_family, difficulty, status, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const { data: assignments } = await supabase
    .from("assignments")
    .select("group_id")
    .eq("prompt_id", id);
  const groupIds = (assignments ?? []).map((a) => a.group_id as string);
  let names: string[] = [];
  if (groupIds.length > 0) {
    const { data: groups } = await supabase.from("groups").select("name").in("id", groupIds);
    names = ((groups ?? []) as { name: string }[]).map((g) => g.name).sort();
  }

  return {
    id: data.id as string,
    promptText: (data.prompt_text as string) ?? "",
    category: (data.category as string | null) ?? null,
    topicFamily: (data.topic_family as string | null) ?? null,
    difficulty: (data.difficulty as number | null) ?? null,
    status: data.status as string,
    createdAt: data.created_at as string,
    assignedGroups: names,
  };
}
