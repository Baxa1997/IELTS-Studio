"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Stocking and tidying the practice library (§9).
 *
 * Separate from `groups/actions.ts` because saving a prompt to the shelf is not
 * a thing you do to a group — the same item serves every class in the centre,
 * which is the whole reason the shelf is shared.
 */

export interface LibraryState {
  error?: string;
  ok?: string;
}

const SKILLS = new Set(["writing", "reading", "listening", "speaking"]);

/**
 * Keep this prompt or test.
 *
 * IDEMPOTENT BY (kind, ref_id). A teacher who saves the same prompt twice —
 * from the assign panel and then from the practice board — has one shelf entry,
 * not two, because two entries for one prompt would split its "used 4 times"
 * count in half and make the library's only useful statistic wrong.
 */
export async function saveToLibrary(
  _prev: LibraryState,
  formData: FormData,
): Promise<LibraryState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher" && profile.role !== "center_admin") {
    return { error: "Only teaching staff can add to the library." };
  }

  const kind = String(formData.get("kind") ?? "");
  if (kind !== "writing_prompt" && kind !== "reading_test") {
    return { error: "That is not something the library holds." };
  }

  const refId = String(formData.get("ref_id") ?? "").trim();
  if (!refId) return { error: "Nothing to save." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Give it a name you would recognise in a list." };

  const skill = String(formData.get("skill") ?? "").trim();
  if (!SKILLS.has(skill)) return { error: "Pick a skill." };

  const supabase = await createClient();

  // The content has to be this centre's. RLS on the target table already scopes
  // it, so a miss means it belongs to somebody else or does not exist — and
  // both answers are the same answer.
  const table = kind === "writing_prompt" ? "writing_prompts" : "reading_tests";
  const { data: content } = await supabase.from(table).select("id").eq("id", refId).maybeSingle();
  if (!content) return { error: "That practice is not one of yours." };

  const { error } = await supabase
    .from("practice_library")
    .upsert(
      {
        organization_id: profile.organization_id,
        kind,
        ref_id: refId,
        title,
        skill,
        task_type: String(formData.get("task_type") ?? "").trim() || null,
        level: String(formData.get("level") ?? "").trim() || null,
        notes: String(formData.get("notes") ?? "").trim() || null,
        // Saving something previously archived puts it back on the shelf, which
        // is what a teacher means by saving it again.
        archived_at: null,
      },
      { onConflict: "organization_id,kind,ref_id" },
    )
    .select("id");
  if (error) return { error: error.message };

  revalidatePath("/console/practice");
  return { ok: `"${title}" is in the library. Any teacher here can set it now.` };
}

/**
 * Take it off the shelf — archived, never deleted (R5).
 *
 * A prompt a class has already sat cannot vanish: its assignments, its
 * attempts, and every report built on them point back at it. Archiving hides it
 * from the picker and keeps the history intact.
 */
export async function archiveLibraryItem(
  _prev: LibraryState,
  formData: FormData,
): Promise<LibraryState> {
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher" && profile.role !== "center_admin") {
    return { error: "Only teaching staff can change the library." };
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { error: "Nothing to archive." };
  const restore = String(formData.get("restore") ?? "") === "on";

  const supabase = await createClient();
  // `.select()` after the write: an RLS-filtered update reports success and
  // changes nothing, so the returned rows are the only proof it landed.
  const { data, error } = await supabase
    .from("practice_library")
    .update({ archived_at: restore ? null : new Date().toISOString() })
    .eq("id", id)
    .select("title");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "That item is not yours to change." };

  revalidatePath("/console/practice");
  return {
    ok: restore
      ? `"${data[0].title}" is back on the shelf.`
      : `"${data[0].title}" archived. Everything already set from it is untouched.`,
  };
}
