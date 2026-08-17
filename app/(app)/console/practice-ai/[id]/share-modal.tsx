"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  EMBER,
  FAINT,
  GOOD_BG,
  GOOD_INK,
  INK,
  MUTED,
  NOTE_BG,
  NOTE_INK,
  PAPER,
  SERIF,
  SOFT,
  TROUGH,
  WARN_BG,
  WARN_INK,
  WASH,
} from "@/lib/lessons/theme";

import {
  assignLessonToGroup,
  rotateShareLink,
  setLessonSharing,
  type LessonActionState,
} from "./actions";

/**
 * What happens after you publish: the two ways a lesson reaches people.
 *
 * It opens on publish rather than waiting to be found, because publishing is
 * the moment a teacher has decided the lesson is good — and "published" on its
 * own does nothing for anybody. The two routes are deliberately shown one under
 * the other, numbered, because they differ in a way that matters and is easy to
 * get wrong: a group gets marked and reported on, a link does not. The link is
 * the quieter of the two on purpose — it sits in a sunken well below the fold
 * of the panel, so the reported route is the one you reach for first.
 *
 * A PORTAL, like the platform console's plan panel, for the same reason: this
 * opens from a page that scrolls inside its own container, and an absolutely
 * positioned panel gets clipped by an ancestor's overflow no matter what
 * z-index it carries.
 */

export interface GroupOption {
  id: string;
  name: string;
  students: number;
}

export function ShareModal({
  lessonId,
  groups,
  shareEnabled,
  shareToken,
  open,
  onClose,
}: {
  lessonId: string;
  groups: GroupOption[];
  shareEnabled: boolean;
  shareToken: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [assignState, assignAction, assigning] = useActionState(
    assignLessonToGroup,
    {} as LessonActionState,
  );
  const [shareState, shareAction, sharing] = useActionState(
    setLessonSharing,
    {} as LessonActionState,
  );
  const [rotateState, rotateAction, rotating] = useActionState(
    rotateShareLink,
    {} as LessonActionState,
  );
  const [picked, setPicked] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Escape closes it. A dialog you can only leave by finding a 38px × in the
  // corner is a dialog that traps the one person in a hurry.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const shareUrl = shareToken ? `${window.location.origin}/p/${shareToken}` : null;
  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Set this lesson to a group or share it"
      onClick={onClose}
      className="pa-slide"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(20,35,46,0.42)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "grid",
        alignItems: "start",
        justifyItems: "center",
        overflow: "auto",
        padding: 32,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pa-pop"
        style={{
          width: 620,
          maxWidth: "100%",
          borderRadius: 32,
          background: PAPER,
          overflow: "hidden",
          boxShadow: "0 40px 80px -30px rgba(20,35,46,.6)",
        }}
      >
        {/* ── header ───────────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "30px 32px 24px",
            background: `linear-gradient(180deg, ${GOOD_BG} 0%, ${PAPER} 100%)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  background: "#fff",
                  color: GOOD_INK,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: ".06em",
                  textTransform: "uppercase",
                }}
              >
                Published
              </span>
              <h2
                style={{
                  fontFamily: SERIF,
                  fontWeight: 600,
                  fontSize: 40,
                  letterSpacing: "-.025em",
                  color: INK,
                  margin: "14px 0 6px",
                }}
              >
                Who gets it?
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: MUTED }}>
                It is ready. Pick where it goes.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="pa-lift"
              style={{
                flex: "none",
                width: 38,
                height: 38,
                borderRadius: 999,
                border: 0,
                background: "rgba(255,255,255,0.8)",
                color: MUTED,
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── 01 · set it to a group ────────────────────────────────────────── */}
        <form action={assignAction} style={{ padding: "4px 32px 0" }}>
          <input type="hidden" name="id" value={lessonId} />

          <Step n="01" bg={NOTE_BG} ink={NOTE_INK} title="Set it to a group" />
          <p style={{ margin: "10px 0 16px", fontSize: 15, lineHeight: 1.6, color: MUTED }}>
            It appears in their assignments. Written answers are AI-marked, and every score and
            mistake lands in your reports.
          </p>

          {groups.length === 0 ? (
            <p style={{ fontSize: 15, color: FAINT, margin: "0 0 8px" }}>
              You have no groups yet — make one first, and this lesson will be waiting.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {groups.map((g) => {
                const on = picked.includes(g.id);
                return (
                  <label
                    key={g.id}
                    className="pa-tap"
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      textAlign: "left",
                      padding: "16px 18px",
                      borderRadius: 20,
                      cursor: "pointer",
                      background: on ? GOOD_BG : TROUGH,
                      boxShadow: on ? "inset 0 0 0 2px #79b79c" : "none",
                    }}
                  >
                    {/* The native control does the semantics and the keyboard;
                        the box beside it does the looking. Hiding it outright
                        would take the checkbox off the tab order with it. */}
                    <input
                      type="checkbox"
                      name="group_id"
                      value={g.id}
                      checked={on}
                      onChange={() => toggle(g.id)}
                      style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      aria-hidden
                      style={{
                        flex: "none",
                        width: 24,
                        height: 24,
                        borderRadius: 8,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#fff",
                        background: on ? GOOD_INK : "#fff",
                        boxShadow: on ? "none" : "inset 0 0 0 2px #d8d3c8",
                      }}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span style={{ fontSize: 17, fontWeight: 600, color: INK }}>{g.name}</span>
                    <span style={{ marginLeft: "auto", fontSize: 14, color: SOFT }}>
                      {g.students} student{g.students === 1 ? "" : "s"}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div
            className="pa-modal-fields"
            style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 12, marginTop: 16 }}
          >
            <label>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: SOFT, marginBottom: 7 }}>
                Due (optional)
              </span>
              <input type="date" name="due_at" className="pa-field" style={field} />
            </label>
            <label>
              <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: SOFT, marginBottom: 7 }}>
                A note for them
              </span>
              <input
                name="instructions"
                placeholder="Do this before Thursday."
                className="pa-field"
                style={field}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={assigning || picked.length === 0}
            className="pa-ember"
            style={{
              width: "100%",
              marginTop: 18,
              padding: 16,
              borderRadius: 999,
              border: 0,
              background: EMBER,
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 16,
              fontWeight: 700,
              cursor: picked.length === 0 || assigning ? "not-allowed" : "pointer",
              opacity: picked.length === 0 ? 0.4 : 1,
              boxShadow: picked.length === 0 ? "none" : "0 12px 26px -12px rgba(236,106,69,.9)",
              transition: "opacity .25s ease",
            }}
          >
            {assigning
              ? "Setting…"
              : picked.length === 0
                ? "Pick a group first"
                : `Set as homework for ${picked.length} group${picked.length > 1 ? "s" : ""}`}
          </button>

          {assignState.ok ? (
            <p style={{ fontSize: 14, color: GOOD_INK, margin: "12px 0 0" }}>{assignState.ok}</p>
          ) : null}
          {assignState.error ? (
            <p style={{ fontSize: 14, color: WARN_INK, margin: "12px 0 0" }} role="alert">
              {assignState.error}
            </p>
          ) : null}
        </form>

        {/* ── 02 · or share a link ──────────────────────────────────────────── */}
        <div style={{ margin: "22px 20px 20px", padding: "22px 24px", borderRadius: 26, background: WASH }}>
          <Step n="02" bg={WARN_BG} ink={WARN_INK} title="Or share a link" />
          <p style={{ margin: "10px 0 16px", fontSize: 15, lineHeight: 1.6, color: MUTED }}>
            Anyone can open it, no account needed. Nothing they do reaches your reports, and written
            answers are not AI-checked — they see the model answer instead.
          </p>

          {shareEnabled && shareUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <code
                style={{
                  flex: 1,
                  minWidth: 200,
                  fontSize: 13,
                  color: MUTED,
                  background: "#fff",
                  borderRadius: 999,
                  padding: "11px 16px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {shareUrl}
              </code>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(shareUrl);
                  setCopied(true);
                }}
                className="pa-lift"
                style={white}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
              <form action={rotateAction}>
                <input type="hidden" name="id" value={lessonId} />
                <button
                  type="submit"
                  disabled={rotating}
                  title="Mint a new link. Every link you have already sent stops working."
                  className="pa-ghost"
                  style={{ ...white, background: "transparent", boxShadow: "none", color: WARN_INK }}
                >
                  New link
                </button>
              </form>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <form action={shareAction}>
                <input type="hidden" name="id" value={lessonId} />
                <input type="hidden" name="enable" value="on" />
                <button type="submit" disabled={sharing} className="pa-lift" style={white}>
                  {sharing ? "…" : "Create a link"}
                </button>
              </form>
              <button
                type="button"
                onClick={onClose}
                className="pa-ghost"
                style={{ ...white, marginLeft: "auto", background: "transparent", boxShadow: "none", color: MUTED }}
              >
                Done
              </button>
            </div>
          )}

          {shareState.error || rotateState.error ? (
            <p style={{ fontSize: 14, color: WARN_INK, margin: "12px 0 0" }} role="alert">
              {shareState.error ?? rotateState.error}
            </p>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Step({ n, bg, ink, title }: { n: string; bg: string; ink: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        aria-hidden
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          background: bg,
          color: ink,
          display: "grid",
          placeItems: "center",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {n}
      </span>
      <h3 style={{ fontSize: 19, fontWeight: 700, color: INK, margin: 0 }}>{title}</h3>
    </div>
  );
}

const field: React.CSSProperties = {
  width: "100%",
  border: 0,
  borderRadius: 16,
  background: TROUGH,
  padding: "13px 16px",
  fontFamily: "inherit",
  fontSize: 15,
  color: INK,
  outline: "none",
  boxShadow: "inset 0 0 0 2px transparent",
};

const white: React.CSSProperties = {
  padding: "13px 22px",
  borderRadius: 999,
  border: 0,
  background: "#fff",
  color: INK,
  fontFamily: "inherit",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow: "0 1px 2px rgba(20,35,46,.07)",
};
