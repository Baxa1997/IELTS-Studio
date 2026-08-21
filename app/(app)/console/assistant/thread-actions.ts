"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { startNewThread } from "@/lib/console/assistant-thread";

/** "New chat". The old thread is kept — putting a conversation aside is not
 *  the same as destroying the record of what you asked. */
export async function newThread(): Promise<void> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return;
  await startNewThread(profile);
  revalidatePath("/console/assistant");
}
