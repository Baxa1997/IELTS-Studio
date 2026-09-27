/** Why each listening trap works, in the learner's language (ids from the
 *  engine's listening spec — P1 audio traps + P4 note-paraphrase mechanisms).
 *  Shared between the in-test review panel and the results/feedback pages. */
export const TRAP_EXPLAIN: Record<string, string> = {
  "wrong-spelling-offer":
    "A plausible spelling was offered first — the correct one was then spelled out letter by letter.",
  "habitual-vs-today":
    "The speaker first described what usually happens; the answer is what applies this time.",
  "condition-before-answer":
    "A vague general statement came first — the specific value followed it.",
  "self-correction": "A value was given, then corrected. Only the amended one counts.",
  "implied-positive-actual-negative":
    "The question implied agreement, but the speaker disagreed — the answer sat in the contrast.",
  "enough-of-x-want-y": "A near-alternative was rejected just before the real answer.",
  "impressive-x-favourite-y":
    "Several options were mentioned — a superlative singled out the right one.",
  "negation-compression":
    "The notes compress a negative statement from the lecture into a short positive phrase.",
  comparative:
    "The notes shorten a comparison the lecturer made — the wording differs, the gap word doesn't.",
  nominalisation:
    "The notes turn the lecturer's verb phrase into a noun phrase around the same gap word.",
  "plausible-not-stated":
    "The wrong option sounded likely from the context — but it was never actually said.",
  "different-subject": "The wrong option's words WERE heard — attached to a different subject.",
  "refute-then-state":
    "The first suggestion was knocked down; the real point came straight after it.",
  "return-to-first": "Other options were rejected and the speakers came back to the first one.",
  "counter-then-agree":
    "A late counter-proposal was confirmed by the other speaker — agreement seals the answer.",
  "answer-in-other-mouth":
    "The answer word was suggested by the OTHER speaker and only confirmed — track who says what.",
  "decoy-number": "A competing wrong figure was spoken nearby — the correct one superseded it.",
  "tier-decoy":
    "An attractive feature of the REJECTED alternative was mentioned just before the real answer.",
  contrast:
    "The answer sat inside a correction or contrast — the first half of the sentence pointed the wrong way.",
  "decoy-figure":
    "Other numbers were spoken in the same breath — the notes ask about a different one.",
  "answer-before-cue":
    "The answer was spoken BEFORE the words the notes use as a cue — waiting for the cue means missing it.",
  "false-lead":
    "A plausible alternative was floated first, then corrected — only the correction counts.",
};

/** One graded question as stored in listening_attempts.result.results[]. */
export type StoredQResult = {
  q: number;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
  kind: string;
  trap: string | null;
};

/** The grading payload stored in listening_attempts.result. */
export type StoredResult = {
  part: number;
  kind?: "test";
  score: number;
  max_score: number;
  band?: number | null;
  topic?: string;
  parts?: { part: number; score: number; max_score: number }[];
  results: StoredQResult[];
  transcript: { speaker: string; text: string }[];
};
