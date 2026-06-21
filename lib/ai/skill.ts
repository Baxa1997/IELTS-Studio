import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Ajv } from "ajv";

import { GradeValidationError, type EssayTaskType, type Grade } from "./schema";

/**
 * Loads the `ielts-examiner` skill — the single source of truth for grading
 * (CLAUDE.md §4). The runtime never re-implements the rubric; it reads the
 * skill's rubric, error taxonomy, grading procedure and canonical output schema
 * from disk and assembles the grading prompt from them.
 *
 * Files are read once and cached in module scope (they don't change at runtime).
 * They live under `.claude/skills/ielts-examiner` and are shipped with the
 * server bundle via `outputFileTracingIncludes` in next.config.
 */
const SKILL_DIR = join(process.cwd(), ".claude", "skills", "ielts-examiner");

/** Validates a parsed object against the canonical output-schema.json. */
export type ValidateGrade = (value: unknown) => { valid: boolean; errors: string[] };

export interface GradingSkill {
  /** The grading procedure, verbatim from SKILL.md. */
  procedure: string;
  /** The Task 2 band descriptors the model must score against. */
  rubric: string;
  /** The Academic Task 1 band descriptors (data-description criteria). */
  rubricTask1Academic: string;
  /** The General Training Task 1 band descriptors (letter: purpose, bullet
   *  coverage, tone/register). */
  rubricTask1General: string;
  /** The faults that cap each criterion. */
  errorTaxonomy: string;
  /** CEFR mapping + lexical-frequency calibration — a corroboration layer that must
   *  agree with the descriptors, never override them (used to sanity-check a band). */
  cefrVocabulary: string;
  /** Non-affiliation disclaimer, attached by the runtime (not model-generated). */
  disclaimer: string;
  /** Gate for the model's reply, compiled from output-schema.json. */
  validate: ValidateGrade;
  /** The band descriptors for a given task type (Task 1 Academic differs from the
   *  Task 2 / Task 1 letter descriptors — never grade Task 1 charts on Task 2
   *  rules; CLAUDE.md grading-accuracy principle). */
  rubricFor(taskType: EssayTaskType): string;
}

let cached: GradingSkill | null = null;

export async function loadGradingSkill(): Promise<GradingSkill> {
  if (cached) return cached;

  const [skillMd, rubric, rubricTask1Academic, rubricTask1General, errorTaxonomy, cefrVocabulary, schemaRaw] =
    await Promise.all([
      readFile(join(SKILL_DIR, "SKILL.md"), "utf8"),
      readFile(join(SKILL_DIR, "references", "writing-task2-rubric.md"), "utf8"),
      readFile(join(SKILL_DIR, "references", "writing-task1-academic-rubric.md"), "utf8"),
      readFile(join(SKILL_DIR, "references", "writing-task1-general-rubric.md"), "utf8"),
      readFile(join(SKILL_DIR, "references", "error-taxonomy.md"), "utf8"),
      readFile(join(SKILL_DIR, "references", "cefr-and-vocabulary.md"), "utf8"),
      readFile(join(SKILL_DIR, "assets", "output-schema.json"), "utf8"),
    ]);

  const schema = JSON.parse(schemaRaw) as { disclaimer?: string };

  cached = {
    procedure: extractSection(skillMd, "## Grading procedure"),
    rubric,
    rubricTask1Academic,
    rubricTask1General,
    errorTaxonomy,
    cefrVocabulary,
    disclaimer: schema.disclaimer ?? "",
    validate: buildValidator(schema),
    // Each Task 1 mode has its own descriptors and must never be scored on another
    // table: Academic Task 1 = data description; General Training Task 1 = a letter
    // (purpose, bullet coverage, tone/register). Task 2 uses the Task 2 table.
    rubricFor(taskType) {
      if (taskType === "task1_academic") return rubricTask1Academic;
      if (taskType === "task1_general") return rubricTask1General;
      return rubric;
    },
  };
  return cached;
}

/**
 * Parse + validate a raw model reply into a {@link Grade}, against the skill's
 * canonical schema. Tolerates a ```json … ``` fence. Throws
 * {@link GradeValidationError} on anything malformed or out-of-schema so the
 * service can repair once, then reject.
 */
export function parseGradeOutput(raw: string, validate: ValidateGrade): Grade {
  const cleaned = stripCodeFence(raw);

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    throw new GradeValidationError("Grading reply was not valid JSON.", raw);
  }

  const { valid, errors } = validate(json);
  if (!valid) {
    throw new GradeValidationError(
      `Grading reply did not match output-schema.json: ${errors.join("; ")}`,
      raw,
    );
  }
  return json as Grade;
}

// ---- internals -------------------------------------------------------------

function buildValidator(schema: object): ValidateGrade {
  // strict:false so the schema's custom `disclaimer` annotation keyword is
  // tolerated; data validation (additionalProperties, multipleOf, $ref) is
  // unaffected.
  const ajv = new Ajv({ allErrors: true, strict: false });
  const fn = ajv.compile(schema);
  return (value) => {
    const valid = fn(value) === true;
    const errors = valid
      ? []
      : (fn.errors ?? []).map((e) => `${e.instancePath || "(root)"} ${e.message ?? ""}`.trim());
    return { valid, errors };
  };
}

/** Slice a "## Heading" section out of a markdown doc, up to the next "## ". */
function extractSection(md: string, heading: string): string {
  const lines = md.split("\n");
  const start = lines.findIndex((l) => l.trimStart().startsWith(heading));
  if (start === -1) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fence ? fence[1] : trimmed;
}
