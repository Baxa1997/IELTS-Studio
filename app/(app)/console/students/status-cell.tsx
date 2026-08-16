"use client";

import { useActionState, useState } from "react";

import { useActionFeedback } from "@/components/console/toast";
import {
  MEMBER_STATUSES,
  STUDENT_STATUS_LABEL,
  STUDENT_STATUS_NOTE,
  type MemberStatus,
} from "@/lib/console/status";

import { setStudentStatus } from "../groups/actions";
import { type GroupFormState } from "../groups/actions";

/**
 * A student's status, changed in place.
 *
 * IN THE TABLE, NOT BEHIND A PAGE. Pausing a student is something a receptionist
 * does while the parent is still on the phone, and every extra click is a click
 * where they decide to do it later — which means never, which means the student
 * sits in the gone-quiet list and the attendance denominator all term.
 *
 * The consequence of each choice is spelled out rather than implied, because
 * "paused" and "left" look interchangeable until someone discovers which one
 * stopped the invoices.
 */

const INK = "#16162E";
const FAINT = "#93919F";

const TINT: Record<MemberStatus, { bg: string; fg: string }> = {
  active: { bg: "#EAF4EE", fg: "#16794C" },
  paused: { bg: "#FDF2E3", fg: "#8A5A12" },
  left: { bg: "#F1F0EC", fg: "#6E6C87" },
};

export function StudentStatusCell({
  studentId,
  status,
}: {
  studentId: string;
  status: MemberStatus;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(setStudentStatus, {} as GroupFormState);
  useActionFeedback(state, { keepOpen: true });

  const tint = TINT[status];

  if (!open) {
    return (
      <button
        type="button"
        // The row is a link to the student; opening the picker must not follow it.
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        title="Change status"
        style={{
          background: tint.bg,
          color: tint.fg,
          border: 0,
          borderRadius: 20,
          padding: "3px 10px",
          fontFamily: "inherit",
          fontSize: 11.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {STUDENT_STATUS_LABEL[status]}
      </button>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{ display: "flex", flexDirection: "column", gap: 4 }}
    >
      <div style={{ display: "flex", gap: 4 }}>
        {MEMBER_STATUSES.map((s) => (
          <form key={s} action={action}>
            <input type="hidden" name="student_id" value={studentId} />
            <input type="hidden" name="status" value={s} />
            <button
              type="submit"
              disabled={pending || s === status}
              title={STUDENT_STATUS_NOTE[s]}
              style={{
                background: s === status ? TINT[s].bg : "#fff",
                color: s === status ? TINT[s].fg : INK,
                border: `1px solid ${s === status ? TINT[s].fg : "#E4E2DC"}`,
                borderRadius: 7,
                padding: "4px 8px",
                fontFamily: "inherit",
                fontSize: 11.5,
                fontWeight: 500,
                cursor: s === status ? "default" : "pointer",
                opacity: pending ? 0.6 : 1,
              }}
            >
              {STUDENT_STATUS_LABEL[s]}
            </button>
          </form>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setOpen(false)}
        style={{
          alignSelf: "flex-start",
          background: "transparent",
          border: 0,
          padding: 0,
          fontFamily: "inherit",
          fontSize: 11,
          color: FAINT,
          cursor: "pointer",
        }}
      >
        cancel
      </button>
    </div>
  );
}
