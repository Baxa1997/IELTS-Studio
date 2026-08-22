"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { createStaffLink, unlinkStaff } from "@/lib/telegram/staff";

export interface StaffLinkState {
  code?: string;
  url?: string | null;
  error?: string;
  ok?: string;
}

/** A code that turns somebody's Telegram into their own console, read-only. */
export async function connectMyTelegram(): Promise<StaffLinkState> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return { error: "Not allowed." };
  const link = await createStaffLink(profile);
  revalidatePath("/console/assistant");
  return { code: link.code, url: link.url };
}

export async function disconnectMyTelegram(): Promise<StaffLinkState> {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") return { error: "Not allowed." };
  await unlinkStaff(profile);
  revalidatePath("/console/assistant");
  return { ok: "Disconnected." };
}
