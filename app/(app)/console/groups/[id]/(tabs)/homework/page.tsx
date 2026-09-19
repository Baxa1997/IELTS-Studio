import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { type AssignmentKind, loadGroupAssignments } from "@/lib/console/assignments";
import { loadGroupDetail } from "@/lib/console/groups";
import { loadLibrary } from "@/lib/console/practice-library";
import { ENROLLED } from "@/lib/console/status";
import { today } from "@/lib/finance/period";
import { READING_LIBRARY_ORG_ID } from "@/lib/reading/service";
import { createAdminClient } from "@/lib/supabase/admin";

import { AssignSheet } from "../../assign-sheet";
import { SANS, SERIF } from "@/components/console/crm-ui";
import {
  Board,
  BoardHead,
  FilterPill,
  MiniBar,
  Pill,
  SkillChip,
  V2,
  card as v2card,
  serifHead,
} from "../../ui";
import { PANEL } from "@/lib/theme/tokens";

export const dynamic = "force-dynamic";

const FLOWS = ["open", "overdue", "done"] as const;
type Flow = (typeof FLOWS)[number];
const SKILLS = ["writing", "reading", "listening", "lesson"] as const;

const FLOW_LABEL: Record<Flow, string> = {
  open: "Open",
  overdue: "Overdue",
  done: "Done",
};
const FLOW_TONE: Record<Flow, "open" | "overdue" | "done"> = {
  open: "open",
  overdue: "overdue",
  done: "done",
};
const SKILL_LABEL: Record<AssignmentKind, string> = {
  writing: "Writing",
  reading: "Reading",
  listening: "Listening",
  lesson: "Lesson",
};

/** The practice board's columns, shared by its head and its rows so the two
 *  can never drift apart. */
const BOARD_COLS =
  "minmax(0, 2.4fr) minmax(0, 96px) minmax(0, 112px) minmax(0, 118px) minmax(0, 64px) minmax(0, 104px)";

/**
 * The homework board.
 *
 * ⚠️ THE PRACTICE LIBRARY IS LOADED HERE, AND ONLY HERE. `loadLibrary()` plus
 * the shared reading shelf is the heaviest pair of queries on this screen, and
 * they exist to fill ONE control: the "Set practice" sheet. That control used to
 * sit in the page header, which meant opening a class to read the register, or
 * to check who had paid, paid for the whole library first. It is a homework
 * action; it belongs on the homework tab.
 */
export default async function GroupHomeworkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ flow?: string; skill?: string; q?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const { id } = await params;
  const sp = await searchParams;

  const group = await loadGroupDetail(id);
  if (!group) notFound();
  const isAdmin = profile.role === "center_admin";
  if (!isAdmin && group.teacherId !== profile.id) notFound();

  const roster = group.members.filter((m) => ENROLLED.includes(m.status));

  // The shared reading library lives in its own org, so it's read with the
  // service-role client (exactly as the student read hub does).
  const admin = createAdminClient();
  const [assignments, libTestsRes, library] = await Promise.all([
    loadGroupAssignments(group.id),
    admin
      .from("reading_tests")
      .select("id, target_band")
      .eq("organization_id", READING_LIBRARY_ORG_ID)
      .eq("is_library", true)
      .order("target_band", { ascending: true })
      .limit(12),
    loadLibrary(),
  ]);

  const libraryTests = (libTestsRes.data ?? []).map((t, i) => ({
    id: t.id as string,
    label: t.target_band ? `Test ${i + 1} — band ${t.target_band} level` : `Test ${i + 1}`,
  }));

  // §9's shelf, offered here so setting practice can reuse rather than
  // regenerate. Kept to what is unarchived and current.
  const shelf = library.map((item) => ({
    id: item.id,
    title: item.title,
    skill: item.skill,
    level: item.level,
  }));

  // Every assignment gets a state a teacher would recognise on sight. There is
  // deliberately NO "to mark" bucket: this product marks with a model the
  // moment work is handed in, so a queue waiting on a human would read zero for
  // ever and teach everybody to ignore the strip above the board.
  const flowOf = (a: { completed: number; dueAt: string | null }): Flow => {
    if (roster.length > 0 && a.completed >= roster.length) return "done";
    // Compared by DATE, not by instant: something due today is not late until
    // tomorrow, and `today()` is the clock the rest of this page already reads.
    if (a.dueAt && a.dueAt.slice(0, 10) < today()) return "overdue";
    return "open";
  };
  const board = assignments.map((a) => ({ ...a, flow: flowOf(a) }));
  const hasPlacement = assignments.some((a) => a.isPlacement);
  const openCount = board.filter((a) => a.flow === "open").length;
  const overdueCount = board.filter((a) => a.flow === "overdue").length;
  const doneCount = board.filter((a) => a.flow === "done").length;

  const flowFilter = (FLOWS as readonly string[]).includes(sp.flow ?? "")
    ? (sp.flow as Flow)
    : null;
  const skillFilter = (SKILLS as readonly string[]).includes(sp.skill ?? "")
    ? (sp.skill as AssignmentKind)
    : null;
  const query = (sp.q ?? "").trim();
  const needle = query.toLowerCase();
  const visible = board.filter(
    (a) =>
      (!flowFilter || a.flow === flowFilter) &&
      (!skillFilter || a.kind === skillFilter) &&
      (!needle || a.title.toLowerCase().includes(needle)),
  );

  /** A board link that keeps the filters you already have and changes one of
   *  them. Filters in the URL rather than in component state, so "what is
   *  overdue in this class" is a link a teacher can bookmark or send on.
   *
   *  No `tab=` in it any more — the board is its own route, so the filters are
   *  the only thing left in the query string. */
  const boardHref = (patch: { flow?: Flow | null; skill?: AssignmentKind | null; q?: string }) => {
    const next = new URLSearchParams();
    const flow = patch.flow === undefined ? flowFilter : patch.flow;
    const skill = patch.skill === undefined ? skillFilter : patch.skill;
    const text = patch.q === undefined ? query : patch.q;
    if (flow) next.set("flow", flow);
    if (skill) next.set("skill", skill);
    if (text) next.set("q", text);
    const qs = next.toString();
    return `/console/groups/${id}/homework${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      {/* Only the group's own teacher may set practice — createAssignment
          refuses anyone else, so an admin is not shown a button that will turn
          them away. It sat in the page header until the tabs were split; it is
          here now, beside the board it fills. */}
      {group.teacherId === profile.id ? (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <AssignSheet
            groupId={group.id}
            libraryTests={libraryTests}
            library={shelf}
            hasPlacement={hasPlacement}
          />
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 18 }}>
        <div
          style={{
            ...v2card,
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 220, flex: "1 1 260px" }}>
            <h2 style={{ ...serifHead, fontSize: 22 }}>Homework</h2>
            <p style={{ margin: "5px 0 0", fontFamily: SANS, fontSize: 13, color: V2.faint }}>
              Review what was assigned, what is overdue, and what students have finished.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <FilterPill
              href={boardHref({ flow: null, skill: null, q: "" })}
              label="All"
              active={!flowFilter && !skillFilter && !query}
            />
            <FilterPill
              href={boardHref({ flow: "open", skill: null, q: "" })}
              label={`Open ${openCount}`}
              active={flowFilter === "open"}
            />
            <FilterPill
              href={boardHref({ flow: "overdue", skill: null, q: "" })}
              label={`Overdue ${overdueCount}`}
              active={flowFilter === "overdue"}
            />
            <FilterPill
              href={boardHref({ flow: "done", skill: null, q: "" })}
              label={`Done ${doneCount}`}
              active={flowFilter === "done"}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* A GET form, so a search is a URL like every other filter here. */}
          <form action={`/console/groups/${id}`} style={{ margin: 0 }}>
            <input type="hidden" name="tab" value="practice" />
            {flowFilter ? <input type="hidden" name="flow" value={flowFilter} /> : null}
            {skillFilter ? <input type="hidden" name="skill" value={skillFilter} /> : null}
            <input
              name="q"
              defaultValue={query}
              placeholder="Search homework"
              aria-label="Search homework"
              style={{
                width: 280,
                maxWidth: "100%",
                padding: "10px 14px",
                borderRadius: 12,
                border: `1px solid ${V2.field}`,
                background: PANEL,
                fontFamily: SANS,
                fontSize: 14,
                color: V2.ink,
                outline: "none",
              }}
            />
          </form>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <FilterPill href={boardHref({ skill: null })} label="All" active={!skillFilter} />
            {SKILLS.map((k) => (
              <FilterPill
                key={k}
                href={boardHref({ skill: k })}
                label={SKILL_LABEL[k]}
                active={skillFilter === k}
              />
            ))}
          </div>
          <span style={{ marginLeft: "auto", fontFamily: SANS, fontSize: 13, color: V2.faint }}>
            {visible.length === board.length
              ? `${board.length} set in total`
              : `${visible.length} of ${board.length} shown`}
          </span>
        </div>

        <Board>
          <BoardHead
            cols={BOARD_COLS}
            labels={["Homework", "Skill", "Set / due", "Submitted", "Band", "Status"]}
          />
          {visible.map((a) => {
            const pct = roster.length > 0 ? Math.round((a.completed / roster.length) * 100) : 0;
            const row = (
              <>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <SkillChip kind={a.kind} />
                    <span
                      style={{
                        fontFamily: SANS,
                        fontSize: 15,
                        fontWeight: 600,
                        color: V2.ink,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.title}
                    </span>
                    {/* A PLACEMENT ONLY SETS A BASELINE FOR WRITING AND
                        READING — `placementBand` covers those two, and says
                        so: a centre that placement-tests listening gets
                        `first_attempt`, which is the honest answer rather
                        than a wrong one. So the badge is not shown on a kind
                        where it would promise an anchor that never arrives. */}
                    {a.isPlacement && (a.kind === "writing" || a.kind === "reading") ? (
                      <span
                        title="Where this class started. Every later progress figure is measured from its band."
                        style={{
                          flex: "none",
                          padding: "3px 9px",
                          borderRadius: 999,
                          background: V2.indigoTint,
                          color: V2.indigoInk,
                          fontFamily: SANS,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        Baseline
                      </span>
                    ) : null}
                  </div>
                </div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: V2.body, minWidth: 0 }}>
                  {SKILL_LABEL[a.kind]}
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 13,
                    color: V2.body,
                    minWidth: 0,
                    lineHeight: 1.35,
                  }}
                >
                  <div>set {new Date(a.createdAt).toLocaleDateString()}</div>
                  <div style={{ color: V2.faint }}>
                    {a.dueAt ? `due ${new Date(a.dueAt).toLocaleDateString()}` : "no deadline"}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: SANS, fontSize: 13, color: V2.body }}>
                    {a.completed} / {roster.length}
                  </div>
                  <MiniBar pct={pct} />
                </div>
                <div
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: 19,
                    color: a.band == null ? V2.faint : V2.ink,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {a.band == null ? "—" : a.band.toFixed(1)}
                </div>
                <div style={{ textAlign: "right", minWidth: 0 }}>
                  <Pill tone={FLOW_TONE[a.flow]}>{FLOW_LABEL[a.flow]}</Pill>
                </div>
              </>
            );
            const rowStyle: React.CSSProperties = {
              display: "grid",
              gridTemplateColumns: BOARD_COLS,
              alignItems: "center",
              gap: 12,
              padding: "15px 20px",
              borderBottom: `1px solid ${V2.hair}`,
              textDecoration: "none",
              color: "inherit",
            };
            return (
              <Link
                key={a.id}
                href={`/console/groups/${group.id}/assignments/${a.id}`}
                className="cn-boardrow"
                style={rowStyle}
              >
                {row}
              </Link>
            );
          })}
          {visible.length === 0 ? (
            <div
              style={{
                padding: "44px 20px",
                textAlign: "center",
                fontFamily: SANS,
                fontSize: 14,
                color: V2.faint,
              }}
            >
              {board.length === 0
                ? "No homework assigned yet."
                : "No homework matches this filter."}
            </div>
          ) : null}
          {group.teacherId === profile.id ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 20px",
                background: V2.wash,
                flexWrap: "wrap",
              }}
            >
              <AssignSheet
                groupId={group.id}
                libraryTests={libraryTests}
                library={shelf}
                hasPlacement={hasPlacement}
                label="+ Assign practice"
                variant="quiet"
              />
              <span style={{ fontFamily: SANS, fontSize: 13, color: V2.faint }}>
                Everyone in the group receives identical content, so the bands stay comparable.
              </span>
            </div>
          ) : null}
        </Board>
      </div>
    </>
  );
}
