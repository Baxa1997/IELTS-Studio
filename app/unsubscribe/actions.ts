"use server";

import { applyResubscribe } from "@/lib/marketing/unsubscribe";

/**
 * Put somebody back on the marketing list.
 *
 * NO SESSION CHECK, AND THE TOKEN IS THE WHOLE AUTHORISATION — the same
 * signed value that carried the unsubscribe. Somebody who can prove they hold
 * the link for this account may toggle that account's preference in either
 * direction; without the token this does nothing at all.
 */
export async function resubscribe(profileId: string, token: string): Promise<boolean> {
  return applyResubscribe(profileId, token);
}
