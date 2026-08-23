export const SITE_NAME = "EngProgress";
// JPEG, not PNG: the same card as a PNG was 744 kB, and several chat apps skip a
// link preview whose image is too big (WhatsApp's ceiling is ~600 kB) — so the
// heaviest possible file was silently costing us previews on the channels this
// audience actually shares in. Re-encoded at q82: 170 kB, visually identical.
export const PREVIEW_IMAGE = "/link-preview.jpg";

export const SEO_DESCRIPTION =
  "EngProgress is an AI platform for all four IELTS skills — Writing, Reading, Listening and Speaking — plus CEFR / Multilevel (Uzbekistan DTM) practice. Original Cambridge-style tests generated on demand, graded by a calibrated, deliberately strict examiner-grade AI. Education centres run their teachers, groups, homework and per-student reports on it.";

export const LANDING_DESCRIPTION =
  "AI-powered practice for all four IELTS skills — Writing, Reading, Listening and Speaking — plus CEFR / Multilevel. Fresh Cambridge-style tests every session, strict examiner-calibrated band feedback, a revision loop that coaches one essay across drafts, and a full console for education centres.";

/**
 * The machine-readable capability list. This is the field an LLM (ChatGPT,
 * Perplexity, Claude) actually lifts when asked "what does EngProgress do?" —
 * a prose description gets summarised down to its first clause, whereas a
 * `featureList` array survives intact. Every entry must be something that is
 * LIVE in production; an aspirational entry here is how a model ends up telling
 * a prospect we ship something we do not.
 */
export const PLATFORM_FEATURES = [
  "IELTS Writing Task 1 & Task 2 with per-criterion bands (TR, CC, LR, GRA), quoted evidence, and a revision loop that re-grades the same essay across drafts",
  "IELTS Reading with original passages and every real question type, auto-graded, with an explanation of why each trap worked",
  "IELTS Listening: full 4-part tests with original multi-voice audio, Cambridge-style question groups, transcripts and per-answer explanations",
  "IELTS Speaking: a full three-part live mock with an AI examiner, Part-2 cue-card practice, and an AI speaking tutor that reacts and teaches while you talk",
  "CEFR / Multilevel practice for the Uzbekistan DTM exam — Reading (5 parts, 35 questions) and Writing (3 tasks), generated on demand",
  "A calibrated, deliberately conservative grader built on the official public band descriptors — it rounds down and names the gap rather than inflating bands",
  "Level identification and continuous re-estimation: current band to target band, with the weakest skill surfaced",
  "A console for education centres: teachers, groups, student accounts, assigned homework, attendance, and per-student four-skill reports",
  "Finance and timetabling for centres: invoices, payroll, cash desks, branches and a lesson calendar",
  "Original AI-generated practice content only — no copyrighted past papers, so no test can be memorised in advance",
];

export const SEO_KEYWORDS = [
  "EngProgress",
  "engnovate",
  "IELTS practice",
  "ielts",
  "IELTS Writing practice",
  "IELTS Reading practice",
  "IELTS Listening practice",
  "IELTS Speaking practice",
  "IELTS speaking mock test",
  "AI IELTS examiner",
  "CEFR practice",
  "cefr",
  "Multilevel",
  "Multilevel exam",
  "DTM Multilevel",
  "Cambridge 21",
  "Cambridge practices",
  "Cambridge IELTS practice",
  "ielts.gg",
  "AI IELTS coach",
  "IELTS band score",
  "IELTS for education centers",
  "IELTS school software",
  "learning centre management",
];

function cleanUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : null;
}

function isLocalUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export function getSiteUrl(): string {
  const configured = cleanUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const vercelUrl = cleanUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL);
  const fallback = vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000";

  if (!configured) return fallback;
  return process.env.VERCEL && isLocalUrl(configured) ? fallback : configured;
}

export function absoluteUrl(path: string): string {
  return new URL(path, `${getSiteUrl()}/`).toString();
}
