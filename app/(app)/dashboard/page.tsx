import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle, ArrowRight, BookOpen, CalendarClock, CalendarPlus, Flame,
  PenLine, Sparkles, Target, TrendingDown, TrendingUp,
} from "lucide-react";

import { requireOrgUser } from "@/lib/auth";
import { SKILL_LABELS } from "@/lib/estimates/compute";
import type { HistoryEvent, Recommendation, WeakCriterion, WeakReadingType } from "@/lib/dashboard/compute";
import { loadDashboard } from "@/lib/dashboard/load";
import { countTasksThisWeek, loadStudyPlan } from "@/lib/plan/service";
import { daysUntil, type StudyPlan } from "@/lib/plan/types";

import { BandCard } from "./band-card";
import { WritingHero } from "./writing-hero";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const FAINT = "#8A8FA0";
const LINE = "#ECEAF2";
const SURF = "#F6F6FA";
const TINT = "#F4F4FE";
const TINT_BORDER = "#E0E1F4";
const EMERALD = "#2f8f5b";
const AMBER = "#B9791A";

const card: React.CSSProperties = { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, padding: 18 };

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const plan = await loadStudyPlan(profile.id);
  if (!plan) return null;

  const [{ estimates, weakestCriterion, weakestReadingType, streakDays, history, recommendation }, tasksThisWeek] =
    await Promise.all([loadDashboard(profile.id), countTasksThisWeek(profile.id)]);

  const days = daysUntil(plan.examDate);

  return (
    <div style={{ fontFamily: SANS, color: INK }}>
      <style>{DASH_CSS}</style>

      <Header name={profile.full_name} plan={plan} days={days} streakDays={streakDays} tasksThisWeek={tasksThisWeek} />

      <WritingHero estimate={estimates.bySkill.writing} firstName={firstNameOf(profile.full_name)} />

      <div className="dash-grid" style={{ marginTop: 16 }}>
        {/* main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <NextTask rec={recommendation} />
          <div className="dash-2">
            <BandCard estimate={estimates.bySkill.reading} />
            <BandCard estimate={estimates.bySkill.writing} />
          </div>
          <RecentResults history={history} />
        </div>

        {/* right rail of widgets */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <StreakCard streakDays={streakDays} />
          <WeekProgressCard done={tasksThisWeek} goal={plan.weeklyGoal} />
          <CountdownCard plan={plan} days={days} />
          <FocusCard writing={weakestCriterion} reading={weakestReadingType} />
        </aside>
      </div>
    </div>
  );
}

// ---- header ----------------------------------------------------------------

function Header({ name, plan, days, streakDays, tasksThisWeek }: { name: string | null; plan: StudyPlan; days: number | null; streakDays: number; tasksThisWeek: number }) {
  const countdown = plan.examDate != null && days != null && days >= 0 ? `${days} ${days === 1 ? "day" : "days"} to your test` : "No exam date set";
  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
      <div>
        <Eyebrow>Your dashboard</Eyebrow>
        <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(24px,2.6vw,32px)", lineHeight: 1.08, letterSpacing: "-.015em", margin: "6px 0 0", color: INK }}>{greeting(name)}</h1>
        <p style={{ fontFamily: SANS, fontSize: 15, color: MUTED, margin: "6px 0 0" }}>
          Target Band {plan.targetBand.toFixed(1)} · {countdown}
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Chip Icon={Flame} tone="amber" label={streakDays > 0 ? `${streakDays}-day streak` : "No streak yet"} />
        <Chip Icon={Target} tone="indigo" label={`${tasksThisWeek}/${plan.weeklyGoal} this week`} />
      </div>
    </div>
  );
}

function Chip({ Icon, tone, label }: { Icon: typeof Flame; tone: "amber" | "indigo"; label: string }) {
  const c = tone === "amber" ? { bg: "#FFF3E0", bd: "#F6E0B8", fg: AMBER } : { bg: TINT, bd: TINT_BORDER, fg: INDIGO };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, background: c.bg, border: `1px solid ${c.bd}`, color: c.fg, fontFamily: SANS, fontWeight: 700, fontSize: 13.5, padding: "9px 14px", borderRadius: 999, whiteSpace: "nowrap" }}>
      <Icon size={15} strokeWidth={2.2} /> {label}
    </span>
  );
}

// ---- next task -------------------------------------------------------------

function NextTask({ rec }: { rec: Recommendation }) {
  const [chipA, chipB] = chipsFor(rec.href);
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(120deg,#EEF0FB 0%,#F4F1FC 100%)", border: `1px solid ${TINT_BORDER}`, borderRadius: 16, padding: "22px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
      <div aria-hidden style={{ position: "absolute", top: -60, right: 120, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(59,67,181,.1),transparent 65%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: SANS, fontWeight: 700, fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: INDIGO }}>
          <Sparkles size={14} strokeWidth={2.4} /> Next task · AI recommended
        </div>
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(19px,2.1vw,22px)", color: INK, marginTop: 8 }}>{rec.title}</div>
        <p style={{ fontFamily: SANS, fontSize: 14.5, lineHeight: 1.5, color: MUTED, margin: "6px 0 0", maxWidth: 520 }}>{rec.reason}</p>
        <Link href={rec.href} style={{ ...btnPrimary, marginTop: 16 }}>{rec.cta} <ArrowRight size={16} /></Link>
      </div>
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8, flex: "none" }}>
        {[{ Icon: CalendarClock, t: chipA }, { Icon: TrendingUp, t: chipB }].map(({ Icon, t }) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: SANS, fontWeight: 500, fontSize: 13.5, color: MUTED, background: "#fff", border: `1px solid ${TINT_BORDER}`, borderRadius: 10, padding: "10px 13px" }}>
            <Icon size={16} color={INDIGO} strokeWidth={2} /> {t}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- right-rail widgets ----------------------------------------------------

function StreakCard({ streakDays }: { streakDays: number }) {
  const dots = weekDots(streakDays);
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Eyebrow>Streak</Eyebrow>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, color: AMBER }}>
          <Flame size={18} fill="#FBE3C0" strokeWidth={2} />
          <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 22, color: INK }}>{streakDays}</span>
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6, marginTop: 14 }}>
        {dots.map((d) => (
          <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
            <span style={{ width: "100%", maxWidth: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", background: d.filled ? INDIGO : SURF, border: `1.5px solid ${d.today ? INDIGO : d.filled ? INDIGO : LINE}` }}>
              <Flame size={14} color={d.filled ? "#fff" : "#C7C9D4"} strokeWidth={2.2} />
            </span>
            <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: ".02em", color: d.today ? INDIGO : FAINT }}>{d.label}</span>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, margin: "13px 0 0" }}>
        {streakDays > 0 ? "Keep it going — practice today." : "Practice today to start a streak."}
      </p>
    </div>
  );
}

function WeekProgressCard({ done, goal }: { done: number; goal: number }) {
  const pct = goal > 0 ? Math.min(100, Math.round((done / goal) * 100)) : 0;
  const met = done >= goal;
  return (
    <div style={card}>
      <Eyebrow>This week</Eyebrow>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: 9 }}>
        <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 30, lineHeight: 1, color: met ? EMERALD : INK, fontVariantNumeric: "tabular-nums" }}>{done}</span>
        <span style={{ fontFamily: SANS, fontSize: 14, color: MUTED }}>/ {goal} tasks</span>
      </div>
      <div style={{ height: 7, background: "#E7E7F2", borderRadius: 999, overflow: "hidden", marginTop: 12 }} aria-hidden>
        <div style={{ width: `${pct}%`, height: "100%", background: met ? EMERALD : INDIGO, borderRadius: 999 }} />
      </div>
      <p style={{ fontFamily: SANS, fontSize: 12.5, color: MUTED, margin: "10px 0 0" }}>
        {met ? "Weekly goal reached — nice work." : `${goal - done} more to hit your weekly goal.`}
      </p>
      <Link href="/plan" style={{ ...miniLink, marginTop: 10 }}>Adjust plan <ArrowRight size={14} /></Link>
    </div>
  );
}

function CountdownCard({ plan, days }: { plan: StudyPlan; days: number | null }) {
  const has = plan.examDate != null && days != null && days >= 0;
  return (
    <div style={card}>
      <Eyebrow>Exam countdown</Eyebrow>
      {has ? (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 9 }}>
            <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 30, lineHeight: 1, color: INK, fontVariantNumeric: "tabular-nums" }}>{days}</span>
            <span style={{ fontFamily: SANS, fontSize: 14, color: MUTED }}>{days === 1 ? "day" : "days"} to go</span>
          </div>
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, margin: "8px 0 0" }}>{fmtFullDate(plan.examDate!)}</p>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
            <span style={{ flex: "none", width: 36, height: 36, borderRadius: 10, background: TINT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CalendarPlus size={18} color={INDIGO} strokeWidth={2} />
            </span>
            <p style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.45, color: MUTED, margin: 0 }}>Add your exam date to unlock a paced countdown.</p>
          </div>
          <Link href="/plan" style={{ ...miniLink, marginTop: 12 }}>Set exam date <ArrowRight size={14} /></Link>
        </>
      )}
    </div>
  );
}

function FocusCard({ writing, reading }: { writing: WeakCriterion | null; reading: WeakReadingType | null }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <AlertTriangle size={14} color={AMBER} strokeWidth={2.2} />
        <Eyebrow>Focus areas</Eyebrow>
      </div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 12 }}>
        <FocusRow Icon={PenLine} skill="Writing" value={writing ? writing.label : "Not measured yet"} sub={writing ? `avg band ${writing.meanBand.toFixed(1)}` : "Grade an essay to find it"} href="/write" />
        <div style={{ height: 1, background: LINE, margin: "12px 0" }} />
        <FocusRow Icon={BookOpen} skill="Reading" value={reading ? reading.label : "Not measured yet"} sub={reading ? `${Math.round(reading.accuracy * 100)}% correct · ${reading.correct}/${reading.attempted}` : "Do a set to find it"} href="/read" />
      </div>
    </div>
  );
}

function FocusRow({ Icon, skill, value, sub, href }: { Icon: typeof PenLine; skill: string; value: string; sub: string; href: string }) {
  return (
    <Link href={href} className="dash-focus" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none", borderRadius: 10, margin: "0 -6px", padding: "4px 6px" }}>
      <span style={{ flex: "none", width: 34, height: 34, borderRadius: 9, background: TINT, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={16} color={INDIGO} strokeWidth={2} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: FAINT }}>{skill}</span>
        <span style={{ display: "block", fontFamily: SANS, fontWeight: 700, fontSize: 14.5, color: INK, marginTop: 1 }}>{value}</span>
        <span style={{ display: "block", fontFamily: SANS, fontSize: 12.5, color: MUTED }}>{sub}</span>
      </span>
      <ArrowRight size={16} color={FAINT} />
    </Link>
  );
}

// ---- recent results --------------------------------------------------------

function RecentResults({ history }: { history: HistoryEvent[] }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: INK, margin: 0 }}>Recent results</h2>
        <Link href="/activities" style={{ ...miniLink }}>All activities <ArrowRight size={14} /></Link>
      </div>
      {history.length === 0 ? (
        <div style={{ ...card, fontFamily: SANS, fontSize: 14.5, color: MUTED }}>No results yet — your graded work will show up here.</div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {history.map((h, i) => (
            <div key={`${h.skill}-${h.date}-${i}`} style={{ display: "grid", gridTemplateColumns: "84px 1fr auto", alignItems: "center", gap: 14, padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}>
              <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13.5, color: FAINT }}>{fmtDate(h.date)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: SANS, fontWeight: 600, fontSize: 15, color: INK }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: TINT, color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                  {h.skill === "reading" ? <BookOpen size={15} strokeWidth={2} /> : <PenLine size={15} strokeWidth={2} />}
                </span>
                {SKILL_LABELS[h.skill]}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <DeltaBadge value={h.deltaVsPrev} />
                <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 18, color: INK, fontVariantNumeric: "tabular-nums" }}>{h.band.toFixed(1)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeltaBadge({ value }: { value: number | null }) {
  const badge: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 4, fontFamily: SANS, fontWeight: 600, fontSize: 12, padding: "3px 9px", borderRadius: 999 };
  if (value == null) return <span style={{ ...badge, color: FAINT, background: SURF }}>baseline</span>;
  if (value > 0) return <span style={{ ...badge, color: EMERALD, background: "#E5F2EB" }}><TrendingUp size={12} /> {value.toFixed(1)}</span>;
  if (value < 0) return <span style={{ ...badge, color: "#c0392b", background: "#FBEAE7" }}><TrendingDown size={12} /> {Math.abs(value).toFixed(1)}</span>;
  return null;
}

// ---- helpers ---------------------------------------------------------------

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, letterSpacing: ".09em", textTransform: "uppercase", color: FAINT }}>{children}</div>;
}

const btnPrimary: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 9, background: INDIGO, color: "#fff", fontFamily: SANS, fontWeight: 600, fontSize: 14.5, padding: "11px 20px", borderRadius: 10, textDecoration: "none", boxShadow: "0 12px 24px -12px rgba(59,67,181,.7)" };
const miniLink: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, fontFamily: SANS, fontWeight: 600, fontSize: 13.5, color: INDIGO, textDecoration: "none" };

function greeting(name: string | null): string {
  return name ? `Welcome back, ${name.split(" ")[0]}` : "Welcome back";
}
function firstNameOf(name: string | null): string | null {
  return name ? name.split(" ")[0] : null;
}
function chipsFor(href: string): [string, string] {
  if (href.startsWith("/diagnostic")) return ["~60 min total", "Reading + Writing"];
  if (href.startsWith("/write")) return ["Task 2 · ~40 min", "Per-criterion grade"];
  return ["Timed passage", "Instant marking"];
}
function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(iso));
}
function fmtFullDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date(`${iso}T00:00:00`));
}

/** A Mon–Sun week with today marked and the trailing `streakDays` filled. */
function weekDots(streakDays: number): { label: string; today: boolean; filled: boolean }[] {
  const labels = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const jsDay = new Date().getDay(); // 0=Sun..6=Sat
  const todayIdx = (jsDay + 6) % 7; // 0=Mon..6=Sun
  return labels.map((label, i) => ({ label, today: i === todayIdx, filled: i <= todayIdx && todayIdx - i < streakDays }));
}

const DASH_CSS = `
.dash-grid { display: grid; grid-template-columns: minmax(0,1.7fr) minmax(0,1fr); gap: 16px; align-items: start; }
.dash-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.dash-focus:hover { background: #F6F6FA; }
@media (max-width: 1040px) { .dash-grid { grid-template-columns: 1fr; } }
@media (max-width: 560px) { .dash-2 { grid-template-columns: 1fr; } }
`;
