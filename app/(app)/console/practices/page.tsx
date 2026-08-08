import { redirect } from "next/navigation";

import {
  EmptyRow,
  FAINT,
  INK,
  LINE,
  List,
  MUTED,
  PageHead,
  Panel,
  Pill,
  Row,
  RowLink,
  SANS,
  StatRow,
  StatTile,
  TINT,
} from "@/components/console/page-ui";
import { requireOrgUser } from "@/lib/auth";
import { loadPractices, type PracticeRow, type PracticeTab } from "@/lib/console/practices";
import { TASK2_CATEGORY_LABELS, type Task2Category } from "@/lib/prompts/types";

import { NewPracticeForm } from "./new-practice-form";

const TABS: { key: PracticeTab; label: string; blurb: string }[] = [
  { key: "drafts", label: "Drafts", blurb: "Generated, not yet published. Only staff can see these." },
  { key: "published", label: "Published", blurb: "Ready to set to a class." },
  { key: "archived", label: "Archived", blurb: "Retired, but kept — students' graded work points at it." },
];

/** Everything a teacher has made, and what became of it. */
export default async function PracticesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role === "student") redirect("/dashboard");

  const sp = await searchParams;
  const tab: PracticeTab = TABS.some((t) => t.key === sp.tab)
    ? (sp.tab as PracticeTab)
    : "published";

  const all = await loadPractices({ role: profile.role, profileId: profile.id });
  const rows = all.filter((p) => p.tab === tab);
  const count = (key: PracticeTab) => all.filter((p) => p.tab === key).length;

  return (
    <div>
      <PageHead
        eyebrow="Practice"
        title="Your practice library"
        subtitle={
          profile.role === "center_admin"
            ? "Every prompt and test your center has made, and how the classes did on it."
            : "Everything you've made, and how your classes did on it."
        }
      />

      <StatRow>
        {TABS.map((t) => (
          <StatTile
            key={t.key}
            value={count(t.key)}
            label={t.label}
            tone={t.key === tab ? "indigo" : "ink"}
            href={`/console/practices?tab=${t.key}`}
            active={t.key === tab}
          />
        ))}
      </StatRow>

      <Panel
        title="Write a new Task 2 prompt"
        description="It's generated as a draft — you read it before any student does."
      >
        <NewPracticeForm />
      </Panel>

      <Panel title={TABS.find((t) => t.key === tab)!.label} description={TABS.find((t) => t.key === tab)!.blurb}>
        <List>
          {rows.map((p, i) => (
            <PracticeListRow key={`${p.kind}-${p.id}`} practice={p} first={i === 0} />
          ))}
          {rows.length === 0 ? (
            <EmptyRow>
              {tab === "drafts"
                ? "No drafts. Generate one above."
                : tab === "published"
                  ? "Nothing published yet. Generate a prompt, read it, then publish."
                  : "Nothing archived."}
            </EmptyRow>
          ) : null}
        </List>
      </Panel>
    </div>
  );
}

function PracticeListRow({ practice, first }: { practice: PracticeRow; first: boolean }) {
  const meta = [
    practice.kind === "reading"
      ? "Reading"
      : practice.category
        ? TASK2_CATEGORY_LABELS[practice.category as Task2Category]
        : "Task 2",
    practice.topicFamily,
    practice.targetBand ? `band ${practice.targetBand}` : null,
    new Date(practice.createdAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Row first={first}>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: "-webkit-box",
            fontWeight: 500,
            color: INK,
            overflow: "hidden",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {practice.title || "Untitled prompt"}
        </span>
        <span style={{ display: "block", fontSize: 12.5, color: FAINT, marginTop: 3 }}>{meta}</span>

        {practice.groups.length > 0 ? (
          <span style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>
            {practice.groups.map((g) => (
              <span
                key={g}
                style={{
                  background: TINT,
                  border: `1px solid ${LINE}`,
                  borderRadius: 999,
                  padding: "2px 9px",
                  fontFamily: SANS,
                  fontSize: 11.5,
                  color: MUTED,
                }}
              >
                {g}
              </span>
            ))}
            <span style={{ fontFamily: SANS, fontSize: 11.5, color: FAINT, alignSelf: "center" }}>
              {practice.completed}/{practice.assigned} done
              {practice.averageBand != null ? ` · avg ${practice.averageBand.toFixed(1)}` : ""}
            </span>
          </span>
        ) : (
          <span style={{ display: "inline-block", marginTop: 7 }}>
            <Pill tone="neutral">not set to anyone</Pill>
          </span>
        )}
      </span>

      {practice.kind === "writing" ? (
        <RowLink href={`/console/practices/${practice.id}`}>Open →</RowLink>
      ) : (
        <span style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, flex: "none" }}>
          set from a group
        </span>
      )}
    </Row>
  );
}
