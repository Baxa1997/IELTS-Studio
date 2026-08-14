import "server-only";

import { createClient } from "@/lib/supabase/server";

import { lessonContentSchema, type LessonContent } from "./types";

/**
 * One lesson, for the page that shows it.
 *
 * Reads through the RLS client, so this is also the access check: staff get
 * their centre's lessons, a student gets one only because it was set to a class
 * they are in, and everyone else gets null. There is no role branch here on
 * purpose — the policy is the rule, and duplicating it in TypeScript is how the
 * two drift apart.
 */

export interface LoadedLesson {
  id: string;
  title: string;
  subtitle: string | null;
  blueprint: string;
  topic: string;
  level: string | null;
  language: string;
  status: "draft" | "published" | "archived";
  brief: string;
  content: LessonContent;
  exerciseCount: number;
  shareToken: string | null;
  shareEnabled: boolean;
  createdBy: string | null;
  createdAt: string;
  /** True once anyone has attempted it — after which the content is frozen. */
  hasAttempts: boolean;
}

export async function loadLesson(id: string): Promise<LoadedLesson | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("lessons")
    .select("id, title, subtitle, blueprint, topic, level, explain_language, status, brief, content, exercise_count, share_token, share_enabled, created_by, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  // Parse rather than cast. The row was written by the engine against the same
  // schema, but a stored document outlives the code that wrote it — and a
  // lesson that fails to parse should show as broken, not render half a page of
  // undefined.
  const parsed = lessonContentSchema.safeParse(data.content);
  if (!parsed.success) return null;

  const { count } = await supabase
    .from("lesson_attempts")
    .select("id", { count: "exact", head: true })
    .eq("lesson_id", id);

  return {
    id: data.id as string,
    title: data.title as string,
    subtitle: (data.subtitle as string | null) ?? null,
    blueprint: data.blueprint as string,
    topic: data.topic as string,
    level: (data.level as string | null) ?? null,
    language: (data.explain_language as string) ?? "en",
    status: data.status as LoadedLesson["status"],
    brief: data.brief as string,
    content: parsed.data as LessonContent,
    exerciseCount: (data.exercise_count as number) ?? parsed.data.exercises.length,
    shareToken: (data.share_token as string | null) ?? null,
    shareEnabled: Boolean(data.share_enabled),
    createdBy: (data.created_by as string | null) ?? null,
    createdAt: data.created_at as string,
    hasAttempts: (count ?? 0) > 0,
  };
}
