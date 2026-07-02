import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/lib/auth";
import { generate } from "@/lib/ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { expandOptionalParens, norm, splitAlternatives } from "./grade";
import {
  CONFIDENCE_THRESHOLD,
  DEFAULT_TARGET_BAND,
  FULL_TEST_PASSAGE_COUNT,
  pickFullTestLayout,
  generateReadingInputSchema,
  MAX_TARGET_BAND,
  MIN_TARGET_BAND,
  READING_GAP_MARKER,
  readingSetOutputSchema,
  readingValidationOutputSchema,
  reviewDecisionSchema,
  type GeneratedReadingSet,
  type GeneratedReadingTest,
  type GenerateReadingInput,
  type NoteMeta,
  type ReadingModule,
  type ReadingQuestionOut,
  type ReadingQuestionType,
  type ReadingValidationItem,
  type ReadingValidationOutput,
  type ReviewDecision,
  type StoredReadingPassage,
  type StoredReadingQuestion,
  type StoredReadingTest,
} from "./types";

/**
 * Reading generation service: generate an original passage + typed questions
 * (Gemini, JSON), run a deterministic second-pass that checks every answer key
 * against the passage, flag low-confidence items for teacher review, and store
 * the lot as a pending passage. Approval (separate) is what releases it.
 *
 * The generator and the checker are SEPARATE model calls on purpose — a model
 * shouldn't bless its own answer key. All writes go through the RLS client, so
 * tenant + teacher-only rules are enforced by Postgres, not just these guards.
 */

export interface ReadingActor {
  userId: string;
  organizationId: string;
  role: AppRole;
}

const CAN_AUTHOR: AppRole[] = ["center_admin", "teacher"];

const PASSAGE_COLUMNS =
  "id, title, body, module, topic, difficulty, status, source, needs_review";
const QUESTION_COLUMNS =
  "id, question_type, order_index, prompt, options, answer_key, supporting_sentence, explanation, word_limit, section, note_meta, confidence, needs_review, validation_verdict, validation_note";
const TEST_COLUMNS = "id, module, target_band, status, source, needs_review";

export class ReadingServiceError extends Error {
  constructor(
    message: string,
    readonly code: "forbidden" | "invalid_input" | "generation_failed" | "not_found" | "store_failed",
  ) {
    super(message);
    this.name = "ReadingServiceError";
  }
}

// ---- Generate --------------------------------------------------------------

/** A question row prepared for storage (answer key + validator verdict merged). */
interface PreparedQuestion {
  question_type: ReadingQuestionType;
  order_index: number;
  prompt: string;
  options: string[] | null;
  answer_key: string;
  supporting_sentence: string;
  explanation: string;
  word_limit: string | null;
  section: string | null;
  note_meta: NoteMeta | null;
  confidence: number | null;
  needs_review: boolean;
  validation_verdict: string | null;
  validation_note: string | null;
}

interface ComposedReadingSet {
  title: string;
  body: string;
  module: ReadingModule;
  topic: string;
  targetBand: number;
  prepared: PreparedQuestion[];
  flaggedCount: number;
  validationFailed: boolean;
}

/**
 * Generate a passage + questions and run the SEPARATE answer-key checker, merging
 * each verdict onto its question. No storage, no role check — callers decide where
 * it lands (teacher review queue vs. auto-approved B2C). The generator and checker
 * are distinct model calls on purpose: a model shouldn't bless its own key.
 */
async function composeReadingSet(
  input: GenerateReadingInput,
  meta: { organizationId: string; userId: string },
): Promise<ComposedReadingSet> {
  // 1) Generate the passage + questions. When the caller pins an exact block plan
  //    (the full test), pass it as an authoritative, human-readable line so the
  //    model produces the precise Cambridge structure (counts + order), annotating
  //    any block that is a word-bank summary or a flow-chart so the model shapes it.
  const questionPlanLine = input.questionPlan
    ? input.questionPlan
        .map((g, i) => {
          const flags = [
            g.wordBank ? "with a word bank A–J" : "",
            g.layout === "flowchart" ? "as a flow-chart" : "",
          ].filter(Boolean);
          return `${i + 1}) ${g.count}× ${g.type}${flags.length ? ` [${flags.join(", ")}]` : ""}`;
        })
        .join("; ")
    : undefined;
  // Flow-chart is a render-only flag with no content of its own, so we can force it
  // onto the stored note_meta rather than trust the model to echo it back.
  const flowchartNotes =
    input.questionPlan?.some((g) => g.type === "note_completion" && g.layout === "flowchart") ?? false;
  let set;
  try {
    const res = await generate({
      kind: "reading_set",
      spec: {
        module: input.module,
        topic: input.topic,
        target_band: input.targetBand,
        question_types: input.questionTypes,
        total_questions: input.totalQuestions,
        ...(input.angle ? { angle: input.angle } : {}),
        ...(questionPlanLine ? { question_plan: questionPlanLine } : {}),
      },
      meta,
    });
    set = readingSetOutputSchema.parse(parseJson(res.content));
  } catch (err) {
    console.error("[reading.compose] generate failed:", err);
    throw new ReadingServiceError(`Reading generation failed: ${msg(err)}`, "generation_failed");
  }

  // 2) Second pass: check each answer key against the passage (separate call).
  let validation: ReadingValidationOutput | null = null;
  try {
    const res = await generate({
      kind: "reading_validation",
      spec: {
        passage: `${set.title}\n\n${set.body}`,
        questions: set.questions.map((q) => ({
          number: q.number,
          type: q.type,
          prompt: q.prompt,
          options: q.options ?? null,
          answer: q.answer,
          supporting_sentence: q.supporting_sentence,
        })),
      },
      meta,
    });
    validation = readingValidationOutputSchema.parse(parseJson(res.content));
  } catch {
    validation = null; // checker unavailable → flag everything (conservative)
  }
  const validationFailed = validation === null;

  // 3) Merge the verdicts onto each question.
  const byNumber = new Map<number, ReadingValidationItem>();
  for (const item of validation?.items ?? []) byNumber.set(item.number, item);

  let flaggedCount = 0;
  const prepared: PreparedQuestion[] = set.questions.map((q, i) => {
    const item = byNumber.get(q.number);
    // Objective code checks first — the LLM validator never sees the word limit
    // and can't be trusted on verbatim containment, so these are authoritative
    // and flag the question regardless of its verdict.
    const problem = codeCheckProblem(q, set.body);
    const needsReview =
      problem !== null ||
      !item ||
      item.verdict !== "correct" ||
      item.confidence < CONFIDENCE_THRESHOLD ||
      !item.supporting_sentence_ok;
    if (needsReview) flaggedCount += 1;

    let note = item?.note ?? "";
    if (item?.corrected_answer && item.verdict !== "correct") {
      note = `${note}${note ? " " : ""}Suggested: ${item.corrected_answer}`.trim();
    }
    if (validationFailed) note = "validation pass unavailable — review manually";
    else if (!item) note = "no validator verdict for this item";
    if (problem) note = `code check: ${problem}`;

    return {
      question_type: q.type,
      order_index: q.number ?? i + 1,
      prompt: q.prompt,
      options: q.options ?? null,
      answer_key: q.answer,
      supporting_sentence: q.supporting_sentence,
      explanation: q.explanation,
      word_limit: q.word_limit ?? null,
      section: q.section ?? null,
      note_meta:
        q.type === "note_completion"
          ? flowchartNotes
            ? { indent: 0, ...(q.note_meta ?? {}), layout: "flowchart" as const }
            : q.note_meta ?? null
          : null,
      confidence: item?.confidence ?? null,
      needs_review: needsReview,
      validation_verdict: item?.verdict ?? null,
      validation_note: note || null,
    };
  });

  return {
    title: set.title,
    body: set.body,
    module: input.module,
    topic: input.topic,
    targetBand: input.targetBand,
    prepared,
    flaggedCount,
    validationFailed,
  };
}

/** Persist a composed set at the given visibility, using the given client: the RLS
 *  client for teacher writes, or the service-role client for the auto-approved B2C
 *  path (which RLS would otherwise block for a student). `store` carries the owning
 *  org + creator (creator is null for shared library content, which has no user). */
async function storeReadingSet(
  client: SupabaseClient,
  store: { organizationId: string; createdBy: string | null },
  composed: ComposedReadingSet,
  questions: PreparedQuestion[],
  status: "pending" | "approved",
  opts: { testId?: string; orderInTest?: number; isLibrary?: boolean } = {},
): Promise<GeneratedReadingSet> {
  const { data: passage, error: pErr } = await client
    .from("reading_passages")
    .insert({
      organization_id: store.organizationId,
      title: composed.title,
      body: composed.body,
      module: composed.module,
      topic: composed.topic,
      difficulty: composed.targetBand,
      status,
      source: "ai",
      needs_review: status === "approved" ? false : composed.flaggedCount > 0 || composed.validationFailed,
      created_by: store.createdBy,
      test_id: opts.testId ?? null,
      order_in_test: opts.orderInTest ?? null,
      is_library: opts.isLibrary ?? false,
    })
    .select(PASSAGE_COLUMNS)
    .single();
  if (pErr || !passage) {
    throw new ReadingServiceError(`Failed to store passage: ${pErr?.message ?? "unknown"}`, "store_failed");
  }

  const { data: questionRows, error: qErr } = await client
    .from("reading_questions")
    .insert(
      questions.map((p) => ({
        passage_id: passage.id,
        organization_id: store.organizationId,
        ...p,
      })),
    )
    .select(QUESTION_COLUMNS);
  if (qErr || !questionRows) {
    // Roll back the orphan passage so a half-written set isn't left behind.
    await client.from("reading_passages").delete().eq("id", passage.id);
    throw new ReadingServiceError(`Failed to store questions: ${qErr?.message ?? "unknown"}`, "store_failed");
  }

  return {
    passage: passage as StoredReadingPassage,
    questions: (questionRows as StoredReadingQuestion[]).sort((a, b) => a.order_index - b.order_index),
    flaggedCount: composed.flaggedCount,
    validationFailed: composed.validationFailed,
  };
}

/** Teacher/admin path: generate and park as PENDING for the review queue. */
export async function generateReadingSet(
  rawInput: GenerateReadingInput,
  actor: ReadingActor,
): Promise<GeneratedReadingSet> {
  if (!CAN_AUTHOR.includes(actor.role)) {
    throw new ReadingServiceError("Only a teacher or center admin can generate reading.", "forbidden");
  }
  const input = parse(generateReadingInputSchema, rawInput);
  const composed = await composeReadingSet(input, {
    organizationId: actor.organizationId,
    userId: actor.userId,
  });
  const supabase = await createClient();
  return storeReadingSet(
    supabase,
    { organizationId: actor.organizationId, createdBy: actor.userId },
    composed,
    composed.prepared,
    "pending",
  );
}

/**
 * B2C path: with no teacher to curate a pool, generate one passage on demand and
 * store it already-APPROVED so a solo learner can practice immediately. The AI
 * answer-key checker stands in for human review — we keep only the questions it
 * confirmed, so a student is never graded on an unchecked key (CLAUDE.md: accuracy
 * is the moat). Service-role client, because RLS only lets teachers write reading.
 *
 * Pitched at the learner's level (their reading band), like the writing prompts.
 */
export async function generateReadingForStudent(actor: ReadingActor): Promise<GeneratedReadingSet> {
  const targetBand = await resolveReadingTargetBand(actor);
  const input = parse(generateReadingInputSchema, defaultReadingSpec(targetBand));
  const { composed, kept } = await composeValidated(input, {
    organizationId: actor.organizationId,
    userId: actor.userId,
  });
  const admin = createAdminClient();
  return storeReadingSet(
    admin,
    { organizationId: actor.organizationId, createdBy: actor.userId },
    composed,
    kept,
    "approved",
  );
}

/**
 * B2C full test: 3 original passages + ~40 questions in the real IELTS exam FORMAT
 * (never Cambridge content — CLAUDE.md §IP), pitched at the learner's level with
 * difficulty rising P1→P3. The three passages are generated IN PARALLEL (each is a
 * generate + a separate answer-key check) so the wall-clock is ~one passage, not
 * three. Stored already-approved under one reading_tests row via the service-role
 * client. The band for the whole test is converted later, once, over all ~40.
 */
export async function generateReadingTestForStudent(actor: ReadingActor): Promise<GeneratedReadingTest> {
  const centerBand = await resolveReadingTargetBand(actor);
  return buildAndStoreTest(createAdminClient(), {
    storageOrgId: actor.organizationId,
    createdBy: actor.userId,
    centerBand,
    isLibrary: false,
    meta: { organizationId: actor.organizationId, userId: actor.userId },
  });
}

interface BuildTestParams {
  /** Org the test + passages are written to. */
  storageOrgId: string;
  /** profiles.id of the author, or null for shared library content (no user). */
  createdBy: string | null;
  /** Difficulty center: P1 = band−1, P2 = band, P3 = band+1 (each clamped). */
  centerBand: number;
  /** Mark the rows as shared-library templates. */
  isLibrary: boolean;
  /** Tenant/user attributed for AI-usage logging (separate from where rows land). */
  meta: { organizationId: string; userId: string };
}

/**
 * Generate + store one full 3-passage test. The three passages are composed IN
 * PARALLEL (each is a generate + a separate answer-key check) so wall-clock ≈ one
 * passage, then written under a single reading_tests row. On any failure the test
 * row is deleted — the FK cascade clears partial passages/questions, so a broken
 * test is never served. Shared by the learner path and the library seed.
 */
async function buildAndStoreTest(admin: SupabaseClient, p: BuildTestParams): Promise<GeneratedReadingTest> {
  // One brief per passage: a DISTINCT domain + topic + angle drawn for each
  // difficulty slot (P1 easiest → P3 hardest), so the three passages span three
  // subjects and lenses rather than repeating a theme.
  const briefs = pickFullTestTopics();
  // Pick ONE real-Cambridge layout for the whole test (so the 3 passages cohere),
  // then shuffle each passage's block order — structure fixed, position dynamic.
  const layout = pickFullTestLayout();
  // Each passage composes-and-validates independently (with its own single
  // regenerate), still in parallel — wall-clock stays ≈ one passage.
  const composedSets = await Promise.all(
    Array.from({ length: FULL_TEST_PASSAGE_COUNT }, (_, i) => {
      const band = clampBand(p.centerBand + (i - 1)); // P1 easier → P3 harder
      const plan = shuffle(layout[i]);
      const input = parse(generateReadingInputSchema, {
        module: "academic",
        topic: briefs[i].topic,
        angle: briefs[i].angle,
        targetBand: band,
        questionTypes: [...new Set(plan.map((g) => g.type))],
        totalQuestions: plan.reduce((n, g) => n + g.count, 0),
        questionPlan: plan,
      });
      return composeValidated(input, p.meta);
    }),
  );

  const { data: test, error: tErr } = await admin
    .from("reading_tests")
    .insert({
      organization_id: p.storageOrgId,
      module: "academic",
      target_band: p.centerBand,
      status: "approved",
      source: "ai",
      needs_review: false,
      created_by: p.createdBy,
      is_library: p.isLibrary,
    })
    .select(TEST_COLUMNS)
    .single();
  if (tErr || !test) {
    throw new ReadingServiceError(`Failed to store test: ${tErr?.message ?? "unknown"}`, "store_failed");
  }

  const passages: GeneratedReadingSet[] = [];
  try {
    for (let i = 0; i < composedSets.length; i++) {
      const { composed, kept } = composedSets[i];
      passages.push(
        await storeReadingSet(
          admin,
          { organizationId: p.storageOrgId, createdBy: p.createdBy },
          composed,
          kept,
          "approved",
          { testId: test.id as string, orderInTest: i + 1, isLibrary: p.isLibrary },
        ),
      );
    }
  } catch (err) {
    await admin.from("reading_tests").delete().eq("id", test.id);
    throw err;
  }

  return { test: test as StoredReadingTest, passages };
}

// ---- Shared library (ready-to-start, no waiting) ---------------------------

/**
 * The single org that owns the shared reading LIBRARY (the ~10 ready tests + ~10
 * ready passages every learner sees). Seeded once by scripts/seed-reading-library.ts.
 * Templates are read with the service-role client; on "Start" they're cloned into
 * the learner's own org, so RLS/FK/grading downstream are untouched.
 */
export const READING_LIBRARY_ORG_ID = "00000000-0000-4000-8000-00000000111b";

/** Synthetic ids for AI-usage logging during the seed — non-UUIDs, so the usage
 *  insert is rejected and swallowed (the one-time seed isn't billed to a tenant). */
const LIBRARY_SEED_META = { organizationId: "reading-library-seed", userId: "reading-library-seed" };

/** Idempotently ensure the shared library org row exists (seed bootstrap). */
export async function ensureReadingLibraryOrg(): Promise<string> {
  const admin = createAdminClient();
  const { error } = await admin.from("organizations").upsert(
    {
      id: READING_LIBRARY_ORG_ID,
      name: "IELTS Practice Library",
      slug: "ielts-practice-library",
      plan: "enterprise",
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) throw new ReadingServiceError(`Failed to ensure library org: ${error.message}`, "store_failed");
  return READING_LIBRARY_ORG_ID;
}

/** Seed: generate one shared full test at an explicit difficulty (no user, no
 *  skill lookup). Stored under the library org as a template. */
export async function generateLibraryReadingTest(centerBand: number): Promise<GeneratedReadingTest> {
  return buildAndStoreTest(createAdminClient(), {
    storageOrgId: READING_LIBRARY_ORG_ID,
    createdBy: null,
    centerBand: clampBand(Math.round(centerBand)),
    isLibrary: true,
    meta: LIBRARY_SEED_META,
  });
}

/** Seed: generate one shared standalone practice passage at an explicit band. */
export async function generateLibraryReadingPassage(band: number): Promise<GeneratedReadingSet> {
  const input = parse(generateReadingInputSchema, defaultReadingSpec(clampBand(Math.round(band))));
  const { composed, kept } = await composeValidated(input, LIBRARY_SEED_META);
  return storeReadingSet(
    createAdminClient(),
    { organizationId: READING_LIBRARY_ORG_ID, createdBy: null },
    composed,
    kept,
    "approved",
    { isLibrary: true },
  );
}

/**
 * Clone a shared library TEST into the learner's own org and return the new test
 * id. Idempotent: a learner gets ONE copy per template (deduped by library_key),
 * so re-pressing "Start" reopens the same copy. The copy is an ordinary approved,
 * in-org test, so the runner/grading/attempts all work unchanged. Cheap — it's a
 * row copy, no model call.
 */
export async function instantiateLibraryTest(actor: ReadingActor, libraryTestId: string): Promise<string> {
  const admin = createAdminClient();

  const existing = await findClone(admin, "reading_tests", actor.organizationId, libraryTestId);
  if (existing) return existing;

  const { data: src } = await admin
    .from("reading_tests")
    .select("module, target_band")
    .eq("id", libraryTestId)
    .eq("is_library", true)
    .maybeSingle();
  if (!src) throw new ReadingServiceError("Sample test not found.", "not_found");

  const { data: srcPassages } = await admin
    .from("reading_passages")
    .select("id, title, body, module, topic, difficulty, order_in_test")
    .eq("test_id", libraryTestId)
    .order("order_in_test", { ascending: true });
  if (!srcPassages || srcPassages.length === 0) {
    throw new ReadingServiceError("Sample test has no passages.", "not_found");
  }

  const { data: newTest, error: tErr } = await admin
    .from("reading_tests")
    .insert({
      organization_id: actor.organizationId,
      module: src.module,
      target_band: src.target_band,
      status: "approved",
      source: "ai",
      needs_review: false,
      created_by: actor.userId,
      is_library: false,
      library_key: libraryTestId,
    })
    .select("id")
    .single();
  if (tErr || !newTest) {
    const raced = await findClone(admin, "reading_tests", actor.organizationId, libraryTestId);
    if (raced) return raced; // unique index caught a concurrent Start — reuse it
    throw new ReadingServiceError(`Failed to start sample test: ${tErr?.message ?? "unknown"}`, "store_failed");
  }

  try {
    for (const sp of srcPassages) {
      await clonePassageInto(admin, actor, sp, {
        testId: newTest.id as string,
        orderInTest: (sp.order_in_test as number | null) ?? null,
      });
    }
  } catch (err) {
    await admin.from("reading_tests").delete().eq("id", newTest.id); // cascade clears partials
    throw err;
  }
  return newTest.id as string;
}

/** Clone a shared standalone library PASSAGE into the learner's org (idempotent). */
export async function instantiateLibraryPassage(actor: ReadingActor, libraryPassageId: string): Promise<string> {
  const admin = createAdminClient();

  const existing = await findClone(admin, "reading_passages", actor.organizationId, libraryPassageId);
  if (existing) return existing;

  const { data: src } = await admin
    .from("reading_passages")
    .select("id, title, body, module, topic, difficulty")
    .eq("id", libraryPassageId)
    .eq("is_library", true)
    .is("test_id", null)
    .maybeSingle();
  if (!src) throw new ReadingServiceError("Sample passage not found.", "not_found");

  try {
    return await clonePassageInto(admin, actor, src, { testId: null, orderInTest: null });
  } catch (err) {
    const raced = await findClone(admin, "reading_passages", actor.organizationId, libraryPassageId);
    if (raced) return raced;
    throw err;
  }
}

/** Look up this org's existing clone of a template (by library_key). */
async function findClone(
  admin: SupabaseClient,
  table: "reading_tests" | "reading_passages",
  organizationId: string,
  libraryKey: string,
): Promise<string | null> {
  const q = admin.from(table).select("id").eq("organization_id", organizationId).eq("library_key", libraryKey);
  const { data } = table === "reading_passages" ? await q.is("test_id", null).maybeSingle() : await q.maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/** Copy one source passage + its questions into the learner's org (answer keys and
 *  all). `library_key` records which template it came from (clone dedupe). */
async function clonePassageInto(
  admin: SupabaseClient,
  actor: ReadingActor,
  source: { id: string; title: string; body: string; module: string; topic: string | null; difficulty: number | null },
  opts: { testId: string | null; orderInTest: number | null },
): Promise<string> {
  const { data: srcQuestions } = await admin
    .from("reading_questions")
    .select(QUESTION_COLUMNS)
    .eq("passage_id", source.id)
    .order("order_index", { ascending: true });

  const { data: newPassage, error: pErr } = await admin
    .from("reading_passages")
    .insert({
      organization_id: actor.organizationId,
      title: source.title,
      body: source.body,
      module: source.module,
      topic: source.topic,
      difficulty: source.difficulty,
      status: "approved",
      source: "ai",
      needs_review: false,
      created_by: actor.userId,
      test_id: opts.testId,
      order_in_test: opts.orderInTest,
      is_library: false,
      library_key: source.id,
    })
    .select("id")
    .single();
  if (pErr || !newPassage) {
    throw new ReadingServiceError(`Failed to copy passage: ${pErr?.message ?? "unknown"}`, "store_failed");
  }

  const rows = (srcQuestions ?? []) as StoredReadingQuestion[];
  if (rows.length > 0) {
    const { error: qErr } = await admin.from("reading_questions").insert(
      rows.map((q) => ({
        passage_id: newPassage.id,
        organization_id: actor.organizationId,
        question_type: q.question_type,
        order_index: q.order_index,
        prompt: q.prompt,
        options: q.options,
        answer_key: q.answer_key,
        supporting_sentence: q.supporting_sentence,
        explanation: q.explanation,
        word_limit: q.word_limit,
        section: q.section,
        note_meta: q.note_meta,
        confidence: q.confidence,
        needs_review: q.needs_review,
        validation_verdict: q.validation_verdict,
        validation_note: q.validation_note,
      })),
    );
    if (qErr) {
      await admin.from("reading_passages").delete().eq("id", newPassage.id);
      throw new ReadingServiceError(`Failed to copy questions: ${qErr.message}`, "store_failed");
    }
  }
  return newPassage.id as string;
}

/** Single passage is served at the exam-realistic ceiling; over-generation above
 *  this only exists to survive validator drops, never to inflate the count. */
const MAX_PASSAGE_QUESTIONS = 15;
/** Below this many confirmed questions a set isn't worth serving — regenerate. */
const MIN_KEPT_QUESTIONS = 4;

/** Keep ONLY validator-confirmed questions — a student is never graded on an
 *  unchecked key (the caller regenerates when too few survive; there is no
 *  fall-back-to-all). Capped at the exam-realistic 15, renumbered from 1. */
function keepValidated(prepared: PreparedQuestion[]): PreparedQuestion[] {
  const kept = prepared.filter((q) => !q.needs_review).slice(0, MAX_PASSAGE_QUESTIONS);
  return kept.map((q, i) => ({ ...q, order_index: i + 1 }));
}

/**
 * Compose a set and keep only confirmed questions. If too few survive (the
 * checker was down, or it rejected most keys), REGENERATE once rather than serve
 * unchecked answer keys; if the retry is also thin, fail the request — grading
 * accuracy is the product (CLAUDE.md), a broken quiz is worse than none.
 */
async function composeValidated(
  input: GenerateReadingInput,
  meta: { organizationId: string; userId: string },
): Promise<{ composed: ComposedReadingSet; kept: PreparedQuestion[] }> {
  let lastKept = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    const composed = await composeReadingSet(input, meta);
    const kept = keepValidated(composed.prepared);
    if (kept.length >= MIN_KEPT_QUESTIONS) return { composed, kept };
    lastKept = kept.length;
    console.warn(
      `[reading.compose] only ${kept.length}/${composed.prepared.length} questions passed validation (attempt ${attempt + 1}/2) — ${attempt === 0 ? "regenerating" : "giving up"}`,
    );
  }
  throw new ReadingServiceError(
    `Reading generation failed: only ${lastKept} questions passed the answer-key check. Please try again.`,
    "generation_failed",
  );
}

// ---- Deterministic code checks (no model call) ------------------------------
// Objective properties of a generated question that code can verify outright —
// the classic AI-generation failures the LLM checker misses: an answer that
// breaks the block's word limit, a "verbatim" proof sentence that isn't in the
// passage, a completion line with no gap to fill, or a key that can't match any
// option. A failed check flags the question exactly like a validator rejection.

const GAP_TYPES: ReadonlySet<ReadingQuestionType> = new Set([
  "sentence_completion",
  "summary_completion",
  "note_completion",
]);
/** The group's exact rubric phrase → the most tokens any accepted answer may
 *  have ("AND/OR A NUMBER" allows one extra token for the number). */
const LIMIT_MAX_TOKENS: Record<string, number> = {
  "ONE WORD ONLY": 1,
  "ONE WORD AND/OR A NUMBER": 2,
  "NO MORE THAN TWO WORDS": 2,
  "NO MORE THAN TWO WORDS AND/OR A NUMBER": 3,
  "NO MORE THAN THREE WORDS": 3,
  "NO MORE THAN THREE WORDS AND/OR A NUMBER": 4,
};
const TF_VERDICTS = new Set(["true", "false", "not given", "ng"]);
const YN_VERDICTS = new Set(["yes", "no", "not given", "ng"]);
const ROMAN_INDEX: Record<string, number> = {
  i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6, viii: 7, ix: 8, x: 9,
  xi: 10, xii: 11, xiii: 12, xiv: 13, xv: 14,
};

/** Every accepted form of a completion key: alternatives the author listed
 *  ("colour/color", "x or y", "a; b"), each with every optional "(...)" group
 *  both included and dropped — the same folding acceptedKeyForms applies. */
function keyAlternatives(key: string): string[] {
  const out: string[] = [];
  for (const alt of splitAlternatives(key)) {
    for (const expanded of expandOptionalParens(alt)) {
      const s = expanded.replace(/\s+/g, " ").trim();
      if (s) out.push(s);
    }
  }
  return out.length ? out : [key];
}

/** Return the first objective defect found in a generated question, or null. */
function codeCheckProblem(q: ReadingQuestionOut, body: string): string | null {
  const answer = (q.answer ?? "").trim();
  if (!answer) return "empty answer key";
  const options = q.options ?? [];

  // Completion-from-the-passage: the prompt must carry a gap, and at least one
  // accepted form of the key must fit the block's stated word limit.
  if (GAP_TYPES.has(q.type) && !(q.type === "summary_completion" && options.length > 0)) {
    if (!READING_GAP_MARKER.test(q.prompt ?? "")) {
      return "completion prompt has no '______' gap marker";
    }
    const maxTokens = LIMIT_MAX_TOKENS[(q.word_limit ?? "").trim().toUpperCase()];
    if (maxTokens !== undefined) {
      const shortest = Math.min(
        ...keyAlternatives(answer).map((a) => norm(a).split(" ").filter(Boolean).length),
      );
      if (shortest > maxTokens) return `answer '${answer}' exceeds the word limit (${q.word_limit})`;
    }
  }

  if (q.type === "true_false_not_given" && !TF_VERDICTS.has(norm(answer))) {
    return `answer '${answer}' is not TRUE/FALSE/NOT GIVEN`;
  }
  if (q.type === "yes_no_not_given" && !YN_VERDICTS.has(norm(answer))) {
    return `answer '${answer}' is not YES/NO/NOT GIVEN`;
  }

  // Matching information: the key is a paragraph letter that must exist as a label.
  if (q.type === "matching_information") {
    const letter = norm(answer);
    if (!/^[a-z]$/.test(letter)) return `answer '${answer}' is not a single paragraph letter`;
    if (!body.includes(`${letter.toUpperCase()})`)) {
      return `paragraph '${letter.toUpperCase()})' is not labelled in the passage`;
    }
  }

  // Option-bank types: the key must resolve to an option (its text, a letter, or
  // a roman numeral index) or the grader can never mark anything correct.
  const optionBankTypes: ReadingQuestionType[] = [
    "multiple_choice",
    "matching_sentence_endings",
    "matching_headings",
    "summary_completion",
  ];
  if (options.length > 0 && optionBankTypes.includes(q.type)) {
    const key = norm(answer);
    let resolvable = options.some((o) => norm(o) === key);
    if (!resolvable && /^[a-z]$/.test(key)) resolvable = key.charCodeAt(0) - 97 < options.length;
    if (!resolvable && key in ROMAN_INDEX) resolvable = ROMAN_INDEX[key] < options.length;
    if (!resolvable) return `answer '${answer}' does not match any option in the bank`;
  }

  // The cited proof must actually be in the passage (punctuation-insensitive).
  const support = (q.supporting_sentence ?? "").trim();
  if (support && !norm(body).includes(norm(support))) {
    return "supporting sentence is not found verbatim in the passage";
  }

  return null;
}

/**
 * Pitch reading content at the learner's level: their measured reading band if we
 * have one, else the target they set, else the default. Read with the service-role
 * client (estimates are server-owned). Rounded to an int and clamped to the band
 * range the generator accepts.
 */
async function resolveReadingTargetBand(actor: ReadingActor): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("skill_estimates")
    .select("current_band, target_band")
    .eq("student_id", actor.userId)
    .eq("organization_id", actor.organizationId)
    .eq("skill", "reading")
    .maybeSingle();
  const raw =
    data?.current_band != null
      ? Number(data.current_band)
      : data?.target_band != null
        ? Number(data.target_band)
        : DEFAULT_TARGET_BAND;
  return clampBand(Math.round(raw));
}

function clampBand(b: number): number {
  return Math.max(MIN_TARGET_BAND, Math.min(MAX_TARGET_BAND, b));
}

/** A shuffled copy (Fisher–Yates) — used to randomise the block order within a
 *  passage so the position is dynamic while the type inventory stays fixed. */
function shuffle<T>(xs: readonly T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- B2C generation defaults ----------------------------------------------

/** Original, non-copyrighted passage material for on-demand generation, organised as
 *  a TAXONOMY (Cambridge-competitive breadth). Effective variety is not the topic
 *  count — it's domains × topics × angles, which turns the same seed into a dozen
 *  distinct passages and stops an active student seeing repeats within weeks. Each
 *  DOMAIN carries the difficulty SLOT(S) it best fits (1 = P1 accessible/concrete,
 *  2 = P2 intermediate, 3 = P3 advanced/abstract), so a full test draws P1/P2/P3
 *  from slot-appropriate, DISTINCT domains with difficulty rising P1→P3. Content is
 *  always original (CLAUDE.md §IP) — this only steers the subject and the lens. */
type ReadingDomain = { label: string; slots: number[]; topics: string[] };
const READING_DOMAINS: Record<string, ReadingDomain> = {
  history_civilisation: {
    label: "History & Civilisation",
    slots: [1, 2],
    topics: [
      "the decipherment of ancient writing systems",
      "the rise and fall of the Hanseatic trading league",
      "the archaeology of the world's earliest cities",
      "how ancient civilisations engineered water and irrigation",
      "the Silk Road and the exchange of goods and ideas",
      "the history of mapmaking and cartography",
      "the domestication of the horse and its impact",
      "the lost libraries of the ancient world",
      "the invention and spread of the calendar",
    ],
  },
  archaeology_anthropology: {
    label: "Archaeology & Anthropology",
    slots: [2, 3],
    topics: [
      "dating methods used to age archaeological finds",
      "underwater and marine archaeology",
      "what ancient teeth and bones reveal about past diets",
      "the peopling of the Pacific islands",
      "prehistoric rock art and its possible meanings",
      "how the study of ancient DNA is rewriting prehistory",
      "why some past societies collapsed while others endured",
    ],
  },
  life_sciences_biology: {
    label: "Life Sciences & Biology",
    slots: [1, 2],
    topics: [
      "whether animals experience emotions",
      "the biology of human ageing",
      "the science of sleep and why we need it",
      "regeneration and healing in the animal kingdom",
      "the human microbiome and its influence on health",
      "how cells communicate with one another",
      "symbiotic partnerships in the natural world",
    ],
  },
  animal_behaviour_wildlife: {
    label: "Animal Behaviour & Wildlife",
    slots: [1],
    topics: [
      "why zebras have stripes",
      "how honeybees make collective decisions",
      "animal migration and the science of navigation",
      "the intelligence of octopuses",
      "birdsong and the functions it serves",
      "the complex social lives of elephants",
      "insect architecture, from termite mounds to nests",
      "tool use among animals",
    ],
  },
  plants_botany: {
    label: "Plants & Botany",
    slots: [1, 2],
    topics: [
      "how plants communicate and defend themselves",
      "the hidden underground world of fungi",
      "the strategies plants use to disperse their seeds",
      "the domestication of wheat and other crops",
      "carnivorous plants and how they trap prey",
      "what ancient trees record about the past",
      "the partnership between flowers and pollinators",
    ],
  },
  physical_sciences: {
    label: "Physical Sciences",
    slots: [2, 3],
    topics: [
      "the surprising physics of bubbles and foams",
      "the materials science and history of glass",
      "the science of colour and how we see it",
      "the physics of sound and acoustics",
      "nanotechnology and its applications",
      "the unusual properties of water",
      "how new materials are designed and tested",
    ],
  },
  earth_sciences_geology: {
    label: "Earth Sciences & Geology",
    slots: [2],
    topics: [
      "how volcanoes form and how they are monitored",
      "what ice cores reveal about ancient climates",
      "the movement of tectonic plates",
      "the slow formation of caves",
      "the exploration of the deep ocean floor",
      "earthquakes and the challenge of prediction",
      "underground aquifers and the water cycle",
    ],
  },
  space_astronomy: {
    label: "Space & Astronomy",
    slots: [2, 3],
    topics: [
      "the search for planets beyond our solar system",
      "asteroids, and plans to mine and deflect them",
      "the history and evolution of the telescope",
      "how astronomers map the universe",
      "the growing problem of space debris",
      "the science behind eclipses",
      "the search for life beyond Earth",
    ],
  },
  climate_environment: {
    label: "Climate & Environment",
    slots: [2],
    topics: [
      "the debate over rewilding wild landscapes",
      "the environmental cost of fast fashion",
      "how growing cities secure their water supply",
      "the race to develop alternatives to plastic",
      "capturing and storing carbon",
      "the restoration of damaged coral reefs",
      "the ecology and value of wetlands",
      "the causes and spread of desertification",
    ],
  },
  psychology_cognition: {
    label: "Psychology & Cognition",
    slots: [2, 3],
    topics: [
      "the psychology of everyday decision-making",
      "the science of memory and why we forget",
      "how habits form and how they can be broken",
      "why people procrastinate",
      "the psychology of queuing and waiting",
      "how creativity works in the brain",
      "the bystander effect and helping behaviour",
      "how children's thinking develops",
    ],
  },
  language_linguistics: {
    label: "Language & Linguistics",
    slots: [2, 3],
    topics: [
      "how and why languages change over time",
      "the loss of the world's endangered languages",
      "how children acquire their first language",
      "the origins of writing systems",
      "the structure of sign languages",
      "the progress and limits of machine translation",
      "how bilingualism affects the brain",
    ],
  },
  society_culture: {
    label: "Society & Culture",
    slots: [2],
    topics: [
      "why some cities flourish while others decline",
      "the cultural history of the colour blue",
      "the anthropology of food taboos",
      "the history of leisure and the holiday",
      "ageing populations and demographic change",
      "the history and purpose of public parks",
      "the origins of festivals and celebrations",
    ],
  },
  technology_engineering: {
    label: "Technology & Engineering",
    slots: [2, 3],
    topics: [
      "how the shipping container transformed global trade",
      "the surprisingly complex history of the bicycle",
      "the engineering behind long-span bridges",
      "the design of the London Underground map",
      "the humble pencil and how it is made",
      "robotics on the factory floor",
      "the engineering challenges of skyscrapers",
      "the history and impact of refrigeration",
    ],
  },
  computing_ai: {
    label: "Computing & AI",
    slots: [3],
    topics: [
      "the ethics of facial-recognition technology",
      "how algorithms shape what we read online",
      "the early history of computing",
      "how machine learning actually works",
      "data privacy in a connected world",
      "the promise and risks of artificial intelligence",
      "the digital divide between and within nations",
    ],
  },
  economics_business: {
    label: "Economics & Business",
    slots: [2, 3],
    topics: [
      "the economics of the global coffee trade",
      "the gig economy and the future of work",
      "insights from behavioural economics",
      "whether wealth actually makes people happier",
      "globalisation and modern supply chains",
      "the history and future of money",
      "why some companies keep innovating",
      "the rise of the sharing economy",
    ],
  },
  health_medicine: {
    label: "Health & Medicine",
    slots: [2],
    topics: [
      "what nutrition science really knows about diet",
      "the global rise of short-sightedness",
      "vaccines and the history of public health",
      "the placebo effect and the mind's role in healing",
      "the growing threat of antibiotic resistance",
      "the history of surgery",
      "how sleep shapes physical and mental health",
    ],
  },
  education_learning: {
    label: "Education & Learning",
    slots: [2],
    topics: [
      "the debate over how children best learn to read",
      "what makes learning a second language easier or harder",
      "the science of acquiring a complex skill",
      "the history and role of the university",
      "the importance of play in childhood development",
      "memory techniques and how they work",
      "the uses and limits of testing",
    ],
  },
  arts_design_music: {
    label: "Arts, Design & Music",
    slots: [1, 2],
    topics: [
      "why humans across all cultures make art",
      "the science and history of musical tuning",
      "how architectural styles rise and fade",
      "the psychology of colour in design",
      "the invention and spread of photography",
      "typography and the science of readability",
      "the delicate work of restoring old paintings",
      "the history of animation",
    ],
  },
  food_agriculture: {
    label: "Food & Agriculture",
    slots: [1, 2],
    topics: [
      "how a single crop like the potato reshaped the world",
      "the science of fermentation",
      "vertical farming and the future of food",
      "the history of the global spice trade",
      "how food was preserved before refrigeration",
      "the domestication of the chicken",
      "the journey of chocolate from bean to bar",
    ],
  },
  exploration_geography: {
    label: "Exploration & Geography",
    slots: [1],
    topics: [
      "the lost art of navigating by the stars",
      "the history of polar exploration",
      "the centuries-long effort to map the oceans",
      "how the height of mountains is measured",
      "the search for a way to measure longitude",
      "the exploration of the world's deepest caves",
      "how places get their names",
    ],
  },
};

/** The ANGLE is the main multiplier: the same topic seen through two different lenses
 *  yields two unrelated passages. One angle is drawn per passage and handed to the
 *  generator as the REQUIRED framing (a mechanism explainer vs a history vs a debate
 *  vs a single study…), so repeats of a subject still read as brand-new passages. */
const READING_ANGLES: string[] = [
  "trace how it developed over time, as a chronological account",
  "explain the underlying mechanism — how it actually works",
  "weigh the competing viewpoints and the debate around it",
  "examine its economic dimension — costs, trade, industry, incentives",
  "tell it through a key figure, discovery, or turning point",
  "build it around one specific research study — its method and findings",
  "foreground its environmental or sustainability dimension",
  "compare how different societies or cultures approach it",
  "look at where it is heading — emerging methods, technology, trends",
  "set two approaches or eras against each other (old versus new)",
];

/** A brief for one passage: the subject and the lens to frame it through. */
type PassageBrief = { domain: string; topic: string; angle: string };

/** Domain keys whose difficulty slots include this passage position (1/2/3). */
function domainsForSlot(slot: number): string[] {
  return Object.keys(READING_DOMAINS).filter((k) => READING_DOMAINS[k].slots.includes(slot));
}

/** One brief per passage P1→P3, each from a DISTINCT domain eligible for that
 *  difficulty slot — so the three passages span three subjects and rise in
 *  difficulty. Falls back to any unused domain if a slot's pool is exhausted. */
function pickFullTestTopics(): PassageBrief[] {
  const used = new Set<string>();
  const briefs: PassageBrief[] = [];
  for (const slot of [1, 2, 3]) {
    let pool = domainsForSlot(slot).filter((d) => !used.has(d));
    if (pool.length === 0) pool = Object.keys(READING_DOMAINS).filter((d) => !used.has(d));
    if (pool.length === 0) pool = Object.keys(READING_DOMAINS);
    const domain = pickRandom(pool);
    used.add(domain);
    briefs.push({
      domain,
      topic: pickRandom(READING_DOMAINS[domain].topics),
      angle: pickRandom(READING_ANGLES),
    });
  }
  return briefs;
}

/** One brief (domain, topic, angle) for a single quick-practice passage. */
function pickSingleTopic(): PassageBrief {
  const domain = pickRandom(Object.keys(READING_DOMAINS));
  return {
    domain,
    topic: pickRandom(READING_DOMAINS[domain].topics),
    angle: pickRandom(READING_ANGLES),
  };
}

/** Reliable question-type mixes (one is chosen at random for variety). Each mirrors
 *  a real Cambridge part: a completion/notes block + a verdict block + one more. */
// One set carries matching_information (the lettered-paragraph A–G task), so a
// single practice draws it ~1 in 4 — "sometimes, not always", like the full test.
const READING_TYPE_SETS: ReadingQuestionType[][] = [
  ["matching_information", "true_false_not_given", "multiple_choice"],
  ["true_false_not_given", "sentence_completion", "summary_completion"],
  ["yes_no_not_given", "multiple_choice", "matching_sentence_endings"],
  ["yes_no_not_given", "sentence_completion", "note_completion"],
];

function defaultReadingSpec(targetBand: number = DEFAULT_TARGET_BAND) {
  const brief = pickSingleTopic();
  return {
    module: "academic" as const,
    topic: brief.topic,
    angle: brief.angle,
    targetBand,
    questionTypes: pickRandom(READING_TYPE_SETS),
    // A real IELTS passage section runs 13–14 questions; we serve 13–15. Request a
    // few EXTRA (16–18) so that after the answer-key validator drops any it can't
    // confirm, ~13–15 still survive — keepValidated caps the kept set back to 15.
    // (Earlier this requested 13–15 with no headroom, so drops left passages as
    // light as 9.)
    totalQuestions: 16 + Math.floor(Math.random() * 3),
  };
}

function pickRandom<T>(xs: readonly T[]): T {
  return xs[Math.floor(Math.random() * xs.length)];
}

// ---- Review ----------------------------------------------------------------

/** Teacher/admin approves or rejects a generated passage (and thereby its
 *  questions). Approval is what makes the passage visible to students. */
export async function reviewReadingPassage(
  passageId: string,
  rawDecision: ReviewDecision,
  actor: ReadingActor,
): Promise<StoredReadingPassage> {
  if (!CAN_AUTHOR.includes(actor.role)) {
    throw new ReadingServiceError("Only a teacher or center admin can review reading.", "forbidden");
  }
  const decision = parse(reviewDecisionSchema, rawDecision);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_passages")
    .update({ status: decision, reviewed_by: actor.userId, reviewed_at: new Date().toISOString() })
    .eq("id", passageId)
    .eq("organization_id", actor.organizationId)
    .select(PASSAGE_COLUMNS)
    .maybeSingle();
  if (error) throw new ReadingServiceError(`Review failed: ${error.message}`, "store_failed");
  if (!data) throw new ReadingServiceError("Passage not found.", "not_found");
  return data as StoredReadingPassage;
}

// ---- Helpers ---------------------------------------------------------------

function parse<T>(schema: { parse: (v: unknown) => T }, value: unknown): T {
  try {
    return schema.parse(value);
  } catch (err) {
    throw new ReadingServiceError(`Invalid input: ${msg(err)}`, "invalid_input");
  }
}

/** Strip an optional ```json fence and parse. JSON mode usually returns clean
 *  JSON, but be defensive. */
function parseJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  return JSON.parse(trimmed);
}

function msg(err: unknown): string {
  if (err instanceof Error) {
    const e = err as Error & {
      cause?: unknown;
      status?: number;
      response?: { data?: unknown };
    };
    const parts: string[] = [];
    if (e.name && e.name !== "Error") parts.push(e.name);
    if (e.message) parts.push(e.message);
    if (e.status) parts.push(`status=${e.status}`);
    if (e.response?.data) parts.push(`data=${JSON.stringify(e.response.data).slice(0, 400)}`);
    if (e.cause) {
      const c = e.cause as { message?: string };
      parts.push(`cause=${c?.message ?? String(e.cause)}`);
    }
    return parts.join(" | ") || e.stack?.split("\n")[0] || "unknown error";
  }
  return String(err) || "unknown error";
}
