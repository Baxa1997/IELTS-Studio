"use client";

import { useRouter } from "next/navigation";

import { ReadingRunner } from "./reading-runner";
import type { CefrPublicMode, ReadingPaper, WritingPaper } from "./types";
import { WritingRunner } from "./writing-runner";

// ---- The free daily practice (a visitor with no account) ---------------------

/**
 * One shared paper, Reading or Writing, in public mode.
 *
 * ⚠️ ITS OWN MODULE ON PURPOSE. It sat in `multilevel-client.tsx` beside the
 * signed-in hub, so the free page — the one a visitor with no account opens —
 * shipped the whole hub and its generate picker to run a single paper. Keep
 * the hub out of this file's imports.
 */
export function PublicCefrRunner({
  paper,
  publicMode,
}: {
  paper: ReadingPaper | WritingPaper;
  publicMode: CefrPublicMode;
}) {
  const router = useRouter();
  const exit = () => router.push(publicMode.exitHref);
  return paper.paper === "reading" ? (
    <ReadingRunner paper={paper} mode="full" regenBusy={false} onNew={exit} onExit={exit} publicMode={publicMode} />
  ) : (
    <WritingRunner paper={paper} regenBusy={false} onNew={exit} onExit={exit} publicMode={publicMode} />
  );
}
