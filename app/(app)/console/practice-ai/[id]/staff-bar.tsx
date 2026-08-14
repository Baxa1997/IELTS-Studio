"use client";

import { useActionState, useState } from "react";

import { useActionFeedback } from "@/components/console/toast";

import {
  rotateShareLink,
  setLessonSharing,
  setLessonStatus,
  type LessonActionState,
} from "./actions";

/**
 * The things only a teacher can do to a lesson: publish it, share it, retire it.
 *
 * Sits above the lesson rather than inside it, so what is below stays exactly
 * the page a learner sees. Mixing staff controls into the content is how a
 * "preview" stops being a preview.
 */

const INK = "#15171C";
const MUTED = "#5C616C";
const FAINT = "#8B909B";
const LINE = "#E7E5DF";
const EMBER = "#E85A2C";
const GREEN = "#16794C";

const STATUS_COPY: Record<string, { label: string; tone: string; bg: string; note: string }> = {
  draft: {
    label: "Draft",
    tone: "#A9721F",
    bg: "#FBEEE0",
    note: "Only you can see this. Publish it to set it to a class or share a link.",
  },
  published: {
    label: "Published",
    tone: GREEN,
    bg: "#EAF4EE",
    note: "Ready to set as homework or share.",
  },
  archived: {
    label: "Archived",
    tone: "#7C7A93",
    bg: "#F1F0EB",
    note: "Retired. Anyone who already did it keeps their result.",
  },
};

export function LessonStaffBar({
  id,
  status,
  shareEnabled,
  shareToken,
  hasAttempts,
}: {
  id: string;
  status: "draft" | "published" | "archived";
  shareEnabled: boolean;
  shareToken: string | null;
  hasAttempts: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState(
    setLessonStatus,
    {} as LessonActionState,
  );
  const [shareState, shareAction, sharePending] = useActionState(
    setLessonSharing,
    {} as LessonActionState,
  );
  const [rotateState, rotateAction, rotatePending] = useActionState(
    rotateShareLink,
    {} as LessonActionState,
  );
  const [copied, setCopied] = useState(false);

  useActionFeedback(statusState, { keepOpen: true });
  useActionFeedback(shareState, { keepOpen: true });
  useActionFeedback(rotateState, { keepOpen: true });

  const copy = STATUS_COPY[status];
  const shareUrl =
    shareToken && typeof window !== "undefined" ? `${window.location.origin}/p/${shareToken}` : null;

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 820,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <span
          style={{
            background: copy.bg,
            color: copy.tone,
            borderRadius: 999,
            padding: "4px 12px",
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          {copy.label}
        </span>
        <span style={{ fontSize: 12.5, color: MUTED, flex: 1, minWidth: 200 }}>{copy.note}</span>

        <span style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {status !== "published" ? (
            <form action={statusAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value="published" />
              <button type="submit" disabled={statusPending} style={primary}>
                {statusPending ? "…" : "Publish"}
              </button>
            </form>
          ) : null}
          {status === "published" ? (
            <form action={statusAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value="archived" />
              <button type="submit" disabled={statusPending} style={ghost}>
                Archive
              </button>
            </form>
          ) : null}
          {status === "archived" ? (
            <form action={statusAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value="published" />
              <button type="submit" disabled={statusPending} style={ghost}>
                Restore
              </button>
            </form>
          ) : null}
        </span>
      </div>

      {/* Sharing only makes sense once it is published — a draft handed to a
          stranger is a half-finished lesson with your name on it. */}
      {status === "published" ? (
        <div
          style={{
            borderTop: `1px solid #F2F0EB`,
            paddingTop: 12,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <form action={shareAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="enable" value={shareEnabled ? "off" : "on"} />
            <button type="submit" disabled={sharePending} style={shareEnabled ? ghost : primary}>
              {shareEnabled ? "Turn the link off" : "Share a link"}
            </button>
          </form>

          {shareEnabled && shareUrl ? (
            <>
              <code
                style={{
                  flex: 1,
                  minWidth: 220,
                  fontSize: 12.5,
                  color: MUTED,
                  background: "#FAFAF8",
                  border: `1px solid ${LINE}`,
                  borderRadius: 8,
                  padding: "7px 10px",
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
                {copied ? "Copied" : "Copy"}
              </button>
              <form action={rotateAction}>
                <input type="hidden" name="id" value={id} />
                <button
                  type="submit"
                  disabled={rotatePending}
                  title="Mint a new link. Every link you have already sent stops working."
                  style={{ ...ghost, color: EMBER, borderColor: "rgba(232,90,44,.35)" }}
                >
                  New link
                </button>
              </form>
            </>
          ) : null}

          {shareEnabled ? (
            <span style={{ flexBasis: "100%", fontSize: 12, color: FAINT }}>
              Results from this link stay private — nothing anyone does here reaches your reports.
            </span>
          ) : null}
        </div>
      ) : null}

      {hasAttempts ? (
        <p style={{ margin: 0, fontSize: 12, color: FAINT, borderTop: `1px solid #F2F0EB`, paddingTop: 10 }}>
          Someone has already done this lesson, so its content is frozen — a score has to mean the
          lesson they actually sat. Make a new one to change anything.
        </p>
      ) : null}

      {statusState.error || shareState.error || rotateState.error ? (
        <p style={{ margin: 0, fontSize: 12.5, color: "#A63A30" }} role="alert">
          {statusState.error ?? shareState.error ?? rotateState.error}
        </p>
      ) : null}
    </div>
  );
}

const primary: React.CSSProperties = {
  border: 0,
  borderRadius: 9,
  background: INK,
  color: "#fff",
  padding: "8px 15px",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  border: `1px solid ${LINE}`,
  borderRadius: 9,
  background: "#fff",
  color: MUTED,
  padding: "8px 13px",
  fontFamily: "inherit",
  fontSize: 13,
  cursor: "pointer",
};
