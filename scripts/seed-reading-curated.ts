/**
 * Seed the shared reading library with the hand-written content in
 * lib/reading/curated — standalone practice passages and full three-passage
 * tests, all original and in the IELTS Academic format.
 *
 * WHY THE CONTENT LIVES IN CODE: the library is one reserved organisation, and in
 * August 2026 an org delete wiped every row it held. The repo is now the source
 * of truth. Every library id (passage and test) is DERIVED from its key, so
 * re-running this after any loss recreates the same ids, and learners' copies
 * (library_key) and their "opened" state still point at the right card.
 *
 * WHAT HAS TO PASS BEFORE ANYTHING IS STORED — the same bar generated content
 * clears (lib/reading/service.ts):
 *   1. the deterministic code checks (lib/reading/code-checks.ts);
 *   2. the SEPARATE answer-key checker model (kind "reading_validation"): every
 *      key "correct", confidence ≥ CONFIDENCE_THRESHOLD, proof sentence OK.
 * Anything that fails is reported and NOT stored — fix the content and re-run.
 * A full test is all or nothing: if one of its passages fails, none is stored.
 *
 * ── Running ─────────────────────────────────────────────────────────────────
 *   npm run seed:reading:curated                      # dry run: checks only
 *   npm run seed:reading:curated -- --apply           # store what isn't in the library yet
 *   npm run seed:reading:curated -- --apply --replace # also re-store existing items
 *
 * ⚠️ .env.local points at PRODUCTION. The checker makes one model call per
 * passage; rate-limit errors are retried with a growing pause.
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

const RATE_LIMIT_ATTEMPTS = 5;

/** A stable UUID (v5 layout) derived from a passage or test key. */
function libraryIdFor(key: string): string {
  const h = createHash("sha1").update(`ielts-reading-library:${key}`).digest();
  h[6] = (h[6] & 0x0f) | 0x50;
  h[8] = (h[8] & 0x3f) | 0x80;
  const hex = h.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

type Checked = { ok: true; confidence: Map<number, number> } | { ok: false; report: string };

async function main(): Promise<void> {
  const { CURATED_READING_PASSAGES, CURATED_READING_TESTS } =
    await import("../lib/reading/curated");
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

  /** Each row of a choose-two pair carries its own option before the pair is folded
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

  /** Code checks, then the separate model checker. */
  async function check(p: CuratedPassage): Promise<Checked> {
    const answers = perRowAnswers(p);
    const problems = p.questions
      .map((q, i) => ({
        n: i + 1,
        problem: codeCheckProblem({ ...q, answer: answers[i], number: i + 1 }, p.body),
      }))
      .filter((x) => x.problem);
    if (problems.length) {
      return { ok: false, report: problems.map((x) => `      Q${x.n}: ${x.problem}`).join("\n") };
    }

    let verdicts;
    try {
      verdicts = await withRateLimitRetry(async () => {
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
        return readingValidationOutputSchema.parse(JSON.parse(raw)).items;
      });
    } catch (err) {
      return { ok: false, report: `      answer-key checker unavailable: ${errMsg(err)}` };
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
      return {
        ok: false,
        report: rejected
          .map(({ n, v }) =>
            v
              ? `      Q${n}: ${v.verdict} (${v.confidence})${v.corrected_answer ? ` → ${v.corrected_answer}` : ""}${v.supporting_sentence_ok ? "" : " [proof sentence]"} ${v.note}`
              : `      Q${n}: no verdict`,
          )
          .join("\n"),
      };
    }
    return { ok: true, confidence: new Map(verdicts.map((v) => [v.number, v.confidence])) };
  }

  /** Insert one passage and its questions. Throws on failure; a standalone passage
   *  removes itself, a test passage is cleaned up by deleting its test. */
  async function storePassage(
    p: CuratedPassage,
    confidence: Map<number, number>,
    placement: { testId: string | null; order: number | null },
  ): Promise<string> {
    const id = libraryIdFor(p.key);
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
      test_id: placement.testId,
      order_in_test: placement.order,
      is_library: true,
    });
    if (pErr) throw new Error(`passage "${p.title}": ${pErr.message}`);

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
          confidence: confidence.get(i + 1) ?? null,
          needs_review: false,
          validation_verdict: "correct",
          validation_note: null,
        })),
      )
      .select("id");
    if (qErr || (rows ?? []).length !== p.questions.length) {
      if (!placement.testId) await admin.from("reading_passages").delete().eq("id", id);
      throw new Error(
        `questions for "${p.title}": ${qErr?.message ?? `stored ${(rows ?? []).length} of ${p.questions.length}`}`,
      );
    }
    return id;
  }

  let stored = 0;
  let skipped = 0;
  let failed = 0;

  // ── Standalone practice passages ─────────────────────────────────────────
  console.log("Passage practice");
  for (const p of CURATED_READING_PASSAGES) {
    const id = libraryIdFor(p.key);
    const label = `"${p.title}" (band ${p.difficulty}, ${p.questions.length} Qs)`;

    const { data: existing } = await admin
      .from("reading_passages")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (existing && !REPLACE) {
      skipped++;
      console.log(`  • ${label} already in the library`);
      continue;
    }

    const result = await check(p);
    if (!result.ok) {
      failed++;
      console.log(`  ✗ ${label}\n${result.report}`);
      continue;
    }
    if (!APPLY) {
      console.log(`  ✓ ${label} passes both checks${existing ? " (would be replaced)" : ""}`);
      continue;
    }

    try {
      if (existing) {
        const { error } = await admin.from("reading_passages").delete().eq("id", id).select("id");
        if (error) throw new Error(`replace: ${error.message}`);
      }
      await storePassage(p, result.confidence, { testId: null, order: null });
      stored++;
      console.log(`  ✓ ${label} stored (${id})`);
    } catch (err) {
      failed++;
      console.log(`  ✗ ${label} — ${errMsg(err)}`);
    }
  }

  // ── Full tests ────────────────────────────────────────────────────────────
  console.log("\nFull tests");
  for (const t of CURATED_READING_TESTS) {
    const testId = libraryIdFor(t.key);
    const label = `${t.key} (band ${t.targetBand}: ${t.passages.map((p) => p.title).join(" / ")})`;

    const { data: existing } = await admin
      .from("reading_tests")
      .select("id")
      .eq("id", testId)
      .maybeSingle();
    if (existing && !REPLACE) {
      skipped++;
      console.log(`  • ${label} already in the library`);
      continue;
    }

    const confidences: Map<number, number>[] = [];
    const reports: string[] = [];
    for (const [i, p] of t.passages.entries()) {
      const result = await check(p);
      if (result.ok) confidences.push(result.confidence);
      else reports.push(`    Passage ${i + 1} "${p.title}"\n${result.report}`);
    }
    if (reports.length) {
      failed++;
      console.log(`  ✗ ${label}\n${reports.join("\n")}`);
      continue;
    }
    if (!APPLY) {
      console.log(`  ✓ ${label} passes both checks${existing ? " (would be replaced)" : ""}`);
      continue;
    }

    try {
      // Deleting a test cascades to its passages and questions, so a replace or a
      // failed store never leaves a partial test behind.
      if (existing) {
        const { error } = await admin.from("reading_tests").delete().eq("id", testId).select("id");
        if (error) throw new Error(`replace: ${error.message}`);
      }
      const { error: tErr } = await admin.from("reading_tests").insert({
        id: testId,
        organization_id: READING_LIBRARY_ORG_ID,
        module: "academic",
        target_band: t.targetBand,
        status: "approved",
        source: "manual",
        needs_review: false,
        created_by: null,
        is_library: true,
      });
      if (tErr) throw new Error(`test: ${tErr.message}`);
      try {
        for (const [i, p] of t.passages.entries()) {
          await storePassage(p, confidences[i], { testId, order: i + 1 });
        }
      } catch (err) {
        await admin.from("reading_tests").delete().eq("id", testId);
        throw err;
      }
      stored++;
      console.log(`  ✓ ${label} stored (${testId})`);
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

/** Retry a model call when the provider rate-limits it (429), pausing longer each time. */
async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const rateLimited = /\b429\b|RESOURCE_EXHAUSTED/i.test(errMsg(err));
      if (!rateLimited || attempt >= RATE_LIMIT_ATTEMPTS) throw err;
      const seconds = 30 * attempt;
      console.log(`      rate limited — retrying in ${seconds}s`);
      await new Promise((r) => setTimeout(r, seconds * 1000));
    }
  }
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
