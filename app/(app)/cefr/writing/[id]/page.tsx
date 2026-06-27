import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireOrgUser } from "@/lib/auth";
import { CEFR } from "@/lib/cefr/levels";
import { attemptToGradeResult, getCefrAttempt } from "@/lib/cefr/store";
import { createClient } from "@/lib/supabase/server";

import { CefrFeedback } from "../cefr-feedback";

export const dynamic = "force-dynamic";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const MUTED = "#5A6076";

/**
 * Reopen a past CEFR writing attempt from history — renders the stored grade with
 * the same feedback view as the live result. RLS scopes the fetch to the learner's
 * own attempts, so a missing/foreign id is a 404.
 */
export default async function CefrAttemptPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const { id } = await params;
  const supabase = await createClient();
  const attempt = await getCefrAttempt(supabase, id);
  if (!attempt) notFound();

  const grade = attemptToGradeResult(attempt);
  const accent = CEFR[grade.estimated_level].color;
  const againHref = attempt.task_id ? `/cefr/writing?task=${attempt.task_id}` : "/cefr/writing";

  return (
    <div style={{ fontFamily: SANS, maxWidth: 880 }}>
      <Link href="/cefr" style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", fontSize: 14, fontWeight: 600, color: MUTED }}>
        <ArrowLeft size={15} /> CEFR practice
      </Link>
      <div style={{ marginTop: 16 }}>
        <CefrFeedback
          grade={grade}
          taskTitle={attempt.task_title}
          footer={
            <Link
              href={againHref}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: 11, background: accent, color: "#fff", fontWeight: 700, fontSize: 14.5, textDecoration: "none", boxShadow: `0 10px 22px -10px ${accent}b3` }}
            >
              Practise this task again
            </Link>
          }
        />
      </div>
    </div>
  );
}
