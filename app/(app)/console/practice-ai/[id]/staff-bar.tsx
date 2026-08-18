"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { useActionFeedback } from "@/components/console/toast";
import {
  GOOD_BG,
  GOOD_INK,
  HAIRLINE,
  INK,
  MUTED,
  PAPER,
  SOFT,
  TROUGH,
  WARN_BG,
  WARN_INK,
} from "@/lib/lessons/theme";

import { setLessonStatus, type LessonActionState } from "./actions";
import { ShareModal, type GroupOption } from "./share-modal";

/**
 * The things only a teacher can do to a lesson: publish it, set it, retire it.
 *
 * A STICKY BAR above the lesson rather than a panel inside it. Two reasons.
 * What is below has to stay exactly the page a learner sees — mixing staff
 * controls into the content is how a "preview" stops being a preview. And the
 * lesson page is long: a teacher who has scrolled to the last exercise and
 * decided to set it should not have to scroll back up to do it.
 *
 * Sharing moved OUT of here and into the modal, where it belongs beside the
 * other way a lesson reaches people. It used to be a second row of controls
 * that was only ever relevant after publishing, competing with the row above it.
 */

const STATUS: Record<string, { label: string; bg: string; ink: string }> = {
  draft: { label: "Draft", bg: WARN_BG, ink: WARN_INK },
  published: { label: "Published", bg: GOOD_BG, ink: GOOD_INK },
  archived: { label: "Archived", bg: TROUGH, ink: SOFT },
};

export function LessonStaffBar({
  id,
  title,
  status,
  shareEnabled,
  shareToken,
  groups,
}: {
  id: string;
  title: string;
  status: "draft" | "published" | "archived";
  shareEnabled: boolean;
  shareToken: string | null;
  groups: GroupOption[];
}) {
  const [statusState, statusAction, statusPending] = useActionState(
    setLessonStatus,
    {} as LessonActionState,
  );
  const [shareOpen, setShareOpen] = useState(false);

  // Publishing opens the modal, because "published" on its own does nothing for
  // anybody — the decision a teacher has actually just made is that the lesson
  // is ready for people, and the next question is which people. Adjusted during
  // render rather than in an effect, the same way the console chrome closes its
  // panels.
  const [seenPublish, setSeenPublish] = useState<string | undefined>(undefined);
  if (statusState.ok && statusState.ok !== seenPublish) {
    setSeenPublish(statusState.ok);
    if (statusState.ok.startsWith("Published")) setShareOpen(true);
  }

  useActionFeedback(statusState, { keepOpen: true });

  const badge = STATUS[status] ?? STATUS.draft;

  return (
    <div
      className="pa-bar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 28px",
        background: "rgba(253,251,247,0.9)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: `1px solid ${HAIRLINE}`,
      }}
    >
      <Link href="/console/practice-ai" className="pa-ghost" style={{ ...pill, color: INK, textDecoration: "none" }}>
        ← Lessons
      </Link>

      <span
        style={{
          padding: "6px 14px",
          borderRadius: 999,
          background: badge.bg,
          color: badge.ink,
          fontSize: 13,
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        {badge.label}
      </span>

      <span
        className="pa-bar-hide"
        style={{
          fontSize: 14,
          color: SOFT,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </span>

      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        {status !== "published" ? (
          <form action={statusAction}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value="published" />
            <button type="submit" disabled={statusPending} className="pa-lift" style={raised}>
              {statusPending ? "…" : status === "archived" ? "Restore" : "Publish"}
            </button>
          </form>
        ) : (
          <>
            <button type="button" onClick={() => setShareOpen(true)} className="pa-lift" style={raised}>
              Set to a group
            </button>
            <form action={statusAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="status" value="archived" />
              <button type="submit" disabled={statusPending} className="pa-lift" style={raised}>
                Archive
              </button>
            </form>
          </>
        )}

        {/* The one thing on this bar a teacher does for themselves rather than
            to the lesson: see it the way the class will. */}
        <Link href={`/learn/${id}`} className="pa-dark" style={{ ...dark, textDecoration: "none" }}>
          Open practice →
        </Link>
      </div>

      <ShareModal
        lessonId={id}
        groups={groups}
        shareEnabled={shareEnabled}
        shareToken={shareToken}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      {statusState.error ? (
        <p
          style={{ flexBasis: "100%", margin: 0, fontSize: 13, color: WARN_INK }}
          role="alert"
        >
          {statusState.error}
        </p>
      ) : null}
    </div>
  );
}

const pill: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 16px",
  borderRadius: 999,
  border: 0,
  background: "transparent",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const raised: React.CSSProperties = {
  padding: "11px 18px",
  borderRadius: 999,
  border: 0,
  background: "#fff",
  color: MUTED,
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
  boxShadow: "0 1px 2px rgba(20,35,46,.06), 0 8px 18px -14px rgba(20,35,46,.4)",
};

const dark: React.CSSProperties = {
  padding: "11px 20px",
  borderRadius: 999,
  border: 0,
  background: INK,
  color: PAPER,
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
