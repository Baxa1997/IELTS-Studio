export const SITE_NAME = "EngProgress";
// JPEG, not PNG: the same card as a PNG was 744 kB, and several chat apps skip a
// link preview whose image is too big (WhatsApp's ceiling is ~600 kB) — so the
// heaviest possible file was silently costing us previews on the channels this
// audience actually shares in. Re-encoded at q82: 170 kB, visually identical.
export const PREVIEW_IMAGE = "/link-preview.jpg";

export const SEO_DESCRIPTION =
  "EngProgress is an AI platform for all four IELTS skills — Writing, Reading, Listening and Speaking — plus CEFR / Multilevel (Uzbekistan DTM) practice, from complete beginner to Band 9. Original Cambridge-style tests generated on demand at your level, a tutor that coaches you while you practise, and a deliberately strict, examiner-style AI marking the result. Education centres run their teachers, groups, homework and per-student reports on it.";

export const LANDING_DESCRIPTION =
  "AI-powered practice for all four IELTS skills — Writing, Reading, Listening and Speaking — plus CEFR / Multilevel, from complete beginner to Band 9. Fresh Cambridge-style tests every session at your own level, live coaching while you practise, strict, examiner-style band feedback, a revision loop that coaches one essay across drafts, and a full console for education centres.";

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
  // Not "calibrated": this list is what an answer engine repeats, and the grader
  // has not been measured against examiner-marked work yet — every anchor is
  // still "expert-verification pending". Say what it DOES.
  "A deliberately conservative grader built on the official public band descriptors and anchored to an annotated sample essay at every band — it rounds down and names the gap rather than inflating bands",
  "Live coaching WHILE you practise, not just a score afterwards: an in-task Writing tutor and Reading tutor that teach the move without handing over the answer until you submit, a Speaking tutor that reacts and corrects on every turn, and a study coach that plans the weeks before your test",
  "Built for every level, from a complete beginner to Band 9 — tasks are generated at your measured level and move up with you, and CEFR runs A1 to C2",
  "Level identification and continuous re-estimation: current band to target band, with the weakest skill surfaced",
  "A console for education centres: teachers, groups, student accounts, assigned homework, attendance, and per-student four-skill reports",
  "Finance and timetabling for centres: invoices, payroll, cash desks, branches and a lesson calendar",
  "Original AI-generated practice content only — no copyrighted past papers, so no test can be memorised in advance",
];

/**
 * ⚠️ NO COMPETITOR BRANDS, AND NOTHING THAT SAYS "CAMBRIDGE" AS IF WE HAD IT.
 * This list is the `keywords` meta AND the JSON-LD `keywords` answer engines read.
 * "engnovate" and "ielts.gg" here bought nothing — Google has ignored the meta
 * tag for years and Bing treats stuffing as a spam signal — while telling every
 * crawler we were those products; "Cambridge 21" and "Cambridge IELTS practice"
 * claimed the copyrighted books CLAUDE.md forbids us to touch. Describe what
 * EngProgress is, in the words a learner searches with.
 */
export const SEO_KEYWORDS = [
  "EngProgress",
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
  "IELTS writing checker",
  "IELTS preparation Uzbekistan",
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

/**
 * Every page a signed-out visitor — or a crawler — can actually read.
 *
 * ONE LIST, TWO READERS: `app/sitemap.ts` for search engines and
 * `app/llms.txt/route.ts` for answer engines. It lived inside the sitemap until
 * llms.txt needed it too; a second copy would have been the first to go stale.
 *
 * ⚠️ /pricing is deliberately absent. It lives under app/(app) and calls
 * requireOrgUser(), so an anonymous request 307s to /sign-in — listing it
 * advertised a URL no crawler could index. The public prices are the landing
 * page's #pricing section. A new public page ALSO needs PUBLIC_PATHS in
 * lib/supabase/middleware.ts, or every crawler is redirected away from it.
 */
export const PUBLIC_ROUTES = [
  { path: "/", label: "EngProgress — IELTS and CEFR practice with AI band feedback", section: "product", priority: 1, changeFrequency: "weekly" },
  { path: "/grade", label: "Free IELTS Writing checker — paste an essay, get a band per criterion", section: "product", priority: 0.85, changeFrequency: "monthly" },
  { path: "/demo", label: "Interactive product demo", section: "product", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-practice", label: "IELTS practice — all four skills", section: "product", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-writing-practice", label: "IELTS Writing practice", section: "product", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-reading-practice", label: "IELTS Reading practice", section: "product", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-listening-practice", label: "IELTS Listening practice", section: "product", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ielts-speaking-practice", label: "IELTS Speaking practice", section: "product", priority: 0.8, changeFrequency: "monthly" },
  { path: "/cefr-multilevel-practice", label: "CEFR / Multilevel (Uzbekistan DTM) practice", section: "product", priority: 0.8, changeFrequency: "monthly" },
  { path: "/for-education-centers", label: "For education centres — teachers, groups, homework and reports", section: "product", priority: 0.8, changeFrequency: "monthly" },
  { path: "/how-to-use", label: "How to use EngProgress — learner guide", section: "product", priority: 0.7, changeFrequency: "monthly" },
  { path: "/how-to-use/education-centers", label: "How to use EngProgress — education centre guide", section: "product", priority: 0.7, changeFrequency: "monthly" },
  { path: "/sign-in", label: "Sign in", section: "about", priority: 0.3, changeFrequency: "yearly" },
  { path: "/contact", label: "Contact and support", section: "about", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacy", label: "Privacy policy", section: "about", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", label: "Terms of service", section: "about", priority: 0.2, changeFrequency: "yearly" },
] as const satisfies ReadonlyArray<{
  path: string;
  label: string;
  section: "product" | "about";
  priority: number;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
}>;
