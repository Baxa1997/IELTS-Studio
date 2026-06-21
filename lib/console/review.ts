import "server-only";

import { createClient } from "@/lib/supabase/server";

import { isBorderlineGrading } from "./compute";

/**
 * The teacher review queue: low-confidence AI gradings to audit, generated content
 * awaiting approval, and the recent-overrides log (the flywheel made visible).
 * Read through the RLS client — a teacher/admin sees only their org's rows.
 */

export interface ReviewGrading {
  id: string;
  studentName: string;
  band: number;
  createdAt: string;
  /** Criteria disagree enough that the overall band is shaky — surface first. */
  borderline: boolean;
}

export interface PendingPromptItem {
  id: string;
  prompt_text: string;
  category: string | null;
  topic_family: string | null;
  difficulty: number | null;
}

export interface PendingPassageItem {
  id: string;
  title: string;
  topic: string | null;
  module: string;
  needsReview: boolean;
}

export interface OverrideLogItem {
  studentName: string;
  teacherName: string;
  previousBand: number | null;
  newBand: number;
  comment: string;
  createdAt: string;
}

export interface ReviewQueue {
  gradings: ReviewGrading[];
  prompts: PendingPromptItem[];
  passages: PendingPassageItem[];
  overrides: OverrideLogItem[];
}

export async function loadReviewQueue(): Promise<ReviewQueue> {
  const supabase = await createClient();

  const [profilesRes, essaysRes, promptsRes, passagesRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name"),
    supabase.from("essays").select("id, student_id"),
    supabase
      .from("writing_prompts")
      .select("id, prompt_text, category, topic_family, difficulty")
      .eq("task_type", "task2")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("reading_passages")
      .select("id, title, topic, module, needs_review, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
  ]);

  const names = new Map((profilesRes.data ?? []).map((p) => [p.id as string, (p.full_name as string | null) ?? "—"]));
  const essayOwner = new Map((essaysRes.data ?? []).map((e) => [e.id as string, e.student_id as string]));
  const essayIds = [...essayOwner.keys()];

  // Latest grading per essay; keep the un-overridden ones for review.
  const gradings: ReviewGrading[] = [];
  if (essayIds.length > 0) {
    const { data } = await supabase
      .from("gradings")
      .select("id, essay_id, overall_band, criteria, is_teacher_override, created_at")
      .in("essay_id", essayIds)
      .order("created_at", { ascending: true });
    const latest = new Map<string, NonNullable<typeof data>[number]>();
    for (const g of data ?? []) latest.set(g.essay_id as string, g);
    for (const g of latest.values()) {
      if (g.is_teacher_override) continue; // already human-verified
      const studentId = essayOwner.get(g.essay_id as string);
      gradings.push({
        id: g.id as string,
        studentName: studentId ? (names.get(studentId) ?? "—") : "—",
        band: Number(g.overall_band),
        createdAt: g.created_at as string,
        borderline: isBorderlineGrading(g.criteria as Parameters<typeof isBorderlineGrading>[0]),
      });
    }
    // Low-confidence first, then most recent.
    gradings.sort((a, b) =>
      a.borderline === b.borderline ? b.createdAt.localeCompare(a.createdAt) : a.borderline ? -1 : 1,
    );
  }

  // Recent overrides (the log).
  const { data: overrideRows } = await supabase
    .from("grading_overrides")
    .select("essay_id, teacher_id, previous_band, new_band, comment, created_at")
    .order("created_at", { ascending: false })
    .limit(12);
  const overrides: OverrideLogItem[] = (overrideRows ?? []).map((o) => {
    const studentId = essayOwner.get(o.essay_id as string);
    return {
      studentName: studentId ? (names.get(studentId) ?? "—") : "—",
      teacherName: names.get(o.teacher_id as string) ?? "—",
      previousBand: o.previous_band != null ? Number(o.previous_band) : null,
      newBand: Number(o.new_band),
      comment: o.comment as string,
      createdAt: o.created_at as string,
    };
  });

  return {
    gradings: gradings.slice(0, 40),
    prompts: (promptsRes.data ?? []) as PendingPromptItem[],
    passages: (passagesRes.data ?? []).map((p) => ({
      id: p.id as string,
      title: p.title as string,
      topic: (p.topic as string | null) ?? null,
      module: (p.module as string) ?? "academic",
      needsReview: Boolean(p.needs_review),
    })),
    overrides,
  };
}
