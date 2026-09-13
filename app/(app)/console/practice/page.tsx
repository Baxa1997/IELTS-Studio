import { redirect } from "next/navigation";

import {
  Card,
  CardHead,
  FAINT,
  fieldStyle,
  INDIGO,
  Kpi,
  KpiRow,
  PageHead,
  SANS,
  Tag,
  Toolbar,
  type Tone,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { KIND_LABEL } from "@/lib/console/attempts";
import {
  loadPracticeBoard,
  type PracticeBoardRow,
  type PracticeStatus,
} from "@/lib/console/practice-board";
import { libraryFacets, loadLibrary } from "@/lib/console/practice-library";

import { PracticeGallery, type GalleryItem } from "@/components/practice/gallery";

import { LibraryPanel } from "./library-panel";
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
export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; teacher?: string; skill?: string; status?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const sp = await searchParams;
  const board = await loadPracticeBoard(profile);
  // §9: the shelf lives on this page, under the board. The board answers "is
  // what we set landing"; the library answers "what do we already have" — the
  // two questions a teacher has when they sit down to set work.
  const library = await loadLibrary();

  const shown = board.rows.filter(
    (r) =>
      (!sp.group || r.groupId === sp.group) &&
      (!sp.teacher || r.teacherId === sp.teacher) &&
      (!sp.skill || r.skill === sp.skill) &&
      (!sp.status || r.status === sp.status),
  );

  const overdue = board.rows.filter((r) => r.status === "overdue");
  const expected = board.rows.reduce((n, r) => n + r.expected, 0);
  const handedIn = board.rows.reduce((n, r) => n + r.handedIn, 0);
  const marked = board.rows.reduce((n, r) => n + r.marked, 0);
  const completion = expected > 0 ? Math.round((handedIn / expected) * 100) : null;

  return (
    <div>
      <PageHead
        eyebrow="Learning"
        title="Practice"
        subtitle={
          board.rows.length === 0
            ? "Nothing has been set yet — practice appears here the moment a group is given some."
            : `${board.rows.length} set across ${board.groups.length} group${board.groups.length === 1 ? "" : "s"}.`
        }
      />

      <KpiRow mb={12}>
        <Kpi label="Practices set" value={board.rows.length} sub="most recent first" />
        <Kpi
          label="Handed in"
          value={completion == null ? "—" : `${completion}%`}
          sub={`${handedIn} of ${expected} expected`}
          deltaTone={completion != null && completion >= 60 ? "good" : "bad"}
        />
        <Kpi
          label="Marked"
          value={handedIn > 0 ? `${marked} of ${handedIn}` : "—"}
          sub="a teacher has signed off"
          deltaTone={handedIn > 0 && marked === handedIn ? "good" : "flat"}
        />
        <Kpi
          label="Overdue"
          value={overdue.length}
          deltaTone={overdue.length > 0 ? "bad" : "good"}
          sub="past due and still owed"
        />
      </KpiRow>

      {/* ── the thing the Overview alert points at ─────────────────────────── */}
      {board.groupsWithNothingSet.length > 0 ? (
        <Card flush>
          <CardHead
            title={`${board.groupsWithNothingSet.length} group${board.groupsWithNothingSet.length === 1 ? " has" : "s have"} no practice at all`}
            divided
            badge={<Tag tone="amber">nothing set</Tag>}
            note="nothing to hand in means nothing to mark, and nothing to report on"
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "14px 18px" }}>
            {board.groupsWithNothingSet.map((g) => (
              <a
                key={g.id}
                href={`/console/groups/${g.id}/homework`}
                className="cn-btn cn-btn--ghost"
                style={{
                  ...fieldStyle,
                  background: "#fff",
                  textDecoration: "none",
                  fontFamily: SANS,
                  fontSize: 12.5,
                  color: INDIGO,
                  fontWeight: 600,
                }}
              >
                {g.name}
                <span style={{ color: FAINT, fontWeight: 400 }}>
                  {" "}
                  · {g.teacherName ?? "no teacher"}
                </span>
              </a>
            ))}
          </div>
        </Card>
      ) : null}

      <div style={{ height: 14 }} />

      <Card flush>
        <CardHead
          title="Everything set"
          divided
          note="handed in counts the work done, whether or not it came through the homework link"
        />
        <Toolbar>
          <form
            method="GET"
            style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", flex: 1 }}
          >
            <select
              name="group"
              defaultValue={sp.group ?? ""}
              aria-label="Group"
              style={fieldStyle}
            >
              <option value="">All groups</option>
              {board.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            {profile.role !== "teacher" ? (
              <select
                name="teacher"
                defaultValue={sp.teacher ?? ""}
                aria-label="Teacher"
                style={fieldStyle}
              >
                <option value="">All teachers</option>
                {board.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            ) : null}
            <select
              name="skill"
              defaultValue={sp.skill ?? ""}
              aria-label="Skill"
              style={fieldStyle}
            >
              <option value="">All skills</option>
              {(["writing", "reading", "listening"] as const).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={sp.status ?? ""}
              aria-label="Status"
              style={fieldStyle}
            >
              <option value="">Any status</option>
              <option value="set">Set</option>
              <option value="overdue">Overdue</option>
              <option value="complete">All in</option>
            </select>
            <button
              type="submit"
              className="cn-btn cn-btn--ghost"
              style={{ ...fieldStyle, background: "#fff", cursor: "pointer", fontWeight: 500 }}
            >
              Apply
            </button>
          </form>
          <span style={{ fontFamily: SANS, fontSize: 12, color: FAINT }}>
            {shown.length} shown
            {shown.length !== board.rows.length ? ` of ${board.rows.length}` : ""}
          </span>
        </Toolbar>

        {/* The same grid as the learner's Activities, the teacher's library and a
            student's report — one piece of practice looks the same wherever it
            is seen. The toolbar above stays: those filters are in the URL on
            purpose, so "what is overdue in Group B" is a link a colleague can be
            sent, which is worth more here than the keystroke the grid's own
            search would save. */}
        <div style={{ padding: "14px 16px 16px" }}>
          <PracticeGallery
            items={shown.map(toGalleryItem)}
            categories={BOARD_CATEGORIES}
            emptyTitle={
              board.rows.length === 0 ? "Nothing set yet" : "Nothing matches those filters"
            }
            emptyNote={
              board.rows.length === 0
                ? "Practice appears here the moment a group is given some."
                : "Clear a filter above to see the rest."
            }
          />
        </div>
      </Card>

      {/* ── the shelf ──────────────────────────────────────────────────────── */}
      <Card flush>
        <CardHead
          title="Practice library"
          note="kept so the same paper can be set again — two groups sitting the same task are comparable"
          divided
        />
        <div style={{ padding: "14px 16px 16px" }}>
          <LibraryPanel
            items={library}
            facets={libraryFacets(library)}
            canEdit={profile.role === "teacher" || profile.role === "center_admin"}
          />
        </div>
      </Card>
    </div>
  );
}

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
