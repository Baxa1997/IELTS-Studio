import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DICTIONARIES, translate } from "./index";
import { LOCALES, type Locale } from "./locales";
import { en } from "./messages/en";

/**
 * WHAT THE TYPE SYSTEM ALREADY GUARANTEES, AND WHAT IT DOES NOT.
 *
 * `uz.ts` and `ru.ts` are typed `Messages`, so a key added to English fails
 * their compile until they carry it. That is a real guard and it is why this
 * file does not re-check for missing keys.
 *
 * It cannot check any of the following, and each one ships a broken UI that
 * compiles perfectly:
 *
 *   · a translation left as the English text — the commonest way a "finished"
 *     locale is half done, and invisible in a diff of 3,000 keys;
 *   · a placeholder that does not survive translation. `{name}` in English and
 *     `{имя}` in Russian both type-check, and the Russian renders the literal
 *     text `{имя}` to a user;
 *   · an empty string, which renders as a button with no label.
 */

const ROOT = process.cwd();

/** Keys whose translation is legitimately the English word. Each needs a
 *  reason, because "it looked the same" is how an untranslated key hides. */
const SAME_ON_PURPOSE: Record<string, string> = {
  "nav.cefr": "CEFR is the framework's name in every language",
  "nav.ielts": "IELTS is a proper noun",
  "card.pro": "the plan is called Pro on the invoice in every language",
  /* The IELTS module names. Uzbek and Russian centres say "Academic Task 2" and
     "General Training" in English in class — translating them would be less
     recognisable to the student, not more. */
  "write.acadT1": "IELTS module name, used in English in UZ/RU classrooms",
  "write.acadT2": "IELTS module name, used in English in UZ/RU classrooms",
  "write.gt": "IELTS module name, used in English in UZ/RU classrooms",
  "su.email": "Uzbek uses the English word for an email address",
  /* The tail of "By creating an account you agree to our X and Y." Uzbek puts
     the verb last, so the sentence needs a piece AFTER the second link and this
     key exists for it; in English and Russian that piece is the full stop. */
  "su.legalPost": "sentence tail — punctuation only outside Uzbek",
};

const PLACEHOLDER = /\{(\w+)\}/g;
const placeholders = (s: string) => new Set([...s.matchAll(PLACEHOLDER)].map((m) => m[1]));

describe("the dictionaries", () => {
  const keys = Object.keys(en) as (keyof typeof en)[];

  it("carries a meaningful number of keys", () => {
    expect(keys.length).toBeGreaterThan(80);
  });

  for (const locale of LOCALES.filter((l) => l !== "en") as Locale[]) {
    it(`${locale}: every placeholder survives translation`, () => {
      const broken: string[] = [];
      for (const k of keys) {
        const a = placeholders(en[k]);
        const b = placeholders(DICTIONARIES[locale][k]);
        for (const name of a) if (!b.has(name)) broken.push(`${locale} ${k}: lost {${name}}`);
        for (const name of b) if (!a.has(name)) broken.push(`${locale} ${k}: invented {${name}}`);
      }
      expect(broken).toEqual([]);
    });

    it(`${locale}: nothing is left in English`, () => {
      const untranslated = keys
        .filter((k) => DICTIONARIES[locale][k] === en[k] && !(k in SAME_ON_PURPOSE))
        .map((k) => `${locale} ${k}: still "${en[k]}"`);
      expect(untranslated).toEqual([]);
    });

    it(`${locale}: nothing is blank`, () => {
      const blank = keys
        .filter((k) => !DICTIONARIES[locale][k].trim())
        .map((k) => `${locale} ${k}`);
      expect(blank).toEqual([]);
    });
  }

  it("fills placeholders, and leaves an unknown one visible", () => {
    // The visible-failure rule: a missing var renders as `{name}`, not as a gap.
    expect(translate("en", "dash.welcomeName", { name: "Bahriddin" })).toContain("Bahriddin");
    expect(translate("en", "dash.welcomeName", {})).toContain("{name}");
  });

  it("is not mojibake", () => {
    /* ⚠️ UTF-8 READ BACK AS LATIN-1, AND IT TYPE-CHECKS PERFECTLY. "На этой"
       becomes "Ð\x9dÐ°Ñ\x82Ð¾Ð¹" and "oʻ" becomes "oÊ»" — still a string, still
       the right key, still compiles, and every other guard here passes because
       the corrupted value does not equal the English one. It happened to this
       file: a script wrote the blocks with `.encode().decode("unicode_escape")`,
       which resolves \\uXXXX escapes but reinterprets the utf-8 bytes as
       latin-1, so both new locales shipped unreadable.

       The signature is a Latin-1 high byte where a Cyrillic or Uzbek letter
       should be: Ð, Ñ, Ê, Â, â€ and friends never appear in real copy. */
    const MOJIBAKE = /[ÐÑÊÂ][\u0080-\u00bf\u02b0-\u02ff]|â€|Ã[\u0080-\u00bf]/;
    const bad: string[] = [];
    for (const locale of LOCALES) {
      for (const k of keys) {
        if (MOJIBAKE.test(DICTIONARIES[locale][k])) {
          bad.push(`${locale} ${k}: "${DICTIONARIES[locale][k]}"`);
        }
      }
    }
    expect(bad, "utf-8 was read back as latin-1 somewhere").toEqual([]);
  });

  it("writes Uzbek with the modifier letter, not an ASCII apostrophe", () => {
    /* `oʻ` and `gʻ` use U+02BB. An ASCII ' looks almost identical in a terminal,
       sorts differently everywhere else, and is the single most common way
       Uzbek copy arrives subtly wrong. */
    const uz = readFileSync(join(ROOT, "lib/i18n/messages/uz.ts"), "utf8");
    const bad = uz
      .split("\n")
      .filter((l) => /^\s*"/.test(l) && /[a-zA-Z]'[a-zA-Z]/.test(l))
      .map((l) => l.trim());
    expect(bad, "use ʻ (U+02BB) in oʻ / gʻ").toEqual([]);
  });
});
