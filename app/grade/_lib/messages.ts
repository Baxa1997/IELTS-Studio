import type { Translate } from "@/lib/i18n";

/**
 * What the checker's routes' refusals mean, in words a visitor can act on.
 * Both grade routes (IELTS and CEFR) share one vocabulary of error codes, so
 * one mapping serves every tab; the word bounds are passed in because they
 * differ between the IELTS and the CEFR tabs.
 */
export function gradeErrorMessage(
  t: Translate,
  status: number,
  code: string | undefined,
  bounds: { min: number; max: number },
): string {
  switch (code) {
    case "rate_limited":
      return t("grade.errLimit");
    case "busy":
      return t("grade.errBusy");
    case "too_short":
      return t("grade.errShort", { n: bounds.min });
    case "too_long":
      return t("grade.errLong", { n: bounds.max });
    case "prompt_too_long":
      return t("grade.errQuestionLong");
    case "grade_failed":
      return t("grade.errFailed");
    case "unavailable":
      return t("grade.errUnavailable");
    default:
      return status === 429 ? t("grade.errBusy") : t("grade.errGeneric");
  }
}

/** /api/public/transcribe's refusals — a photo or a PDF that could not be read. */
export function transcribeErrorMessage(t: Translate, code: string | undefined): string {
  switch (code) {
    case "rate_limited":
      return t("grade.errLimit");
    case "busy":
      return t("grade.errBusy");
    case "unsupported_type":
      return t("grade.errFileType");
    case "too_large":
      return t("grade.errFileSize");
    case "empty_file":
      return t("grade.errFileEmpty");
    case "no_text":
      return t("grade.errFileNoText");
    default:
      return t("grade.errFileRead");
  }
}
