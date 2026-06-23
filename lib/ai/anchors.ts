import "server-only";

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type { EssayTaskType, GradeEssayInput } from "./schema";

/**
 * Calibrated anchor retrieval — the biggest anti-inflation lever (CLAUDE.md):
 * few-shot the grader with exemplars near the likely band so its numbers stay
 * pinned to known scores.
 *
 * Today this is a static store that returns the skill's starter anchors. The
 * `AnchorStore` seam is deliberate: later, a `PgVectorAnchorStore` will embed
 * the essay and retrieve the k nearest exemplars by cosine similarity. Callers
 * use `retrieveAnchors()` only, so that swap touches nothing else.
 */
const ANCHORS_DIR = join(
  process.cwd(),
  ".claude",
  "skills",
  "ielts-examiner",
  "references",
  "anchors",
);

export interface Anchor {
  id: string;
  taskType: EssayTaskType;
  band: number;
  /** The exemplar block injected into the prompt (essay + calibrated bands). */
  content: string;
}

export interface AnchorStore {
  nearest(input: GradeEssayInput, k: number): Promise<Anchor[]>;
}

/** Static store: returns anchors spread across the band ladder for the task type. */
export const staticAnchorStore: AnchorStore = {
  async nearest(input, k) {
    const all = (await loadAll()).filter((a) => a.taskType === input.taskType).sort((a, b) => a.band - b.band);
    // No similarity model yet, and we have no "likely band" at retrieval time, so
    // pin the grader's range by handing it an EVEN SPREAD across the ladder (a low,
    // a mid and a high exemplar) rather than the k lowest — that's what stops both
    // upward drift and over-harsh scoring. Always include the floor and ceiling.
    return evenSpread(all, k);
  },
};

/** Pick up to k items evenly across a sorted list, always keeping first + last. */
function evenSpread<T>(sorted: T[], k: number): T[] {
  if (sorted.length <= k || k <= 0) return sorted;
  if (k === 1) return [sorted[0]];
  const out: T[] = [];
  for (let i = 0; i < k; i++) {
    out.push(sorted[Math.round((i * (sorted.length - 1)) / (k - 1))]);
  }
  return out;
}

/**
 * The one entry point feature/service code calls. Swap `staticAnchorStore` for a
 * pgvector-backed store later without changing any caller.
 */
export function retrieveAnchors(input: GradeEssayInput, k = 2): Promise<Anchor[]> {
  return staticAnchorStore.nearest(input, k);
}

/**
 * Anchors for a task type without an essay in hand — used to GROUND model-answer
 * generation (the Band-8 sample feature) so the generator writes genuinely at-band
 * essays, not inflated ones. The static store only reads `taskType`, so a bare
 * shape is enough; the pgvector swap would take a target band instead.
 */
export function retrieveAnchorsForTask(taskType: EssayTaskType, k = 3): Promise<Anchor[]> {
  return staticAnchorStore.nearest({ taskType } as GradeEssayInput, k);
}

// ---- internals -------------------------------------------------------------

let cache: Anchor[] | null = null;

async function loadAll(): Promise<Anchor[]> {
  if (cache) return cache;
  const files = (await readdir(ANCHORS_DIR)).filter((f) => f.endsWith(".md")).sort();
  cache = await Promise.all(
    files.map(async (f) =>
      parseAnchor(f.replace(/\.md$/, ""), await readFile(join(ANCHORS_DIR, f), "utf8")),
    ),
  );
  return cache;
}

function parseAnchor(id: string, raw: string): Anchor {
  const fm = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw.trim());
  const meta: Record<string, string> = {};
  let body = raw.trim();
  if (fm) {
    for (const line of fm[1].split("\n")) {
      const idx = line.indexOf(":");
      if (idx > -1) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    body = fm[2].trim();
  }
  return {
    id,
    taskType: (meta.task_type as EssayTaskType) || "task2",
    band: Number(meta.band ?? "0"),
    content: body,
  };
}
