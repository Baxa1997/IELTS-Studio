import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";

import { SpeakingClient } from "./speaking-client";

export const dynamic = "force-dynamic";

/**
 * Speaking practice hub (BETA) — Part 2 push-to-talk live; Parts 1 & 3 with a
 * live AI examiner are phase 2 (docs/ielts-speaking-plan.md in the engine
 * repo). Browser-direct engine calls like Listening/CEFR. Students only.
 */
export default async function SpeakPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  // ?card=<library_id> — the revision loop: "practise this card again" from a
  // report deep-links straight into quick practice with that exact cue card.
  const sp = await searchParams;
  const card = typeof sp.card === "string" ? sp.card : null;
  return <SpeakingClient initialCardId={card} />;
}
