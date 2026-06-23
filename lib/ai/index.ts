import "server-only";

import { serverEnv } from "@/lib/env";

import { retrieveAnchors, retrieveAnchorsForTask, type Anchor } from "./anchors";
import { GeminiProvider } from "./gemini";
import { RemoteAIProvider } from "./remote";
import type { AiTask, AIProvider, CompletionResult, InlineFile } from "./provider";
import { buildGeneratePrompt, buildGradePrompt } from "./prompts";
import {
  GradeValidationError,
  gradeEssayInputSchema,
  generateInputSchema,
  type CriterionScore,
  type EssayGrade,
  type Grade,
  type GenerateInput,
  type GenerateResult,
  type GradeEssayInput,
  type EssayTaskType,
  type WritingSample,
  writingSamplesResultSchema,
} from "./schema";
import { loadGradingSkill, parseGradeOutput } from "./skill";
import { logUsage } from "./usage";
import { CEFR_GRADE_PROMPT_VERSION, GRADE_PROMPT_VERSION, GENERATE_PROMPT_VERSION } from "./version";
import { buildCefrGradePrompt } from "@/lib/cefr/grade-prompt";
import {
  CEFR_GRADE_DISCLAIMER,
  cefrGradeInputSchema,
  cefrGradeSchema,
  type CefrGrade,
  type CefrGradeInput,
  type CefrGradeResult,
} from "@/lib/cefr/schema";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/cefr/levels";

/**
 * The single server-side entry point for ALL model access.
 *
 *  - `import "server-only"` keeps it out of any Client Component bundle.
 *  - Two methods only: `gradeEssay()` and `generate()`. Everything cross-cutting
 *    — key handling (via providers), temperature policy, timeouts, retries, JSON
 *    validation and usage logging — is centralized here so it happens once.
 *  - Model-agnostic: to change models, change `getProvider()`; feature code that
 *    calls `gradeEssay`/`generate` never changes.
 *  - Grading is grounded in the `ielts-examiner` skill (rubric + taxonomy +
 *    procedure + anchors + canonical schema), not in app code.
 *  - `gradeEssay` returns the validated grade; persisting it to the `gradings`
 *    table is the caller's job. The only DB side-effect here is `ai_usage`.
 */

// ---- Policy knobs ----------------------------------------------------------

/** Grading is deterministic: same essay → same band (CLAUDE.md). Callers can't
 *  override this. */
const GRADING_TEMPERATURE = 0;
/** Generation wants variety across prompts/passages. */
const GENERATION_TEMPERATURE = 0.7;
/** Private reasoning budget (tokens) for the grader to work criterion-by-criterion
 *  BEFORE committing a band — the biggest accuracy lever (CLAUDE.md: "force
 *  criterion-by-criterion reasoning with evidence before emitting a number").
 *  Bounded so a single grade still fits the serverless window; the thoughts are
 *  never returned (the reply is forced to JSON). Generation does NOT use this. */
const GRADE_THINKING_BUDGET = 2048;

const GRADE_RESILIENCE = { timeoutMs: 60_000, retries: 2 };
const GENERATE_RESILIENCE = { timeoutMs: 45_000, retries: 2 };
/** Reading generation/validation return large JSON and need a longer leash. */
const READING_RESILIENCE = { timeoutMs: 120_000, retries: 2 };

// ---- Provider routing ------------------------------------------------------

/** One provider instance per distinct model id (grade and generate may differ). */
const providers = new Map<string, AIProvider>();

/**
 * Pick the engine for a task. v1: Gemini for both, but with per-task models
 * (route by task, not globally — CLAUDE.md). Grading can run a stronger model
 * than generation; both are env-configurable. To move grading to Claude Sonnet
 * later, return a ClaudeProvider for task === "grade" — feature code never changes.
 */
function providerForModel(model: string): AIProvider {
  let provider = providers.get(model);
  if (!provider) {
    // Remote engine (Contabo) when configured; otherwise Vertex/Gemini in-process.
    // Per-task model routing is unchanged — the model id flows through either way.
    const remote = serverEnv.aiEngine;
    provider = remote ? new RemoteAIProvider(model, remote) : new GeminiProvider(model);
    providers.set(model, provider);
  }
  return provider;
}

function getProvider(task: AiTask): AIProvider {
  if (task !== "grade" && task !== "generate") {
    throw new Error(`No provider configured for task: ${task}`);
  }
  return providerForModel(task === "grade" ? serverEnv.geminiModels.grade : serverEnv.geminiModels.generate);
}

// ---- Public API ------------------------------------------------------------

export async function gradeEssay(rawInput: GradeEssayInput): Promise<EssayGrade> {
  const input = gradeEssayInputSchema.parse(rawInput);

  // Hard floor: a submission too short to be a real attempt (a few words,
  // gibberish, blank) is graded deterministically as Band 1 — no model call. The
  // model is unreliable at the very bottom (it parks fragments at ~Band 2-4), and
  // CLAUDE.md is non-negotiable that we never inflate a non-attempt.
  const floor = await nonAttemptFloor(input);
  if (floor) return floor;

  const provider = getProvider("grade");
  const skill = await loadGradingSkill();
  const anchors = await resolveAnchors(input);
  const { system, user } = buildGradePrompt(input, skill, anchors);

  const startedAt = Date.now();
  const usage = { input: 0, output: 0 };
  let model = provider.name;

  try {
    const first = await withResilience(
      (signal) =>
        provider.complete({
          task: "grade",
          system,
          prompt: user,
          temperature: GRADING_TEMPERATURE,
          thinkingBudget: GRADE_THINKING_BUDGET,
          responseFormat: "json",
          signal,
        }),
      GRADE_RESILIENCE,
    );
    model = first.model;
    addUsage(usage, first);

    let grade: Grade;
    try {
      grade = parseGradeOutput(first.text, skill.validate);
    } catch (err) {
      if (!(err instanceof GradeValidationError)) throw err;
      // A malformed reply isn't transient, so withResilience won't retry it — we
      // re-ask once with the broken output and the validation errors echoed back.
      const repair = await withResilience(
        (signal) =>
          provider.complete({
            task: "grade",
            system,
            prompt: repairPrompt(user, first.text, err.message),
            temperature: GRADING_TEMPERATURE,
            thinkingBudget: GRADE_THINKING_BUDGET,
            responseFormat: "json",
            signal,
          }),
        GRADE_RESILIENCE,
      );
      model = repair.model;
      addUsage(usage, repair);
      grade = parseGradeOutput(repair.text, skill.validate); // still bad → throws, caught below
    }

    await logUsage({
      organizationId: input.meta.organizationId,
      userId: input.meta.userId,
      task: "grade",
      provider: provider.name,
      model,
      requestKind: input.taskType,
      essayId: input.meta.essayId,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs: Date.now() - startedAt,
      ok: true,
      promptVersion: GRADE_PROMPT_VERSION,
      resultSummary: `band ${grade.overall_band}`,
      input: user,
      output: grade,
    });

    // Attach provenance + the non-affiliation disclaimer (from the skill schema,
    // never model-generated).
    return { ...grade, model, disclaimer: skill.disclaimer };
  } catch (err) {
    await logUsage({
      organizationId: input.meta.organizationId,
      userId: input.meta.userId,
      task: "grade",
      provider: provider.name,
      model,
      requestKind: input.taskType,
      essayId: input.meta.essayId,
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs: Date.now() - startedAt,
      ok: false,
      error: errorMessage(err),
      promptVersion: GRADE_PROMPT_VERSION,
      resultSummary: "grade failed",
      input: user,
    });
    throw err;
  }
}

// ---- Non-attempt floor -----------------------------------------------------

const FLOOR_MODEL = "rule:non-attempt-floor";

/** Below this many words a submission can't be a real attempt at the task. Real
 *  attempts run far longer (Task 2 ≥ 250, Task 1 ≥ 150 words); these thresholds
 *  only catch the unambiguous non-attempt zone. */
const NON_ATTEMPT_MAX_WORDS: Record<GradeEssayInput["taskType"], number> = {
  task2: 40,
  task1_academic: 25,
  task1_general: 25,
};

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Deterministic Band-1 grade for a severely under-length submission. Returns null
 * when the text is long enough to deserve a real model grading. Keeps us honest at
 * the bottom of the scale where the model can't be trusted, and avoids a wasted
 * model call on garbage input.
 */
async function nonAttemptFloor(input: GradeEssayInput): Promise<EssayGrade | null> {
  const words = wordCount(input.essayText);
  if (words >= NON_ATTEMPT_MAX_WORDS[input.taskType]) return null;

  const minWords = input.taskType === "task2" ? 250 : 150;
  const skill = await loadGradingSkill();

  const note = (): CriterionScore => ({
    band: 1,
    evidence: `Only ${words} word${words === 1 ? "" : "s"} were written — far short of the ~${minWords}-word task.`,
    what_caps_it:
      "Non-attempt: there is no developed response, organisation, vocabulary range, or grammatical range to assess.",
    fix: `Write a complete, on-topic response of at least ${minWords} words.`,
  });

  const grade: Grade = {
    overall_band: 1,
    criteria: { TR: note(), CC: note(), LR: note(), GRA: note() },
    score_blocker: {
      criterion: "TR",
      why: `This is a non-attempt (${words} words). Write a full, on-topic answer of at least ${minWords} words to receive a real band.`,
    },
    band_with_fixes: 1,
  };

  await logUsage({
    organizationId: input.meta.organizationId,
    userId: input.meta.userId,
    task: "grade",
    provider: "rule",
    model: FLOOR_MODEL,
    requestKind: input.taskType,
    essayId: input.meta.essayId,
    inputTokens: 0,
    outputTokens: 0,
    latencyMs: 0,
    ok: true,
    promptVersion: GRADE_PROMPT_VERSION,
    resultSummary: `band 1 (non-attempt, ${words}w)`,
    input: input.essayText,
    output: grade,
  });

  return { ...grade, model: FLOOR_MODEL, disclaimer: skill.disclaimer };
}

// ---- CEFR writing grader (distinct track) ----------------------------------

/** Below this many words a CEFR submission can't show the level's demands — graded
 *  deterministically (no model call), like the IELTS non-attempt floor. */
const CEFR_NON_ATTEMPT_WORDS: Record<CefrLevel, number> = {
  A1: 8,
  A2: 12,
  B1: 25,
  B2: 40,
  C1: 60,
  C2: 70,
};

const CEFR_FLOOR_MODEL = "rule:cefr-non-attempt";

/**
 * Grade a CEFR writing task against the four Cambridge-aligned subscales and place
 * it on the CEFR ladder (A1–C2). Conservative — between two levels it returns the
 * lower one (CLAUDE.md §2). Goes through the same provider/resilience/usage plumbing
 * as IELTS grading; stateless (the caller decides whether to persist).
 */
export async function gradeCefrWriting(rawInput: CefrGradeInput): Promise<CefrGradeResult> {
  const input = cefrGradeInputSchema.parse(rawInput);

  const floor = cefrNonAttemptFloor(input);
  if (floor) {
    await logUsage({
      organizationId: input.meta.organizationId,
      userId: input.meta.userId,
      task: "grade",
      provider: "rule",
      model: CEFR_FLOOR_MODEL,
      requestKind: "cefr_writing",
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: 0,
      ok: true,
      promptVersion: CEFR_GRADE_PROMPT_VERSION,
      resultSummary: `cefr non-attempt (${wordCount(input.text)}w)`,
      input: input.text,
      output: floor,
    });
    return floor;
  }

  const provider = getProvider("grade");
  const { system, user } = buildCefrGradePrompt(input);
  const startedAt = Date.now();
  const usage = { input: 0, output: 0 };
  let model = provider.name;

  try {
    const first = await withResilience(
      (signal) =>
        provider.complete({
          task: "grade",
          system,
          prompt: user,
          temperature: GRADING_TEMPERATURE,
          responseFormat: "json",
          signal,
        }),
      GRADE_RESILIENCE,
    );
    model = first.model;
    addUsage(usage, first);

    let grade: CefrGrade;
    try {
      grade = parseCefrGrade(first.text);
    } catch (err) {
      // Malformed JSON isn't transient — re-ask once with the error echoed back.
      const repair = await withResilience(
        (signal) =>
          provider.complete({
            task: "grade",
            system,
            prompt: repairPrompt(user, first.text, errorMessage(err)),
            temperature: GRADING_TEMPERATURE,
            responseFormat: "json",
            signal,
          }),
        GRADE_RESILIENCE,
      );
      model = repair.model;
      addUsage(usage, repair);
      grade = parseCefrGrade(repair.text); // still bad → throws, caught below
    }

    // Derive the relational fields server-side so the verdict is always internally
    // consistent regardless of any model slip: the target is what we asked for,
    // on_target is estimated≥target on the CEFR ladder, and next_level is the level
    // immediately above the estimate (keep the model's "focus" advice).
    grade = reconcileCefrGrade(grade, input.targetLevel);

    await logUsage({
      organizationId: input.meta.organizationId,
      userId: input.meta.userId,
      task: "grade",
      provider: provider.name,
      model,
      requestKind: "cefr_writing",
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs: Date.now() - startedAt,
      ok: true,
      promptVersion: CEFR_GRADE_PROMPT_VERSION,
      resultSummary: `cefr ${grade.estimated_level} (target ${grade.target_level})`,
      input: user,
      output: grade,
    });

    return { ...grade, model, disclaimer: CEFR_GRADE_DISCLAIMER };
  } catch (err) {
    await logUsage({
      organizationId: input.meta.organizationId,
      userId: input.meta.userId,
      task: "grade",
      provider: provider.name,
      model,
      requestKind: "cefr_writing",
      inputTokens: usage.input,
      outputTokens: usage.output,
      latencyMs: Date.now() - startedAt,
      ok: false,
      error: errorMessage(err),
      promptVersion: CEFR_GRADE_PROMPT_VERSION,
      resultSummary: "cefr grade failed",
      input: user,
    });
    throw err;
  }
}

/** Strip any code fence / prose and validate the model's CEFR JSON against the schema. */
function parseCefrGrade(text: string): CefrGrade {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const json = start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    throw new Error("CEFR grade reply was not valid JSON.");
  }
  const parsed = cefrGradeSchema.safeParse(obj);
  if (!parsed.success) {
    throw new Error(`CEFR grade JSON failed validation: ${parsed.error.issues.map((i) => i.path.join(".") + " " + i.message).join("; ")}`);
  }
  return parsed.data;
}

/** Force the relational fields to be consistent with the (trusted) estimated_level
 *  and the (authoritative) target. Keeps the model's prose advice intact. */
function reconcileCefrGrade(grade: CefrGrade, targetLevel: CefrLevel): CefrGrade {
  const ei = CEFR_LEVELS.indexOf(grade.estimated_level);
  const ti = CEFR_LEVELS.indexOf(targetLevel);
  const nextLevel = CEFR_LEVELS[Math.min(CEFR_LEVELS.length - 1, ei + 1)];
  return {
    ...grade,
    target_level: targetLevel,
    on_target: ei >= ti,
    next_level: { level: nextLevel, focus: grade.next_level.focus },
  };
}

/** Deterministic low result for a submission too short to assess at the target level. */
function cefrNonAttemptFloor(input: CefrGradeInput): CefrGradeResult | null {
  const words = wordCount(input.text);
  if (words >= CEFR_NON_ATTEMPT_WORDS[input.targetLevel]) return null;

  const note = `Only ${words} word${words === 1 ? "" : "s"} were written — too short to show ${input.targetLevel} writing.`;
  const sub = (improve: string) => ({ mark: 0, comment: note, improve });

  const grade: CefrGrade = {
    estimated_level: "A1",
    target_level: input.targetLevel,
    on_target: false,
    subscales: {
      content: sub("Address every point the task asks for."),
      communicative_achievement: sub("Write a complete message in the right format and tone."),
      organisation: sub("Write in full, connected sentences."),
      language: sub("Show a range of words and structures."),
    },
    summary: `This is too short to assess at ${input.targetLevel}. Write a full response that covers the whole task.`,
    strengths: ["You made a start on the task."],
    improvements: ["Write a complete answer that addresses every point in the task."],
    next_level: { level: input.targetLevel, focus: "Write a full-length response so your level can be assessed." },
  };
  return { ...grade, model: CEFR_FLOOR_MODEL, disclaimer: CEFR_GRADE_DISCLAIMER };
}

export async function generate(rawInput: GenerateInput): Promise<GenerateResult> {
  const input = generateInputSchema.parse(rawInput);
  // A vocabulary lookup is a tiny, latency-sensitive call — run it on the fast
  // (flash-lite) model; passage/essay generation stays on the generate model.
  const provider = providerForModel(
    input.kind === "vocabulary_translate" ? serverEnv.geminiModels.fast : serverEnv.geminiModels.generate,
  );
  const { system, user } = buildGeneratePrompt(input);
  const startedAt = Date.now();
  let model = provider.name;

  // Reading calls + the Academic Task 1 task (prompt + figure) return structured
  // JSON; the validation pass is a checker, so it runs deterministic (temp 0) like
  // grading. Writing prompts want variety.
  const wantsJson =
    input.kind === "reading_set" ||
    input.kind === "reading_validation" ||
    input.kind === "writing_task1_academic" ||
    input.kind === "writing_samples" ||
    input.kind === "vocabulary_translate";
  // A dictionary lookup and the answer-key checker both want a stable, repeatable
  // answer; everything else wants variety.
  const temperature =
    input.kind === "reading_validation" || input.kind === "vocabulary_translate"
      ? GRADING_TEMPERATURE
      : GENERATION_TEMPERATURE;
  const resilience = wantsJson ? READING_RESILIENCE : GENERATE_RESILIENCE;

  try {
    const result = await withResilience(
      (signal) =>
        provider.complete({
          task: "generate",
          system,
          prompt: user,
          temperature,
          responseFormat: wantsJson ? "json" : "text",
          signal,
        }),
      resilience,
    );
    model = result.model;

    await logUsage({
      organizationId: input.meta.organizationId,
      userId: input.meta.userId,
      task: "generate",
      provider: provider.name,
      model,
      requestKind: input.kind,
      inputTokens: result.usage?.inputTokens,
      outputTokens: result.usage?.outputTokens,
      latencyMs: Date.now() - startedAt,
      ok: true,
      promptVersion: GENERATE_PROMPT_VERSION,
      resultSummary: input.kind,
      input: user,
      output: result.text,
    });

    return { content: result.text, model };
  } catch (err) {
    await logUsage({
      organizationId: input.meta.organizationId,
      userId: input.meta.userId,
      task: "generate",
      provider: provider.name,
      model,
      requestKind: input.kind,
      latencyMs: Date.now() - startedAt,
      ok: false,
      error: errorMessage(err),
      promptVersion: GENERATE_PROMPT_VERSION,
      resultSummary: "generate failed",
      input: user,
    });
    throw err;
  }
}

// ---- Writing model answers (the Band-8 sample comparison) ------------------

export interface WritingSamplesInput {
  taskType: EssayTaskType;
  promptText: string;
  /** Academic Task 1 only: the figure flattened to text (figureToText), so the
   *  model answers describe the SAME data the student saw. */
  figure?: string;
  meta: { organizationId: string; userId: string | null };
}

/**
 * Generate two original, band-targeted model answers (Band 7 + Band 8) for one
 * task — the comparison panel a learner studies after grading. The GENERATOR
 * writes these (separate from the grader, CLAUDE.md), grounded in the calibrated
 * anchors so the bands are honest, not inflated. Returns the samples low→high.
 */
export async function generateWritingSamples(input: WritingSamplesInput): Promise<WritingSample[]> {
  const anchors = await retrieveAnchorsForTask(input.taskType, 4);
  const anchorBlock = anchors.length
    ? anchors.map((a, i) => `--- calibrated anchor ${i + 1} (≈ band ${a.band}) ---\n${a.content}`).join("\n\n")
    : "";

  const { content } = await generate({
    kind: "writing_samples",
    spec: {
      task_type: input.taskType,
      prompt: input.promptText,
      figure: input.figure ?? "",
      anchor_block: anchorBlock,
    },
    meta: input.meta,
  });

  const stripped = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const parsed = writingSamplesResultSchema.parse(JSON.parse(stripped));
  return [...parsed.samples].sort((a, b) => a.band - b.band);
}

// ---- Transcription (photo/PDF of a written answer → editable text) ---------

const TRANSCRIBE_RESILIENCE = { timeoutMs: 60_000, retries: 1 };
/** The model returns this when a file has no readable writing; we map it to "". */
const TRANSCRIBE_SENTINEL = "__NO_TEXT__";

export interface TranscribeWritingInput {
  /** One image/PDF of the student's handwritten or typed answer (base64). */
  file: InlineFile;
  meta: { organizationId: string; userId: string | null };
}

/**
 * Transcribe a photo/PDF of a written IELTS answer into editable plain text — the
 * student then reviews/edits it in the studio and grades as normal. Faithful
 * transcription ONLY (temperature 0, no correcting/improving) so the grader still
 * sees the student's real writing. Goes through the single AI service with usage
 * logging like every other model call (CLAUDE.md: never call models from the
 * client; all AI through one server-side service).
 */
export async function transcribeWriting(
  input: TranscribeWritingInput,
): Promise<{ text: string; model: string }> {
  const provider = getProvider("generate");
  const system = [
    "You convert a photo or PDF of a handwritten or typed IELTS Writing answer into plain text.",
    "Transcribe EXACTLY what the student wrote — preserve their wording, spelling, grammar, punctuation and paragraph breaks. Do NOT correct, improve, rephrase, translate, complete, or add anything.",
    "Keep paragraph breaks as blank lines. Ignore page furniture (ruled lines, margins, page numbers).",
    `Output ONLY the transcribed text. If there is no readable writing in the file, output exactly ${TRANSCRIBE_SENTINEL}.`,
  ].join(" ");

  const startedAt = Date.now();
  let model = provider.name;
  try {
    const result = await withResilience(
      (signal) =>
        provider.complete({
          task: "generate",
          system,
          prompt: "Transcribe the IELTS writing answer in this file to plain text, verbatim.",
          files: [input.file],
          temperature: 0,
          responseFormat: "text",
          signal,
        }),
      TRANSCRIBE_RESILIENCE,
    );
    model = result.model;
    const raw = result.text.trim();
    const text = raw === TRANSCRIBE_SENTINEL ? "" : raw;

    await logUsage({
      organizationId: input.meta.organizationId,
      userId: input.meta.userId,
      task: "generate",
      provider: provider.name,
      model,
      requestKind: "writing_transcribe",
      inputTokens: result.usage?.inputTokens,
      outputTokens: result.usage?.outputTokens,
      latencyMs: Date.now() - startedAt,
      ok: true,
      promptVersion: GENERATE_PROMPT_VERSION,
      resultSummary: `transcribed ${text.length} chars`,
      output: text,
    });
    return { text, model };
  } catch (err) {
    await logUsage({
      organizationId: input.meta.organizationId,
      userId: input.meta.userId,
      task: "generate",
      provider: provider.name,
      model,
      requestKind: "writing_transcribe",
      latencyMs: Date.now() - startedAt,
      ok: false,
      error: errorMessage(err),
      promptVersion: GENERATE_PROMPT_VERSION,
      resultSummary: "transcribe failed",
    });
    throw err;
  }
}

// ---- Anchors ---------------------------------------------------------------

/** Use caller-supplied exemplar blocks if given, else retrieve a band-spread set. */
function resolveAnchors(input: GradeEssayInput): Promise<Anchor[]> {
  if (input.anchors?.length) {
    return Promise.resolve(
      input.anchors.map((content, i) => ({
        id: `inline-${i + 1}`,
        taskType: input.taskType,
        band: 0,
        content,
      })),
    );
  }
  return retrieveAnchors(input, 4);
}

// ---- Resilience ------------------------------------------------------------

interface ResilienceOpts {
  timeoutMs: number;
  retries: number;
}

/**
 * Run a model call with a hard timeout and exponential backoff. A fresh
 * AbortController per attempt enforces the timeout; transient failures (timeout,
 * 429, 5xx, network) are retried, everything else (incl. validation) is not.
 */
async function withResilience<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  opts: ResilienceOpts,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("AI call timed out")), opts.timeoutMs);
    try {
      return await fn(controller.signal);
    } catch (err) {
      lastErr = err;
      if (attempt === opts.retries || !isTransient(err)) break;
      await sleep(backoffMs(attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

function isTransient(err: unknown): boolean {
  if (err instanceof GradeValidationError) return false;
  const status =
    (err as { status?: number; code?: number })?.status ?? (err as { code?: number })?.code;
  if (typeof status === "number") return status === 429 || (status >= 500 && status < 600);
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return /timed out|timeout|abort|econnreset|etimedout|fetch failed|network|temporar|unavailable|overloaded|rate limit|503|429|500|502|504/.test(
    msg,
  );
}

/** ~0.4s, 0.8s, 1.6s … with jitter. */
function backoffMs(attempt: number): number {
  return Math.round(400 * 2 ** attempt * (0.75 + Math.random() * 0.5));
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ---- Helpers ---------------------------------------------------------------

function addUsage(acc: { input: number; output: number }, r: CompletionResult): void {
  acc.input += r.usage?.inputTokens ?? 0;
  acc.output += r.usage?.outputTokens ?? 0;
}

function repairPrompt(originalUser: string, badReply: string, why: string): string {
  return [
    originalUser,
    "",
    `Your previous reply was rejected: ${why}`,
    "Previous reply:",
    badReply,
    "",
    "Return ONLY the corrected JSON object, matching the required schema exactly. No prose, no code fence.",
  ].join("\n");
}

function errorMessage(err: unknown): string {
  return (err instanceof Error ? err.message : String(err)).slice(0, 500);
}

export type { EssayGrade, GradeEssayInput, GenerateInput, GenerateResult, WritingSample } from "./schema";
