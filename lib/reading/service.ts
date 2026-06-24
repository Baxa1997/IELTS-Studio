import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AppRole } from "@/lib/auth";
import { generate } from "@/lib/ai";
import { CEFR, cefrToBand, type CefrLevel } from "@/lib/cefr/levels";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import {
  CONFIDENCE_THRESHOLD,
  DEFAULT_TARGET_BAND,
  FULL_TEST_PASSAGE_COUNT,
  FULL_TEST_QUESTION_SPLIT,
  FULL_TEST_TYPE_SETS,
  generateReadingInputSchema,
  MAX_TARGET_BAND,
  MIN_TARGET_BAND,
  readingSetOutputSchema,
  readingValidationOutputSchema,
  reviewDecisionSchema,
  type GeneratedReadingSet,
  type GeneratedReadingTest,
  type GenerateReadingInput,
  type ReadingModule,
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
  "id, question_type, order_index, prompt, options, answer_key, supporting_sentence, explanation, confidence, needs_review, validation_verdict, validation_note";
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
  /** CEFR track only (A1..C2); null for IELTS-band passages. */
  cefrLevel: string | null;
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
  // 1) Generate the passage + questions.
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
        ...(input.cefrLevel ? { cefr_level: input.cefrLevel } : {}),
        ...(input.passageWords ? { passage_words: input.passageWords } : {}),
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
    const needsReview =
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

    return {
      question_type: q.type,
      order_index: q.number ?? i + 1,
      prompt: q.prompt,
      options: q.options ?? null,
      answer_key: q.answer,
      supporting_sentence: q.supporting_sentence,
      explanation: q.explanation,
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
    cefrLevel: input.cefrLevel ?? null,
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
      // Only set on the CEFR track. Omitted for IELTS so the insert never references
      // the cefr_level column on the IELTS path (forward-compatible if the column
      // hasn't been migrated yet — only CEFR reading needs it).
      ...(composed.cefrLevel ? { cefr_level: composed.cefrLevel } : {}),
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
  const composed = await composeReadingSet(input, {
    organizationId: actor.organizationId,
    userId: actor.userId,
  });
  const kept = keepValidated(composed.prepared);
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
 * Distinct CEFR track: generate ONE shorter, level-graded reading passage (A1–C2)
 * + a few comprehension questions, pitched at the chosen CEFR level, and store it
 * already-approved (auto-served like the IELTS B2C path). It rides the SAME
 * compose → answer-key-check → store pipeline (accuracy is the moat), but the
 * passage is shorter so the two model calls fit the serverless window, and it
 * carries a cefr_level so the result is reported as a CEFR level, not a band.
 */
export async function generateCefrReadingForStudent(
  actor: ReadingActor,
  level: CefrLevel,
): Promise<GeneratedReadingSet> {
  const input = parse(generateReadingInputSchema, {
    module: "academic",
    topic: pickRandom(READING_TOPICS),
    targetBand: clampBand(cefrToBand(level)),
    // A CEFR-friendly mix that's answerable from a short text at the level.
    questionTypes: ["true_false_not_given", "multiple_choice", "sentence_completion"],
    totalQuestions: 6,
    cefrLevel: level,
    passageWords: CEFR[level].readingWords,
  });
  const composed = await composeReadingSet(input, {
    organizationId: actor.organizationId,
    userId: actor.userId,
  });
  const kept = keepValidated(composed.prepared);
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
  const topics = pickDistinct(READING_TOPICS, FULL_TEST_PASSAGE_COUNT);
  const composedSets = await Promise.all(
    Array.from({ length: FULL_TEST_PASSAGE_COUNT }, (_, i) => {
      const band = clampBand(p.centerBand + (i - 1)); // P1 easier → P3 harder
      const input = parse(generateReadingInputSchema, {
        module: "academic",
        topic: topics[i],
        targetBand: band,
        questionTypes: FULL_TEST_TYPE_SETS[i],
        totalQuestions: FULL_TEST_QUESTION_SPLIT[i],
      });
      return composeReadingSet(input, p.meta);
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
      const kept = keepValidated(composedSets[i].prepared);
      passages.push(
        await storeReadingSet(
          admin,
          { organizationId: p.storageOrgId, createdBy: p.createdBy },
          composedSets[i],
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
  const composed = await composeReadingSet(input, LIBRARY_SEED_META);
  const kept = keepValidated(composed.prepared);
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

/** Keep validator-confirmed questions; fall back to all if too few survive (a short
 *  quiz beats an empty one). Renumber so order_index stays contiguous from 1. */
/** Single passage is served at the exam-realistic ceiling; over-generation above
 *  this only exists to survive validator drops, never to inflate the count. */
const MAX_PASSAGE_QUESTIONS = 15;

function keepValidated(prepared: PreparedQuestion[]): PreparedQuestion[] {
  let kept = prepared.filter((q) => !q.needs_review);
  if (kept.length < 4) kept = prepared;
  if (kept.length > MAX_PASSAGE_QUESTIONS) kept = kept.slice(0, MAX_PASSAGE_QUESTIONS);
  return kept.map((q, i) => ({ ...q, order_index: i + 1 }));
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

/** Distinct random pick (no repeated topic within one test). */
function pickDistinct<T>(xs: readonly T[], n: number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

// ---- B2C generation defaults ----------------------------------------------

/** Original, non-copyrighted passage topics for on-demand generation. */
const READING_TOPICS = [
  "urban beekeeping",
  "the history of cartography",
  "coral-reef restoration",
  "the science of sleep",
  "ancient Roman concrete",
  "how migratory birds navigate",
  "vertical farming",
  "deep-sea bioluminescence",
  "the invention of the printing press",
  "storing renewable energy",
  "the domestication of wild plants",
  "the ecology of mangroves",
  "how vaccines are developed",
  "the engineering of long-span bridges",
] as const;

/** Reliable question-type mixes (one is chosen at random for variety). */
const READING_TYPE_SETS: ReadingQuestionType[][] = [
  ["true_false_not_given", "multiple_choice", "sentence_completion"],
  ["true_false_not_given", "matching_information", "summary_completion"],
  ["yes_no_not_given", "multiple_choice", "sentence_completion"],
  ["matching_headings", "true_false_not_given", "multiple_choice"],
];

function defaultReadingSpec(targetBand: number = DEFAULT_TARGET_BAND) {
  return {
    module: "academic" as const,
    topic: pickRandom(READING_TOPICS),
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
