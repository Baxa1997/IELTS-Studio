"use client";

import { useEffect, useRef, useState } from "react";

import { BRAND, LINE, MUTED, RADIUS, SANS, STRONG, WHITE } from "./design";

/**
 * The UZ / EN / RU picker from the design's header.
 *
 * ⚠️ IT DOES NOT TRANSLATE ANYTHING YET. The canvas specifies it and the
 * audience is Uzbek, so it is built exactly as drawn — but there is no i18n
 * layer in this app (no next-intl, no message catalogue, every string is
 * inline English), so the only thing choosing a language currently does is move
 * the tick. Wiring it means adding that layer; until then this is a promise the
 * page is making that the product does not keep, and it should either be wired
 * or removed rather than left indefinitely.
 */
const LANGS: { code: Lang; name: string }[] = [
  { code: "UZ", name: "O‘zbekcha" },
  { code: "EN", name: "English" },
  { code: "RU", name: "Русский" },
];

type Lang = "UZ" | "EN" | "RU";

export function LangPicker({ compact = false }: { compact?: boolean }) {
  const [lang, setLang] = useState<Lang>("EN");
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
          background: WHITE,
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
        {lang}
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
            background: WHITE,
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
          {LANGS.map((o) => {
            const on = o.code === lang;
            return (
              <button
                key={o.code}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  setLang(o.code);
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
                  background: on ? "#fdf4f7" : "transparent",
                  color: on ? BRAND : STRONG,
                  fontWeight: on ? 700 : 500,
                }}
              >
                <span>{o.name}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>{on ? "✓" : ""}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
