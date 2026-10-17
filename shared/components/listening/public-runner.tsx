"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { FreeTrialCopy } from "@/lib/free-practice/copy";
import type { Grade, RenderView } from "./types";

import { Runner } from "./runner";

/**
 * ⚠️ ITS OWN MODULE ON PURPOSE: beside the hub in `listening-client.tsx`, the
 * free page shipped the whole signed-in library to play one practice. Keep the
 * hub out of this file's imports (pinned by `public-runner.test.ts`).
 *
 * Today's free Listening practice for a visitor with no account (/listen/free).
 *
 * The signed-in runner, unchanged, fed a `public` source: marking goes to the
 * app's public route (which checks the part really is this visitor's for
 * today), there is no autosave (the autosave only ever runs for `library`),
 * no "practice again", and — the owner's rule — the recommendation to sign in
 * for more free practices: a strip while listening, a card on the review.
 */
export function PublicListeningRunner({
  view,
  practiceKey,
  gradeUrl,
  exitHref,
  copy,
}: {
  view: RenderView;
  /** The practice's key on the visitor's list — what the marking route checks.
   *  ⚠️ NOT `view.id`: the engine names a part `id:part`, the list `id_part`,
   *  and sending the view's id made every free part come back "not today". */
  practiceKey: string;
  gradeUrl: string;
  exitHref: string;
  copy: FreeTrialCopy;
}) {
  const router = useRouter();
  const grade = useCallback(
    async (answers: Record<string, string>): Promise<Grade> => {
      const res = await fetch(gradeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: practiceKey, answers }),
      });
      const body = (await res.json().catch(() => ({}))) as { grade?: Grade; error?: string };
      if (res.ok && body.grade) return body.grade;
      throw new Error(
        body.error === "daily_done"
          ? "You've already done today's free practice — a new one arrives tomorrow."
          : body.error === "not_today"
            ? "Today's practice has changed — reload the page to get the new one."
            : "Couldn't mark your answers. Please try again.",
      );
    },
    [gradeUrl, practiceKey],
  );
  const publicRun = useMemo(() => ({ grade, copy }), [grade, copy]);
  return <Runner view={view} source="public" onExit={() => router.push(exitHref)} publicRun={publicRun} />;
}
