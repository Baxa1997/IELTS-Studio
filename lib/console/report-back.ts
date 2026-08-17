import "server-only";

import type { Profile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Where "back" goes from a report, which depends on who is reading it.
 *
 * THE FOUR REPORT PAGES ARE SHARED ON PURPOSE. `/activities/essay/…`,
 * `/activities/reading/…`, `/listen/results/…` and `/speak/mock/…` gate on RLS
 * rather than on role, so a teacher and their student look at one artefact —
 * which is the only reason the band a parent is shown and the band a teacher
 * signed cannot drift apart.
 *
 * The cost of that sharing was the back link. All four hardcoded the LEARNER's
 * destination — "← Activities", "← All results", "← Speaking" — so a teacher
 * who opened a report from a student's page was offered a link to their own
 * activity list, which for staff is empty. There was no way back to the student
 * they had been looking at. The browser's Back button was the only exit, and
 * working through a marking queue that way is miserable.
 *
 * DERIVED, NOT PASSED IN A QUERY PARAM. A `?from=` would be lost the moment a
 * report is opened in a new tab, linked to in a message, or reloaded — and it
 * would be a URL supplied by the client, which is a redirect waiting to be
 * abused. Who the viewer is and whose work this is are both known on the
 * server, and they are all the answer needs.
 */
export interface BackLink {
  href: string;
  label: string;
}

export async function reportBackLink(args: {
  viewer: Profile;
  /** Whose attempt this is. */
  studentId: string;
  /** The learner's own destination, which differs per skill. */
  learnerHref: string;
  learnerLabel: string;
}): Promise<BackLink> {
  const { viewer, studentId, learnerHref, learnerLabel } = args;

  // Their own work: the learner's history, wherever that skill keeps it.
  if (viewer.id === studentId) return { href: learnerHref, label: learnerLabel };

  // Anyone else reading this is staff — RLS would not have let them load the
  // page otherwise. Send them to the student, which is where they came from
  // and the only place the rest of that student's work is.
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", studentId)
    .maybeSingle();

  const name = (data?.full_name as string | null)?.trim();
  return {
    href: `/console/students/${studentId}`,
    // Naming them is the difference between a link you trust and one you
    // hover to find out where it goes.
    label: name ? `Back to ${name}` : "Back to the student",
  };
}
