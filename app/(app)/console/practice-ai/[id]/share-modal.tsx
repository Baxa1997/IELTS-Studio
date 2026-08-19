"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useActionFeedback } from "@/components/console/toast";

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
  /** True only for a VERIFIED link — a half-finished handshake announces
   *  nothing, so it must not read as connected here. */
  telegram: boolean;
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
  // THE SUCCESS WAS THERE AND NOBODY SAW IT. It rendered as a 13.5px green
  // line under the button, inside a body that scrolls — after an action the
  // teacher was specifically waiting to have confirmed. The console has a toast
  // for exactly this and every other action in it uses one; this modal was the
  // exception.
  //
  // SETTING IT CLOSES THE DIALOG. It stayed open at first, on the reasoning
  // that one class is often the first of several — but the picker takes as many
  // classes as you tick in a single submit, so there is rarely a second trip,
  // and a dialog that sits there afterwards makes a teacher wonder whether the
  // thing they just did actually happened. The toast carries the confirmation
  // out to where it is read.
  //
  // `keepOpen` stays on: it governs the console DRAWER, which this dialog is
  // not inside, and letting the hook close a drawer nobody opened would shut
  // something else on the page.
  useActionFeedback(assignState, { keepOpen: true, onSuccess: onClose });
  // The share link is the opposite case — the whole point is to copy the URL it
  // has just produced, so closing on success would take it away.
  useActionFeedback(shareState, { keepOpen: true });

  const [picked, setPicked] = useState<string[]>([]);

  // A CLOSED DIALOG IS NOT AN UNMOUNTED ONE. The early return below happens
  // after the hooks, so this component keeps its state the whole time the page
  // is open — which means the classes ticked on the last visit are still ticked
  // on the next one, describing work that has already been set. Cleared on the
  // transition into open, during render rather than in an effect, so the first
  // paint is never the stale list.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPicked([]);
  }
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
        placeItems: "center",
        padding: 20,
      }}
    >
      {/* A COLUMN with a capped height: the header stays put and only the body
          scrolls. It used to be one tall block inside a scrolling backdrop, so
          on a laptop the two buttons that finish the job — "Create a link" and
          "Done" — sat below the fold of a dialog that looked complete. */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="pa-pop"
        style={{
          width: 520,
          maxWidth: "100%",
          maxHeight: "calc(100dvh - 40px)",
          display: "flex",
          flexDirection: "column",
          borderRadius: 24,
          background: PAPER,
          overflow: "hidden",
          boxShadow: "0 40px 80px -30px rgba(20,35,46,.6)",
        }}
      >
        {/* ── header ───────────────────────────────────────────────────────── */}
        <div
          style={{
            flex: "none",
            padding: "18px 22px 14px",
            background: `linear-gradient(180deg, ${GOOD_BG} 0%, ${PAPER} 100%)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <span
                style={{
                  padding: "4px 11px",
                  borderRadius: 999,
                  background: "#fff",
                  color: GOOD_INK,
                  fontSize: 11,
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
                  fontSize: 25,
                  letterSpacing: "-.025em",
                  color: INK,
                  margin: "10px 0 4px",
                }}
              >
                Who gets it?
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: MUTED }}>
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
                width: 32,
                height: 32,
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
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <form action={assignAction} style={{ padding: "2px 22px 0" }}>
          <input type="hidden" name="id" value={lessonId} />

          <Step n="01" bg={NOTE_BG} ink={NOTE_INK} title="Set it to a group" />
          <p style={{ margin: "7px 0 11px", fontSize: 13.5, lineHeight: 1.5, color: MUTED }}>
            It appears in their assignments. Written answers are AI-marked, and every score and
            mistake lands in your reports.
          </p>

          {groups.length === 0 ? (
            <p style={{ fontSize: 13.5, color: FAINT, margin: "0 0 8px" }}>
              You have no groups yet — make one first, and this lesson will be waiting.
            </p>
          ) : (
            <div style={{ display: "grid", gap: 7 }}>
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
                      gap: 11,
                      textAlign: "left",
                      padding: "10px 13px",
                      borderRadius: 13,
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
                        width: 20,
                        height: 20,
                        borderRadius: 6,
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
                    <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>{g.name}</span>
                    {/* SAID WHERE IT MATTERS. Setting a lesson announces it in
                        the group's Telegram channel — but only a verified link
                        has one, and a group without it gets the homework in
                        silence. A teacher who did not know that reads the
                        silence as the assignment having failed. The connect
                        screen is the third section of a drawer behind the group
                        page, which is why nobody finds it. */}
                    <span
                      title={
                        g.telegram
                          ? "This class has a Telegram channel — it will be told"
                          : "No Telegram channel: this class gets the homework silently. Open the group's Settings to connect one."
                      }
                      style={{
                        marginLeft: "auto",
                        flex: "none",
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: g.telegram ? GOOD_BG : WARN_BG,
                        color: g.telegram ? GOOD_INK : WARN_INK,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {g.telegram ? "Telegram ✓" : "No Telegram"}
                    </span>
                    <span style={{ fontSize: 13, color: SOFT, flex: "none" }}>
                      {g.students} student{g.students === 1 ? "" : "s"}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* A badge that only diagnoses is half a fix. This says what to do
              about it, and names where — "Settings" is a drawer on the group
              page, so there is no URL to send anyone to. */}
          {groups.some((g) => !g.telegram) ? (
            <p style={{ margin: "9px 2px 0", fontSize: 12.5, lineHeight: 1.5, color: SOFT }}>
              A class with no channel still gets the homework — it just is not announced.{" "}
              <Link
                href="/console/telegram"
                style={{ color: INK, fontWeight: 600, textDecoration: "underline" }}
              >
                Connect one →
              </Link>
            </p>
          ) : null}

          <div
            className="pa-modal-fields"
            style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 9, marginTop: 12 }}
          >
            <label>
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: SOFT, marginBottom: 5 }}>
                Due (optional)
              </span>
              <input type="date" name="due_at" className="pa-field" style={field} />
            </label>
            <label>
              <span style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: SOFT, marginBottom: 5 }}>
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
              marginTop: 13,
              padding: 12,
              borderRadius: 999,
              border: 0,
              background: EMBER,
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 15,
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
            <p style={{ fontSize: 13.5, color: GOOD_INK, margin: "10px 0 0" }}>{assignState.ok}</p>
          ) : null}
          {assignState.error ? (
            <p style={{ fontSize: 13.5, color: WARN_INK, margin: "10px 0 0" }} role="alert">
              {assignState.error}
            </p>
          ) : null}
        </form>

        {/* ── 02 · or share a link ──────────────────────────────────────────── */}
        <div style={{ margin: "14px 14px 14px", padding: "14px 16px", borderRadius: 18, background: WASH }}>
          <Step n="02" bg={WARN_BG} ink={WARN_INK} title="Or share a link" />
          <p style={{ margin: "7px 0 11px", fontSize: 13.5, lineHeight: 1.5, color: MUTED }}>
            Anyone can open it, no account needed. Nothing they do reaches your reports, and written
            answers are not AI-checked — they see the model answer instead.
          </p>

          {shareEnabled && shareUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <code
                style={{
                  flex: 1,
                  minWidth: 160,
                  fontSize: 12.5,
                  color: MUTED,
                  background: "#fff",
                  borderRadius: 999,
                  padding: "9px 13px",
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
            <p style={{ fontSize: 13.5, color: WARN_INK, margin: "10px 0 0" }} role="alert">
              {shareState.error ?? rotateState.error}
            </p>
          ) : null}
        </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Step({ n, bg, ink, title }: { n: string; bg: string; ink: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        aria-hidden
        style={{
          flex: "none",
          width: 23,
          height: 23,
          borderRadius: 999,
          background: bg,
          color: ink,
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {n}
      </span>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: INK, margin: 0 }}>{title}</h3>
    </div>
  );
}

const field: React.CSSProperties = {
  width: "100%",
  border: 0,
  borderRadius: 12,
  background: TROUGH,
  padding: "9px 12px",
  fontFamily: "inherit",
  fontSize: 14,
  color: INK,
  outline: "none",
  boxShadow: "inset 0 0 0 2px transparent",
};

const white: React.CSSProperties = {
  padding: "10px 17px",
  borderRadius: 999,
  border: 0,
  background: "#fff",
  color: INK,
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow: "0 1px 2px rgba(20,35,46,.07)",
};
