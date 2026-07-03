import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { VocabularyList, type VocabItem } from "./vocabulary-list";

export const dynamic = "force-dynamic";

/**
 * Vocabulary = the student's personal word list, built while practicing (select a
 * word in a reading passage → translate → add). RLS scopes the rows to the owner,
 * so the query returns only this student's words. Students only.
 */
export default async function VocabularyPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const supabase = await createClient();
  const { data } = await supabase
    .from("vocabulary_items")
    .select("id, word, language, translation, definition, example, context_sentence, source, created_at")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });

  const items = (data ?? []) as VocabItem[];

  // Header, review hero, filters, and the grid all render in the client
  // component — filtering/review/deletes are browser-side.
  return <VocabularyList initial={items} />;
}
