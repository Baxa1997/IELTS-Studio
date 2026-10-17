import { engineClient } from "@/lib/engine/client";

import type { CefrPublicMode } from "./types";

// ---- Engine call -----------------------------------------------------------

/** Every engine call on this screen goes to the engine's `multilevel` namespace. */
export const callEngine = engineClient("multilevel");

/** What the marking route's refusals mean, in words a visitor can act on. */
const PUBLIC_ERRORS: Record<string, string> = {
  daily_done: "Today's free practice is already used. Sign in to get more free practices.",
  not_today: "This practice is no longer on today's list — open it again from the list.",
  rate_limited: "Too many free gradings from this network today. Sign in to keep practising.",
  busy: "The grader is very busy right now. Please try again in a few minutes.",
  too_short: "Write a little more before submitting.",
  too_long: "That answer is far longer than the task asks for.",
  unavailable: "Marking is not available right now. Please try again later.",
};

export async function postPublic<T>(mode: CefrPublicMode, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(mode.submitUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: mode.practiceKey, ...body }),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(PUBLIC_ERRORS[data.error ?? ""] ?? "Marking failed. Please try again.");
  return data;
}
