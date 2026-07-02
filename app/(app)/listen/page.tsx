import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";

import { ListeningHub } from "./listening-hub";

export const dynamic = "force-dynamic";

/**
 * Listening preview hub — UI only (see CLAUDE.md: Speaking/Listening are
 * roadmap, built after Writing + Reading are solid). No generation, audio, or
 * grading yet; this previews the real 4-part exam structure. Students only.
 */
export default async function ListenPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  return <ListeningHub />;
}
