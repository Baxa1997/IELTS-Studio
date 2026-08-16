"use server";

import { revalidatePath } from "next/cache";

import { requireOrgUser } from "@/lib/auth";
import { loadCenterSettings } from "@/lib/console/center-settings";
import { reportHref, snapBand, WRITING_CRITERIA, type AttemptKind } from "@/lib/console/attempts";
import { createClient } from "@/lib/supabase/server";

/**
 * Signing off one attempt.
 *
 * TWO NUMBERS GO IN, ALWAYS. `ai_band` is read from the attempt itself at the
 * moment of review and frozen; `final_band` is the centre's. Confirming without
 * changing anything still writes a row, because "a human looked at this and
 * agreed" is a different fact from "nobody has looked", and it is the fact a
 * parent is actually being sold.
 */

export interface ReviewState {
  error?: string;
  ok?: string;
}

const KINDS = new Set<AttemptKind>(["writing", "reading", "listening", "speaking"]);

const readBand = (raw: FormDataEntryValue | null): number | null =>
  raw == null || raw === "" ? null : snapBand(Number(raw));

/**
 * What the model said about this attempt, read from wherever that skill keeps
 * it. Four shapes, one answer — and null is a legitimate answer for an attempt
 * whose band never landed.
 */
async function readAiBand(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kind: AttemptKind,
  refId: string,
): Promise<{ band: number | null; studentId: string } | null> {
  if (kind === "writing") {
    const { data: essay } = await supabase
      .from("essays")
      .select("student_id")
      .eq("id", refId)
      .maybeSingle();
    if (!essay) return null;
    const { data: grading } = await supabase
      .from("gradings")
      .select("overall_band")
      .eq("essay_id", refId)
      .not("overall_band", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return {
      band: grading?.overall_band != null ? Number(grading.overall_band) : null,
      studentId: essay.student_id as string,
    };
  }
  if (kind === "reading") {
    const { data } = await supabase
      .from("reading_attempts")
      .select("student_id, band")
      .eq("id", refId)
      .maybeSingle();
    return data ? { band: data.band != null ? Number(data.band) : null, studentId: data.student_id as string } : null;
  }
  if (kind === "listening") {
    const { data } = await supabase
      .from("listening_attempts")
      .select("student_id, result")
      .eq("id", refId)
      .maybeSingle();
    if (!data) return null;
    const b = Number((data.result as { band?: unknown } | null)?.band);
    return { band: Number.isFinite(b) ? b : null, studentId: data.student_id as string };
  }
  const { data } = await supabase
    .from("speaking_sessions")
    .select("student_id, result")
    .eq("id", refId)
    .maybeSingle();
  if (!data) return null;
  const b = Number((data.result as { overall_band?: unknown } | null)?.overall_band);
  return { band: Number.isFinite(b) ? b : null, studentId: data.student_id as string };
}

export async function reviewAttempt(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const { profile } = await requireOrgUser();

  // The policy the centre chose. RLS enforces it too (can_override_bands), but
  // a form that lets you type a band and then refuses on submit is worse than
  // one that never offered.
  const settings = await loadCenterSettings();
  const allowed =
    settings.overridePolicy === "nobody"
      ? false
      : settings.overridePolicy === "admin_only"
        ? profile.role === "center_admin" || profile.role === "administrator"
        : profile.role === "center_admin" ||
          profile.role === "administrator" ||
          profile.role === "teacher";
  if (!allowed) {
    return {
      error:
        settings.overridePolicy === "nobody"
          ? "This centre has marking locked: the AI band stands. Change it in Settings."
          : "Only a centre admin may correct a band here.",
    };
  }

  const kind = String(formData.get("kind") ?? "") as AttemptKind;
  const refId = String(formData.get("ref_id") ?? "").trim();
  if (!KINDS.has(kind) || !refId) return { error: "That attempt does not exist." };

  const finalBand = readBand(formData.get("final_band"));
  if (finalBand == null) return { error: "Pick a band between 0 and 9, on the half band." };

  const reason = String(formData.get("reason") ?? "").trim();
  if (reason.length < 3) {
    return { error: "Say why in one line — it is what the student and their parent read." };
  }

  const supabase = await createClient();
  const attempt = await readAiBand(supabase, kind, refId);
  if (!attempt) return { error: "That attempt is not yours to review." };

  // Per-criterion corrections, writing only — the other three skills do not
  // store a criterion breakdown the same way, and inventing one here would put
  // numbers on a report that nothing else in the product can explain.
  let criteria: Record<string, { band: number; was: number | null }> | null = null;
  if (kind === "writing") {
    const { data: grading } = await supabase
      .from("gradings")
      .select("criteria")
      .eq("essay_id", refId)
      .not("overall_band", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const original = (grading?.criteria ?? {}) as Record<string, { band?: number }>;
    for (const c of WRITING_CRITERIA) {
      const given = readBand(formData.get(`criterion_${c.key}`));
      if (given == null) continue;
      const was = Number(original[c.key]?.band);
      if (Number.isFinite(was) && was === given) continue; // unchanged, not an override
      criteria = { ...(criteria ?? {}), [c.key]: { band: given, was: Number.isFinite(was) ? was : null } };
    }
  }

  const { error } = await supabase
    .from("attempt_reviews")
    .upsert(
      {
        organization_id: profile.organization_id,
        kind,
        ref_id: refId,
        student_id: attempt.studentId,
        ai_band: attempt.band,
        final_band: finalBand,
        criteria,
        reason,
        reviewed_by: profile.id,
        reviewed_at: new Date().toISOString(),
      },
      { onConflict: "kind,ref_id" },
    )
    .select("id");
  // `.select()` after the write: an RLS-filtered upsert reports success and
  // changes nothing, which on this schema is the usual way a feature "works"
  // in testing and does nothing in production.
  if (error) {
    // The freeze trigger fires when a re-grade moved the AI band under an
    // existing review. Say what happened rather than showing the raw message.
    if (error.message.includes("AI band is a record")) {
      return {
        error:
          "This attempt was re-graded after it was reviewed. Open it again — the new AI band needs its own verdict.",
      };
    }
    return { error: error.message };
  }

  revalidatePath(reportHref(kind, refId));
  revalidatePath("/console/marking");
  revalidatePath("/console");

  const moved = attempt.band != null && attempt.band !== finalBand;
  return {
    ok: moved
      ? `Recorded ${finalBand.toFixed(1)} — the AI's ${attempt.band?.toFixed(1)} is kept beside it.`
      : `Confirmed at ${finalBand.toFixed(1)}. Your name is on the report.`,
  };
}
