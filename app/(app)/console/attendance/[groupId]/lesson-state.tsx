"use client";

import { useActionState, useState } from "react";
import { FiLock, FiSlash, FiUnlock } from "react-icons/fi";

import { useActionFeedback } from "@/components/console/toast";

import {
  cancelLesson,
  restoreLesson,
  unlockRegister,
  type ActionState,
} from "../../center-actions";

/**
 * The two things that can be true of a lesson besides "it happened": it was
 * written off, or its register has closed.
 *
 * Both live here, above the register, because this is where a teacher is
 * standing when they find out — they open Tuesday's register, remember the
 * lesson never ran, and need somewhere to say so. Sending them to a settings
 * page is how a center ends up with a month of unmarked registers instead.
 */

const INK = "#16162E";
const MUTED = "#6E6C87";
const RED = "#A63A30";

const banner = (tint: string, edge: string, ink: string): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 11,
  flexWrap: "wrap",
  padding: "12px 16px",
  marginBottom: 14,
  background: tint,
  border: `1px solid ${edge}`,
  borderRadius: 10,
  fontSize: 13,
  color: ink,
});

const button = (primary: boolean): React.CSSProperties => ({
  marginLeft: "auto",
  background: primary ? "#fff" : "transparent",
  border: `1px solid ${primary ? "#DDD9D0" : "transparent"}`,
  borderRadius: 8,
  padding: "7px 12px",
  fontFamily: "inherit",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  color: INK,
});

export function CancelledBanner({
  groupId,
  heldOn,
  reason,
}: {
  groupId: string;
  heldOn: string;
  reason: string;
}) {
  const [state, action, pending] = useActionState(restoreLesson, {} as ActionState);
  useActionFeedback(state, { keepOpen: true });

  return (
    <form action={action} style={banner("#F4F3EF", "#C5C4BE", MUTED)}>
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="held_on" value={heldOn} />
      <FiSlash size={15} aria-hidden />
      <span>
        <strong style={{ fontWeight: 600, color: INK }}>This lesson was cancelled</strong> — {reason}
        . It is out of the attendance rate and out of the fee divisor.
      </span>
      <button type="submit" disabled={pending} style={button(true)}>
        {pending ? "Restoring…" : "It did happen — restore it"}
      </button>
    </form>
  );
}

export function LockedBanner({
  sessionId,
  lockedOn,
  canUnlock,
}: {
  /** Null when nobody ever marked it — there is no row to reopen. */
  sessionId: string | null;
  lockedOn: string;
  canUnlock: boolean;
}) {
  const [state, action, pending] = useActionState(unlockRegister, {} as ActionState);
  useActionFeedback(state, { keepOpen: true });

  return (
    <form action={action} style={banner("#F4F3EF", "#C5C4BE", MUTED)}>
      <input type="hidden" name="session_id" value={sessionId ?? ""} />
      <FiLock size={15} aria-hidden />
      <span>
        <strong style={{ fontWeight: 600, color: INK }}>This register closed on {lockedOn}.</strong>{" "}
        {canUnlock
          ? "You can reopen it for 24 hours; the unlock goes in the center's activity log."
          : "A center admin can reopen it."}
      </span>
      {canUnlock && sessionId ? (
        <button type="submit" disabled={pending} style={button(true)}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <FiUnlock size={13} aria-hidden />
            {pending ? "Reopening…" : "Reopen for 24 hours"}
          </span>
        </button>
      ) : null}
    </form>
  );
}

export function CancelLesson({ groupId, heldOn }: { groupId: string; heldOn: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(cancelLesson, {} as ActionState);
  useActionFeedback(state, { keepOpen: true });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          fontFamily: "inherit",
          fontSize: 12.5,
          color: MUTED,
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        This lesson didn&apos;t happen
      </button>
    );
  }

  return (
    <form
      action={action}
      style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
    >
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="held_on" value={heldOn} />
      <input
        name="reason"
        required
        maxLength={300}
        autoFocus
        placeholder="Why? e.g. teacher ill"
        style={{
          border: "1px solid #DDD9D0",
          borderRadius: 8,
          padding: "7px 10px",
          fontFamily: "inherit",
          fontSize: 12.5,
          minWidth: 190,
          color: INK,
        }}
      />
      <button
        type="submit"
        disabled={pending}
        style={{
          background: RED,
          color: "#fff",
          border: 0,
          borderRadius: 8,
          padding: "7px 12px",
          fontFamily: "inherit",
          fontSize: 12.5,
          fontWeight: 600,
          cursor: pending ? "wait" : "pointer",
        }}
      >
        {pending ? "Cancelling…" : "Cancel it"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{
          background: "transparent",
          border: 0,
          fontFamily: "inherit",
          fontSize: 12.5,
          color: MUTED,
          cursor: "pointer",
        }}
      >
        Never mind
      </button>
    </form>
  );
}
