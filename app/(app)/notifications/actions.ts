"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Mark notifications read. RLS restricts the rows to the caller's own, and the
 * column grant restricts the write to `read_at` — so this cannot be turned into
 * a way to edit what a notification says.
 */
export async function markRead(formData: FormData): Promise<void> {
  await requireOrgUser();

  const id = String(formData.get("id") ?? "").trim();
  const supabase = await createClient();

  let q = supabase.from("notifications").update({ read_at: new Date().toISOString() });
  q = id ? q.eq("id", id) : q.is("read_at", null); // no id → mark all read
  await q;

  revalidatePath("/notifications");
  revalidatePath("/dashboard");
}
