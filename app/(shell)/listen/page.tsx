import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";

import { ListeningClient } from "./listening-client";

export const dynamic = "force-dynamic";

/**
 * Listening practice hub — Parts 1 & 4 live (original scripts + exam-style TTS
 * audio, generated and graded on the AI engine; Parts 2 & 3 shown as coming
 * soon). Browser-direct engine calls like the CEFR hub, so the ~2 min
 * generate+synthesize runs off Vercel's serverless cap. Students only.
 */
export default async function ListenPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  return <ListeningClient />;
}
