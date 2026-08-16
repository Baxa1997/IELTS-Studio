"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { INK, LINE, SANS, TONE, type Tone } from "./ui";

/**
 * The "…" overflow menu the design puts beside the primary action on every
 * screen.
 *
 * A PORTAL, because these pages scroll inside the shell's own surface and an
 * absolutely-positioned panel gets clipped by an ancestor's overflow no matter
 * what z-index it carries — the same reason the plan panel is a portal. It is
 * positioned from the trigger's measured rectangle rather than by nesting.
 *
 * Every item is a real destination or a real action. The design's menus also
 * offer "Edit center details" and "Broadcast announcement", which have no flow
 * behind them here; a menu of things that do nothing is worse than a shorter
 * menu, so those are absent rather than inert.
 */

export interface MenuItem {
  label: string;
  /** A link, a download, or a mailto — whichever the action actually is. */
  href?: string;
  onSelect?: () => void;
  icon: React.ReactNode;
  tone?: Tone;
  /** Puts a rule above this item, for the destructive tail of the list. */
  separated?: boolean;
  danger?: boolean;
  download?: boolean;
}

export function OverflowMenu({ items, label = "More actions" }: { items: MenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    // Scroll as well as click: a panel pinned to a stale rectangle is worse
    // than one that simply closes when the page moves under it.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    setRect(button.current?.getBoundingClientRect() ?? null);
    setOpen((v) => !v);
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-expanded={open}
        style={{
          width: 40,
          height: 40,
          background: "#fff",
          border: `1px solid #E0DED8`,
          borderRadius: 9,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          color: "#4C4A63",
          flexShrink: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.9" />
          <circle cx="12" cy="12" r="1.9" />
          <circle cx="19" cy="12" r="1.9" />
        </svg>
      </button>

      {open && rect && typeof document !== "undefined"
        ? createPortal(
            <>
              <div
                onClick={() => setOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 70 }}
                aria-hidden
              />
              <div
                role="menu"
                style={{
                  position: "fixed",
                  top: rect.bottom + 6,
                  right: Math.max(12, window.innerWidth - rect.right),
                  width: 252,
                  background: "#fff",
                  border: "1px solid #E4E2DC",
                  borderRadius: 12,
                  boxShadow: "0 18px 44px rgba(20,19,58,.16)",
                  padding: 6,
                  zIndex: 71,
                  fontFamily: SANS,
                }}
              >
                {items.map((item) => {
                  const tone = TONE[item.tone ?? "neutral"];
                  const body = (
                    <>
                      <span
                        aria-hidden
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 7,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          background: tone.tint,
                          color: tone.ink,
                        }}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </>
                  );
                  const style: React.CSSProperties = {
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    width: "100%",
                    background: "none",
                    border: 0,
                    borderRadius: 8,
                    padding: "9px 10px",
                    fontFamily: "inherit",
                    fontSize: 13,
                    textAlign: "left",
                    cursor: "pointer",
                    color: item.danger ? TONE.red.ink : INK,
                    textDecoration: "none",
                    borderTop: item.separated ? `1px solid ${LINE}` : undefined,
                    marginTop: item.separated ? 5 : undefined,
                    paddingTop: item.separated ? 12 : undefined,
                  };
                  return item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="ad-menu-item"
                      style={style}
                      onClick={() => setOpen(false)}
                      {...(item.download ? { download: "" } : null)}
                    >
                      {body}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      className="ad-menu-item"
                      style={style}
                      onClick={() => {
                        setOpen(false);
                        item.onSelect?.();
                      }}
                    >
                      {body}
                    </button>
                  );
                })}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
