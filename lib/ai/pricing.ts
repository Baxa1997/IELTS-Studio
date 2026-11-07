/**
 * Token → USD cost estimation for usage logging and per-org cost tracking.
 *
 * Rates are USD per 1M tokens and are necessarily APPROXIMATE — provider pricing
 * changes, and Vertex vs. the Developer API can differ. Keep this table current;
 * it's the single place cost is defined. Pure (no I/O), so it's testable and the
 * AI service can call it inline.
 */

export interface ModelRate {
  /** USD per 1M input tokens. */
  input: number;
  /** USD per 1M output tokens. */
  output: number;
}

/** A rate Google has already announced will change: the first rate applies
 *  before `until` (a UTC date), `then` from it on. Written out instead of
 *  updated by hand on the day, because a table nobody remembers to edit is
 *  wrong silently — every call billed at the old rate. */
interface ScheduledRate extends ModelRate {
  until: string;
  then: ModelRate;
}

/** Matched by longest-prefix against the concrete model id the provider returns.
 *  Output is billed INCLUDING thinking tokens, and since 2026-11-07 the providers
 *  report it that way (lib/ai/thinking.ts `billedOutputTokens`) — before that a
 *  thinking model's cost here came out several times too low. Rates are
 *  approximate; the 4.x and 3.6 rows are the Gemini API list prices of
 *  2026-11-07. */
const RATES: Record<string, ModelRate | ScheduledRate> = {
  // Introductory price, doubling on 1 December 2026.
  "gemini-4-argon": { input: 2, output: 10, until: "2026-12-01", then: { input: 4, output: 20 } },
  // Introductory price, doubling on 1 January 2027.
  "gemini-3.6-flash": { input: 0.75, output: 3.75, until: "2027-01-01", then: { input: 1.5, output: 7.5 } },
  "gemini-3.1-pro": { input: 2, output: 12 },
  "gemini-3-pro": { input: 2, output: 12 },
  "gemini-3.5-flash": { input: 0.4, output: 3 },
  "gemini-3-flash": { input: 0.4, output: 3 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5 },
  "gemini-2.5-pro": { input: 1.25, output: 10 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "gemini-1.5-pro": { input: 1.25, output: 5 },
  "claude-sonnet": { input: 3, output: 15 },
  "claude-haiku": { input: 0.8, output: 4 },
  "claude-opus": { input: 15, output: 75 },
};

/** Used when a model id isn't in the table — better a rough number than none. */
const FALLBACK_RATE: ModelRate = { input: 0.5, output: 2 };

export function rateForModel(model: string, at: Date = new Date()): ModelRate {
  const id = model.toLowerCase();
  let best: ModelRate | ScheduledRate | null = null;
  let bestLen = 0;
  for (const [prefix, rate] of Object.entries(RATES)) {
    if (id.startsWith(prefix) && prefix.length > bestLen) {
      best = rate;
      bestLen = prefix.length;
    }
  }
  if (!best) return FALLBACK_RATE;
  if ("until" in best) {
    return at.getTime() < Date.parse(`${best.until}T00:00:00Z`) ? { input: best.input, output: best.output } : best.then;
  }
  return best;
}

/**
 * Estimated USD cost for a call. Returns null when we have no token counts (so we
 * store NULL rather than a misleading 0). Rounded to 6 dp (matches numeric(10,6)).
 */
export function estimateCostUsd(
  model: string,
  inputTokens: number | undefined,
  outputTokens: number | undefined,
  at: Date = new Date(),
): number | null {
  const inTok = inputTokens ?? 0;
  const outTok = outputTokens ?? 0;
  if (inTok === 0 && outTok === 0) return null;
  const rate = rateForModel(model, at);
  const cost = (inTok / 1_000_000) * rate.input + (outTok / 1_000_000) * rate.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}
