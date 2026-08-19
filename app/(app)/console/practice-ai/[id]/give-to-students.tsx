"use client";

import { useActionState, useState } from "react";

import { EMBER } from "@/lib/lessons/theme";

import { setLessonStatus, type LessonActionState } from "./actions";
import { ShareModal, type GroupOption } from "./share-modal";

/**
 * The one button that gets a lesson in front of a class.
 *
 * WHY IT EXISTS. Handing a lesson out took two controls that did not look
 * related and were not next to each other: "Publish" in the top bar, and then —
 * only after publishing, and only if you noticed it had changed — "Set to a
 * group" in the same bar. Both server actions REQUIRE the published status, so
 * a teacher on a draft who found the group picker at all got nothing from it.
 * The commonest thing anyone wants to do with a finished lesson was the least
 * discoverable thing on the page.
 *
 * So it is one button, in the panel a teacher is already reading, that does
 * whatever is needed: publishes first when the lesson is a draft, then opens
 * the picker. The top bar keeps its status controls for the deliberate cases
 * (archiving, restoring) — this is the path, not another control competing
 * with them.
 */
export function GiveToStudents({
  lessonId,
  status,
  groups,
  shareEnabled,
  shareToken,
}: {
  lessonId: string;
  status: "draft" | "published" | "archived";
  groups: GroupOption[];
  shareEnabled: boolean;
  shareToken: string | null;
}) {
  const [state, action, pending] = useActionState(setLessonStatus, {} as LessonActionState);
  const [open, setOpen] = useState(false);

  // Publishing is a means here, not the goal — the teacher pressed a button
  // that says "give it to students", so the picker has to follow by itself.
  // Adjusted during render rather than in an effect, the way the console
  // chrome closes its panels.
  const [seen, setSeen] = useState<string | undefined>(undefined);
  if (state.ok && state.ok !== seen) {
    setSeen(state.ok);
    setOpen(true);
  }

  const label = pending
    ? "Publishing…"
    : status === "published"
      ? "Give it to students"
      : "Publish & give to students";

  return (
    <>
      {status === "published" ? (
        <button type="button" onClick={() => setOpen(true)} className="pa-ember" style={button}>
          {label}
        </button>
      ) : (
        <form action={action}>
          <input type="hidden" name="id" value={lessonId} />
          <input type="hidden" name="status" value="published" />
          <button type="submit" disabled={pending} className="pa-ember" style={button}>
            {label}
          </button>
        </form>
      )}

      <p style={hint}>
        {status === "published"
          ? "Set it to a class, or copy a link anyone can open."
          : "Publishes it, then asks which class gets it."}
      </p>

      <ShareModal
        lessonId={lessonId}
        groups={groups}
        shareEnabled={shareEnabled}
        shareToken={shareToken}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const button: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "13px 14px",
  borderRadius: 999,
  border: 0,
  background: EMBER,
  color: "#fff",
  fontFamily: "inherit",
  fontSize: 15,
  fontWeight: 700,
  textAlign: "center",
  cursor: "pointer",
  boxShadow: "0 10px 24px -10px rgba(236,106,69,.8)",
};

const hint: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: 12,
  lineHeight: 1.45,
  color: "#8fa1aa",
  textAlign: "center",
};
