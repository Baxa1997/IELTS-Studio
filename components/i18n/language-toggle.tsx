"use client";

import { Check } from "lucide-react";

import { LOCALE_NAMES, LOCALE_SHORT, LOCALES, type Locale } from "@/lib/i18n/locales";
import { BRAND, BRAND_SOFT, FAINT, LINE, MUTED, PANEL, SANS } from "@/lib/theme/tokens";

import { useLocale } from "./locale-provider";

/**
 * The interface language, as a radio group — the settings-page counterpart of
 * the header's `LangPicker`, which is a dropdown because it sits in a nav bar.
 *
 * Each language is written in ITSELF and never translated: someone looking for
 * their own language scans for the word they use for it, not for the English
 * name of it, which they may not read. The two-letter code is kept alongside
 * because it is what the header control shows, and the two should be
 * recognisably the same setting.
 *
 * Unlike the theme toggle, this needs no mounted guard — the locale is a cookie,
 * so the server already rendered with it and the selected row is correct in the
 * very first frame.
 */
export function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: 5,
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        background: PANEL,
        maxWidth: 340,
      }}
    >
      {LOCALES.map((code: Locale) => {
        const on = code === locale;
        return (
          <button
            key={code}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setLocale(code)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              width: "100%",
              textAlign: "left",
              border: "none",
              borderRadius: 9,
              padding: "11px 13px",
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: 15,
              fontWeight: on ? 700 : 500,
              background: on ? BRAND_SOFT : "transparent",
              color: on ? BRAND : MUTED,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span
                aria-hidden
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  color: on ? BRAND : FAINT,
                  minWidth: 22,
                }}
              >
                {LOCALE_SHORT[code]}
              </span>
              {LOCALE_NAMES[code]}
            </span>
            {on ? <Check size={16} strokeWidth={2.2} aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}
