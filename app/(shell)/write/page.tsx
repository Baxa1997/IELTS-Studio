import { TeacherPractice } from "@/components/console/teacher-practice";
import { requireOrgUser } from "@/lib/auth";
import { loadStudentEstimates } from "@/lib/estimates/load";
import { loadStudyPlan } from "@/lib/plan/service";
import { pitchDifficulty } from "@/lib/plan/types";
import { seedStarterPrompts } from "@/lib/prompts/starter";
import {
  DEFAULT_DIFFICULTY,
  ESSAY_TASK_LABELS,
  ESSAY_TASK_TYPES,
  TASK2_CATEGORIES,
} from "@/lib/prompts/types";
import { createClient } from "@/lib/supabase/server";

import { WritingLibrary, type LibraryPrompt } from "./library";

export const dynamic = "force-dynamic";

/**
 * Writing library ("outside"). Students only. Renders INSIDE the app shell (the
 * sidebar stays). Browse cached AI prompts, generate a fresh one, or paste your
 * own; each choice navigates to /write/[id] — the full-screen editor (no sidebar).
 * Practised prompts carry their best band and link straight to that essay's feedback.
 */
export default async function WritePage() {
  const { profile } = await requireOrgUser();
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
    .limit(60);

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

  // Which prompts this learner has already attempted — badged + filterable in the
  // list, but every card still starts a fresh attempt. Past grades live in Activities.
  const { data: done } = await supabase
    .from("essays")
    .select("prompt_id")
    .eq("student_id", profile.id)
    .not("prompt_id", "is", null);
  const practised = Array.from(new Set((done ?? []).map((d) => d.prompt_id as string)));

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

  // A teacher gets a bench above the library: say the class's level, generate,
  // and start or attach the result — without being dropped into the runner the
  // moment it exists. Only a teacher; a center_admin doesn't set practice.
  let bench: React.ReactNode = null;
  let teacherGroups: { id: string; name: string }[] = [];
  if (profile.role === "teacher") {
    const { data: myGroups } = await supabase
      .from("groups")
      .select("id, name")
      .eq("teacher_id", profile.id)
      .order("name");
    teacherGroups = (myGroups ?? []) as { id: string; name: string }[];
    bench = (
      <TeacherPractice
        kind="writing"
        taskTypes={ESSAY_TASK_TYPES.map((t) => ({ value: t, label: ESSAY_TASK_LABELS[t] }))}
        categories={TASK2_CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))}
        groups={teacherGroups}
        defaultDifficulty={DEFAULT_DIFFICULTY}
      />
    );
  }

  // The shell (sidebar + header) is owned by the (shell) layout.
  return (
    <>
      {bench ? <div style={{ padding: "18px 20px 0" }}>{bench}</div> : null}
      <WritingLibrary
        library={library}
        practised={practised}
        pitchBand={pitchBand}
        isTeacher={profile.role === "teacher"}
        groups={teacherGroups}
      />
    </>
  );
}
