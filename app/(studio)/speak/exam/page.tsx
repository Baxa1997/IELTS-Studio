import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";

import { ExamPage } from "./exam-client";

export const dynamic = "force-dynamic";

/** The live mock test on its own page. A test deserves its own address: you
 *  arrive here to sit it, and nothing else on the page competes with it. */
export default async function SpeakingExamPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  return <ExamPage />;
}
