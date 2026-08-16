import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * The old grading-review screen, kept only as a forwarder.
 *
 * IT USED TO BE A SECOND PLACE TO MARK. It showed the essay beside a form that
 * wrote the teacher's band into `gradings.overall_band` — the same column
 * `v_gradable_attempts` now reads as the AI's answer. Two marking paths writing
 * to different columns is how a centre ends up with a report that disagrees
 * with its own audit trail, and this one did it invisibly: the row still looked
 * well-formed afterwards, it just no longer said what the model had said.
 *
 * Marking lives on the learner's own report now, where the teacher and the
 * student read one artefact. Anyone holding a bookmark to this URL lands there.
 */
export default async function GradingReviewPage({ params }: PageProps) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;
  const supabase = await createClient();
  const { data: grading } = await supabase
    .from("gradings")
    .select("essay_id")
    .eq("id", id)
    .maybeSingle();

  // No grading, or not this org's: the marking queue is the honest landing
  // place — it says what is actually waiting rather than 404-ing on a bookmark.
  if (!grading?.essay_id) redirect("/console/marking");
  redirect(`/activities/essay/${grading.essay_id as string}`);
}
