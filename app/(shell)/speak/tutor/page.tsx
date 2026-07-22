import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";

import { TutorRoom } from "../tutor-room";

export const dynamic = "force-dynamic";

/** The speaking tutor: a live voice lesson. Separate from the mock exam — the
 *  exam never teaches, this only teaches. */
export default async function TutorPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  return <TutorRoom />;
}
