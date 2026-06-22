/**
 * Model-agnostic AI *transport* interface.
 *
 * This is the thin layer a model SDK implements: take a request, talk to the
 * model, return text + token usage. Everything cross-cutting (prompt assembly,
 * validation, retries, timeouts, temperature policy, usage logging) lives one
 * level up in the service (`./index`). Providers stay dumb on purpose.
 *
 * v1 is Gemini; the grader is expected to move to Claude Sonnet later (see
 * CLAUDE.md). Swapping models means swapping the implementation behind this
 * interface, not touching feature code.
 */

/** Which engine a call belongs to. Grading and generation are kept separate so
 *  the generator never grades its own output leniently. */
export type AiTask = "grade" | "generate";

/** "json" asks the model to emit a single JSON object (schema-constrained when
 *  the provider supports it). Grading always uses "json". */
export type ResponseFormat = "text" | "json";

/** An image/PDF sent alongside the prompt for a multimodal call (e.g. transcribing
 *  a photo of a handwritten answer). `data` is base64 (no data: URI prefix). */
export interface InlineFile {
  mimeType: string;
  data: string;
}

export interface CompletionRequest {
  task: AiTask;
  prompt: string;
  /** Optional system / instruction text. */
  system?: string;
  /** Optional image/PDF parts for a multimodal call. Providers that don't support
   *  them ignore them. */
  files?: InlineFile[];
  /** Grading runs low-temperature for consistency; generation can be higher.
   *  The service sets this; callers don't. */
  temperature?: number;
  /** Token budget for the model's PRIVATE reasoning before it answers (Gemini
   *  "thinking"). The reasoning is never returned — only the final text — so this
   *  buys deliberation (criterion-by-criterion grading) without polluting the JSON.
   *  Set by the service for the grade task; omitted ⇒ provider/model default. */
  thinkingBudget?: number;
  /** Shape of the reply. Defaults to "text". */
  responseFormat?: ResponseFormat;
  /** Cancels the in-flight model call (used by the service's timeout). */
  signal?: AbortSignal;
}

export interface CompletionResult {
  text: string;
  /** Concrete model id that served the request, e.g. "gemini-2.5-flash".
   *  Recorded on the grading row and in usage logs. */
  model: string;
  /** Token usage when the provider reports it — used for usage logging / cost. */
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface AIProvider {
  /** Stable identifier used in usage logs and traces, e.g. "gemini". */
  readonly name: string;
  complete(request: CompletionRequest): Promise<CompletionResult>;
}
