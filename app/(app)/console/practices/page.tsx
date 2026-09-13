import { redirect } from "next/navigation";

import {
  List,
  PageHead,
  Panel,
  Row,
  RowLink,
  RowText,
  StatRow,
  StatTile,
} from "@/components/console/page-ui";
import { requireOrgUser, roleHome } from "@/lib/auth";
import { loadPractices, type PracticeRow, type PracticeTab } from "@/lib/console/practices";
import { TASK2_CATEGORY_LABELS, type Task2Category } from "@/lib/prompts/types";

import { PracticeGallery, type GalleryItem } from "@/components/practice/gallery";

import { PracticeRowActions } from "./practice-row-actions";

const TABS: { key: PracticeTab; label: string; blurb: string }[] = [
  {
    key: "drafts",
    label: "Drafts",
    blurb: "Generated, not yet published. Only staff can see these.",
  },
  { key: "published", label: "Published", blurb: "Ready to set to a group." },
  {
    key: "archived",
    label: "Archived",
    blurb: "Retired, but kept — students' graded work points at it.",
  },
];

/**
 * Everything a teacher has made, and what became of it.
 *
 * Teacher-only, by design. A practice library belongs to whoever teaches the
 * group; a center_admin has no use for a list of drafts they cannot publish and
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
        subtitle="Everything you've made, and how your groups did on it."
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
        description="You get the same screens your students do — generate it, work through it if you like, then set it to a group from the button on that page."
      >
        <List>
          <Row first>
            <RowText
              title="Writing"
              meta="Generate a Task 2 prompt, or pick one from the library."
            />
            <RowLink href="/write">Open writing →</RowLink>
          </Row>
          <Row>
            <RowText
              title="Reading"
              meta="A full test or a single passage, from the shared library."
            />
            <RowLink href="/read">Open reading →</RowLink>
          </Row>
          <Row>
            <RowText title="Listening" meta="Cambridge-style parts and full tests." />
            <RowLink href="/listen">Open listening →</RowLink>
          </Row>
        </List>
      </Panel>

      {/* The list became a gallery — the same grid the learner's Activities and a
          student's report use, so a practice looks the same wherever it is seen.
          The status tabs above stay: drafts/published/archived is a different
          axis from the chips, which filter by what the practice IS. */}
      <PracticeGallery
        items={rows.map(toGalleryItem)}
        categories={["Writing", "Reading"]}
        emptyTitle={TABS.find((t) => t.key === tab)!.label}
        emptyNote={
          tab === "drafts"
            ? "Anything you generate in Writing lands here until you set it to a group."
            : tab === "published"
              ? "Nothing published yet. Open Writing, generate a prompt, then set it to a group."
              : "Nothing archived."
        }
      />
    </div>
  );
}

/** This page's row → the shared gallery's flat shape. */
function toGalleryItem(practice: PracticeRow): GalleryItem {
  const isReading = practice.kind === "reading";
  const category = isReading
    ? "Reading"
    : practice.category
      ? TASK2_CATEGORY_LABELS[practice.category as Task2Category]
      : "Task 2";

  const stats =
    practice.groups.length > 0
      ? [
          practice.groups.join(", "),
          `${practice.completed}/${practice.assigned} done`,
          practice.averageBand != null ? `avg ${practice.averageBand.toFixed(1)}` : null,
        ].filter((x): x is string => Boolean(x))
      : ["not set to anyone"];

  return {
    id: `${practice.kind}-${practice.id}`,
    // "Open" is the real runner, not a console preview: the only honest way to
    // see a practice is the screen the student sees.
    href: isReading ? `/read/test/${practice.id}` : `/write/${practice.id}`,
    title: practice.title || "Untitled prompt",
    byline: [
      category,
      practice.topicFamily,
      new Date(practice.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    ]
      .filter(Boolean)
      .join(" · "),
    tone: isReading ? "reading" : "writing",
    // The chips filter by skill; the task category is already in the byline,
    // and a chip row of nine Task 2 topics would be longer than the grid.
    category: isReading ? "Reading" : "Writing",
    headline:
      practice.averageBand != null
        ? practice.averageBand.toFixed(1)
        : practice.targetBand
          ? String(practice.targetBand)
          : "—",
    headnote:
      practice.averageBand != null
        ? "average band"
        : practice.targetBand
          ? "target band"
          : "not attempted",
    badge: practice.assigned > 0 ? `${practice.completed}/${practice.assigned}` : undefined,
    stats,
    date: practice.createdAt,
    value: practice.averageBand,
    actions:
      practice.kind === "writing" ? (
        <PracticeRowActions promptId={practice.id} archived={practice.tab === "archived"} />
      ) : null,
  };
}
