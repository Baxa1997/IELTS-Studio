"use client";

import { useActionState, useState } from "react";
import { createPortal } from "react-dom";

import { assignLessonToGroup, setLessonSharing, type LessonActionState } from "./actions";

/**
 * What happens after you publish: the two ways a lesson reaches people.
 *
 * It opens on publish rather than waiting to be found, because publishing is
 * the moment a teacher has decided the lesson is good — and "published" on its
 * own does nothing for anybody. The two routes are deliberately shown side by
 * side, because they differ in a way that matters and is easy to get wrong:
 * a group gets marked and reported on, a link does not.
 *
 * A PORTAL, like the platform console's plan panel, for the same reason: this
 * opens from a page that scrolls inside its own container, and an absolutely
 * positioned panel gets clipped by an ancestor's overflow no matter what
 * z-index it carries.
 */

const INK = "#15171C";
const MUTED = "#5C616C";
const FAINT = "#8B909B";
const LINE = "#C5C4BE";
const EMBER = "#E85A2C";
const GREEN = "#16794C";

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
  const [picked, setPicked] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

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
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(16,18,40,.38)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 100%)",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 24px 60px rgba(20,25,50,.28)",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                color: GREEN,
                fontWeight: 700,
              }}
            >
              Published
            </div>
            <h2
              style={{
                fontFamily: "var(--font-serif4), Georgia, serif",
                fontSize: 22,
                fontWeight: 700,
                color: INK,
                margin: "6px 0 0",
              }}
            >
              Who gets it?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 0,
              background: "transparent",
              fontSize: 20,
              color: FAINT,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* ── set to a group ─────────────────────────────────────────────── */}
        <form action={assignAction} style={{ marginTop: 20 }}>
          <input type="hidden" name="id" value={lessonId} />
          <div style={{ fontSize: 15, fontWeight: 650, color: INK }}>Set it to a group</div>
          <p style={{ fontSize: 13, color: MUTED, margin: "3px 0 12px", lineHeight: 1.5 }}>
            It appears in their assignments. Written answers are checked by AI, and you get every
            score and mistake.
          </p>

          {groups.length === 0 ? (
            <p style={{ fontSize: 13, color: FAINT, margin: "0 0 8px" }}>
              You have no groups yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              {groups.map((g) => {
                const on = picked.includes(g.id);
                return (
                  <label
                    key={g.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      border: `1px solid ${on ? EMBER : LINE}`,
                      background: on ? "rgba(232,90,44,.06)" : "#fff",
                      borderRadius: 10,
                      padding: "10px 13px",
                      cursor: "pointer",
                      fontSize: 14,
                      color: INK,
                    }}
                  >
                    <input
                      type="checkbox"
                      name="group_id"
                      value={g.id}
                      checked={on}
                      onChange={() => toggle(g.id)}
                    />
                    <span style={{ flex: 1 }}>{g.name}</span>
                    <span style={{ fontSize: 12.5, color: FAINT }}>
                      {g.students} student{g.students === 1 ? "" : "s"}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <label style={{ fontSize: 12.5, color: MUTED }}>
              Due (optional)
              <input type="date" name="due_at" style={{ ...field, marginTop: 4, width: 165 }} />
            </label>
            <label style={{ fontSize: 12.5, color: MUTED, flex: 1, minWidth: 180 }}>
              A note for them (optional)
              <input
                name="instructions"
                placeholder="Do this before Thursday."
                style={{ ...field, marginTop: 4, width: "100%" }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={assigning || picked.length === 0}
            style={{
              marginTop: 14,
              border: 0,
              borderRadius: 10,
              background: picked.length === 0 ? "#DAD7D0" : EMBER,
              color: "#fff",
              padding: "10px 18px",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
              cursor: assigning || picked.length === 0 ? "default" : "pointer",
            }}
          >
            {assigning
              ? "Setting…"
              : picked.length > 1
                ? `Set to ${picked.length} groups`
                : "Set as homework"}
          </button>
          {assignState.ok ? (
            <p style={{ fontSize: 13, color: GREEN, margin: "10px 0 0" }}>{assignState.ok}</p>
          ) : null}
          {assignState.error ? (
            <p style={{ fontSize: 13, color: "#A63A30", margin: "10px 0 0" }} role="alert">
              {assignState.error}
            </p>
          ) : null}
        </form>

        <hr style={{ border: 0, borderTop: `1px solid ${LINE}`, margin: "22px 0" }} />

        {/* ── or share a link ────────────────────────────────────────────── */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 650, color: INK }}>Or share a link</div>
          <p style={{ fontSize: 13, color: MUTED, margin: "3px 0 12px", lineHeight: 1.5 }}>
            Anyone can open it, no account needed. Nothing they do reaches your reports, and their
            written answers are not AI-checked — they see the model answer instead.
          </p>

          {shareEnabled && shareUrl ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <code
                style={{
                  flex: 1,
                  minWidth: 200,
                  fontSize: 12.5,
                  color: MUTED,
                  background: "#FAFAF8",
                  border: `1px solid ${LINE}`,
                  borderRadius: 8,
                  padding: "9px 11px",
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
                style={ghost}
              >
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          ) : (
            <form action={shareAction}>
              <input type="hidden" name="id" value={lessonId} />
              <input type="hidden" name="enable" value="on" />
              <button type="submit" disabled={sharing} style={ghost}>
                {sharing ? "…" : "Create a link"}
              </button>
            </form>
          )}
          {shareState.error ? (
            <p style={{ fontSize: 13, color: "#A63A30", margin: "10px 0 0" }} role="alert">
              {shareState.error}
            </p>
          ) : null}
        </div>

        <button type="button" onClick={onClose} style={{ ...ghost, marginTop: 22, width: "100%" }}>
          Done
        </button>
      </div>
    </div>,
    document.body,
  );
}

const field: React.CSSProperties = {
  border: `1px solid ${LINE}`,
  borderRadius: 8,
  padding: "8px 10px",
  fontFamily: "inherit",
  fontSize: 13.5,
  color: INK,
  background: "#fff",
};

const ghost: React.CSSProperties = {
  border: `1px solid ${LINE}`,
  borderRadius: 10,
  background: "#fff",
  color: MUTED,
  padding: "10px 16px",
  fontFamily: "inherit",
  fontSize: 14,
  cursor: "pointer",
};
