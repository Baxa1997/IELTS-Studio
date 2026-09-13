import { redirect } from "next/navigation";

import { type Tone } from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { KIND_LABEL } from "@/lib/console/attempts";
import {
  loadPracticeBoard,
  type PracticeBoardRow,
  type PracticeStatus,
} from "@/lib/console/practice-board";

import { PracticeGallery, type GalleryItem } from "@/components/practice/gallery";

import { RemindButton } from "./remind-button";

export const dynamic = "force-dynamic";

const STATUS: Record<PracticeStatus, { label: string; tone: Tone }> = {
  set: { label: "Set", tone: "indigo" },
  overdue: { label: "Overdue", tone: "red" },
  complete: { label: "All in", tone: "green" },
};

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/**
 * Practice across the whole centre — what has been set, and is it landing.
 *
 * ⚠️ THE PRACTICE LIBRARY IS NO LONGER ON THIS PAGE. The shelf — §9's "kept so
 * the same paper can be set again" — used to sit under the board, on the
 * argument that "is what we set landing" and "what do we already have" are the
 * two questions a teacher has when they sit down to set work. The owner removed
 * it when this page was cut back to the reference layout. It is not deleted,
 * only unmounted: `LibraryPanel`, `loadLibrary` and `libraryFacets` are all
 * still there, so putting it back is an import and six lines of JSX.
 *
 * THE ALERT FINALLY HAS SOMEWHERE TO GO. "2 groups have no practice set" has
 * been on the Overview with no destination since it was written; §2 of the
 * restructure names that as the gap. The groups with nothing set are the first
 * thing on this page, above the table, because they are the only rows here that
 * represent work not happening at all.
 *
 * Filtering is done in the URL rather than in the browser: this table is small
 * (a centre sets tens of practices a term, not thousands) and a filtered view
 * that can be sent to a colleague is worth more than a keystroke saved.
 */
export default async function PracticePage() {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const board = await loadPracticeBoard(profile);

  return (
    <div>
      {/* ⚠️ EVERYTHING THAT USED TO SIT ABOVE THIS GRID IS GONE, at the owner's
          instruction, and it is worth recording what went so nobody puts it
          back by halves:

            - the four KPIs (set / handed in / marked / overdue);
            - the "N groups have no practice at all" card, which the Overview's
              alert used to point at — that alert now has no destination again;
            - the URL-filter toolbar (group / teacher / skill / status).

          The toolbar's job did not disappear with it. The grid searches title
          AND byline, and the byline carries the group and the teacher, so those
          two are found by typing them. Skill is the chip row. Status is the
          Filter select — which is why the gallery grew a second filter axis
          rather than this page losing "show me what is overdue".

          WHAT IS GENUINELY LOST is the shareable filtered URL: the filters live
          in the browser now, so a colleague cannot be sent a link to "overdue in
          Group B". That was a deliberate feature of this page once. If it is
          wanted back, the fix is to lift the grid's state into searchParams —
          not to bring the old toolbar back alongside it. */}
      <PracticeGallery
        title="Practice"
        subtitle={
          board.rows.length === 0
            ? "Nothing has been set yet — practice appears here the moment a group is given some."
            : `${board.rows.length} set across ${board.groups.length} group${board.groups.length === 1 ? "" : "s"}.`
        }
        items={board.rows.map(toGalleryItem)}
        categories={BOARD_CATEGORIES}
        statusLabel="All statuses"
        statuses={BOARD_STATUSES}
        emptyTitle="Nothing set yet"
        emptyNote="Practice appears here the moment a group is given some."
        bleed
      />
    </div>
  );
}

/** The Filter select's options — the three states a practice can be in. */
const BOARD_STATUSES = ["Set", "Overdue", "All in"];

/** The chip row. Skills in the order the product teaches them; the gallery
 *  drops any this centre has never set. */
const BOARD_CATEGORIES = ["Writing", "Reading", "Listening", "Speaking", "Lesson"];

/** A board row → the shared gallery's flat shape. */
function toGalleryItem(r: PracticeBoardRow): GalleryItem {
  const pct = r.expected > 0 ? Math.round((r.handedIn / r.expected) * 100) : 0;
  const label = KIND_LABEL[r.skill] ?? "Practice";

  return {
    id: r.assignmentId,
    href: `/console/groups/${r.groupId}/assignments/${r.assignmentId}`,
    title: r.title,
    byline: `${r.groupName} · ${r.teacherName ?? "no teacher"} · set ${dateFmt(r.setOn)}`,
    tone: (["writing", "reading", "listening", "speaking"].includes(r.skill)
      ? r.skill
      : "lesson") as GalleryItem["tone"],
    category: label,
    /* THE FACE IS THE COMPLETION, NOT THE BAND, and that is the difference
       between this grid and the other three. They look back at work that is
       finished, so the band is the answer. This page asks whether what was set
       is LANDING — the median band of four hand-ins out of twenty says nothing
       until the twenty are in. */
    headline: `${pct}%`,
    headnote: `${r.handedIn}/${r.expected} handed in`,
    badge: STATUS[r.status].label,
    status: STATUS[r.status].label,
    stats: [
      r.handedIn > 0 ? `${r.marked}/${r.handedIn} marked` : "nothing to mark yet",
      r.medianBand != null ? `median ${r.medianBand.toFixed(1)}` : null,
    ].filter((x): x is string => Boolean(x)),
    date: r.setOn,
    value: r.medianBand,
    // Only where it would do something — a reminder to nobody is a button that
    // teaches people to ignore buttons.
    actions:
      r.missing.length > 0 ? (
        <RemindButton groupId={r.groupId} title={r.title} missing={r.missing} dueAt={r.dueAt} />
      ) : null,
  };
}
