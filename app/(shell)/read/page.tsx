import { AssignedHub } from "@/shared/components/assignments/assigned-hub";
import { loadStudentAssignments } from "@/lib/assignments/student";
import { isHomeworkOnlyStudent, requireOrgUser } from "@/lib/auth";
import { loadStudentEstimates } from "@/lib/estimates/load";
import { READING_LIBRARY_ORG_ID } from "@/lib/reading/service";
import { composeTestSubtitle, composeTestTitle } from "@/lib/reading/titles";
import type { ReadingQuestionType } from "@/lib/reading/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getLibraryQuota } from "@/lib/quota";

import {
  ReadingHub,
  type Graded,
  type LibraryTest,
  type Live,
  type PassageCard,
  type TestCard,
} from "./_components/read-hub";
import { PANEL } from "@/lib/theme/tokens";

export const dynamic = "force-dynamic";

// A real IELTS passage runs 13–14 questions and we now generate 13–15. Hide any
// legacy/under-density passages (the old too-light ~9-question rows, or stray
// short CEFR sets) so the practice hub only offers exam-realistic passages.
const MIN_PRACTICE_QUESTIONS = 11;

// The hand-written library holds 103 full tests (lib/reading/curated). The cap only
// guards against a runaway table, so it must stay AHEAD of that count or the newest
// tests silently vanish from the hub — the list is ordered by band, so what drops off
// is the hardest material, which nobody reports as missing.
// ⚠️ Deliberately a literal rather than CURATED_READING_TESTS.length: importing the
// curated module here would pull every passage body (~100 files of prose) into this
// page's server bundle to learn one number.
const LIBRARY_TEST_LIMIT = 150;

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
        // Many tests share a band; without a tie-break their "Practice test N"
        // numbers could swap between visits.
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(LIBRARY_TEST_LIMIT),
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
      /* ⭐ EVERY ATTEMPT THIS LEARNER HAS, finished or still open. The redesigned
         card reports a real result (band, score, how long it took, when) and an
         unfinished run, so a bare "has a graded attempt" boolean is no longer
         enough. Newest first, so the first row seen for an id is the one to show. */
      supabase
        .from("reading_attempts")
        /* ⚠️ ONE STRING LITERAL, NEVER A CONCATENATION. supabase-js parses the
           select list at the TYPE level, and it can only do that for a literal —
           splitting this across a `+` makes the row type collapse to
           GenericStringError and every field access below fails to compile. */
        .select(
          "id, test_id, passage_id, status, band, correct_count, total_questions, duration_seconds, submitted_at, cursor_index, seconds_left, answered_count",
        )
        .eq("student_id", profile.id)
        .in("status", ["graded", "in_progress"])
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false }),
    ]);

  /* ⭐ THE FREE SHELF. Which library items this learner may still open, worked
     out here so the card can carry a lock rather than the learner discovering
     it after a click. The route enforces it for real — this is the honest
     shop window, not the till. Already-opened items are never locked, however
     far over the limit the org is: the copy is theirs already. */
  const libraryQuota = await getLibraryQuota(profile.organization_id);

  /* ⚠️ A LIBRARY CARD REPORTS THE STATE OF THE LEARNER'S COPY, NOT THE LIBRARY ROW.
     Starting a library item clones it into the learner's org with library_key set
     to the library id; every attempt then hangs off the CLONE. So the library
     card has to be told which clone is its own before it can show a band or a
     paused run — the library row itself never has an attempt against it.
     This is also the query the free shelf needs, so it runs unconditionally now
     (it used to be skipped on a paid plan, where openedKeys went unused). */
  const [cloneTestsRes, clonePassagesRes] = await Promise.all([
    supabase.from("reading_tests").select("id, library_key").not("library_key", "is", null),
    supabase.from("reading_passages").select("id, library_key").not("library_key", "is", null),
  ]);
  const openedKeys = new Set<string>();
  const cloneIdByKey = new Map<string, string>();
  for (const row of [...(cloneTestsRes.data ?? []), ...(clonePassagesRes.data ?? [])]) {
    const { id, library_key: key } = row as { id: string; library_key: string | null };
    if (!key) continue;
    openedKeys.add(key);
    // Newest clone wins if a learner somehow holds two copies of one library id.
    cloneIdByKey.set(key, id);
  }
  const isLocked = (libraryId: string) =>
    libraryQuota.limit !== null && libraryQuota.exceeded && !openedKeys.has(libraryId);

  /* The attempt rows, reduced to what a card draws. Newest first out of the
     query, so `setDefault` keeps the FIRST row it sees for each id and later
     (older) ones are ignored. Graded and in-progress are tracked separately: a
     test can legitimately be both — finished once, and open again right now. */
  const gradedByTest = new Map<string, Graded>();
  const gradedByPassage = new Map<string, Graded>();
  const liveByTest = new Map<string, Live>();
  const liveByPassage = new Map<string, Live>();
  for (const a of attemptsRes.data ?? []) {
    const testId = a.test_id as string | null;
    const passageId = a.passage_id as string | null;
    if (a.status === "graded") {
      const g: Graded = {
        attemptId: a.id as string,
        band: (a.band as number | null) ?? null,
        correct: (a.correct_count as number | null) ?? 0,
        total: (a.total_questions as number | null) ?? 0,
        durationSeconds: (a.duration_seconds as number | null) ?? null,
        at: (a.submitted_at as string | null) ?? null,
      };
      if (testId && !gradedByTest.has(testId)) gradedByTest.set(testId, g);
      if (passageId && !gradedByPassage.has(passageId)) gradedByPassage.set(passageId, g);
    } else {
      const l: Live = {
        cursorIndex: (a.cursor_index as number | null) ?? null,
        secondsLeft: (a.seconds_left as number | null) ?? null,
        answered: (a.answered_count as number | null) ?? 0,
      };
      if (testId && !liveByTest.has(testId)) liveByTest.set(testId, l);
      if (passageId && !liveByPassage.has(passageId)) liveByPassage.set(passageId, l);
    }
  }
  /** A card's own id if it owns one, else the id of the learner's clone of it. */
  const stateId = (id: string) => cloneIdByKey.get(id) ?? id;

  const reading = estimates.bySkill.reading;
  const levelBand = reading.currentBand ?? reading.targetBand ?? null;
  const levelMeasured = reading.currentBand != null;

  /* ⭐ WHAT EACH TEST IS ABOUT. The card now names the test and lists its
     passages instead of reading "Practice test N", which needs the passages of
     every test on the page — one query for both shelves. Service-role, because
     a library test's passages live in the library org. */
  const testIds = [
    ...(libTestsRes.data ?? []).map((t) => t.id as string),
    ...(ownTestsRes.data ?? []).map((t) => t.id as string),
  ];
  const partsByTest = new Map<string, { title: string; topic: string | null }[]>();
  if (testIds.length) {
    const { data: parts } = await admin
      .from("reading_passages")
      .select("test_id, title, topic, order_in_test")
      .in("test_id", testIds)
      .order("order_in_test", { ascending: true });
    for (const p of parts ?? []) {
      const tid = p.test_id as string;
      const list = partsByTest.get(tid) ?? [];
      list.push({ title: (p.title as string) ?? "", topic: (p.topic as string | null) ?? null });
      partsByTest.set(tid, list);
    }
  }
  /** Title + subtitle for one test, composed from its passages. */
  const nameOf = (testId: string) => {
    const parts = partsByTest.get(testId) ?? [];
    return {
      title: composeTestTitle(parts.map((p) => p.topic ?? p.title)),
      subtitle: composeTestSubtitle(parts.map((p) => p.title)),
    };
  };

  const libraryTests: LibraryTest[] = (libTestsRes.data ?? []).map((t) => {
    const id = t.id as string;
    const key = stateId(id);
    return {
      id,
      targetBand: (t.target_band as number | null) ?? null,
      locked: isLocked(id),
      ...nameOf(id),
      graded: gradedByTest.get(key) ?? null,
      live: liveByTest.get(key) ?? null,
    };
  });

  // Number generated tests "Reading test 1, 2, …" in the order they were created.
  // The list arrives newest-first, so the newest gets the highest number (= total).
  const totalOwnTests = ownTestsRes.count ?? ownTestsRes.data?.length ?? 0;
  const ownTests: TestCard[] = (ownTestsRes.data ?? []).map((t, i) => {
    const id = t.id as string;
    return {
      id,
      targetBand: (t.target_band as number | null) ?? null,
      createdAt: t.created_at as string,
      seq: totalOwnTests - i,
      ...nameOf(id),
      graded: gradedByTest.get(id) ?? null,
      live: liveByTest.get(id) ?? null,
    };
  });

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
    .filter((c) => c.questionCount >= MIN_PRACTICE_QUESTIONS)
    .map((c) => ({
      ...c,
      locked: isLocked(c.id),
      graded: gradedByPassage.get(stateId(c.id)) ?? null,
      live: liveByPassage.get(stateId(c.id)) ?? null,
    }));
  const ownPassages = (ownPassagesRes.data ?? [])
    .map(toPassageCard)
    .filter((c) => c.questionCount >= MIN_PRACTICE_QUESTIONS)
    .map((c) => ({
      ...c,
      graded: gradedByPassage.get(c.id) ?? null,
      live: liveByPassage.get(c.id) ?? null,
    }));

  // The shell (sidebar + header) is owned by the (shell) layout; this page only
  // paints its own full-bleed surface inside it.
  return (
    <div
      style={{
        minHeight: "100%",
        background: PANEL,
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
        freeUsed={libraryQuota.used}
        freeLimit={libraryQuota.limit}
      />
    </div>
  );
}
