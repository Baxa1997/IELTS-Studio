/**
 * Seed the shared READING LIBRARY — the ready-to-start content every learner sees
 * so they never have to wait for generation: ~10 full tests + ~10 standalone
 * passages, all run through the REAL generate → answer-key-check pipeline
 * (`lib/reading/service`) and stored in one library org. 100% original, in the
 * IELTS Academic FORMAT — never Cambridge content (CLAUDE.md §IP).
 *
 * On "Start", a learner gets their own clone of a library item (see
 * instantiateLibrary* in lib/reading/service.ts), so RLS/grading are untouched.
 *
 * ── Running ─────────────────────────────────────────────────────────────────
 *   npm run seed:reading
 *
 * Idempotent / resumable: it counts what's already in the library and only
 * generates the remainder, so you can re-run after a partial/failed run. Each item
 * is two+ model calls, so a full seed of 20 items takes a while — that's expected.
 *
 * (`server-only` modules resolve only under the react-server condition, so the npm
 *  script runs: node --conditions=react-server --import tsx … — same as calibrate.)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env.local into process.env BEFORE importing the pipeline (the AI + Supabase
// layers read credentials from env). CLI env wins.
loadEnvLocal();

// A realistic spread of difficulty so the library covers weak → strong learners.
const TEST_BANDS = [5, 5, 6, 6, 6, 7, 7, 7, 8, 8];
const PASSAGE_BANDS = [4, 5, 5, 6, 6, 7, 7, 7, 8, 8];

async function main(): Promise<void> {
  // Dynamic import so env is populated first.
  const {
    ensureReadingLibraryOrg,
    generateLibraryReadingTest,
    generateLibraryReadingPassage,
    READING_LIBRARY_ORG_ID,
  } = await import("../lib/reading/service");
  const { createAdminClient } = await import("../lib/supabase/admin");

  console.log("\nSeeding the shared reading library (original, IELTS-format)…\n");

  await ensureReadingLibraryOrg();
  const admin = createAdminClient();

  // Resume: count what's already there, generate only the remainder.
  const { count: haveTests } = await admin
    .from("reading_tests")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", READING_LIBRARY_ORG_ID)
    .eq("is_library", true);
  const { count: havePassages } = await admin
    .from("reading_passages")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", READING_LIBRARY_ORG_ID)
    .eq("is_library", true)
    .is("test_id", null);

  let made = 0;
  let failed = 0;

  // ── Full tests ──────────────────────────────────────────────────────────
  for (let i = haveTests ?? 0; i < TEST_BANDS.length; i++) {
    const band = TEST_BANDS[i];
    process.stdout.write(`  test ${i + 1}/${TEST_BANDS.length} (≈band ${band}) … `);
    try {
      const { passages } = await generateLibraryReadingTest(band);
      const q = passages.reduce((n, p) => n + p.questions.length, 0);
      console.log(`ok — 3 passages, ${q} questions`);
      made++;
    } catch (err) {
      console.log(`FAILED — ${errMsg(err)}`);
      failed++;
    }
  }
  if ((haveTests ?? 0) >= TEST_BANDS.length) console.log(`  tests: already have ${haveTests} — skipping`);

  // ── Standalone passages ──────────────────────────────────────────────────
  for (let i = havePassages ?? 0; i < PASSAGE_BANDS.length; i++) {
    const band = PASSAGE_BANDS[i];
    process.stdout.write(`  passage ${i + 1}/${PASSAGE_BANDS.length} (band ${band}) … `);
    try {
      const { questions } = await generateLibraryReadingPassage(band);
      console.log(`ok — ${questions.length} questions`);
      made++;
    } catch (err) {
      console.log(`FAILED — ${errMsg(err)}`);
      failed++;
    }
  }
  if ((havePassages ?? 0) >= PASSAGE_BANDS.length) console.log(`  passages: already have ${havePassages} — skipping`);

  console.log(`\nDone. Generated ${made} item(s)${failed ? `, ${failed} failed (re-run to retry)` : ""}.\n`);
  process.exit(failed > 0 && made === 0 ? 1 : 0);
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
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
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
