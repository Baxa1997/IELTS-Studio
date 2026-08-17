import Link from "next/link";

import {
  Card,
  CardHead,
  Empty,
  FAINT,
  Glyph,
  INK,
  Kpi,
  KpiRow,
  MUTED,
  Notice,
  Pill,
  PageTitle,
  SOFT,
  Surface,
  TONE,
  clip,
} from "@/components/admin/ui";
import { loadConductFlags } from "@/lib/admin/moderation";
import { calendarAgo, within } from "@/lib/admin/time";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "—";

/**
 * Speaking mocks where the candidate abused or refused the examiner.
 *
 * REPORTED, NEVER ENFORCED, and the page says so at the top rather than in a
 * footnote. Nothing here changes a band, a quota or an account — the grader
 * writes a conduct note, and this is where a human reads it. The only judgement
 * it supports is "one bad afternoon, or a pattern?", which is why it groups by
 * person rather than listing flags in a flat stream.
 *
 * There is deliberately no Dismiss button. A dismiss would imply the flag did
 * something that needed undoing, and it does not; hiding a note only makes the
 * pattern harder to see next month.
 */
export default async function ModerationPage() {
  await requireSuperAdmin();
  const flags = await loadConductFlags(100);

  const last7 = flags.filter((f) => within(f.when, 7));
  const people = new Map<string, typeof flags>();
  for (const f of flags) {
    const key = `${f.student}·${f.org}`;
    people.set(key, [...(people.get(key) ?? []), f]);
  }
  const repeat = [...people.values()].filter((rows) => rows.length > 1);
  const kinds = new Map<string, number>();
  for (const f of flags) kinds.set(f.kind || "other", (kinds.get(f.kind || "other") ?? 0) + 1);

  return (
    <Surface>
      <PageTitle
        eyebrow="Operations"
        title="Moderation"
        subtitle="Mocks where the candidate abused or refused the examiner, as reported by the grader. Reported only — no band, quota or account is changed by anything on this page."
      />

      <KpiRow cols={4}>
        <Kpi label="Flagged sessions" value={flags.length} accent={INK} sub="all time" />
        <Kpi
          label="Last 7 days"
          value={last7.length}
          accent={last7.length > 0 ? TONE.amber.ink : TONE.green.ink}
          sub={last7.length === 0 ? "nothing recent" : "needs a look"}
        />
        <Kpi
          label="Repeat candidates"
          value={repeat.length}
          accent={repeat.length > 0 ? TONE.red.ink : TONE.green.ink}
          sub="flagged more than once"
        />
        <Kpi
          label="People involved"
          value={people.size}
          accent="#7C79DB"
          sub={[...kinds.entries()].map(([k, n]) => `${n} ${k}`).join(" · ") || "—"}
        />
      </KpiRow>

      {repeat.length > 0 ? (
        <Notice
          tone="amber"
          title={`${repeat.length} candidate${repeat.length === 1 ? " has" : "s have"} been flagged more than once`}
          detail="A single flag is usually frustration with a machine. The same person twice is the only signal on this page worth acting on — and acting means talking to their centre, not touching their account."
        />
      ) : null}

      <Card>
        <CardHead
          title="Flagged sessions"
          note="Newest first. The quote is what the grader heard — it is the whole of the evidence."
          badge={flags.length > 0 ? <Pill tone="red">{flags.length}</Pill> : undefined}
        />

        {flags.map((f) => {
          const isRepeat = (people.get(`${f.student}·${f.org}`)?.length ?? 0) > 1;
          return (
            <div
              key={f.id}
              className="sa-row"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 14,
                padding: "14px 18px",
                borderBottom: "1px solid #F5F4F0",
              }}
            >
              <Glyph tone={isRepeat ? "red" : "amber"} size={34} round>
                {initials(f.student)}
              </Glyph>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: INK }}>{f.student}</span>
                  <Pill tone={isRepeat ? "red" : "amber"}>{f.kind || "conduct"}</Pill>
                  {isRepeat ? <Pill tone="red">repeat</Pill> : null}
                  <Link
                    href={`/admin/centers/${f.orgId}`}
                    style={{ fontSize: 11.5, color: FAINT, textDecoration: "none" }}
                  >
                    {f.org}
                  </Link>
                </div>
                <blockquote
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: MUTED,
                    lineHeight: 1.5,
                    borderLeft: `2px solid ${TONE.amber.border}`,
                    paddingLeft: 10,
                  }}
                >
                  “{f.quote}”
                </blockquote>
              </div>

              <div style={{ fontSize: 12, color: FAINT, whiteSpace: "nowrap", ...clip }}>
                {calendarAgo(f.when)}
              </div>
            </div>
          );
        })}

        {flags.length === 0 ? (
          <Empty>
            Nothing flagged. The grader writes a conduct note when a candidate abuses or refuses the
            examiner during a full mock — those appear here.
          </Empty>
        ) : null}

        <div style={{ padding: "14px 18px", fontSize: 12, color: FAINT, lineHeight: 1.55 }}>
          There is no dismiss button on purpose. A flag has no effect to undo, and hiding one only
          makes a pattern harder to see next month.
        </div>
      </Card>

      <div style={{ marginTop: 16, fontSize: 12.5, color: SOFT, lineHeight: 1.6, maxWidth: "72ch" }}>
        Conduct notes come from the speaking grader (the engine&apos;s <code>_conduct</code> pass).
        They are stored on the session, never on the learner, and they are invisible to the learner,
        their teacher and their centre.
      </div>
    </Surface>
  );
}
