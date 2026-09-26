import "server-only";

import { createHash } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

import { STARTER_PROMPTS, type StarterPrompt } from "./starter-set";

/**
 * The writing starter set as ONE shared set of rows that no account owns.
 *
 * It used to be copied into each learner's org the first time they opened the
 * library (./starter). That tied every prompt to an account, and it is why a
 * centre's teachers never saw the set at all: copies were only made for learners
 * with a study plan. Migration 20260926150000 builds the shared rows
 * (organization_id NULL, readable by everyone, writable by no client) and
 * repoints learners' essays at them.
 *
 * ⚠️ THE ID IS DERIVED, NOT RANDOM: a name-based (version 3, MD5) uuid of
 * `task_type \n prompt_text`, computed identically here and by
 * public.shared_prompt_id() in that migration. That is what lets the migration
 * build the set from existing copies and this module fill in any prompt no org
 * ever received, without the two disagreeing about which row is which. Change
 * one only together with the other.
 *
 * The version and variant bits are set rather than left as raw md5, because a
 * raw md5 is not a well-formed uuid: Postgres stores it, but a strict validator
 * (zod's `z.uuid()`, for one) rejects it.
 */
export function sharedPromptId(taskType: string, promptText: string): string {
  const hex = createHash("md5").update(`${taskType}\n${promptText}`, "utf8").digest("hex").split("");
  hex[12] = "3"; // version 3: name-based, MD5
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16); // RFC 4122 variant, 10xx
  const h = hex.join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function sharedRow(p: StarterPrompt) {
  return {
    id: sharedPromptId(p.task_type, p.prompt_text),
    organization_id: null,
    task_type: p.task_type,
    category: p.category,
    prompt_text: p.prompt_text,
    figure: p.figure ?? null,
    topic_family: p.topic_family,
    difficulty: p.difficulty,
    status: "approved",
    source: "seed",
    created_by: null,
  };
}

/** Once the set is known complete, this server instance stops checking. */
let complete = false;
/** After a refused insert, when to try again — see the note below. */
let retryAfter = 0;
const RETRY_MS = 15 * 60 * 1000;

/**
 * Make sure every curated prompt exists as a shared row, and say whether the
 * shared set is in use — the caller copies the set into the learner's org only
 * when it is not.
 *
 * Self-healing: a shared row that goes missing is put back from code on the
 * next library visit, under the same id, so it depends on no account and on no
 * one remembering to re-seed.
 *
 * ⚠️ SHIPS BEFORE THE MIGRATION, ON PURPOSE. Until 20260926150000 runs,
 * organization_id is NOT NULL, the insert is refused, this returns false, and
 * the library keeps copying the set into learners' orgs exactly as it did. The
 * refusal is remembered for RETRY_MS so the library does not re-send 176 rows
 * on every page view in the meantime.
 */
export async function ensureSharedWritingPrompts(): Promise<boolean> {
  if (complete) return true;
  if (Date.now() < retryAfter) return false;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("writing_prompts")
    .select("id")
    .is("organization_id", null)
    .eq("source", "seed");
  if (error) return false;

  const have = new Set((data ?? []).map((r) => r.id as string));
  const missing = STARTER_PROMPTS.filter((p) => !have.has(sharedPromptId(p.task_type, p.prompt_text)));
  if (missing.length > 0) {
    const { error: insertError } = await admin
      .from("writing_prompts")
      .upsert(missing.map(sharedRow), { onConflict: "id", ignoreDuplicates: true });
    if (insertError) {
      retryAfter = Date.now() + RETRY_MS;
      if (have.size === 0) return false; // the migration has not run yet
      console.error("[shared prompts] could not restore missing prompts:", insertError.message);
      return true; // the set exists; a few prompts are missing until the next try
    }
  }
  complete = true;
  return true;
}
