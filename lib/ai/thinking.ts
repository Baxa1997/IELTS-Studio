/**
 * How a call asks a Gemini model to think, and how many tokens that call bills.
 *
 * Callers state their intent as a token BUDGET (`CompletionRequest.thinkingBudget`
 * — the grader's 2048, a latency-critical 0). Turning that into what a given
 * model accepts is transport, so it happens here, once, for every provider. The
 * engine mirrors this file in `ai/thinking.py`; the two must agree, because in
 * production the app's calls reach Vertex THROUGH the engine's /generate.
 *
 * Pure — no I/O, no `server-only` — so the rules are pinned by a test.
 */

/** The levels a level-only model accepts. ⚠️ No MINIMAL: gemini-4-argon answers
 *  it with a 400 ("Thinking level is unsupported: THINKING_LEVEL_MINIMAL"), so the
 *  bottom of the scale is LOW. */
export type ThinkingLevel = "LOW" | "MEDIUM" | "HIGH";

/**
 * ⚠️ From this Gemini generation on, `thinkingBudget` is a HARD 400 — "Thinking
 * budget is not supported for this model. Use thinking level instead." —
 * measured on gemini-4-argon on Vertex, 2026-11-07. Sending the grader's budget
 * unchanged failed every grade; the 3.x models still accept a budget, so they
 * keep getting one and nothing that runs today changes.
 */
const FIRST_LEVEL_ONLY_GENERATION = 4;

/** Whether `model` takes `thinkingLevel` instead of `thinkingBudget`. Read off the
 *  generation in the id, so the next Gemini 4 model needs no edit here. The live
 *  native-audio ids (`gemini-live-2.5-…`) carry no generation after `gemini-` and
 *  stay on budgets. */
export function takesThinkingLevel(model: string): boolean {
  const generation = /(?:^|\/)gemini-(\d+)/.exec(model.toLowerCase())?.[1];
  return generation !== undefined && Number(generation) >= FIRST_LEVEL_ONLY_GENERATION;
}

/**
 * The level that matches a budget's intent. 0 ("don't deliberate", a
 * latency-critical call) is LOW, the least a level-only model accepts; the
 * grader's 2048 is MEDIUM, Argon's own default; only a budget past 8k asks for
 * HIGH.
 */
export function thinkingLevelFor(budget: number): ThinkingLevel {
  if (budget <= 1024) return "LOW";
  if (budget <= 8192) return "MEDIUM";
  return "HIGH";
}

export type ThinkingConfig =
  | { thinkingBudget: number; includeThoughts: false }
  | { thinkingLevel: ThinkingLevel; includeThoughts: false };

/**
 * The `thinkingConfig` for one call, or undefined to leave the model's default.
 * A negative budget is Gemini's "dynamic" — for a level-only model that IS the
 * default, so nothing is sent.
 */
export function thinkingConfig(model: string, budget: number | undefined): ThinkingConfig | undefined {
  if (budget === undefined) return undefined;
  if (!takesThinkingLevel(model)) return { thinkingBudget: budget, includeThoughts: false };
  if (budget < 0) return undefined;
  return { thinkingLevel: thinkingLevelFor(budget), includeThoughts: false };
}

/**
 * Output tokens as Google BILLS them: the visible answer plus the private
 * reasoning. ⚠️ Gemini reports the two separately — `candidatesTokenCount` and
 * `thoughtsTokenCount` — and until 2026-11-07 only the first was logged, so
 * every thinking model's `ai_usage.output_tokens` and `cost_usd` came out low.
 * On a probe that day gemini-3.5-flash thought ~2,000 tokens to answer in ~400:
 * the logged output was about a fifth of the billed one. Undefined when the
 * response carried no counts at all, so the row stores NULL rather than 0.
 */
export function billedOutputTokens(
  usage: { candidatesTokenCount?: number; thoughtsTokenCount?: number } | undefined,
): number | undefined {
  const answer = usage?.candidatesTokenCount;
  const thoughts = usage?.thoughtsTokenCount;
  if (answer === undefined && thoughts === undefined) return undefined;
  return (answer ?? 0) + (thoughts ?? 0);
}
