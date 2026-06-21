import Link from "next/link";
import { redirect } from "next/navigation";

import { requireOrgUser, roleHome } from "@/lib/auth";
import { loadDashboard } from "@/lib/dashboard/load";
import { countTasksThisWeek, loadStudyPlan } from "@/lib/plan/service";
import { daysUntil, levelCheckDue } from "@/lib/plan/types";

import { BandCard } from "../dashboard/band-card";
import { startLevelCheck } from "./actions";

export const dynamic = "force-dynamic";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A1C33";
const MUTED = "#565a72";
const EMERALD = "#2f8f5b";

const CRITERION_TIP: Record<string, string> = {
  TR: "answer every part of the prompt and state a clear position — that lifts Task Response fastest.",
  CC: "give each idea its own paragraph and connect sentences with referencing, not just linking words.",
  LR: "swap repeated, vague words for precise topic vocabulary and natural collocations.",
  GRA: "add a few accurate complex sentences and proof-read articles and subject–verb agreement.",
};

/**
 * The exam-date-paced study plan: countdown, current → target per skill, the
 * weekly task quota, the weakest area to focus on, and the next level re-check.
 */
export default async function PlanPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect(roleHome(profile.role));

  const plan = await loadStudyPlan(profile.id);
  if (!plan) return null;

  const [{ estimates, weakestCriterion }, tasksThisWeek] = await Promise.all([
    loadDashboard(profile.id),
    countTasksThisWeek(profile.id),
  ]);

  const days = daysUntil(plan.examDate);
  const checkDue = levelCheckDue(plan.nextLevelCheckAt);
  const daysToCheck = daysUntil(plan.nextLevelCheckAt?.slice(0, 10) ?? null);
  const goalPct = Math.min(100, Math.round((tasksThisWeek / plan.weeklyGoal) * 100));
  const goalMet = tasksThisWeek >= plan.weeklyGoal;

  return (
    <div style={{ fontFamily: SANS, color: INK }}>
      {/* header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(23px,2.4vw,29px)", lineHeight: 1.1, letterSpacing: "-.015em", margin: 0, color: INK }}>Your study plan</h1>
          <p style={{ fontFamily: SANS, fontSize: 15, color: "#6b6e84", margin: "5px 0 0" }}>Tuned to your level and paced to your goal.</p>
        </div>
        <Link href="/onboarding" style={{ display: "inline-flex", alignItems: "center", gap: 7, height: 40, padding: "0 15px", border: "1px solid #E2DED0", background: "#fff", borderRadius: 11, fontFamily: SANS, fontSize: 14, fontWeight: 600, color: "#41496A", textDecoration: "none" }}>
          Edit plan
        </Link>
      </div>

      {/* countdown */}
      <CountdownCard examDate={plan.examDate} days={days} target={plan.targetBand} />

      {/* level re-check */}
      <LevelCheck due={checkDue} daysToCheck={daysToCheck} />

      {/* current → target */}
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        <BandCard estimate={estimates.bySkill.reading} />
        <BandCard estimate={estimates.bySkill.writing} />
      </div>

      {/* weekly goal + weakest focus */}
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        {/* weekly quota */}
        <div style={{ background: "#fff", border: "1px solid #E7E4D6", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: MUTED }}>This week</span>
            {goalMet ? <span style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 700, color: EMERALD, background: "#E5F2EB", borderRadius: 999, padding: "3px 10px" }}>Goal met 🎉</span> : null}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 10 }}>
            <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 34, lineHeight: 1, color: INDIGO, fontVariantNumeric: "tabular-nums" }}>{tasksThisWeek}</span>
            <span style={{ fontFamily: SANS, fontSize: 14, color: MUTED, paddingBottom: 6 }}>of {plan.weeklyGoal} tasks</span>
          </div>
          <div style={{ height: 7, background: "#EFEEE2", borderRadius: 999, overflow: "hidden", marginTop: 12 }} aria-hidden>
            <div style={{ width: `${goalPct}%`, height: "100%", background: goalMet ? EMERALD : INDIGO, borderRadius: 999 }} />
          </div>
          <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: "10px 0 14px" }}>
            {goalMet ? "You've hit your weekly goal — every extra task still helps." : `${plan.weeklyGoal - tasksThisWeek} more to hit this week's goal.`}
          </p>
          <Link href="/write" style={ctaStyle}>
            Practice next task →
          </Link>
        </div>

        {/* weakest focus */}
        <div style={{ background: "#fff", border: "1px solid #E7E4D6", borderLeft: "3px solid #C28A1A", borderRadius: 16, padding: 20 }}>
          <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "#B9791A" }}>Focus area</span>
          {weakestCriterion ? (
            <>
              <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 18, color: INK, marginTop: 10 }}>{weakestCriterion.label}</div>
              <div style={{ fontFamily: SANS, fontSize: 13.5, color: "#8a897c", marginTop: 4 }}>
                avg band {weakestCriterion.meanBand.toFixed(1)}
                {weakestCriterion.blockerCount > 0 ? ` · capping ${weakestCriterion.blockerCount} ${weakestCriterion.blockerCount === 1 ? "essay" : "essays"}` : ""}
              </div>
              <div style={{ marginTop: 12, background: "#FAF9F1", border: "1px solid #ECEADC", borderRadius: 10, padding: "10px 12px", fontFamily: SANS, fontSize: 13.5, lineHeight: 1.5, color: MUTED }}>
                <b style={{ color: INK }}>AI tip:</b> {CRITERION_TIP[weakestCriterion.key] ?? "target this criterion with one focused essay and resubmit to see it move."}
              </div>
            </>
          ) : (
            <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.5, color: "#8a897c", marginTop: 12 }}>
              Submit a Task 2 essay and the AI will pinpoint your weakest criterion — and the one fix that lifts it.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const ctaStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  background: INDIGO,
  color: "#fff",
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: 14,
  padding: "10px 16px",
  borderRadius: 10,
  textDecoration: "none",
} as const;

function CountdownCard({ examDate, days, target }: { examDate: string | null; days: number | null; target: number }) {
  const hasFuture = examDate != null && days != null && days >= 0;
  return (
    <div style={{ position: "relative", overflow: "hidden", marginTop: 16, background: "linear-gradient(120deg,#EEF0FB 0%,#F4F1FC 100%)", border: "1px solid #DADBF4", borderRadius: 16, padding: "22px 26px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
      <div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: INDIGO }}>
          {hasFuture ? "Test countdown" : "Test date"}
        </div>
        {hasFuture ? (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
              <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(30px,4vw,44px)", lineHeight: 1, color: INK }}>{days}</span>
              <span style={{ fontFamily: SANS, fontSize: 16, color: MUTED }}>{days === 1 ? "day to go" : "days to go"}</span>
            </div>
            <p style={{ fontFamily: SANS, fontSize: 14.5, color: MUTED, margin: "8px 0 0" }}>
              {fmtFull(examDate!)} · aiming for band {target.toFixed(1)}
            </p>
          </>
        ) : examDate != null ? (
          <p style={{ fontFamily: SANS, fontSize: 15, color: MUTED, margin: "8px 0 0", maxWidth: 460 }}>
            Your test date ({fmtFull(examDate)}) has passed. <Link href="/onboarding" style={{ color: INDIGO, fontWeight: 600 }}>Set a new date</Link> to keep your plan paced.
          </p>
        ) : (
          <p style={{ fontFamily: SANS, fontSize: 15, color: MUTED, margin: "8px 0 0", maxWidth: 460 }}>
            No test date yet. <Link href="/onboarding" style={{ color: INDIGO, fontWeight: 600 }}>Add one</Link> for a countdown and a week-by-week plan. Aiming for band {target.toFixed(1)}.
          </p>
        )}
      </div>
    </div>
  );
}

function LevelCheck({ due, daysToCheck }: { due: boolean; daysToCheck: number | null }) {
  if (due) {
    return (
      <div style={{ marginTop: 14, background: "#FFF8E8", border: "1px solid #F1DFB0", borderRadius: 14, padding: "16px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "#F6E6BE", color: "#B9791A", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>
          </span>
          <div>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15.5, color: INK }}>Time for a level check</div>
            <div style={{ fontFamily: SANS, fontSize: 13.5, color: MUTED }}>Do a fresh timed task so your bands stay accurate.</div>
          </div>
        </div>
        <form action={startLevelCheck}>
          <button type="submit" style={{ ...ctaStyle, border: "none", cursor: "pointer", background: "#B9791A" }}>
            Re-check my level →
          </button>
        </form>
      </div>
    );
  }
  if (daysToCheck != null && daysToCheck > 0) {
    return (
      <p style={{ fontFamily: SANS, fontSize: 13.5, color: MUTED, margin: "14px 0 0" }}>
        Next level check in <b style={{ color: INK }}>{daysToCheck}</b> {daysToCheck === 1 ? "day" : "days"} — your bands keep updating with every graded task in the meantime.
      </p>
    );
  }
  return null;
}

function fmtFull(iso: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "long", day: "numeric", year: "numeric" }).format(
    new Date(`${iso}T00:00:00`),
  );
}
