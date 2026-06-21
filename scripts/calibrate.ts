/**
 * Grader calibration harness — proves the grader is accurate and NOT inflating.
 *
 * Reads a folder of teacher-labeled essays, runs each through the REAL grading
 * pipeline (`lib/ai` → skill + anchors + ajv schema gate + Vertex), and reports:
 *
 *   • MAE   — mean absolute error vs the human band (how far off, either way).
 *   • Bias  — mean SIGNED error (model − human). POSITIVE = grading too high.
 *             This is the number that matters: a conservative grader is at or
 *             below zero. CLAUDE.md target: within ±0.5 of human, not upward.
 *
 * Per-essay table + an aggregate block + a PASS/FAIL verdict against those
 * targets. Re-run after any rubric/anchor/model change to catch regressions.
 *
 * ── Input format ────────────────────────────────────────────────────────────
 * A folder of *.json files. Each file is one case, or an array of cases:
 *   { "prompt": "...", "essay": "...", "human_band": 6.5, "task_type": "task2" }
 * Aliases accepted: prompt|prompt_text|promptText, essay|essay_text|essayText,
 * human_band|humanBand|band, task_type|taskType (default "task2"), id|name.
 *
 * ── Running ─────────────────────────────────────────────────────────────────
 *   npm run calibrate -- ./calibration
 *
 * (`server-only` modules throw unless resolved with the react-server condition,
 *  so the npm script runs: node --conditions=react-server --import tsx …)
 *
 * Flags:  --json   also print the full results as JSON (for tracking over time).
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

// ── Load .env.local into process.env BEFORE importing the pipeline ───────────
// Node doesn't auto-load it, and the AI layer reads credentials from env. CLI
// env wins (we never overwrite an already-set var).
loadEnvLocal();

// Dynamic import so env is populated first. Typed via the public surface.
type Pipeline = typeof import("../lib/ai");
type EssayTaskType = Parameters<Pipeline["gradeEssay"]>[0]["taskType"];

const TASK_TYPES = ["task1_academic", "task1_general", "task2"] as const;

// CLAUDE.md calibration targets.
const MAE_TARGET = 0.5; // within ±0.5 of human
const BIAS_TOLERANCE = 0.0; // not biased upward (a conservative grader sits ≤ 0)

interface Case {
  id: string;
  taskType: EssayTaskType;
  prompt: string;
  essay: string;
  humanBand: number;
}

interface Result {
  case: Case;
  modelBand: number;
  bandWithFixes: number;
  blocker: string;
  model: string;
  latencyMs: number;
  delta: number; // modelBand − humanBand (signed; + = inflated)
}

interface Failure {
  case: Case;
  error: string;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const emitJson = args.includes("--json");
  const folderArg = args.find((a) => !a.startsWith("--")) ?? "./calibration";
  const folder = resolve(process.cwd(), folderArg);

  const cases = loadCases(folder);
  if (cases.length === 0) {
    console.error(`No labeled essays found in ${folder}.`);
    console.error(
      "Add *.json files shaped { prompt, essay, human_band, task_type? }. See calibration/README.md.",
    );
    process.exit(1);
  }

  const { gradeEssay } = (await import("../lib/ai")) as Pipeline;

  console.log(`\nCalibrating grader against ${cases.length} teacher-labeled essay(s)…`);
  console.log(`Source: ${folder}\n`);

  const results: Result[] = [];
  const failures: Failure[] = [];

  // Sequential on purpose: small sets, readable progress, gentle on Vertex quota.
  for (const c of cases) {
    process.stdout.write(`  grading ${c.id} … `);
    const startedAt = Date.now();
    try {
      // Synthetic tenant ids on purpose: they aren't real UUIDs, so the pipeline's
      // `ai_usage` insert is rejected and swallowed — calibration never pollutes the
      // billing/usage table. (`npm run calibrate` sets NODE_ENV=production to mute
      // that swallowed-error dev log.) No essayId: these aren't real essay rows.
      const grade = await gradeEssay({
        taskType: c.taskType,
        promptText: c.prompt,
        essayText: c.essay,
        meta: { organizationId: "calibration", userId: "calibration" },
      });
      const latencyMs = Date.now() - startedAt;
      const delta = round1(grade.overall_band - c.humanBand);
      results.push({
        case: c,
        modelBand: grade.overall_band,
        bandWithFixes: grade.band_with_fixes,
        blocker: grade.score_blocker?.criterion ?? "-",
        model: grade.model,
        latencyMs,
        delta,
      });
      console.log(`band ${fmtBand(grade.overall_band)} (human ${fmtBand(c.humanBand)}, Δ ${fmtDelta(delta)})`);
    } catch (err) {
      failures.push({ case: c, error: errMsg(err) });
      console.log(`FAILED — ${errMsg(err)}`);
    }
  }

  printPerEssayTable(results, failures);
  const agg = printAggregate(results, failures);

  if (emitJson) {
    console.log("\n--- JSON ---");
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          model: results[0]?.model ?? null,
          aggregate: agg,
          results: results.map((r) => ({
            id: r.case.id,
            taskType: r.case.taskType,
            humanBand: r.case.humanBand,
            modelBand: r.modelBand,
            delta: r.delta,
            bandWithFixes: r.bandWithFixes,
            blocker: r.blocker,
            latencyMs: r.latencyMs,
          })),
          failures: failures.map((f) => ({ id: f.case.id, error: f.error })),
        },
        null,
        2,
      ),
    );
  }

  // Non-zero exit if the grader misses the calibration bar — lets CI gate on it.
  process.exit(agg.pass ? 0 : 1);
}

// ── Aggregation + reporting ─────────────────────────────────────────────────

interface Aggregate {
  graded: number;
  failed: number;
  mae: number;
  bias: number; // mean signed error; + = inflating
  rmse: number;
  within05: number; // share with |Δ| ≤ 0.5
  exact: number; // share with Δ == 0
  over: number; // count graded ABOVE human (inflated)
  under: number; // count graded BELOW human (conservative)
  worstOver: { id: string; delta: number } | null;
  pass: boolean;
}

function printAggregate(results: Result[], failures: Failure[]): Aggregate {
  const n = results.length;
  const deltas = results.map((r) => r.delta);
  const mae = n ? mean(deltas.map(Math.abs)) : 0;
  const bias = n ? mean(deltas) : 0;
  const rmse = n ? Math.sqrt(mean(deltas.map((d) => d * d))) : 0;
  const within05 = n ? deltas.filter((d) => Math.abs(d) <= 0.5).length / n : 0;
  const exact = n ? deltas.filter((d) => d === 0).length / n : 0;
  const over = deltas.filter((d) => d > 0).length;
  const under = deltas.filter((d) => d < 0).length;
  const worstOver = results
    .filter((r) => r.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .map((r) => ({ id: r.case.id, delta: r.delta }))[0] ?? null;

  const maeOk = mae <= MAE_TARGET;
  const biasOk = bias <= BIAS_TOLERANCE; // not upward-biased
  const pass = n > 0 && maeOk && biasOk;

  const line = "─".repeat(58);
  console.log(`\n${line}`);
  console.log("AGGREGATE");
  console.log(line);
  console.log(`  Essays graded        ${n}${failures.length ? `  (+${failures.length} failed)` : ""}`);
  console.log(`  Mean absolute error  ${mae.toFixed(3)}   ${verdict(maeOk)} (target ≤ ${MAE_TARGET.toFixed(1)})`);
  console.log(
    `  Inflation bias       ${fmtSigned(bias, 3)}   ${verdict(biasOk)} ${biasLabel(bias)}`,
  );
  console.log(`  RMSE                 ${rmse.toFixed(3)}`);
  console.log(`  Within ±0.5          ${pct(within05)}     (exact ${pct(exact)})`);
  console.log(`  Direction            ${over} over · ${under} under · ${n - over - under} exact`);
  if (worstOver) {
    console.log(`  Worst over-score     ${fmtDelta(worstOver.delta)} on "${worstOver.id}"`);
  } else if (n > 0) {
    console.log(`  Worst over-score     none — never scored above a human`);
  }
  console.log(line);
  console.log(
    pass
      ? "  VERDICT: ✅ PASS — accurate and not inflating."
      : "  VERDICT: ❌ FAIL — " +
          [!maeOk ? `MAE ${mae.toFixed(2)} > ${MAE_TARGET}` : null, !biasOk ? `upward bias ${fmtSigned(bias, 2)}` : null]
            .filter(Boolean)
            .join("; "),
  );
  console.log(`${line}\n`);

  return { graded: n, failed: failures.length, mae, bias, rmse, within05, exact, over, under, worstOver, pass };
}

function printPerEssayTable(results: Result[], failures: Failure[]): void {
  if (results.length === 0) {
    console.log("\nNo essays graded successfully.");
    return;
  }
  const rows = results.map((r) => ({
    id: r.case.id,
    task: r.case.taskType,
    human: fmtBand(r.case.humanBand),
    model: fmtBand(r.modelBand),
    delta: fmtDelta(r.delta),
    fixes: fmtBand(r.bandWithFixes),
    blk: r.blocker,
    ms: `${(r.latencyMs / 1000).toFixed(1)}s`,
  }));
  const headers = {
    id: "essay",
    task: "task",
    human: "human",
    model: "model",
    delta: "Δ",
    fixes: "w/fix",
    blk: "blk",
    ms: "time",
  };
  const cols = Object.keys(headers) as (keyof typeof headers)[];
  const width: Record<string, number> = {};
  for (const c of cols) {
    width[c] = Math.max(headers[c].length, ...rows.map((r) => String(r[c]).length));
  }
  const fmtRow = (r: Record<string, string>) =>
    "  " + cols.map((c) => String(r[c]).padEnd(width[c])).join("  ");

  console.log(`\n${fmtRow(headers)}`);
  console.log("  " + cols.map((c) => "─".repeat(width[c])).join("  "));
  for (const r of rows) console.log(fmtRow(r));
  for (const f of failures) console.log(`  ${f.case.id.padEnd(width.id)}  → FAILED: ${f.error}`);
}

// ── Loading + parsing ───────────────────────────────────────────────────────

function loadCases(folder: string): Case[] {
  let entries: string[];
  try {
    entries = readdirSync(folder);
  } catch {
    console.error(`Folder not found: ${folder}`);
    console.error("Create it and add teacher-labeled *.json essays. See calibration/README.md.");
    process.exit(1);
  }
  const files = entries
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .map((f) => join(folder, f))
    .filter((f) => statSync(f).isFile())
    .sort();

  const cases: Case[] = [];
  for (const file of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(file, "utf8"));
    } catch (err) {
      console.error(`Skipping ${file}: invalid JSON (${errMsg(err)})`);
      continue;
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    items.forEach((raw, i) => {
      const baseId = fileStem(file);
      const id = items.length > 1 ? `${baseId}#${i + 1}` : baseId;
      const c = toCase(raw, id);
      if (c) cases.push(c);
    });
  }
  return cases;
}

function toCase(raw: unknown, id: string): Case | null {
  if (!raw || typeof raw !== "object") {
    console.error(`Skipping ${id}: not a JSON object.`);
    return null;
  }
  const o = raw as Record<string, unknown>;
  const prompt = str(o.prompt ?? o.prompt_text ?? o.promptText);
  const essay = str(o.essay ?? o.essay_text ?? o.essayText);
  const humanBand = num(o.human_band ?? o.humanBand ?? o.band);
  const taskTypeRaw = str(o.task_type ?? o.taskType) || "task2";
  const caseId = str(o.id ?? o.name) || id;

  if (!prompt) return skip(caseId, "missing `prompt`");
  if (!essay) return skip(caseId, "missing `essay`");
  if (humanBand === null) return skip(caseId, "missing/invalid `human_band` (number 0–9)");
  if (humanBand < 0 || humanBand > 9) return skip(caseId, `human_band ${humanBand} out of range 0–9`);
  if (!TASK_TYPES.includes(taskTypeRaw as (typeof TASK_TYPES)[number])) {
    return skip(caseId, `unknown task_type "${taskTypeRaw}" (expected ${TASK_TYPES.join(" | ")})`);
  }
  return { id: caseId, taskType: taskTypeRaw as EssayTaskType, prompt, essay, humanBand };
}

function skip(id: string, why: string): null {
  console.error(`Skipping ${id}: ${why}.`);
  return null;
}

// ── Small utilities ─────────────────────────────────────────────────────────

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
    // No .env.local — rely on the ambient environment (e.g. CI secrets).
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}
function num(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}
function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function fmtBand(n: number): string {
  return n.toFixed(1);
}
function fmtDelta(d: number): string {
  return d === 0 ? " 0.0" : fmtSigned(d, 1);
}
function fmtSigned(n: number, dp: number): string {
  return (n >= 0 ? "+" : "") + n.toFixed(dp);
}
function pct(x: number): string {
  return `${Math.round(x * 100)}%`;
}
function verdict(ok: boolean): string {
  return ok ? "✅" : "❌";
}
function biasLabel(bias: number): string {
  if (bias > 0) return "(grading ABOVE humans — inflating)";
  if (bias < 0) return "(grading below humans — conservative)";
  return "(dead on)";
}
function fileStem(file: string): string {
  return file.split("/").pop()!.replace(/\.json$/i, "");
}
function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

main().catch((err) => {
  console.error("\nCalibration run crashed:", errMsg(err));
  process.exit(1);
});
