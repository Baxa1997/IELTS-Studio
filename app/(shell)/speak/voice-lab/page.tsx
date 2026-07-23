import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";

import { VoiceLabClient } from "./voice-lab-client";

export const dynamic = "force-dynamic";

/** Voice ear-test lab — an internal tool for choosing the persona voices by ear.
 *  Not linked from the app; reachable only by URL. Students only (same gate as
 *  the rest of /speak). */
export default async function VoiceLabPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  return <VoiceLabClient />;
}
