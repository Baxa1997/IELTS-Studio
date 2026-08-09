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
  RowText,
  SANS,
  StatRow,
  StatTile,
  TINT,
} from "@/components/console/page-ui";
import { requireOrgUser, roleHome } from "@/lib/auth";
import { loadPractices, type PracticeRow, type PracticeTab } from "@/lib/console/practices";
import { TASK2_CATEGORY_LABELS, type Task2Category } from "@/lib/prompts/types";

import { PracticeRowActions } from "./practice-row-actions";

const TABS: { key: PracticeTab; label: string; blurb: string }[] = [
  { key: "drafts", label: "Drafts", blurb: "Generated, not yet published. Only staff can see these." },
  { key: "published", label: "Published", blurb: "Ready to set to a class." },
  { key: "archived", label: "Archived", blurb: "Retired, but kept — students' graded work points at it." },
];

/**
 * Everything a teacher has made, and what became of it.
 *
 * Teacher-only, by design. A practice library belongs to whoever teaches the
 * class; a center_admin has no use for a list of drafts they cannot publish and
 * would never assign, and sees results through Reports and the group pages.
 */
export default async function PracticesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "teacher") redirect(roleHome(profile.role));

  const sp = await searchParams;
  const tab: PracticeTab = TABS.some((t) => t.key === sp.tab)
    ? (sp.tab as PracticeTab)
    : "published";

  const all = await loadPractices({ profileId: profile.id });
  const rows = all.filter((p) => p.tab === tab);
  const count = (key: PracticeTab) => all.filter((p) => p.tab === key).length;

  return (
    <div>
      <PageHead
        eyebrow="Practice"
        title="Your practice library"
        subtitle="Everything you've made, and how your classes did on it."
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
        title="Make a new practice"
        description="You get the same screens your students do — generate it, work through it if you like, then set it to a class from the button on that page."
      >
        <List>
          <Row first>
            <RowText title="Writing" meta="Generate a Task 2 prompt, or pick one from the library." />
            <RowLink href="/write">Open writing →</RowLink>
          </Row>
          <Row>
            <RowText title="Reading" meta="A full test or a single passage, from the shared library." />
            <RowLink href="/read">Open reading →</RowLink>
          </Row>
          <Row>
            <RowText title="Listening" meta="Cambridge-style parts and full tests." />
            <RowLink href="/listen">Open listening →</RowLink>
          </Row>
        </List>
      </Panel>

      <Panel title={TABS.find((t) => t.key === tab)!.label} description={TABS.find((t) => t.key === tab)!.blurb}>
        <List>
          {rows.map((p, i) => (
            <PracticeListRow key={`${p.kind}-${p.id}`} practice={p} first={i === 0} />
          ))}
          {rows.length === 0 ? (
            <EmptyRow>
              {tab === "drafts"
                ? "No drafts. Anything you generate in Writing lands here until you set it to a class."
                : tab === "published"
                  ? "Nothing published yet. Open Writing, generate a prompt, then set it to a class."
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

      <span style={{ display: "flex", alignItems: "center", gap: 10, flex: "none" }}>
        {practice.kind === "writing" ? (
          <PracticeRowActions promptId={practice.id} archived={practice.tab === "archived"} />
        ) : null}
        {/* "Open" is the real runner, not a console preview: the only honest way
            to see a practice is the screen the student sees. */}
        <RowLink
          href={
            practice.kind === "writing" ? `/write/${practice.id}` : `/read/test/${practice.id}`
          }
        >
          Open →
        </RowLink>
      </span>
    </Row>
  );
}
