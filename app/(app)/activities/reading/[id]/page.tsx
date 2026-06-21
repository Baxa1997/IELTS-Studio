import Link from "next/link";
import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { READING_QUESTION_LABELS, type ReadingQuestionType } from "@/lib/reading/types";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** One graded question as stored in reading_attempts.details. Full-test attempts
 *  tag each item with the passage it belongs to (single-passage attempts don't). */
interface ReviewRow {
  id: string;
  question_type: ReadingQuestionType;
  order_index: number;
  prompt: string;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  supporting_sentence: string;
  explanation: string;
  passage_order?: number;
  passage_title?: string;
}

type Breakdown = Partial<Record<ReadingQuestionType, { attempted: number; correct: number }>>;

interface PassageGroup {
  order: number;
  title: string;
  items: ReviewRow[];
  correct: number;
}

/**
 * Read-only review of one past reading attempt, rendered entirely from the stored
 * `reading_attempts.details` (no re-grading). RLS scopes the attempt to its owner.
 *
 * Handles both shapes: a single-passage attempt (passage_id) and a full 3-passage
 * TEST attempt (test_id) — the latter is regrouped by passage, the way it was taken,
 * with a per-passage score and headed sections.
 */
export default async function ReadingFeedbackPage({ params }: PageProps) {
  await requireOrgUser();
  const { id } = await params;
  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("reading_attempts")
    .select("test_id, passage_id, band, percent, correct_count, total_questions, type_breakdown, details, submitted_at")
    .eq("id", id)
    .maybeSingle();
  if (!attempt) redirect("/activities");

  const isTest = attempt.test_id != null;
  const items = (attempt.details ?? []) as ReviewRow[];
  const breakdown = (attempt.type_breakdown ?? {}) as Breakdown;
  const band = attempt.band == null ? null : Number(attempt.band);

  // Title: a full test has no single passage; a passage attempt uses its title.
  let title = "Reading passage";
  if (isTest) {
    title = "Full reading test";
  } else if (attempt.passage_id) {
    const { data: passage } = await supabase
      .from("reading_passages")
      .select("title")
      .eq("id", attempt.passage_id as string)
      .maybeSingle();
    title = (passage?.title as string | undefined) ?? "Reading passage";
  }

  const groups = groupByPassage(items);
  const grouped = isTest && groups.length > 1;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/activities" className="text-muted-foreground hover:text-foreground text-sm">
          ← Activities
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
        {isTest ? (
          <p className="text-muted-foreground mt-1 text-sm">
            3 passages · graded over all {attempt.total_questions ?? items.length} questions
          </p>
        ) : null}
      </div>

      {/* Score */}
      <section className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <div>
          <span className="text-primary text-4xl font-semibold tabular-nums">
            {band == null ? "—" : band.toFixed(1)}
          </span>
          <span className="text-muted-foreground ml-2 text-sm">indicative band</span>
        </div>
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium tabular-nums">
            {attempt.correct_count ?? 0}/{attempt.total_questions ?? items.length}
          </span>{" "}
          correct
          {attempt.percent != null ? ` · ${Math.round(Number(attempt.percent))}%` : ""}
        </p>
      </section>

      {/* Per-passage breakdown (full tests only) */}
      {grouped ? (
        <section className="grid gap-3 sm:grid-cols-3">
          {groups.map((g) => (
            <div key={g.order} className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Passage {g.order}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {g.correct}/{g.items.length}
              </p>
              {g.title !== `Passage ${g.order}` ? (
                <p className="text-muted-foreground mt-1 truncate text-xs">{g.title}</p>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      <WeakTypes breakdown={breakdown} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Review</h2>
        {grouped
          ? groups.map((g) => (
              <div key={g.order} className="space-y-3">
                <h3 className="mt-5 text-sm font-semibold">
                  Passage {g.order}
                  {g.title !== `Passage ${g.order}` ? ` — ${g.title}` : ""}
                </h3>
                {g.items.map((it) => (
                  <ReviewItem key={it.id} item={it} />
                ))}
              </div>
            ))
          : items.map((it) => <ReviewItem key={it.id} item={it} />)}
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No per-question detail was stored for this attempt.</p>
        ) : null}
      </section>
    </div>
  );
}

/** Group graded items by their passage (full-test attempts); single-passage
 *  attempts collapse to one group keyed at order 1. */
function groupByPassage(items: ReviewRow[]): PassageGroup[] {
  const map = new Map<number, PassageGroup>();
  for (const it of items) {
    const order = it.passage_order ?? 1;
    const g =
      map.get(order) ?? { order, title: it.passage_title?.trim() || `Passage ${order}`, items: [], correct: 0 };
    g.items.push(it);
    if (it.is_correct) g.correct += 1;
    map.set(order, g);
  }
  return [...map.values()].sort((a, b) => a.order - b.order);
}

function WeakTypes({ breakdown }: { breakdown: Breakdown }) {
  const rows = (Object.entries(breakdown) as [ReadingQuestionType, { attempted: number; correct: number }][])
    .map(([type, t]) => ({ type, ...t, ratio: t.attempted ? t.correct / t.attempted : 1 }))
    .sort((a, b) => a.ratio - b.ratio);
  if (rows.length === 0) return null;

  return (
    <section className="rounded-lg border p-4">
      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">By question type</p>
      <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {rows.map((r) => {
          const perfect = r.correct === r.attempted;
          return (
            <li key={r.type} className="flex items-center justify-between gap-3 text-sm">
              <span className={cn(!perfect && "font-medium")}>{READING_QUESTION_LABELS[r.type]}</span>
              <span className={cn("tabular-nums", perfect ? "text-muted-foreground" : "text-destructive")}>
                {r.correct}/{r.attempted}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ReviewItem({ item }: { item: ReviewRow }) {
  const shownStudent = item.student_answer?.trim() || "(no answer)";

  if (item.is_correct) {
    return (
      <article className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm">
            <span className="text-muted-foreground tabular-nums">Q{item.order_index}. </span>
            <span className="whitespace-pre-wrap">{item.prompt}</span>
          </p>
          <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400">Correct</span>
        </div>
        <p className="mt-1 text-sm">
          <span className="text-muted-foreground">Answer: </span>
          <span className="font-medium">{display(item.correct_answer)}</span>
        </p>
      </article>
    );
  }

  return (
    <article className="border-destructive/40 bg-destructive/5 rounded-lg border border-l-4 p-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm">
          <span className="text-muted-foreground tabular-nums">Q{item.order_index}. </span>
          <span className="whitespace-pre-wrap">{item.prompt}</span>
        </p>
        <span className="text-destructive shrink-0 text-xs font-semibold">Incorrect</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">You put: </span>
          <span className="line-through">{display(shownStudent)}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Correct: </span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">{display(item.correct_answer)}</span>
        </p>
      </div>

      {item.supporting_sentence?.trim() ? (
        <blockquote className="border-muted-foreground/30 text-muted-foreground mt-2 border-l-2 pl-3 text-sm italic">
          “{item.supporting_sentence.trim()}”
        </blockquote>
      ) : null}

      {item.explanation?.trim() ? (
        <p className="mt-2 text-sm">
          <span className="font-medium">Why the trap worked: </span>
          {item.explanation.trim()}
        </p>
      ) : null}
    </article>
  );
}

/** Make canonical verdict tokens human-readable. */
function display(answer: string): string {
  const map: Record<string, string> = {
    true: "True",
    false: "False",
    yes: "Yes",
    no: "No",
    not_given: "Not Given",
    "not given": "Not Given",
    ng: "Not Given",
  };
  return map[answer.trim().toLowerCase()] ?? answer;
}
