import { redirect } from "next/navigation";

import {
  Card,
  CardHead,
  FAINT,
  GREEN,
  INK,
  Kpi,
  KpiRow,
  PageHead,
  PersonCell,
  SANS,
  Table,
  Tag,
  TD,
  THead,
  TRow,
} from "@/components/console/crm-ui";
import { requireOrgUser } from "@/lib/auth";
import { KIND_LABEL } from "@/lib/console/attempts";
import { loadMarkingQueue, OVERDUE_HOURS } from "@/lib/console/marking";

export const dynamic = "force-dynamic";

const COLS = "1.8fr 1.2fr 1fr .8fr 1fr 1fr";

/** `3 days` / `14 hours` — a wait, in the unit that makes it feel like one. */
function waited(hours: number): string {
  if (hours < 1) return "just now";
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * The marking queue.
 *
 * Derived, never enqueued: it is every graded attempt by a student in a group
 * that carries no verdict. Nothing can be lost because an insert failed, and
 * signing one off removes it — the queue cannot drift out of step with what has
 * actually been marked.
 *
 * OLDEST FIRST, and that is not a preference. A queue sorted newest-first is a
 * queue where the piece that has been waiting longest is the one nobody ever
 * scrolls to, which is precisely the student who has stopped trusting that
 * anyone reads their work.
 */
export default async function MarkingPage() {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const queue = await loadMarkingQueue(profile);
  const overdue = queue.filter((q) => q.waitingHours >= OVERDUE_HOURS);
  const isAdmin = profile.role !== "teacher";

  // Whose pile is it? A centre admin needs to know which teacher to ask.
  const byTeacher = new Map<string, number>();
  for (const q of queue) {
    const who = q.teacherName ?? "No teacher assigned";
    byTeacher.set(who, (byTeacher.get(who) ?? 0) + 1);
  }
  const worst = [...byTeacher.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <PageHead
        eyebrow="Learning"
        title="Marking"
        subtitle={
          queue.length === 0
            ? "Everything handed in has a teacher's name on it."
            : `${queue.length} piece${queue.length === 1 ? "" : "s"} of work the AI has graded and nobody has signed off.`
        }
      />

      <KpiRow>
        <Kpi label="Waiting" value={queue.length} deltaTone={queue.length > 0 ? "bad" : "good"} />
        <Kpi
          label={`Over ${OVERDUE_HOURS} hours`}
          value={overdue.length}
          deltaTone={overdue.length > 0 ? "bad" : "good"}
          sub="the alert fires on these"
        />
        <Kpi
          label="Longest wait"
          value={queue.length > 0 ? waited(queue[0].waitingHours) : "—"}
          sub={queue.length > 0 ? queue[0].studentName : "nothing waiting"}
        />
        {isAdmin ? (
          <Kpi
            label="Biggest pile"
            value={worst ? worst[1] : 0}
            sub={worst ? worst[0] : "nobody"}
          />
        ) : null}
      </KpiRow>

      <Card flush>
        <CardHead
          title="Oldest first"
          divided
          note="opening a row shows the learner's own report — the same page they see"
        />
        {queue.length > 0 ? (
          <Table cols={COLS}>
            <THead
              cols={COLS}
              labels={["Student", "Group", "Skill", "AI band", "Waiting", "Handed in"]}
            />
            {queue.map((q) => (
              <TRow key={`${q.kind}-${q.refId}`} cols={COLS} href={q.href}>
                <PersonCell name={q.studentName} meta={q.teacherName ?? "no teacher"} />
                <TD tone="soft">{q.groupName ?? "—"}</TD>
                <TD tone="body">{KIND_LABEL[q.kind]}</TD>
                <TD tone="ink" weight={600}>
                  {q.aiBand?.toFixed(1) ?? "—"}
                </TD>
                <TD>
                  {q.waitingHours >= OVERDUE_HOURS ? (
                    <Tag tone="red">{waited(q.waitingHours)}</Tag>
                  ) : (
                    <span style={{ color: FAINT }}>{waited(q.waitingHours)}</span>
                  )}
                </TD>
                <TD tone="soft">
                  {new Date(q.submittedAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })}
                </TD>
              </TRow>
            ))}
          </Table>
        ) : (
          <div style={{ padding: "22px 18px" }}>
            <p style={{ margin: 0, fontFamily: SANS, fontSize: 14, color: INK, fontWeight: 500 }}>
              Nothing is waiting.
            </p>
            <p
              style={{ margin: "6px 0 0", fontFamily: SANS, fontSize: 13, color: FAINT, lineHeight: 1.6 }}
            >
              Work appears here as soon as the AI has graded it. Putting a teacher&rsquo;s name
              against a band is what lets your centre show it to a parent — and every band a
              teacher confirms or corrects is kept beside the AI&rsquo;s own, which is how the
              grader gets better.
            </p>
          </div>
        )}
      </Card>

      {queue.length === 0 ? null : (
        <p
          style={{
            margin: "14px 2px 0",
            fontFamily: SANS,
            fontSize: 12,
            color: FAINT,
            lineHeight: 1.6,
          }}
        >
          <span style={{ color: GREEN, fontWeight: 600 }}>Agreeing counts.</span> Confirming a band
          unchanged still records that a teacher read it — that is the difference between a mark a
          centre can show a parent and one it cannot.
        </p>
      )}
    </div>
  );
}
