/**
 * Top up the curated writing practice set in organisations seeded before it grew.
 *
 * A learner's org gets the curated prompts copied in ONCE, the first time they
 * open the writing library (lib/prompts/starter.ts, gated on
 * study_plans.starter_seeded). Nothing re-runs that copy, so everyone seeded
 * before the set was extended keeps the smaller library they started with — on
 * 2026-09-15 that was 81 orgs holding the 35-prompt set and 4 holding an older
 * 20-prompt one. This gives each of them whatever it is missing.
 *
 * "ALREADY THERE" MEANS THE EXACT prompt_text of a source='seed' row, which is
 * why a shipped prompt must never be reworded (see lib/prompts/starter-set.ts).
 * Rows it matches also get category, difficulty and topic re-synced, so a
 * corrected label reaches existing learners as well as new ones.
 *
 * Only orgs that already hold seed rows are touched. An org that has never
 * opened the library gets the full set from starter.ts on its first visit, and
 * inserting here too would race that copy.
 *
 * ── Running ─────────────────────────────────────────────────────────────────
 *   npm run seed:writing              # dry run: reads only, prints the plan
 *   npm run seed:writing -- --apply   # writes
 *
 * ⚠️ .env.local points at PRODUCTION. Deploy the app BEFORE applying: the old
 * library page shows only the newest 60 prompts, so rows added first would push
 * each learner's own generated topics out of view until the deploy lands.
 *
 * Idempotent: a second run finds nothing to do. Each org's insert is one
 * statement, so an org is either fully topped up or untouched.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { StarterPrompt } from "../lib/prompts/starter-set";

// Load .env.local BEFORE importing anything that reads credentials. CLI env wins.
loadEnvLocal();

const APPLY = process.argv.includes("--apply");
const PAGE = 1000;

interface SeedRow {
  id: string;
  organization_id: string;
  prompt_text: string;
  category: string | null;
  difficulty: number | null;
  topic_family: string | null;
  created_by: string | null;
}

interface OrgPlan {
  orgId: string;
  kind: string;
  missing: StarterPrompt[];
  resync: { id: string; patch: Record<string, unknown> }[];
  createdBy: string | null;
}

async function main(): Promise<void> {
  const { STARTER_PROMPTS } = await import("../lib/prompts/starter-set");
  const { createAdminClient } = await import("../lib/supabase/admin");
  const admin = createAdminClient();

  console.log(
    `\nWriting practice top-up — ${APPLY ? "APPLY: this writes to the database" : "dry run: reads only"}\n`,
  );

  // ── 1. Every seed row, grouped by org ────────────────────────────────────
  const rows: SeedRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin
      .from("writing_prompts")
      .select("id, organization_id, prompt_text, category, difficulty, topic_family, created_by")
      .eq("source", "seed")
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`reading seed rows: ${error.message}`);
    rows.push(...((data ?? []) as SeedRow[]));
    if ((data ?? []).length < PAGE) break;
  }

  const byOrg = new Map<string, SeedRow[]>();
  for (const r of rows) byOrg.set(r.organization_id, [...(byOrg.get(r.organization_id) ?? []), r]);

  const kinds = new Map<string, string>();
  for (const ids of chunks([...byOrg.keys()], 100)) {
    const { data, error } = await admin.from("organizations").select("id, kind").in("id", ids);
    if (error) throw new Error(`reading organisations: ${error.message}`);
    for (const o of data ?? []) kinds.set(o.id as string, o.kind as string);
  }

  // created_by references profiles(id). The original seeding student is the
  // natural owner of the new rows, but only if that profile still exists.
  const creatorIds = [
    ...new Set(rows.map((r) => r.created_by).filter((id): id is string => Boolean(id))),
  ];
  const liveProfiles = new Set<string>();
  for (const ids of chunks(creatorIds, 100)) {
    const { data, error } = await admin.from("profiles").select("id").in("id", ids);
    if (error) throw new Error(`reading profiles: ${error.message}`);
    for (const p of data ?? []) liveProfiles.add(p.id as string);
  }

  // ── 2. Plan ──────────────────────────────────────────────────────────────
  const canonical = new Map(STARTER_PROMPTS.map((p) => [p.prompt_text, p]));
  const plans: OrgPlan[] = [];

  for (const [orgId, list] of byOrg) {
    const have = new Set(list.map((r) => r.prompt_text));
    const missing = STARTER_PROMPTS.filter((p) => !have.has(p.prompt_text));

    const resync: OrgPlan["resync"] = [];
    for (const r of list) {
      const p = canonical.get(r.prompt_text);
      if (!p) continue; // a seed prompt no longer in the set — leave it alone
      const patch: Record<string, unknown> = {};
      if (r.category !== p.category) patch.category = p.category;
      if (r.difficulty !== p.difficulty) patch.difficulty = p.difficulty;
      if (r.topic_family !== p.topic_family) patch.topic_family = p.topic_family;
      if (Object.keys(patch).length > 0) resync.push({ id: r.id, patch });
    }

    if (missing.length === 0 && resync.length === 0) continue;
    const creator = mostCommon(list.map((r) => r.created_by));
    plans.push({
      orgId,
      kind: kinds.get(orgId) ?? "unknown",
      missing,
      resync,
      createdBy: creator && liveProfiles.has(creator) ? creator : null,
    });
  }

  // ── 3. Report ────────────────────────────────────────────────────────────
  const toAdd = plans.flatMap((p) => p.missing);
  console.log(
    `  seed rows read      ${rows.length} across ${byOrg.size} orgs ${tally([...kinds.values()])}`,
  );
  console.log(
    `  curated set         ${STARTER_PROMPTS.length} prompts ${tally(STARTER_PROMPTS.map((p) => p.task_type))}`,
  );
  console.log(`  orgs to update      ${plans.length} ${tally(plans.map((p) => p.kind))}`);
  console.log(`  prompts to add      ${toAdd.length} ${tally(toAdd.map((p) => p.task_type))}`);
  console.log(`  missing per org     ${tally(plans.map((p) => String(p.missing.length)))}`);
  console.log(`  rows to re-label    ${plans.reduce((n, p) => n + p.resync.length, 0)}`);
  console.log(
    `  orgs with no owner  ${plans.filter((p) => !p.createdBy).length} (rows get created_by = null)`,
  );

  if (!APPLY) {
    console.log(`\nDry run — nothing written. Re-run with --apply to write.\n`);
    return;
  }

  // ── 4. Apply ─────────────────────────────────────────────────────────────
  console.log("");
  let failed = 0;
  for (const plan of plans) {
    const label = `${plan.orgId} (${plan.kind})`;
    try {
      if (plan.missing.length > 0) {
        const { data, error } = await admin
          .from("writing_prompts")
          .insert(
            plan.missing.map((p) => ({
              organization_id: plan.orgId,
              task_type: p.task_type,
              category: p.category,
              prompt_text: p.prompt_text,
              figure: p.figure ?? null,
              topic_family: p.topic_family,
              difficulty: p.difficulty,
              status: "approved",
              source: "seed",
              created_by: plan.createdBy,
            })),
          )
          .select("id");
        if (error) throw new Error(`insert: ${error.message}`);
        if ((data ?? []).length !== plan.missing.length) {
          throw new Error(`insert wrote ${(data ?? []).length} of ${plan.missing.length} rows`);
        }
      }
      for (const fix of plan.resync) {
        // .select() so a write that matched nothing is reported, not assumed.
        const { data, error } = await admin
          .from("writing_prompts")
          .update(fix.patch)
          .eq("id", fix.id)
          .select("id");
        if (error) throw new Error(`re-label ${fix.id}: ${error.message}`);
        if ((data ?? []).length === 0) throw new Error(`re-label ${fix.id} changed no row`);
      }
      console.log(
        `  ✓ ${label}  +${plan.missing.length} prompts, ${plan.resync.length} re-labelled`,
      );
    } catch (err) {
      failed++;
      console.log(`  ✗ ${label}  ${errMsg(err)}`);
    }
  }

  console.log(
    `\nDone: ${plans.length - failed} orgs updated${failed ? `, ${failed} failed (re-run to retry)` : ""}.\n`,
  );
  if (failed > 0) process.exitCode = 1;
}

function chunks<T>(xs: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += size) out.push(xs.slice(i, i + size));
  return out;
}

function mostCommon(xs: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const x of xs) if (x) counts.set(x, (counts.get(x) ?? 0) + 1);
  let best: string | null = null;
  for (const [x, n] of counts) if (best === null || n > (counts.get(best) ?? 0)) best = x;
  return best;
}

function tally(xs: string[]): string {
  const counts = new Map<string, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  const parts = [...counts].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`);
  return parts.length ? `(${parts.join(", ")})` : "";
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
  console.error("\nTop-up crashed:", errMsg(err));
  process.exit(1);
});
