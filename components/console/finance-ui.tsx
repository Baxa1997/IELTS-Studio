"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * The client-side furniture the finance pages need: a slide-over that opens
 * from a button, and the form primitives that go inside it.
 *
 * The console's own slide-over lives inside `console-chrome.tsx` and is wired
 * to the four panels the chrome owns (enrol, invite, teacher, group). Finance
 * has a dozen small forms that each belong to one page, so rather than widen
 * the chrome's prop list every time a page grows a form, pages open their own.
 * Same geometry, same escape/backdrop behaviour, no new chrome props.
 */

const INDIGO = "#4340CB";
const GREEN = "#16794C";
const RED = "#A63A30";
const INK = "#16162E";
const MUTED = "#6E6C87";
const CANVAS = "#F4F3EF";

export const fieldStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #CFCABC",
  borderRadius: 8,
  padding: "9px 11px",
  fontFamily: "inherit",
  fontSize: 13,
  color: INK,
  background: "#fff",
};

export const labelStyle: React.CSSProperties = {
  fontSize: 12,
  color: MUTED,
  display: "block",
  marginBottom: 5,
};

/** Label + control, the only field layout these forms use. */
export function Field({
  label,
  hint,
  children,
  span,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  span?: boolean;
}) {
  return (
    <div style={span ? { gridColumn: "1 / -1" } : undefined}>
      <label style={labelStyle}>
        {label}
        {hint ? <span style={{ color: "#93919F" }}> · {hint}</span> : null}
      </label>
      {children}
    </div>
  );
}

export function FieldGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {children}
    </div>
  );
}

/** The result line under a form — one green sentence or one red one. */
export function FormMessage({ state }: { state: { error?: string; ok?: string } }) {
  if (!state.error && !state.ok) return null;
  return (
    <p
      role="status"
      style={{
        margin: "12px 0 0",
        fontSize: 12.5,
        lineHeight: 1.5,
        color: state.error ? RED : GREEN,
      }}
    >
      {state.error ?? state.ok}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
  variant = "primary",
}: {
  pending: boolean;
  children: React.ReactNode;
  variant?: "primary" | "green" | "danger";
}) {
  const background = variant === "green" ? GREEN : variant === "danger" ? RED : INDIGO;
  return (
    <button
      type="submit"
      disabled={pending}
      className="cn-btn"
      style={{
        background,
        color: "#fff",
        border: 0,
        borderRadius: 9,
        padding: "9px 16px",
        fontFamily: "inherit",
        fontSize: 13.5,
        fontWeight: 600,
        cursor: pending ? "default" : "pointer",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {pending ? "Working…" : children}
    </button>
  );
}

/* ── the slide-over ───────────────────────────────────────────────────────── */

/**
 * How a form inside a drawer dismisses it.
 *
 * Context rather than a render-prop child, and that is not a style preference:
 * these drawers are opened from SERVER components, and a function cannot cross
 * the server→client boundary. Children have to be plain elements, so the close
 * handle has to reach the form some other way — and context is the way that
 * costs the caller nothing.
 *
 * Outside a drawer the hook is a no-op, so the same form works inline on a page.
 */
const DrawerCloseContext = createContext<() => void>(() => {});

export function useDrawerClose(): () => void {
  return useContext(DrawerCloseContext);
}

export function Drawer({
  label,
  eyebrow,
  title,
  note,
  variant = "primary",
  width = 460,
  triggerStyle,
  children,
}: {
  /** The trigger's text. */
  label: React.ReactNode;
  eyebrow: string;
  title: string;
  note: string;
  variant?: "primary" | "green" | "ghost";
  width?: number;
  /**
   * Overrides the trigger's own chrome, for the cases where the thing you click
   * IS the content — a timetable block, a card. Merged last, so it wins.
   */
  triggerStyle?: React.CSSProperties;
  /** Rendered inside the panel. A form in here calls `useDrawerClose()` to dismiss it. */
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const trigger: React.CSSProperties =
    variant === "ghost"
      ? {
          background: "#fff",
          color: INK,
          border: "1px solid #E0DED8",
          fontWeight: 500,
        }
      : {
          background: variant === "green" ? GREEN : INDIGO,
          color: "#fff",
          border: 0,
          fontWeight: 600,
        };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`cn-btn cn-btn--${variant}`}
        style={{
          ...trigger,
          borderRadius: 9,
          padding: "8px 15px",
          fontFamily: "inherit",
          fontSize: 13.5,
          cursor: "pointer",
          whiteSpace: "nowrap",
          ...triggerStyle,
        }}
      >
        {label}
      </button>

      {open ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            aria-label="Close"
            onClick={() => setOpen(false)}
            style={{ position: "absolute", inset: 0, background: "rgba(20,19,58,.36)", border: 0 }}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="cn-slideover"
            style={{
              position: "relative",
              width,
              maxWidth: "100vw",
              background: "#fff",
              height: "100dvh",
              overflowY: "auto",
              boxShadow: "-20px 0 50px rgba(20,19,58,.2)",
              padding: "24px 26px",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start" }}>
              <div>
                <div
                  style={{
                    fontSize: 11.5,
                    letterSpacing: ".1em",
                    fontWeight: 600,
                    color: INDIGO,
                    textTransform: "uppercase",
                  }}
                >
                  {eyebrow}
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-serif4), Georgia, serif",
                    fontSize: 24,
                    fontWeight: 700,
                    margin: "6px 0 4px",
                    color: INK,
                  }}
                >
                  {title}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{note}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                style={{
                  marginLeft: "auto",
                  background: CANVAS,
                  border: "1px solid #E4E2DC",
                  borderRadius: 8,
                  width: 30,
                  height: 30,
                  flex: "none",
                  cursor: "pointer",
                  color: MUTED,
                  fontSize: 15,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ marginTop: 22 }}>
              <DrawerCloseContext.Provider value={() => setOpen(false)}>
                {children}
              </DrawerCloseContext.Provider>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * A row action that posts one hidden field, with a confirmation for the ones
 * that destroy something. Used for void / delete / status changes, where a full
 * form would be four times the markup of the thing it does.
 */
export function InlineAction({
  action,
  fields,
  children,
  confirm,
  tone = "quiet",
}: {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  children: React.ReactNode;
  confirm?: string;
  tone?: "quiet" | "danger" | "primary";
}) {
  const color = tone === "danger" ? RED : tone === "primary" ? INDIGO : MUTED;
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      style={{ display: "inline" }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        className="cn-link"
        style={{
          background: "none",
          border: 0,
          padding: 0,
          fontFamily: "inherit",
          fontSize: 12.5,
          color,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </button>
    </form>
  );
}
