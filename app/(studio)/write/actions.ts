"use server";

import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Autosave/save a Task 2 draft against a served prompt.
 *
 * Creates the essay on first save and reuses it afterwards, so autosaves and the
 * eventual submit all land on ONE essay row (whose many gradings form the revision
 * history). Saves keep status = 'draft'; the grade route owns 'grading'/'graded'.
 * All writes go through the RLS client — a student can only write their own essays.
 */

export interface SaveDraftResult {
  essayId?: string;
  error?: string;
}

export async function saveDraft(input: {
  promptId: string;
  essayId: string | null;
  content: string;
}): Promise<SaveDraftResult> {
  const session = await getSession();
  if (!session?.profile) return { error: "You are not signed in." };
  if (session.profile.role !== "student") return { error: "Only students write essays here." };

  const content = input.content;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const supabase = await createClient();

  // Reuse the same essay across autosaves and resubmits.
  if (input.essayId) {
    const { data, error } = await supabase
      .from("essays")
      .update({ content, word_count: wordCount, status: "draft" })
      .eq("id", input.essayId)
      .eq("student_id", session.profile.id)
      .select("id")
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: "Draft not found." };
    return { essayId: data.id };
  }

  // First save: the prompt must be one the student can see (RLS = approved + org).
  const { data: prompt } = await supabase
    .from("writing_prompts")
    .select("id, task_type")
    .eq("id", input.promptId)
    .maybeSingle();
  if (!prompt) return { error: "That prompt is no longer available." };

  const { data, error } = await supabase
    .from("essays")
    .insert({
      organization_id: session.profile.organization_id,
      student_id: session.profile.id,
      prompt_id: prompt.id,
      task_type: prompt.task_type,
      content,
      word_count: wordCount,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Could not save draft." };
  return { essayId: data.id };
}
