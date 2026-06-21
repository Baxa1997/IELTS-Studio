import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { recomputeSkillEstimate } from "@/lib/estimates/service";
import { gradeReadingTest, type GradableQuestion } from "@/lib/reading/grade";
import { READING_DISCLAIMER } from "@/lib/reading/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Objective grading only — no model call. Node runtime so it can use the
// service-role client to read the (student-invisible) answer keys.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/reading/test/[id]/submit  — id = test id.
 * Body: { answers: { [questionId]: string }, durationSeconds?: number }
 *
 * Confirms the student may see this test (RLS = approved + same org), grades every
 * answer across all 3 passages against the stored keys (read via service_role,
 * since students cannot read reading_questions), converts the band ONCE over the
 * full ~40 (the real IELTS raw-score table), records one attempt keyed by test_id,
 * and returns the full per-passage review with correct answers + proofs revealed.
 */
export async function POST(req: Request, ctx: RouteContext): Promise<Response> {
  const { id: testId } = await ctx.params;

  // --- Authn: students only --------------------------------------------------
  const session = await getSession();
  if (!session) return fail(401, "unauthorized");
  if (!session.profile) return fail(403, "forbidden"); // super_admin: no org practice
  if (session.profile.role !== "student") return fail(403, "students_only");
  const { id: studentId, organization_id: organizationId } = session.profile;

  // --- Body ------------------------------------------------------------------
  const { answers, durationSeconds } = await readBody(req);

  // --- Access gate: RLS returns the test only if approved + in the student's org.
  const supabase = await createClient();
  const { data: test, error: tErr } = await supabase
    .from("reading_tests")
    .select("id")
    .eq("id", testId)
    .maybeSingle();
  if (tErr) return fail(500, "load_failed");
  if (!test) return fail(404, "test_not_found");

  // --- Load the test's passages (order + title) via RLS ----------------------
  const { data: passages, error: pErr } = await supabase
    .from("reading_passages")
    .select("id, title, order_in_test")
    .eq("test_id", testId)
    .order("order_in_test", { ascending: true });
  if (pErr) return fail(500, "load_failed");
  if (!passages || passages.length === 0) return fail(422, "no_passages");

  const passageMeta = new Map<string, { order: number; title: string }>();
  for (const p of passages) {
    passageMeta.set(p.id as string, {
      order: (p.order_in_test as number | null) ?? 1,
      title: (p.title as string) ?? "",
    });
  }

  // --- Load the answer keys (service_role — students can't read this table) ---
  const admin = createAdminClient();
  const { data: rows, error: qErr } = await admin
    .from("reading_questions")
    .select("id, question_type, order_index, prompt, options, answer_key, supporting_sentence, explanation, passage_id")
    .in("passage_id", [...passageMeta.keys()])
    .eq("organization_id", organizationId)
    .order("order_index", { ascending: true });
  if (qErr) return fail(500, "load_failed");
  if (!rows || rows.length === 0) return fail(422, "no_questions");

  const questions: GradableQuestion[] = rows.map((q) => {
    const meta = passageMeta.get(q.passage_id as string);
    return {
      id: q.id as string,
      question_type: q.question_type,
      order_index: q.order_index as number,
      prompt: (q.prompt as string) ?? "",
      options: (q.options as string[] | null) ?? null,
      answer_key: (q.answer_key as string) ?? "",
      supporting_sentence: (q.supporting_sentence as string) ?? "",
      explanation: (q.explanation as string) ?? "",
      passage_order: meta?.order,
      passage_title: meta?.title,
    };
  });

  // --- Grade objectively (band over the whole ~40) ---------------------------
  const grade = gradeReadingTest(questions, answers);

  // --- Persist ONE attempt keyed by the test (passage_id null) ---------------
  const duration =
    typeof durationSeconds === "number" && Number.isFinite(durationSeconds) && durationSeconds >= 0
      ? Math.round(durationSeconds)
      : null;

  const { error: insErr } = await admin.from("reading_attempts").insert({
    organization_id: organizationId,
    student_id: studentId,
    test_id: testId,
    answers,
    raw_score: grade.correctCount,
    band: grade.band,
    status: "graded",
    total_questions: grade.total,
    correct_count: grade.correctCount,
    percent: grade.percent,
    duration_seconds: duration,
    details: grade.items,
    type_breakdown: grade.typeBreakdown,
    submitted_at: new Date().toISOString(),
  });
  if (insErr) {
    console.error("[reading/test/submit] failed to store attempt:", testId, insErr.message);
    return fail(500, "store_failed");
  }

  // Roll the student's reading band estimate forward (best-effort).
  try {
    await recomputeSkillEstimate(admin, { studentId, organizationId, skill: "reading" });
  } catch (err) {
    console.error("[reading/test/submit] estimate recompute failed:", testId, err);
  }

  return NextResponse.json(
    {
      result: {
        total: grade.total,
        correctCount: grade.correctCount,
        percent: grade.percent,
        band: grade.band,
        passages: grade.passages,
        typeBreakdown: grade.typeBreakdown,
        items: grade.items,
      },
      disclaimer: READING_DISCLAIMER,
    },
    { status: 200 },
  );
}

/** Tolerate a missing/garbage body; answers default to empty (all wrong). */
async function readBody(req: Request): Promise<{ answers: Record<string, string>; durationSeconds?: number }> {
  try {
    const body = (await req.json()) as { answers?: unknown; durationSeconds?: unknown };
    const answers: Record<string, string> = {};
    if (body && typeof body.answers === "object" && body.answers !== null) {
      for (const [k, v] of Object.entries(body.answers as Record<string, unknown>)) {
        if (typeof v === "string") answers[k] = v;
      }
    }
    const durationSeconds = typeof body?.durationSeconds === "number" ? body.durationSeconds : undefined;
    return { answers, durationSeconds };
  } catch {
    return { answers: {} };
  }
}

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}
