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
  const { locale, setLocale, t, prefetchLocales } = useLocale();
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Click-away and Escape. The canvas only draws the open state; a menu that
  // can be opened and not dismissed is worse than one that was never built.
  //
  // ⚠️ `pointerdown`, NOT `mousedown`. A finger on a phone and a pen on a
  // tablet both raise pointer events; mouse events are a COMPATIBILITY layer
  // the browser may synthesise late, may coalesce, or may skip entirely once
  // something upstream has called `preventDefault`. Listening on the compat
  // layer is how a menu ends up dismissing on some taps and not others.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  /**
   * Open upwards when there is no room below, and warm the destinations.
   *
   * ⚠️ THE MENU USED TO BE PINNED 48px BELOW THE BUTTON AND COULD LAND OFF THE
   * SCREEN. In the mobile drawer the picker sits at the BOTTOM of a panel that
   * also locks body scrolling, so a menu opening downwards there is partly
   * below the fold with no way to scroll to it: the rows you can see are
   * clickable, the ones you cannot are not, and which is which depends on the
   * phone. Measuring once per open costs nothing and there is no third case —
   * either it fits below or it goes above.
   */
  useEffect(() => {
    if (!open) return;
    const el = box.current;
    if (el) {
      const r = el.getBoundingClientRect();
      // 3 rows at ~45px plus the menu's own padding, with a little margin.
      const NEEDED = 172;
      setDropUp(window.innerHeight - r.bottom < NEEDED && r.top > NEEDED);
    }
    prefetchLocales();
  }, [open, prefetchLocales]);

  return (
    <div style={{ position: "relative" }} ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onPointerEnter={prefetchLocales}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("language.change")}
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
          /* Opts out of the browser's wait-and-see for a double-tap. Without it
             a tap is held back ~300ms on some mobile browsers, which is long
             enough for a scroll to start and the tap to be dropped instead. */
          touchAction: "manipulation",
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
            ...(dropUp ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
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
                  touchAction: "manipulation",
                }}
              >
                <span>{LOCALE_NAMES[code]}</span>
                {/* Just a tick. Progress is NOT reported here: the menu closes
                    on the click, and while the switch travels the page-wide
                    loader in `LocaleProvider` is what is on screen. */}
                <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }} aria-hidden>
                  {on ? "✓" : ""}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
