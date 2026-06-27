import Link from "next/link";
import { redirect } from "next/navigation";

import { requireOrgUser, roleHome } from "@/lib/auth";
import { type WeakCriterion } from "@/lib/dashboard/compute";
import { loadDashboard } from "@/lib/dashboard/load";
import { countTasksThisWeek, loadStudyPlan } from "@/lib/plan/service";
import { daysUntil, levelCheckDue } from "@/lib/plan/types";

import { startLevelCheck } from "./actions";
import { PlanBandCard } from "./plan-band-card";

export const dynamic = "force-dynamic";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const FAINT = "#8A8FA0";
const LINE = "#ECEAF2";
const EMERALD = "#2f8f5b";
const AMBER = "#B9791A";
const TRACK = "#E7E7F2";

const CRITERION_TIP: Record<string, string> = {
  TR: "answer every part of the prompt and state a clear position — that lifts Task Response fastest.",
  CC: "give each idea its own paragraph and connect sentences with referencing, not just linking words.",
  LR: "swap repeated, vague words for precise topic vocabulary and natural collocations.",
  GRA: "add a few accurate complex sentences and proof-read articles and subject–verb agreement.",
};

/**
 * The exam-date-paced study plan: the countdown + "% elapsed" ring, current → target
 * per skill, the weekly task quota, the weakest area to focus on, and the next level
 * re-check. Light-mode, matching the rest of the app shell.
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
  const goalMet = tasksThisWeek >= plan.weeklyGoal;
  const elapsedPct = studyElapsedPct(plan.createdAt, plan.examDate);

  return (
    <div style={{ fontFamily: SANS, color: INK }}>
      {/* ─── Header ─── */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
        <div>
          <Eyebrow>Your study plan</Eyebrow>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(24px,2.6vw,32px)", lineHeight: 1.08, letterSpacing: "-.015em", margin: "6px 0 0", color: INK }}>
            Tuned to your level, paced to your goal
          </h1>
        </div>
        <Link href="/onboarding" style={{ marginTop: 4, padding: "10px 18px", borderRadius: 10, border: `1px solid ${LINE}`, background: "#fff", color: MUTED, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>
          Edit plan
        </Link>
      </div>

      {/* ─── Countdown ─── */}
      <CountdownCard examDate={plan.examDate} days={days} target={plan.targetBand} elapsedPct={elapsedPct} />

      {/* ─── Level re-check ─── */}
      <LevelCheck due={checkDue} daysToCheck={daysToCheck} />

      {/* ─── Current → target ─── */}
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <PlanBandCard estimate={estimates.bySkill.reading} />
        <PlanBandCard estimate={estimates.bySkill.writing} />
      </div>

      {/* ─── Weekly quota + weakest focus ─── */}
      <div className="lp-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <WeeklyCard done={tasksThisWeek} goal={plan.weeklyGoal} met={goalMet} />
        <FocusCard weakest={weakestCriterion} />
      </div>
    </div>
  );
}

function CountdownCard({ examDate, days, target, elapsedPct }: { examDate: string | null; days: number | null; target: number; elapsedPct: number | null }) {
  const hasFuture = examDate != null && days != null && days >= 0;
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        marginBottom: 16,
        background: "linear-gradient(120deg,#3B43B5 0%,#2E3490 100%)",
      }}
    >
      {/* soft glow + concentric rings */}
      <div aria-hidden style={{ position: "absolute", top: -40, right: 50, width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,.14),transparent 65%)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", top: -28, right: -28, width: 170, height: 170, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.10)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", top: 8, right: 8, width: 100, height: 100, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "clamp(18px,2.2vw,26px) clamp(20px,2.8vw,30px)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff", flexShrink: 0, animation: "plan-pulse-indigo 2.4s ease infinite" }} />
            <Eyebrow tone="rgba(255,255,255,0.72)">{hasFuture ? "Exam countdown" : "Exam date"}</Eyebrow>
          </div>

          {hasFuture ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}>
                <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(38px,5vw,52px)", color: "#fff", lineHeight: 1, letterSpacing: "-1.5px", fontVariantNumeric: "tabular-nums" }}>{days}</span>
                <span style={{ fontFamily: SANS, fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.62)" }}>{days === 1 ? "day to go" : "days to go"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                <span style={{ fontFamily: SANS, fontSize: 13.5, color: "rgba(255,255,255,0.6)" }}>{fmtFull(examDate!)}</span>
                <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.28)" }} />
                <span style={{ fontFamily: SANS, fontSize: 13.5, color: "rgba(255,255,255,0.6)" }}>Aiming for</span>
                <span style={DARK_PILL}>Band {target.toFixed(1)}</span>
              </div>
            </>
          ) : (
            <div style={{ maxWidth: 460 }}>
              <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(19px,2.4vw,25px)", color: "#fff", marginBottom: 7, letterSpacing: "-.015em", lineHeight: 1.15 }}>
                {examDate != null ? "Your test date has passed" : "No test date yet"}
              </div>
              <p style={{ margin: 0, fontFamily: SANS, fontSize: 14, color: "rgba(255,255,255,0.66)", lineHeight: 1.6 }}>
                {examDate != null ? (
                  <>
                    {fmtFull(examDate)} is behind you.{" "}
                    <Link href="/onboarding" style={{ color: "#fff", fontWeight: 700, textDecoration: "underline" }}>Set a new date</Link> to keep your plan paced.
                  </>
                ) : (
                  <>
                    <Link href="/onboarding" style={{ color: "#fff", fontWeight: 700, textDecoration: "underline" }}>Add a test date</Link> for a live countdown and a week-by-week plan.
                  </>
                )}
              </p>
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ fontFamily: SANS, fontSize: 13.5, color: "rgba(255,255,255,0.6)" }}>Aiming for</span>
                <span style={DARK_PILL}>Band {target.toFixed(1)}</span>
              </div>
            </div>
          )}
        </div>

        {hasFuture && elapsedPct != null ? <ElapsedRing pct={elapsedPct} /> : null}
      </div>
    </div>
  );
}

function ElapsedRing({ pct }: { pct: number }) {
  const C = 2 * Math.PI * 40; // r=40
  const off = C * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" aria-hidden>
        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="7" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="7" strokeDasharray={C} strokeDashoffset={off} strokeLinecap="round" transform="rotate(-90 50 50)" />
        <text x="50" y="47" textAnchor="middle" fill="#fff" fontFamily={SERIF} fontSize="20" fontWeight="700">{Math.round(pct * 100)}%</text>
        <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontFamily={SANS} fontSize="9" fontWeight="600">elapsed</text>
      </svg>
      <span style={{ fontFamily: SANS, fontSize: 11.5, color: "rgba(255,255,255,0.55)", marginTop: -2 }}>of study period</span>
    </div>
  );
}

function LevelCheck({ due, daysToCheck }: { due: boolean; daysToCheck: number | null }) {
  if (due) {
    return (
      <div style={{ marginBottom: 16, borderRadius: 16, background: "#FFF8EE", border: "1px solid #F6E0B8", padding: "16px 20px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 11, background: "#FFF3E0", border: "1px solid #F6E0B8", color: AMBER, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4l3 2" />
            </svg>
          </span>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 15.5, fontWeight: 700, color: INK }}>Time for a level check</div>
            <div style={{ fontFamily: SANS, fontSize: 13.5, color: MUTED }}>Do a fresh timed task so your bands stay accurate.</div>
          </div>
        </div>
        <form action={startLevelCheck}>
          <button type="submit" style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #EBCF9E", background: "#FFF3E0", color: AMBER, fontFamily: SANS, fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}>
            Re-check my level →
          </button>
        </form>
      </div>
    );
  }
  if (daysToCheck != null && daysToCheck > 0) {
    return (
      <p style={{ fontFamily: SANS, fontSize: 14, color: MUTED, margin: "0 0 16px", padding: "0 2px", lineHeight: 1.65 }}>
        Next level check in <strong style={{ color: INDIGO, fontWeight: 700 }}>{daysToCheck} {daysToCheck === 1 ? "day" : "days"}</strong> — your bands keep updating with every graded task in the meantime.
      </p>
    );
  }
  return <div style={{ height: 2 }} />;
}

function WeeklyCard({ done, goal, met }: { done: number; goal: number; met: boolean }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: "clamp(20px,2.4vw,26px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: EMERALD, flexShrink: 0, animation: "plan-pulse-green 2s ease infinite" }} />
        <Eyebrow>This week</Eyebrow>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 16 }}>
        <span style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 700, color: met ? EMERALD : INK, lineHeight: 1, letterSpacing: "-1.5px", fontVariantNumeric: "tabular-nums" }}>{done}</span>
        <span style={{ fontFamily: SANS, fontSize: 16, color: MUTED, fontWeight: 400 }}>of {goal} tasks</span>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {Array.from({ length: goal }).map((_, i) => (
          <div key={i} style={{ flex: "1 1 12px", minWidth: 12, height: 6, borderRadius: 999, background: i < done ? EMERALD : TRACK }} />
        ))}
      </div>

      <p style={{ fontFamily: SANS, fontSize: 13, color: MUTED, margin: "0 0 20px", lineHeight: 1.5 }}>
        {met ? "You've hit this week's goal — every extra task still helps." : `${goal - done} more to hit this week's goal.`}
      </p>

      <Link
        href="/write"
        style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          padding: 14,
          borderRadius: 12,
          background: INDIGO,
          color: "#fff",
          fontFamily: SANS,
          fontSize: 15,
          fontWeight: 700,
          textDecoration: "none",
          boxShadow: "0 12px 24px -12px rgba(59,67,181,.7)",
        }}
      >
        Practice next task
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
          <path d="M2 7.5H13M13 7.5L8.5 3M13 7.5L8.5 12" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span aria-hidden style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "40%", background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)", animation: "plan-shimmer 4s ease infinite 0.5s", pointerEvents: "none" }} />
      </Link>
    </div>
  );
}

function FocusCard({ weakest }: { weakest: WeakCriterion | null }) {
  return (
    <div style={{ position: "relative", borderRadius: 16, padding: "clamp(20px,2.4vw,26px)", background: "#FFFBF4", border: "1px solid #F4E6C9", overflow: "hidden" }}>
      <div aria-hidden style={{ position: "absolute", top: -55, right: -55, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(185,121,26,0.10) 0%,transparent 65%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: AMBER, flexShrink: 0, animation: "plan-pulse-amber 2.3s ease infinite" }} />
          <Eyebrow tone={AMBER}>Focus area</Eyebrow>
        </div>

        {weakest ? (
          <>
            <div style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: INK, letterSpacing: "-.01em", marginBottom: 6 }}>{weakest.label}</div>
            <p style={{ fontFamily: SANS, fontSize: 13.5, color: MUTED, margin: "0 0 18px", lineHeight: 1.6 }}>
              avg band {weakest.meanBand.toFixed(1)}
              {weakest.blockerCount > 0 ? ` · capping ${weakest.blockerCount} ${weakest.blockerCount === 1 ? "essay" : "essays"}` : ""}
            </p>
            <TipCard>
              <strong style={{ color: AMBER, fontWeight: 700 }}>AI tip:</strong>{" "}
              {CRITERION_TIP[weakest.key] ?? "target this criterion with one focused essay and resubmit to see it move."}
            </TipCard>
          </>
        ) : (
          <>
            <p style={{ fontFamily: SANS, fontSize: 15, fontWeight: 400, color: INK, lineHeight: 1.7, margin: "0 0 18px" }}>
              Submit a Task 2 essay and the AI will pinpoint your weakest criterion — and the{" "}
              <em style={{ fontStyle: "normal", color: AMBER, fontWeight: 700 }}>one fix</em> that lifts it.
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {["Task 2 essay", "AI analysis", "Band boost"].map((t) => (
                <span key={t} style={{ background: "#FFF3E0", border: "1px solid #F6E0B8", borderRadius: 999, padding: "5px 12px", fontFamily: SANS, fontSize: 12, fontWeight: 700, color: AMBER }}>
                  {t}
                </span>
              ))}
            </div>
            <TipCard>
              Students who submit Task 2 within the first week improve band scores{" "}
              <strong style={{ color: INK, fontWeight: 700 }}>2× faster</strong> on average.
            </TipCard>
          </>
        )}
      </div>
    </div>
  );
}

function TipCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 12, background: "#FFF6E7", border: "1px solid #F4E6C9", padding: "13px 15px", display: "flex", alignItems: "flex-start", gap: 10 }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginTop: 1, flexShrink: 0 }} aria-hidden>
        <circle cx="8" cy="8" r="7" stroke={AMBER} strokeWidth="1.5" />
        <path d="M8 5v4M8 11v1" stroke={AMBER} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p style={{ margin: 0, fontFamily: SANS, fontSize: 12.5, color: MUTED, lineHeight: 1.6 }}>{children}</p>
    </div>
  );
}

function Eyebrow({ children, tone = FAINT }: { children: React.ReactNode; tone?: string }) {
  return <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, letterSpacing: ".09em", textTransform: "uppercase", color: tone }}>{children}</span>;
}

const DARK_PILL: React.CSSProperties = {
  padding: "4px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.16)",
  border: "1px solid rgba(255,255,255,0.28)",
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 700,
  color: "#fff",
};

/** How far into the study window we are (created → exam), 0..1. null without a date. */
function studyElapsedPct(createdAt: string, examDate: string | null): number | null {
  if (!examDate) return null;
  const start = Date.parse(createdAt);
  const end = Date.parse(`${examDate}T00:00:00`);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return Math.max(0, Math.min(1, (Date.now() - start) / (end - start)));
}

function fmtFull(iso: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "long", day: "numeric", year: "numeric" }).format(
    new Date(`${iso}T00:00:00`),
  );
}
