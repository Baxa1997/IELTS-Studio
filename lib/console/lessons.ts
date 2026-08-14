import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { LessonContent } from "@/lib/lessons/types";

/**
 * The teacher's Practice AI library.
 *
 * A lesson is CONTENT, not an assignment — the same lesson can be set to three
 * classes and shared as a link, and the card shows all of it. Reads through the
 * RLS client, so a teacher sees their centre's lessons and nothing else.
 */

export type LessonStatus = "draft" | "published" | "archived";

export interface LessonCard {
  id: string;
  title: string;
  subtitle: string | null;
  blueprint: string;
  topic: string;
  level: string | null;
  language: string;
  status: LessonStatus;
  exerciseCount: number;
  createdAt: string;
  shareEnabled: boolean;
  /** Classes it has been set to, by name. */
  groups: string[];
  /** Across those classes: how many students have finished it. */
  assigned: number;
  completed: number;
  /** Mean percentage across finished attempts, or null when nobody has. */
  averagePercent: number | null;
  /** First heading and a line of it — enough for the card's mini-preview. */
  previewHeading: string | null;
}

export const BLUEPRINT_LABEL: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  skill: "Skill",
  exam_technique: "Exam technique",
};

/** Card tint per blueprint, so the grid is scannable by kind at a glance. */
export const BLUEPRINT_TINT: Record<string, { bg: string; ink: string }> = {
  grammar: { bg: "#EEEDF8", ink: "#4340CB" },
  vocabulary: { bg: "#EAF4EE", ink: "#16794C" },
  skill: { bg: "#FBEEE0", ink: "#A9721F" },
  exam_technique: { bg: "#F7E4E2", ink: "#A63A30" },
};

export async function loadLessons(opts: { profileId: string }): Promise<LessonCard[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("lessons")
    // One literal string, deliberately not concatenated: supabase-js infers the
    // row type by parsing this as a string LITERAL, and a `+` makes it a plain
    // `string`, which collapses every field to GenericStringError.
    .select("id, title, subtitle, blueprint, topic, level, explain_language, status, exercise_count, share_enabled, created_at, content, created_by")
    .eq("created_by", opts.profileId)
    .order("created_at", { ascending: false })
    .limit(200);

  const lessons = rows ?? [];
  if (lessons.length === 0) return [];

  const ids = lessons.map((l) => l.id as string);

  // Which classes each lesson was set to, and how those classes did. Two
  // queries for the whole page rather than one per card.
  const [{ data: assignments }, { data: attempts }] = await Promise.all([
    supabase.from("assignments").select("lesson_id, group_id").in("lesson_id", ids),
    supabase
      .from("lesson_attempts")
      .select("lesson_id, student_id, score, max_score")
      .in("lesson_id", ids),
  ]);

  const groupIds = [...new Set((assignments ?? []).map((a) => a.group_id as string))];
  const groupName = new Map<string, string>();
  const memberCount = new Map<string, number>();
  if (groupIds.length > 0) {
    const [{ data: groups }, { data: members }] = await Promise.all([
      supabase.from("groups").select("id, name").in("id", groupIds),
      supabase.from("group_members").select("group_id, student_id").in("group_id", groupIds),
    ]);
    for (const g of groups ?? []) groupName.set(g.id as string, g.name as string);
    for (const m of members ?? []) {
      const gid = m.group_id as string;
      memberCount.set(gid, (memberCount.get(gid) ?? 0) + 1);
    }
  }

  const groupsOf = new Map<string, string[]>();
  const assignedOf = new Map<string, number>();
  for (const a of assignments ?? []) {
    const lid = a.lesson_id as string;
    const gid = a.group_id as string;
    groupsOf.set(lid, [...(groupsOf.get(lid) ?? []), groupName.get(gid) ?? "Class"]);
    assignedOf.set(lid, (assignedOf.get(lid) ?? 0) + (memberCount.get(gid) ?? 0));
  }

  const doneOf = new Map<string, Set<string>>();
  const pctOf = new Map<string, number[]>();
  for (const at of (attempts ?? []) as {
    lesson_id: string;
    student_id: string;
    score: number | null;
    max_score: number | null;
  }[]) {
    const set = doneOf.get(at.lesson_id) ?? new Set<string>();
    set.add(at.student_id);
    doneOf.set(at.lesson_id, set);
    if (at.max_score && at.max_score > 0) {
      pctOf.set(at.lesson_id, [
        ...(pctOf.get(at.lesson_id) ?? []),
        ((at.score ?? 0) / at.max_score) * 100,
      ]);
    }
  }

  return lessons.map((l) => {
    const id = l.id as string;
    const content = l.content as LessonContent | null;
    const pcts = pctOf.get(id) ?? [];
    return {
      id,
      title: l.title as string,
      subtitle: (l.subtitle as string | null) ?? null,
      blueprint: l.blueprint as string,
      topic: l.topic as string,
      level: (l.level as string | null) ?? null,
      language: (l.explain_language as string) ?? "en",
      status: l.status as LessonStatus,
      exerciseCount: (l.exercise_count as number) ?? 0,
      createdAt: l.created_at as string,
      shareEnabled: Boolean(l.share_enabled),
      groups: groupsOf.get(id) ?? [],
      assigned: assignedOf.get(id) ?? 0,
      completed: doneOf.get(id)?.size ?? 0,
      averagePercent:
        pcts.length > 0 ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null,
      previewHeading: content?.sections?.[0]?.heading ?? null,
    };
  });
}
