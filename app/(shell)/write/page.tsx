import { AssignedHub } from "@/components/assignments/assigned-hub";
import { loadStudentAssignments } from "@/lib/assignments/student";
import { isHomeworkOnlyStudent, requireOrgUser } from "@/lib/auth";
import { loadStudentEstimates } from "@/lib/estimates/load";
import { loadStudyPlan } from "@/lib/plan/service";
import { pitchDifficulty } from "@/lib/plan/types";
import { seedStarterPrompts } from "@/lib/prompts/starter";
import { DEFAULT_DIFFICULTY } from "@/lib/prompts/types";
import { createClient } from "@/lib/supabase/server";

import { WritingLibrary, type LibraryPrompt, type PromptDraft, type PromptMark } from "./library";

export const dynamic = "force-dynamic";

/**
 * Writing library ("outside"). Students only. Renders INSIDE the app shell (the
 * sidebar stays). Browse cached AI prompts, generate a fresh one, or paste your
 * own; each choice navigates to /write/[id] — the full-screen editor (no sidebar).
 * Practised prompts carry their best band and link straight to that essay's feedback.
 */
export default async function WritePage() {
  const { profile } = await requireOrgUser();
  // A center student gets this skill's homework here, not a library and
  // not a redirect: "Writing" in the menu should open Writing and
  // show what they owe. Generating is a teaching decision for them.
  if (isHomeworkOnlyStudent(profile)) {
    const assignments = await loadStudentAssignments(profile.id);
    return (
      <AssignedHub skill="writing" assignments={assignments.filter((a) => a.kind === "writing")} />
    );
  }
  // Staff browse the same library the class does — a teacher previews a prompt by
  // doing what the student will do, not through a console mock-up of it. They
  // have no study plan, so the plan-shaped bits below fall back to defaults.
  const isStaff = profile.role !== "student";

  // New learners onboard first — the (shell) layout renders the takeover, so this
  // page renders nothing until a plan exists. Then ensure the starter set is seeded.
  const plan = await loadStudyPlan(profile.id);
  if (!plan && !isStaff) return null;
  if (plan) {
    await seedStarterPrompts(
      { studentId: profile.id, organizationId: profile.organization_id },
      plan,
    );
  }

  const supabase = await createClient();

  // Browsable library: approved AI-generated + curated 'seed' prompts (one-off
  // custom pastes stay out). RLS restricts to the learner's org.
  const { data: lib } = await supabase
    .from("writing_prompts")
    .select("id, task_type, category, prompt_text, topic_family, difficulty, source, created_at")
    .eq("status", "approved")
    .in("source", ["ai", "seed"])
    .order("created_at", { ascending: false })
    // The curated set alone is ~176 prompts across the three tabs, so a cap of
    // 60 silently cut most of it off. A learner's org holds only that set plus
    // what they generate, so this stays a few hundred small rows.
    .limit(500);

  const library: LibraryPrompt[] = (lib ?? []).map((r) => ({
    id: r.id as string,
    task_type: r.task_type as LibraryPrompt["task_type"],
    category: (r.category as string | null) ?? null,
    prompt_text: r.prompt_text as string,
    figure: null, // cards don't render the chart; the studio detail page loads it
    topic_family: (r.topic_family as string | null) ?? null,
    difficulty: (r.difficulty as number | null) ?? null,
    // On-demand generations (source = 'ai') surface first, badged "New", no band.
    generated: (r.source as string | null) === "ai",
  }));

  /* ⭐ WHAT THIS LEARNER HAS AGAINST EACH PROMPT. The redesigned card shows a
     real band and an unfinished draft, so a bare "has attempted it" list is no
     longer enough — it needs the essay itself (to link its feedback), its word
     count, and when it was marked. Newest first, so the first row seen for a
     prompt is the one to show. */
  const { data: done } = await supabase
    .from("essays")
    .select("id, prompt_id, status, word_count, updated_at")
    .eq("student_id", profile.id)
    .not("prompt_id", "is", null)
    .order("updated_at", { ascending: false });
  const essays = done ?? [];
  const practised = Array.from(new Set(essays.map((d) => d.prompt_id as string)));

  /* ⚠️ TWO QUERIES, NOT A POSTGREST EMBED. `gradings` reaches `essays` through a
     COMPOSITE foreign key (essay_id, organization_id); PostgREST cannot resolve
     an embed across one and the request fails in a way that renders a blank
     page rather than an error. Joined in JS instead. */
  const essayIds = essays.map((e) => e.id as string);
  const bandByEssay = new Map<string, number>();
  if (essayIds.length) {
    const { data: marks } = await supabase
      .from("gradings")
      .select("essay_id, overall_band, created_at")
      .in("essay_id", essayIds)
      .order("created_at", { ascending: false });
    for (const m of marks ?? []) {
      const id = m.essay_id as string;
      // Newest grading wins — the revision loop re-grades the same essay.
      if (!bandByEssay.has(id)) bandByEssay.set(id, Number(m.overall_band));
    }
  }

  // Plain objects, not Maps: this crosses into a client component.
  const drafts: Record<string, PromptDraft> = {};
  const marked: Record<string, PromptMark> = {};
  for (const e of essays) {
    const promptId = e.prompt_id as string;
    const essayId = e.id as string;
    const words = (e.word_count as number | null) ?? 0;
    const at = (e.updated_at as string | null) ?? null;
    if (e.status === "draft") {
      if (!drafts[promptId]) drafts[promptId] = { essayId, words, at };
    } else if (!marked[promptId]) {
      marked[promptId] = { essayId, words, at, band: bandByEssay.get(essayId) ?? null };
    }
  }

  const est = await loadStudentEstimates(profile.id);

  // The band generated tasks are pitched at — surfaced so the learner sees tasks
  // are tuned to their level (the route applies the same pitch server-side).
  const pitchBand = plan
    ? pitchDifficulty({
        measuredBand: est.bySkill.writing.currentBand,
        selfReportedBand: plan.selfReportedBand,
        targetBand: plan.targetBand,
      })
    : DEFAULT_DIFFICULTY;

  // Own classes only — a teacher can attach to the classes they run, which is
  // the rule assignPractice enforces server-side too.
  let teacherGroups: { id: string; name: string }[] = [];
  if (profile.role === "teacher") {
    const { data } = await supabase
      .from("groups")
      .select("id, name")
      .eq("teacher_id", profile.id)
      .order("name");
    teacherGroups = (data ?? []) as { id: string; name: string }[];
  }

  // The shell (sidebar + header) is owned by the (shell) layout.
  return (
    <WritingLibrary
      library={library}
      practised={practised}
      drafts={drafts}
      marked={marked}
      pitchBand={pitchBand}
      isTeacher={profile.role === "teacher"}
      groups={teacherGroups}
    />
  );
}
