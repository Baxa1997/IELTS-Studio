"use client";

import { useEffect, useRef, useState } from "react";

import { useLocale } from "@/components/i18n/locale-provider";
import { LOCALE_NAMES, LOCALE_SHORT, LOCALES, type Locale } from "@/lib/i18n/locales";

import { BRAND, BRAND_TINT, LINE, MUTED, PANEL, RADIUS, SANS, STRONG, WHITE } from "./design";

/**
 * The UZ / EN / RU picker from the design's header.
 *
 * IT IS WIRED NOW. This file used to carry a warning that choosing a language
 * moved the tick and nothing else, because the app had no i18n layer. That
 * layer is `lib/i18n`, and the picker writes the locale cookie through
 * `useLocale()`.
 *
 * What it changes is the UI CHROME ONLY — nav, buttons, labels, headings.
 * Passages, prompts, essays and the grader's feedback stay in English on
 * purpose: the exam is in English, and the grader is calibrated against English
 * anchors. Saying so is the menu's job, so the control does not overclaim a
 * second time.
 *
 * The languages, their order and their names come from `lib/i18n/locales.ts`
 * rather than a copy here, so a fourth one does not depend on remembering this
 * file. Each is written in ITSELF (`Oʻzbekcha`, never "Uzbek"): someone looking
 * for their language scans for the word they use for it, not for its English
 * name, which they may not read.
 */
export function LangPicker({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Click-away and Escape. The canvas only draws the open state; a menu that
  // can be opened and not dismissed is worse than one that was never built.
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div style={{ position: "relative" }} ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change language"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderRadius: RADIUS.pill,
          padding: compact ? "9px 15px" : "10px 16px",
          cursor: "pointer",
          fontFamily: SANS,
          fontSize: 14,
          fontWeight: 700,
          color: STRONG,
          letterSpacing: compact ? undefined : "0.04em",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: 14 }} aria-hidden>
          🌐
        </span>
        {LOCALE_SHORT[locale]}
        <span style={{ fontSize: 10, color: MUTED }} aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: compact ? 48 : 52,
            right: 0,
            background: PANEL,
            border: `1px solid ${LINE}`,
            borderRadius: RADIUS.field,
            boxShadow: "0 18px 40px rgba(18,19,23,0.12)",
            padding: 8,
            minWidth: 196,
            zIndex: 30,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {LOCALES.map((code: Locale) => {
            const on = code === locale;
            return (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  width: "100%",
                  textAlign: "left",
                  border: 0,
                  cursor: "pointer",
                  fontFamily: SANS,
                  fontSize: 15,
                  padding: "11px 14px",
                  borderRadius: 10,
                  background: on ? BRAND_TINT : "transparent",
                  color: on ? BRAND : STRONG,
                  fontWeight: on ? 700 : 500,
                }}
              >
                <span>{LOCALE_NAMES[code]}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>{on ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
