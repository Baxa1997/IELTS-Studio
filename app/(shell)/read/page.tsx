import { AssignedHub } from "@/components/assignments/assigned-hub";
import { loadStudentAssignments } from "@/lib/assignments/student";
import { isHomeworkOnlyStudent, requireOrgUser } from "@/lib/auth";
import { loadStudentEstimates } from "@/lib/estimates/load";
import { READING_LIBRARY_ORG_ID } from "@/lib/reading/service";
import type { ReadingQuestionType } from "@/lib/reading/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { ReadingHub, type LibraryTest, type PassageCard, type TestCard } from "./read-hub";

export const dynamic = "force-dynamic";

// A real IELTS passage runs 13–14 questions and we now generate 13–15. Hide any
// legacy/under-density passages (the old too-light ~9-question rows, or stray
// short CEFR sets) so the practice hub only offers exam-realistic passages.
const MIN_PRACTICE_QUESTIONS = 11;

/**
 * Reading hub — sidebar shell (like /write); the runner pages are full-screen.
 * This page only loads data; the compact tabbed UI lives in <ReadingHub>. Students
 * only.
 *
 * Two sources feed each tab: the SHARED LIBRARY (ready-to-start sample tests +
 * passages, read with the service-role client because they live in one library
 * org) and the learner's OWN freshly-generated content (library_key null). Library
 * items clone into the learner's org on Start; both show only a "Start" button.
 */
export default async function ReadingHubPage() {
  // Staff see the same hub as the class. A teacher gets one thing extra: an
  // Attach control under every card, so setting homework doesn't require
  // starting the test first to reach the runner's floating control.
  const { profile } = await requireOrgUser();
  // A center student gets this skill's homework here, not a library and
  // not a redirect: "Reading" in the menu should open Reading and
  // show what they owe. Generating is a teaching decision for them.
  if (isHomeworkOnlyStudent(profile)) {
    const assignments = await loadStudentAssignments(profile.id);
    return (
      <AssignedHub skill="reading" assignments={assignments.filter((a) => a.kind === "reading")} />
    );
  }
  const isTeacher = profile.role === "teacher";

  const supabase = await createClient();
  const admin = createAdminClient();

  // Own classes only — RLS narrows it anyway, and a teacher can only assign to
  // classes they run (the rule assignPractice enforces server-side).
  let teacherGroups: { id: string; name: string }[] = [];
  if (isTeacher) {
    const { data } = await supabase
      .from("groups")
      .select("id, name")
      .eq("teacher_id", profile.id)
      .order("name");
    teacherGroups = (data ?? []) as { id: string; name: string }[];
  }

  const [estimates, libTestsRes, libPassagesRes, ownTestsRes, ownPassagesRes, attemptsRes] =
    await Promise.all([
      loadStudentEstimates(profile.id),
      // Shared library (one org, read via service-role).
      admin
        .from("reading_tests")
        .select("id, target_band")
        .eq("organization_id", READING_LIBRARY_ORG_ID)
        .eq("is_library", true)
        .order("target_band", { ascending: true })
        .limit(12),
      admin
        .from("reading_passages")
        .select("id, title, topic, difficulty")
        .eq("organization_id", READING_LIBRARY_ORG_ID)
        .eq("is_library", true)
        .is("test_id", null)
        .order("difficulty", { ascending: true })
        .limit(12),
      // The learner's own freshly-generated content (clones carry library_key, so
      // they're excluded — a started library item stays under its library card).
      supabase
        .from("reading_tests")
        .select("id, target_band, created_at", { count: "exact" })
        .eq("created_by", profile.id)
        .is("library_key", null)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("reading_passages")
        .select("id, title, topic, difficulty")
        .is("test_id", null)
        .is("library_key", null)
        .order("created_at", { ascending: false })
        .limit(9),
      // Which of the learner's OWN tests/passages they've already practised (a graded
      // attempt exists) — so the hub can badge them "Practised" instead of "new".
      supabase
        .from("reading_attempts")
        .select("test_id, passage_id")
        .eq("student_id", profile.id)
        .eq("status", "graded"),
    ]);

  const practisedTests = new Set<string>();
  const practisedPassages = new Set<string>();
  for (const a of attemptsRes.data ?? []) {
    if (a.test_id) practisedTests.add(a.test_id as string);
    if (a.passage_id) practisedPassages.add(a.passage_id as string);
  }

  const reading = estimates.bySkill.reading;
  const levelBand = reading.currentBand ?? reading.targetBand ?? null;
  const levelMeasured = reading.currentBand != null;

  const libraryTests: LibraryTest[] = (libTestsRes.data ?? []).map((t) => ({
    id: t.id as string,
    targetBand: (t.target_band as number | null) ?? null,
  }));

  // Number generated tests "Reading test 1, 2, …" in the order they were created.
  // The list arrives newest-first, so the newest gets the highest number (= total).
  const totalOwnTests = ownTestsRes.count ?? ownTestsRes.data?.length ?? 0;
  const ownTests: TestCard[] = (ownTestsRes.data ?? []).map((t, i) => ({
    id: t.id as string,
    targetBand: (t.target_band as number | null) ?? null,
    createdAt: t.created_at as string,
    seq: totalOwnTests - i,
    practised: practisedTests.has(t.id as string),
  }));

  // Question count + distinct types per passage (answer-key table is teacher/admin-
  // read, so go through the service-role client; ids are unique across orgs).
  const passageRows = [...(libPassagesRes.data ?? []), ...(ownPassagesRes.data ?? [])];
  const passageIds = passageRows.map((p) => p.id as string);
  const byPassage = new Map<string, { count: number; types: Set<ReadingQuestionType> }>();
  if (passageIds.length) {
    const { data: qs } = await admin
      .from("reading_questions")
      .select("passage_id, question_type")
      .in("passage_id", passageIds);
    for (const q of qs ?? []) {
      const pid = q.passage_id as string;
      const e = byPassage.get(pid) ?? { count: 0, types: new Set<ReadingQuestionType>() };
      e.count += 1;
      e.types.add(q.question_type as ReadingQuestionType);
      byPassage.set(pid, e);
    }
  }

  const toPassageCard = (p: (typeof passageRows)[number]): PassageCard => {
    const e = byPassage.get(p.id as string);
    return {
      id: p.id as string,
      title: p.title as string,
      topic: (p.topic as string | null) ?? null,
      difficulty: (p.difficulty as number | null) ?? null,
      questionCount: e?.count ?? 0,
      types: e ? [...e.types] : [],
    };
  };
  const libraryPassages = (libPassagesRes.data ?? [])
    .map(toPassageCard)
    .filter((c) => c.questionCount >= MIN_PRACTICE_QUESTIONS);
  const ownPassages = (ownPassagesRes.data ?? [])
    .map(toPassageCard)
    .filter((c) => c.questionCount >= MIN_PRACTICE_QUESTIONS)
    .map((c) => ({ ...c, practised: practisedPassages.has(c.id) }));

  // The shell (sidebar + header) is owned by the (shell) layout; this page only
  // paints its own full-bleed surface inside it.
  return (
    <div
      style={{
        minHeight: "100%",
        background: "#fff",
      }}
    >
      <ReadingHub
        levelBand={levelBand}
        levelMeasured={levelMeasured}
        libraryTests={libraryTests}
        ownTests={ownTests}
        libraryPassages={libraryPassages}
        ownPassages={ownPassages}
        isTeacher={isTeacher}
        groups={teacherGroups}
      />
    </div>
  );
}
