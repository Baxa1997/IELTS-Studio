"use client";

import { FAINT, INK, LINE, SANS, TONE } from "@/app/admin/_components/ui";
import { PANEL } from "@/lib/theme/tokens";

/**
 * The pieces an /admin editor is built from — the blog's article editor and
 * the broadcast composer.
 *
 * They lived inside the blog editor until the composer was rebuilt to look and
 * work like it (2026-10-17). Moved here rather than copied: two copies of a
 * toolbar button are how two editors drift into two different-looking
 * products, which is the drift the rest of `ui.tsx` exists to stop.
 */

/** A toolbar button: an icon, its name as the tooltip, and an on state. */
export function ToolButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the selection: a mousedown on a button would otherwise blur the editor first.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        display: "inline-grid",
        placeItems: "center",
        width: 32,
        height: 32,
        borderRadius: 8,
        border: 0,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        color: active ? TONE.indigo.ink : INK,
        background: active ? TONE.indigo.tint : "transparent",
      }}
    >
      {children}
    </button>
  );
}

/** The hairline between groups of toolbar buttons. */
export function ToolSep() {
  return <span aria-hidden style={{ width: 1, height: 20, background: LINE, margin: "0 4px" }} />;
}

/** A titled panel: the cards down both sides of an editor. */
export function EditorSection({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section style={{ border: `1px solid ${LINE}`, borderRadius: 14, background: PANEL, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: SANS, fontSize: 11, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700, color: FAINT }}>
          {title}
        </h2>
        {note ? <p style={{ margin: "5px 0 0", fontSize: 11.5, color: FAINT, lineHeight: 1.45 }}>{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** What just happened: red for a refusal, green for done. */
export function EditorBanner({ tone, children }: { tone: "red" | "green"; children: React.ReactNode }) {
  const t = TONE[tone];
  return (
    <div
      role={tone === "red" ? "alert" : "status"}
      style={{
        fontFamily: SANS,
        fontSize: 13.5,
        lineHeight: 1.5,
        color: t.ink,
        background: t.tint,
        border: `1px solid ${t.border}`,
        borderRadius: 10,
        padding: "11px 13px",
      }}
    >
      {children}
    </div>
  );
}
