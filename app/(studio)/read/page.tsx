import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/shell";
import { TargetCard } from "@/components/app-shell/target-card";
import { requireOrgUser, roleHome } from "@/lib/auth";
import { loadStudentEstimates } from "@/lib/estimates/load";
import { READING_LIBRARY_ORG_ID } from "@/lib/reading/service";
import type { ReadingQuestionType } from "@/lib/reading/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { ReadingHub, type LibraryTest, type PassageCard, type TestCard } from "./read-hub";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  center_admin: "Center admin",
  teacher: "Teacher",
  student: "Student",
};

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
  const { user, profile } = await requireOrgUser();
  if (profile.role !== "student") redirect(roleHome(profile.role));

  const supabase = await createClient();
  const admin = createAdminClient();

  const [estimates, libTestsRes, libPassagesRes, ownTestsRes, ownPassagesRes] = await Promise.all([
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
      .select("id, target_band, created_at")
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
  ]);

  const reading = estimates.bySkill.reading;
  const levelBand = reading.currentBand ?? reading.targetBand ?? null;
  const levelMeasured = reading.currentBand != null;

  const libraryTests: LibraryTest[] = (libTestsRes.data ?? []).map((t) => ({
    id: t.id as string,
    targetBand: (t.target_band as number | null) ?? null,
  }));

  const ownTests: TestCard[] = (ownTestsRes.data ?? []).map((t) => ({
    id: t.id as string,
    targetBand: (t.target_band as number | null) ?? null,
    createdAt: t.created_at as string,
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
    .filter((c) => c.questionCount > 0);
  const ownPassages = (ownPassagesRes.data ?? [])
    .map(toPassageCard)
    .filter((c) => c.questionCount > 0);

  const target = Math.max(
    estimates.bySkill.reading.targetBand,
    estimates.bySkill.writing.targetBand,
  );

  return (
    <AppShell
      role={profile.role}
      home={roleHome(profile.role)}
      name={profile.full_name ?? user.email ?? "Account"}
      roleLabel={ROLE_LABEL[profile.role] ?? profile.role}
      contentClassName=""
      sidebarFooter={<TargetCard target={target} done={estimates.diagnosticComplete} />}
    >
      <div
        style={{
          minHeight: "calc(100dvh - 3.5rem)",
          background: "linear-gradient(178deg,#FBFAEF 0%,#F4F2E1 100%)",
        }}
      >
        <ReadingHub
          levelBand={levelBand}
          levelMeasured={levelMeasured}
          libraryTests={libraryTests}
          ownTests={ownTests}
          libraryPassages={libraryPassages}
          ownPassages={ownPassages}
        />
      </div>
    </AppShell>
  );
}
