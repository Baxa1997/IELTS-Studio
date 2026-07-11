export const SITE_NAME = "EngProgress";
export const PREVIEW_IMAGE = "/link-preview.png";

export const SEO_DESCRIPTION =
  "The AI-based platform for IELTS practice — Writing, Reading, Listening and CEFR. Generate Cambridge-style tasks, train with fresh practice tests, and get the closest thing to a real examiner's band: strict, calibrated AI feedback.";

export const LANDING_DESCRIPTION =
  "EngProgress is an AI-powered IELTS practice platform: Cambridge-style Writing, Reading and Listening generated fresh, graded with strict, examiner-calibrated band feedback.";

export const SEO_KEYWORDS = [
  "EngProgress",
  "engnovate",
  "IELTS practice",
  "ielts",
  "IELTS Writing practice",
  "IELTS Reading practice",
  "IELTS Listening practice",
  "CEFR practice",
  "cefr",
  "Cambridge 21",
  "Cambridge practices",
  "Cambridge IELTS practice",
  "ielts.gg",
  "AI IELTS coach",
  "IELTS band score",
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
