import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { PracticeGallery, type GalleryItem } from "@/shared/components/practice/gallery";

export const dynamic = "force-dynamic";

/**
 * Activities = the student's HISTORY of graded work — past writing and reading,
 * each opening its stored feedback and band. New practice is launched from the
 * sidebar (Writing / Reading), not from here.
 */

const TASK_LABEL: Record<string, string> = {
  task2: "Task 2 — Essay",
  task1_academic: "Task 1 — Academic",
  task1_general: "Task 1 — Letter",
};

interface Row {
  id: string;
  href: string;
  title: string;
  date: string;
  band: number | null;
  sub?: string;
}

export default async function ActivitiesPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const supabase = await createClient();

  // Writing: the student's essays → their latest grading's band.
  const { data: essays } = await supabase
    .from("essays")
    .select("id, task_type, updated_at")
    .eq("student_id", profile.id)
    .order("updated_at", { ascending: false });
  const essayIds = (essays ?? []).map((e) => e.id as string);

  const latest = new Map<string, { band: number; at: string }>();
  if (essayIds.length) {
    const { data: gradings } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, created_at")
      .in("essay_id", essayIds)
      .order("created_at", { ascending: true });
    for (const g of gradings ?? []) {
      latest.set(g.essay_id as string, {
        band: Number(g.overall_band),
        at: g.created_at as string,
      });
    }
  }
  const writing: Row[] = (essays ?? [])
    .filter((e) => latest.has(e.id as string)) // graded only
    .map((e) => {
      const g = latest.get(e.id as string)!;
      return {
        id: e.id as string,
        href: `/activities/essay/${e.id}`,
        title: TASK_LABEL[e.task_type as string] ?? "Writing",
        date: g.at,
        band: g.band,
      };
    });

  // Reading: graded attempts → a single passage (passage_id) or a full 3-passage
  // test (test_id). Both open the same read-only review page.
  const { data: attempts } = await supabase
    .from("reading_attempts")
    .select("id, test_id, passage_id, band, percent, submitted_at, created_at")
    .eq("student_id", profile.id)
    .eq("status", "graded")
    .order("submitted_at", { ascending: false });
  const passageIds = [
    ...new Set((attempts ?? []).map((a) => a.passage_id as string).filter(Boolean)),
  ];
  const titles = new Map<string, string>();
  if (passageIds.length) {
    const { data: ps } = await supabase
      .from("reading_passages")
      .select("id, title")
      .in("id", passageIds);
    for (const p of ps ?? []) titles.set(p.id as string, p.title as string);
  }
  const reading: Row[] = (attempts ?? []).map((a) => {
    const pct = a.percent == null ? undefined : `${Math.round(Number(a.percent))}%`;
    const isTest = a.test_id != null;
    return {
      id: a.id as string,
      href: `/activities/reading/${a.id}`,
      title: isTest
        ? "Full reading test"
        : (titles.get(a.passage_id as string) ?? "Reading passage"),
      date: (a.submitted_at as string) ?? (a.created_at as string),
      band: a.band == null ? null : Number(a.band),
      sub: isTest ? `3 passages${pct ? ` · ${pct}` : ""}` : pct,
    };
  });

  /* Mapped into the gallery's flat shape here rather than in the component —
     the grid is shared with the teacher's library and a student's report, and
     each of those has a different row of its own. See shared/components/practice/gallery.tsx. */
  const items: GalleryItem[] = [
    ...writing.map((r) => ({
      id: r.id,
      href: r.href,
      title: r.title,
      byline: fmtDate(r.date),
      tone: "writing" as const,
      category: "Writing",
      // An ungraded piece shows a dash, never a zero: not marked is not the
      // same as marked badly, and the sort keeps it out of the band order too.
      headline: r.band == null ? "—" : r.band.toFixed(1),
      headnote: r.band == null ? "not graded" : "overall band",
      badge: r.band == null ? undefined : `Band ${r.band.toFixed(1)}`,
      stats: r.sub ? [r.sub] : [],
      date: r.date,
      value: r.band,
    })),
    ...reading.map((r) => ({
      id: r.id,
      href: r.href,
      title: r.title,
      byline: fmtDate(r.date),
      tone: "reading" as const,
      category: "Reading",
      headline: r.band == null ? "—" : r.band.toFixed(1),
      headnote: r.band == null ? "not graded" : "overall band",
      badge: r.band == null ? undefined : `Band ${r.band.toFixed(1)}`,
      stats: r.sub ? [r.sub] : [],
      date: r.date,
      value: r.band,
    })),
  ];

  return (
    <PracticeGallery
      title="Activities"
      subtitle="Every piece of practice you have had marked. Open any one to see its feedback and band."
      items={items}
      categories={["Writing", "Reading"]}
      emptyTitle="Nothing here yet"
      emptyNote="Start Writing or Reading from the sidebar — your graded work and feedback collect here."
    />
  );
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(iso),
  );
}
