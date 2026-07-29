import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";

import { TutorRoom } from "@/app/(shell)/speak/tutor-room";

export const dynamic = "force-dynamic";

/** The speaking tutor: a live voice lesson. Separate from the mock exam — the
 *  exam never teaches, this only teaches.
 *
 *  `?kind=` is the chip tapped on the hub (talk, ielts, interview, …) so the
 *  room opens already set to it and the learner only has to press start. */
export default async function TutorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  const sp = await searchParams;
  const kind = typeof sp.kind === "string" ? sp.kind : undefined;
  return <TutorRoom initialKind={kind} />;
}
