/**
 * Seed the shared reading library with the hand-written passages in
 * lib/reading/curated — original passages in the IELTS Academic format.
 *
 * WHY THE CONTENT LIVES IN CODE: the library is one reserved organisation, and in
 * August 2026 an org delete wiped every row it held. The repo is now the source
 * of truth. Each passage's library id is DERIVED from its key, so re-running this
 * after any loss recreates the same ids, and learners' copies (library_key) and
 * their "opened" state still point at the right card.
 *
 * WHAT HAS TO PASS BEFORE A PASSAGE IS STORED — the same bar generated passages
 * clear (lib/reading/service.ts):
 *   1. the deterministic code checks (lib/reading/code-checks.ts);
 *   2. the SEPARATE answer-key checker model (kind "reading_validation"): every
 *      key "correct", confidence ≥ CONFIDENCE_THRESHOLD, proof sentence OK.
 * A passage with any failure is reported and NOT stored — fix the content and
 * re-run. Unlike the generator, nothing is silently dropped: a hand-written
 * block with a question missing would break the exam layout.
 *
 * ── Running ─────────────────────────────────────────────────────────────────
 *   npm run seed:reading:curated                      # dry run: checks only
 *   npm run seed:reading:curated -- --apply           # store passages not yet in the library
 *   npm run seed:reading:curated -- --apply --replace # also re-store existing ones
 *
 * ⚠️ .env.local points at PRODUCTION. The checker makes one model call per passage.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { CuratedPassage } from "../lib/reading/curated";

loadEnvLocal();

const APPLY = process.argv.includes("--apply");
const REPLACE = process.argv.includes("--replace");

/** Synthetic ids for AI-usage logging — non-UUIDs, so the usage insert is rejected
 *  and swallowed (the same convention as the generated library seed). */
const SEED_META = { organizationId: "reading-library-seed", userId: "reading-library-seed" };

/** A stable UUID (v5 layout) derived from the passage key. */
function libraryIdFor(key: string): string {
  const h = createHash("sha1").update(`ielts-reading-library:${key}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const hex = h.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function main(): Promise<void> {
  const { CURATED_READING_PASSAGES } = await import("../lib/reading/curated");
  const { codeCheckProblem } = await import("../lib/reading/code-checks");
  const { PICK_TWO_KEY_RE } = await import("../lib/reading/grade");
  const { CONFIDENCE_THRESHOLD, readingValidationOutputSchema } =
    await import("../lib/reading/types");
  const { ensureReadingLibraryOrg, READING_LIBRARY_ORG_ID } =
    await import("../lib/reading/service");
  const { generate } = await import("../lib/ai");
  const { createAdminClient } = await import("../lib/supabase/admin");

  const admin = createAdminClient();
  console.log(
    `\nCurated reading library — ${APPLY ? "APPLY: this writes to the database" : "dry run: checks only"}\n`,
  );
  if (APPLY) await ensureReadingLibraryOrg();

  /** Each row of a choose-two pair carries its own letter before the pair is folded
   *  into one "A or C" key — checks see it exactly as they do for generated sets. */
  const perRowAnswers = (p: CuratedPassage): string[] => {
    let slot = 0;
    return p.questions.map((q) => {
      const pair = q.type === "multiple_choice" && PICK_TWO_KEY_RE.test(q.answer);
      if (!pair) {
        slot = 0;
        return q.answer;
      }
      const letter = q.answer.split(/\s+or\s+/i)[slot];
      slot = (slot + 1) % 2;
      return q.options?.[letter.toUpperCase().charCodeAt(0) - 65] ?? letter;
    });
  };

  let stored = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of CURATED_READING_PASSAGES) {
    const id = libraryIdFor(p.key);
    const label = `"${p.title}" (band ${p.difficulty}, ${p.questions.length} Qs)`;
    const answers = perRowAnswers(p);

    // 1. Deterministic code checks.
    const problems = p.questions
      .map((q, i) => ({
        n: i + 1,
        problem: codeCheckProblem({ ...q, answer: answers[i], number: i + 1 }, p.body),
      }))
      .filter((x) => x.problem);
    if (problems.length) {
      failed++;
      console.log(`  ✗ ${label}\n${problems.map((x) => `      Q${x.n}: ${x.problem}`).join("\n")}`);
      continue;
    }

    const { data: existing } = await admin
      .from("reading_passages")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (existing && !REPLACE) {
      skipped++;
      console.log(`  • ${label} already in the library (${id})`);
      continue;
    }

    // 2. The separate answer-key checker.
    let verdicts;
    try {
      const res = await generate({
        kind: "reading_validation",
        spec: {
          passage: `${p.title}\n\n${p.body}`,
          questions: p.questions.map((q, i) => ({
            number: i + 1,
            type: q.type,
            prompt: q.prompt,
            options: q.options,
            answer: answers[i],
            supporting_sentence: q.supporting_sentence,
          })),
        },
        meta: SEED_META,
      });
      const raw = res.content
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "");
      verdicts = readingValidationOutputSchema.parse(JSON.parse(raw)).items;
    } catch (err) {
      failed++;
      console.log(`  ✗ ${label} — answer-key checker unavailable: ${errMsg(err)}`);
      continue;
    }

    const byNumber = new Map(verdicts.map((v) => [v.number, v]));
    const rejected = p.questions
      .map((_, i) => ({ n: i + 1, v: byNumber.get(i + 1) }))
      .filter(
        ({ v }) =>
          !v ||
          v.verdict !== "correct" ||
          v.confidence < CONFIDENCE_THRESHOLD ||
          !v.supporting_sentence_ok,
      );
    if (rejected.length) {
      failed++;
      console.log(
        `  ✗ ${label} — checker did not confirm ${rejected.length} key(s):\n${rejected
          .map(({ n, v }) =>
            v
              ? `      Q${n}: ${v.verdict} (${v.confidence})${v.corrected_answer ? ` → ${v.corrected_answer}` : ""}${v.supporting_sentence_ok ? "" : " [proof sentence]"} ${v.note}`
              : `      Q${n}: no verdict`,
          )
          .join("\n")}`,
      );
      continue;
    }

    if (!APPLY) {
      console.log(`  ✓ ${label} passes both checks${existing ? " (would be replaced)" : ""}`);
      continue;
    }

    // 3. Store (replace first if asked). Learners' copies are separate rows, so
    //    re-storing a template never touches work already done on it.
    try {
      if (existing) {
        const { error } = await admin.from("reading_passages").delete().eq("id", id).select("id");
        if (error) throw new Error(`replace: ${error.message}`);
      }
      const { error: pErr } = await admin.from("reading_passages").insert({
        id,
        organization_id: READING_LIBRARY_ORG_ID,
        title: p.title,
        body: p.body,
        module: "academic",
        topic: p.topic,
        difficulty: p.difficulty,
        status: "approved",
        source: "manual",
        needs_review: false,
        created_by: null,
        test_id: null,
        is_library: true,
      });
      if (pErr) throw new Error(`passage: ${pErr.message}`);

      const { data: rows, error: qErr } = await admin
        .from("reading_questions")
        .insert(
          p.questions.map((q, i) => ({
            passage_id: id,
            organization_id: READING_LIBRARY_ORG_ID,
            question_type: q.type,
            order_index: i + 1,
            prompt: q.prompt,
            options: q.options,
            answer_key: q.answer,
            supporting_sentence: q.supporting_sentence,
            explanation: q.explanation,
            word_limit: q.word_limit,
            section: q.section,
            note_meta: q.note_meta,
            confidence: byNumber.get(i + 1)?.confidence ?? null,
            needs_review: false,
            validation_verdict: "correct",
            validation_note: null,
          })),
        )
        .select("id");
      if (qErr || (rows ?? []).length !== p.questions.length) {
        await admin.from("reading_passages").delete().eq("id", id);
        throw new Error(
          `questions: ${qErr?.message ?? `stored ${(rows ?? []).length} of ${p.questions.length}`}`,
        );
      }
      stored++;
      console.log(`  ✓ ${label} stored (${id})`);
    } catch (err) {
      failed++;
      console.log(`  ✗ ${label} — ${errMsg(err)}`);
    }
  }

  console.log(
    `\n${APPLY ? `Stored ${stored}` : "Dry run"}, ${skipped} already present, ${failed} failed${failed ? " — fix and re-run" : ""}.\n`,
  );
  if (failed > 0) process.exitCode = 1;
}

function loadEnvLocal(): void {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const i = t.indexOf("=");
      const key = t.slice(0, i).trim();
      if (process.env[key] !== undefined) continue; // CLI env wins
      let val = t.slice(i + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch {
    // No .env.local — rely on the ambient environment.
  }
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

main().catch((err) => {
  console.error("\nSeed run crashed:", errMsg(err));
  process.exit(1);
});
