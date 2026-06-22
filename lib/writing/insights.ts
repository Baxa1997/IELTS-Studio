/**
 * Deterministic, model-free writing insights — the structural "at a glance" metrics
 * the big public graders (writing9, Engnovate) show alongside the band: word count,
 * sentence/paragraph counts, linking-word usage, and over-repeated words.
 *
 * These are computed straight from the essay text on the client (no AI call, no
 * cost): they're objective surface features, NOT band judgements. The band and the
 * per-criterion reasoning still come only from the grader (CLAUDE.md §4). Pure
 * functions, no imports, no "use client" — usable from server or client.
 */

export interface RepeatedWord {
  word: string;
  count: number;
}

export interface WritingInsights {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  /** Mean words per sentence, rounded. */
  avgSentenceLength: number;
  /** Word count of the longest sentence (flags run-ons). */
  longestSentence: number;
  /** Total linking-word/connective occurrences. */
  linkingTotal: number;
  /** Distinct connectives used (variety matters more than volume). */
  linkingUnique: number;
  /** The connectives actually used, lower-cased, in first-seen order. */
  linkingUsed: string[];
  /** Content words used 4+ times — candidates for synonym variation. */
  repeated: RepeatedWord[];
}

// Standard discourse markers an IELTS essay is expected to deploy. Multi-word
// phrases are matched first so "in addition" isn't double-counted as "addition".
const LINKERS: string[] = [
  "on the other hand",
  "in addition",
  "for example",
  "for instance",
  "as a result",
  "in conclusion",
  "to sum up",
  "in contrast",
  "by contrast",
  "in particular",
  "in other words",
  "as well as",
  "due to",
  "in fact",
  "to conclude",
  "first of all",
  "however",
  "therefore",
  "moreover",
  "furthermore",
  "additionally",
  "consequently",
  "nevertheless",
  "nonetheless",
  "meanwhile",
  "similarly",
  "likewise",
  "whereas",
  "although",
  "though",
  "despite",
  "because",
  "since",
  "thus",
  "hence",
  "overall",
  "firstly",
  "secondly",
  "thirdly",
  "finally",
  "instead",
  "besides",
  "accordingly",
  "subsequently",
  "indeed",
];

const STOPWORDS = new Set([
  "the", "and", "that", "this", "with", "have", "for", "are", "was", "were", "they",
  "their", "them", "then", "than", "from", "which", "would", "could", "should", "will",
  "shall", "what", "when", "where", "while", "your", "you", "our", "his", "her", "its",
  "not", "but", "also", "more", "most", "some", "such", "into", "about", "there", "these",
  "those", "been", "being", "because", "people", "person", "thing", "things", "many",
  "much", "very", "other", "others", "both", "each", "every", "any", "all", "can", "may",
  "one", "two", "who", "how", "why", "out", "off", "use", "used", "using", "get", "got",
]);

/** Compute structural insights for an essay. */
export function computeWritingInsights(text: string): WritingInsights {
  const trimmed = (text ?? "").trim();
  const words = trimmed.match(/[A-Za-z']+/g) ?? [];
  const wordCount = words.length;

  // Sentences: split on terminal punctuation; ignore empty fragments.
  const sentences = trimmed
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const sentenceCount = sentences.length;
  const sentenceLengths = sentences.map((s) => (s.match(/[A-Za-z']+/g) ?? []).length);
  const longestSentence = sentenceLengths.length ? Math.max(...sentenceLengths) : 0;
  const avgSentenceLength = sentenceCount ? Math.round(wordCount / sentenceCount) : 0;

  // Paragraphs: prefer blank-line separation; fall back to single newlines.
  let paragraphs = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length <= 1) {
    const lines = trimmed.split(/\n/).map((p) => p.trim()).filter(Boolean);
    if (lines.length > 1) paragraphs = lines;
  }
  const paragraphCount = Math.max(1, paragraphs.length);

  // Linking words: count phrase matches over the lower-cased text.
  const lower = ` ${trimmed.toLowerCase()} `;
  const linkingUsed: string[] = [];
  let linkingTotal = 0;
  for (const linker of LINKERS) {
    const re = new RegExp(`(?<![A-Za-z])${escapeRe(linker)}(?![A-Za-z])`, "g");
    const n = (lower.match(re) ?? []).length;
    if (n > 0) {
      linkingTotal += n;
      linkingUsed.push(linker);
    }
  }

  // Repetition: content words (len ≥ 4, not a stopword) used 4+ times.
  const freq = new Map<string, number>();
  for (const w of words) {
    const k = w.toLowerCase();
    if (k.length < 4 || STOPWORDS.has(k)) continue;
    freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  const repeated = [...freq.entries()]
    .filter(([, c]) => c >= 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    avgSentenceLength,
    longestSentence,
    linkingTotal,
    linkingUnique: linkingUsed.length,
    linkingUsed,
    repeated,
  };
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
