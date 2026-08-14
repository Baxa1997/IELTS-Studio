/**
 * Turning what a learner typed into something comparable.
 *
 * Almost every "it marked me wrong" complaint is born here rather than in any
 * model: a trailing full stop, a curly apostrophe pasted from Word, `don't` for
 * `do not`, `colour` for `color`. None of those are the thing being taught, and
 * marking them wrong teaches the learner to distrust the marking.
 *
 * THE APPROACH: variants, not a single canonical form. `he's` genuinely means
 * either `he is` or `he has`, and collapsing it to one of them marks the other
 * wrong. So every answer expands to the SET of forms it could be, and two
 * answers match when their sets intersect. Ambiguity is preserved instead of
 * being resolved by a coin toss.
 *
 * Pure and isomorphic — the browser runner and the server both mark with this,
 * and they must never disagree about whether an answer was right.
 */

/* ── contractions ──────────────────────────────────────────────────────────── */

/**
 * Each contraction maps to EVERY expansion it can have. `she'd` is "she would"
 * or "she had"; both are produced, so whichever the answer key used, it matches.
 */
const CONTRACTIONS: Record<string, string[]> = {
  "i'm": ["i am"],
  "i've": ["i have"],
  "i'll": ["i will"],
  "i'd": ["i would", "i had"],
  "you're": ["you are"],
  "you've": ["you have"],
  "you'll": ["you will"],
  "you'd": ["you would", "you had"],
  "he's": ["he is", "he has"],
  "he'll": ["he will"],
  "he'd": ["he would", "he had"],
  "she's": ["she is", "she has"],
  "she'll": ["she will"],
  "she'd": ["she would", "she had"],
  "it's": ["it is", "it has"],
  "it'll": ["it will"],
  "we're": ["we are"],
  "we've": ["we have"],
  "we'll": ["we will"],
  "we'd": ["we would", "we had"],
  "they're": ["they are"],
  "they've": ["they have"],
  "they'll": ["they will"],
  "they'd": ["they would", "they had"],
  "that's": ["that is", "that has"],
  "there's": ["there is", "there has"],
  "who's": ["who is", "who has"],
  "what's": ["what is"],
  "let's": ["let us"],
  "don't": ["do not"],
  "doesn't": ["does not"],
  "didn't": ["did not"],
  "isn't": ["is not"],
  "aren't": ["are not"],
  "wasn't": ["was not"],
  "weren't": ["were not"],
  "haven't": ["have not"],
  "hasn't": ["has not"],
  "hadn't": ["had not"],
  "won't": ["will not"],
  "wouldn't": ["would not"],
  "can't": ["cannot", "can not"],
  "cannot": ["can not"],
  "couldn't": ["could not"],
  "shouldn't": ["should not"],
  "mustn't": ["must not"],
  "needn't": ["need not"],
  "shan't": ["shall not"],
};

/* ── spelling conventions ──────────────────────────────────────────────────── */

/**
 * British ↔ American pairs, as a WORD LIST rather than suffix rules.
 *
 * Rules are tempting and wrong: `-our → -or` turns "four" into "for", and
 * `-ise → -ize` turns "advise" into "advize". A curated list of the words that
 * actually come up in English teaching is boring, safe, and finite.
 */
const SPELLING_PAIRS: [string, string][] = [
  ["colour", "color"], ["colours", "colors"], ["coloured", "colored"],
  ["favour", "favor"], ["favourite", "favorite"], ["behaviour", "behavior"],
  ["neighbour", "neighbor"], ["neighbours", "neighbors"], ["labour", "labor"],
  ["honour", "honor"], ["humour", "humor"], ["flavour", "flavor"],
  ["organise", "organize"], ["organised", "organized"], ["organising", "organizing"],
  ["realise", "realize"], ["realised", "realized"], ["recognise", "recognize"],
  ["recognised", "recognized"], ["apologise", "apologize"], ["analyse", "analyze"],
  ["criticise", "criticize"], ["memorise", "memorize"], ["specialise", "specialize"],
  ["centre", "center"], ["centres", "centers"], ["theatre", "theater"],
  ["metre", "meter"], ["metres", "meters"], ["litre", "liter"], ["litres", "liters"],
  ["travelling", "traveling"], ["travelled", "traveled"], ["traveller", "traveler"],
  ["cancelled", "canceled"], ["cancelling", "canceling"], ["modelling", "modeling"],
  ["defence", "defense"], ["licence", "license"], ["practise", "practice"],
  ["programme", "program"], ["programmes", "programs"],
  ["grey", "gray"], ["jewellery", "jewelry"], ["storey", "story"],
  ["enrol", "enroll"], ["fulfil", "fulfill"], ["skilful", "skillful"],
];

const TO_US = new Map<string, string>();
for (const [gb, us] of SPELLING_PAIRS) TO_US.set(gb, us);

/* ── base cleanup ──────────────────────────────────────────────────────────── */

/** Everything that is never meaningful: case, spacing, quote glyphs, end stops. */
function baseClean(raw: string): string {
  return raw
    .normalize("NFKC")
    // Curly quotes, prime marks and the Word autocorrect apostrophe all become
    // the plain one — a learner who typed on a phone must not lose a mark.
    .replace(/[‘’ʼ′]/g, "'")
    .replace(/[“”]/g, '"')
    // Any dash-like character is a hyphen.
    .replace(/[‐-―]/g, "-")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    // Sentence-final punctuation carries no information in a gap.
    .replace(/[.!?;:,]+$/g, "")
    .trim();
}

/** Word-level canonicalisation: spelling convention only. */
function canonicaliseWords(s: string): string {
  return s
    .split(" ")
    .map((w) => {
      // Keep any punctuation clinging to the word out of the lookup.
      const m = /^([^a-z']*)([a-z']+)(.*)$/.exec(w);
      if (!m) return w;
      const [, pre, core, post] = m;
      return `${pre}${TO_US.get(core) ?? core}${post}`;
    })
    .join(" ");
}

/** Expand every contraction in a string, branching where one is ambiguous. */
function expandContractions(s: string): string[] {
  const words = s.split(" ");
  let forms: string[][] = [[]];

  for (const word of words) {
    const m = /^([^a-z']*)([a-z']+)(.*)$/.exec(word);
    const core = m?.[2];
    const options = core ? CONTRACTIONS[core] : undefined;
    if (!options || !m) {
      forms = forms.map((f) => [...f, word]);
      continue;
    }
    const [, pre, , post] = m;
    // Branch: keep the contracted form too, in case the key is contracted.
    const branches = [core, ...options];
    const next: string[][] = [];
    for (const f of forms) for (const b of branches) next.push([...f, `${pre}${b}${post}`]);
    forms = next;
    // A sentence full of contractions must not explode combinatorially.
    if (forms.length > 24) forms = forms.slice(0, 24);
  }

  return forms.map((f) => f.join(" "));
}

/* ── the public surface ────────────────────────────────────────────────────── */

export interface NormalizeOptions {
  /**
   * Off by default. Turn it on when the SPELLING or the CONTRACTION is the
   * thing being taught — then `colour` and `color` stop being the same answer,
   * which is the whole point of that exercise.
   */
  strict?: boolean;
}

/**
 * Every form an answer could reasonably be written in.
 *
 * Always contains at least the cleaned original, so an unrecognised answer
 * still compares as itself.
 */
export function normalizeVariants(raw: string, opts: NormalizeOptions = {}): Set<string> {
  const cleaned = baseClean(raw ?? "");
  if (!cleaned) return new Set();
  if (opts.strict) return new Set([cleaned]);

  const out = new Set<string>([cleaned]);
  for (const expanded of expandContractions(cleaned)) {
    out.add(expanded);
    out.add(canonicaliseWords(expanded));
  }
  out.add(canonicaliseWords(cleaned));
  return out;
}

/** True when the learner's answer is one of the accepted ones. */
export function matchesAny(
  given: string,
  accepted: readonly string[],
  opts: NormalizeOptions = {},
): boolean {
  const mine = normalizeVariants(given, opts);
  if (mine.size === 0) return false;
  for (const answer of accepted) {
    for (const form of normalizeVariants(answer, opts)) {
      if (mine.has(form)) return true;
    }
  }
  return false;
}

/** The answer as it will be SHOWN when the learner got it wrong. Not
 *  normalised — they should see the key as a human wrote it. */
export function displayAnswer(accepted: readonly string[]): string {
  return accepted[0] ?? "";
}
