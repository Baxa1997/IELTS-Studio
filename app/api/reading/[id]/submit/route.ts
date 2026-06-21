import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { recomputeSkillEstimate } from "@/lib/estimates/service";
import { gradeReadingAttempt, type GradableQuestion } from "@/lib/reading/grade";
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
 * POST /api/reading/[id]/submit  — id = passage id.
 * Body: { answers: { [questionId]: string }, durationSeconds?: number }
 *
 * Confirms the student may see this passage (RLS = approved + same org), grades
 * their answers against the stored keys (read via service_role, since students
 * cannot read reading_questions), records the attempt — including the per-TYPE
 * tally for targeting weak areas — and returns the full review with the correct
 * answers and proving sentences revealed (post-submit is the right reveal moment).
 */
export async function POST(req: Request, ctx: RouteContext): Promise<Response> {
  const { id: passageId } = await ctx.params;

  // --- Authn: students only --------------------------------------------------
  const session = await getSession();
  if (!session) return fail(401, "unauthorized");
  if (!session.profile) return fail(403, "forbidden"); // super_admin: no org practice
  if (session.profile.role !== "student") return fail(403, "students_only");
  const { id: studentId, organization_id: organizationId } = session.profile;

  // --- Body ------------------------------------------------------------------
  const { answers, durationSeconds } = await readBody(req);

  // --- Access gate: RLS returns the passage only if approved + in the student's
  //     org. If it's hidden, this reads as "not found". -----------------------
  const supabase = await createClient();
  const { data: passage, error: pErr } = await supabase
    .from("reading_passages")
    .select("id, title")
    .eq("id", passageId)
    .maybeSingle();
  if (pErr) return fail(500, "load_failed");
  if (!passage) return fail(404, "passage_not_found");

  // --- Load the answer keys (service_role — students can't read this table) ---
  const admin = createAdminClient();
  const { data: rows, error: qErr } = await admin
    .from("reading_questions")
    .select("id, question_type, order_index, prompt, options, answer_key, supporting_sentence, explanation")
    .eq("passage_id", passageId)
    .eq("organization_id", organizationId)
    .order("order_index", { ascending: true });
  if (qErr) return fail(500, "load_failed");
  if (!rows || rows.length === 0) return fail(422, "no_questions");

  // --- Grade objectively -----------------------------------------------------
  const grade = gradeReadingAttempt(rows as GradableQuestion[], answers);

  // --- Persist the attempt (service_role; RLS still owns it to this student) --
  const duration =
    typeof durationSeconds === "number" && Number.isFinite(durationSeconds) && durationSeconds >= 0
      ? Math.round(durationSeconds)
      : null;

  const { error: insErr } = await admin.from("reading_attempts").insert({
    organization_id: organizationId,
    student_id: studentId,
    passage_id: passageId,
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
    console.error("[reading/submit] failed to store attempt:", passageId, insErr.message);
    return fail(500, "store_failed");
  }

  // Roll the student's reading band estimate forward. Best-effort — the score the
  // student just earned stands even if the estimate update hiccups.
  try {
    await recomputeSkillEstimate(admin, { studentId, organizationId, skill: "reading" });
  } catch (err) {
    console.error("[reading/submit] estimate recompute failed:", passageId, err);
  }

  return NextResponse.json(
    {
      result: {
        passageTitle: passage.title,
        total: grade.total,
        correctCount: grade.correctCount,
        percent: grade.percent,
        band: grade.band,
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
