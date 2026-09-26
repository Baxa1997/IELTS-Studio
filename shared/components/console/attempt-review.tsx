import { requireOrgUser } from "@/lib/auth";
import { type AttemptKind } from "@/lib/console/attempts";
import { loadCenterSettings } from "@/lib/console/center-settings";
import { loadReview } from "@/lib/console/marking";
import { createClient } from "@/lib/supabase/server";

import { ReviewPanel } from "./review-panel";

/**
 * The marking footer, decided once and mounted on all four reports.
 *
 * A SERVER COMPONENT ON PURPOSE. Each report page adds one line and gets the
 * loading, the policy and the who-may-see-this rules for free. The alternative
 * — four pages each deriving `canReview` from role and override policy — is
 * four places for the rules to drift, and the one that drifts is the one that
 * shows a teacher a band they may not change or, worse, lets them change one
 * their centre said they may not.
 *
 * IT DOES NOT RENDER FOR A SOLO LEARNER. A personal-org learner has no teacher,
 * so "not yet reviewed by a teacher" would be a promise nobody made — it reads
 * as work being withheld rather than as a feature they are not part of. The
 * panel appears for centre accounts, and for anyone whose work already carries
 * a verdict.
 */
export async function AttemptReview({
  kind,
  refId,
  aiBand,
  aiCriteria,
}: {
  kind: AttemptKind;
  refId: string;
  aiBand: number | null;
  /** Per-criterion AI bands. Writing only; the other three store no breakdown. */
  aiCriteria?: Record<string, number | null>;
}) {
  const { profile } = await requireOrgUser();
  const supabase = await createClient();

  const [review, settings, orgRes] = await Promise.all([
    loadReview(kind, refId),
    loadCenterSettings(),
    supabase.from("organizations").select("kind").eq("id", profile.organization_id).maybeSingle(),
  ]);

  const isCenter = (orgRes.data?.kind as string | null) === "center";
  if (!isCenter && !review) return null;

  const isStaff = profile.role !== "student";
  const canReview =
    isStaff &&
    (settings.overridePolicy === "teacher"
      ? true
      : settings.overridePolicy === "admin_only"
        ? profile.role === "center_admin" || profile.role === "administrator"
        : false);

  // When a staff member cannot mark, say why rather than hiding the control —
  // a missing button is indistinguishable from a broken one.
  const lockedNote =
    isStaff && !canReview
      ? settings.overridePolicy === "nobody"
        ? "This centre has marking locked — the AI band stands. A centre admin can change that in Settings."
        : "Only a centre admin may correct a band at this centre."
      : undefined;

  return (
    <ReviewPanel
      kind={kind}
      refId={refId}
      aiBand={aiBand}
      aiCriteria={aiCriteria}
      review={review}
      canReview={canReview}
      lockedNote={lockedNote}
    />
  );
}
