"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useRef, useState } from "react";
import {
  ArrowLeft, BookOpen, CalendarDays, Check, Compass, Gauge, GraduationCap, Headphones,
  Layers, Mic, PenLine, ShieldCheck, Sparkles, Target, Timer, TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { signOut } from "@/app/(auth)/actions";
import { createClient } from "@/lib/supabase/client";
import { pitchDifficulty, SELF_REPORT_BANDS, type StudyPlanInput } from "@/lib/plan/types";

import { savePlanForCurrentUser, stashOnboarding } from "./actions";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#3B43B5";
const INK = "#1A2138";
const MUTED = "#5A6076";
const FAINT = "#8A8FA0";
const LINE = "#ECEAF2";
const TINT = "#F4F4FE";
const TINT_BORDER = "#D8DAF3";

const STEPS = ["Get started", "Your goal", "Your level", "Create account"] as const;

type TimelineKey = "lt1" | "1to3" | "3to6" | "none";
const TIMELINES: { key: TimelineKey; label: string; desc: string; Icon: LucideIcon }[] = [
  { key: "lt1", label: "Less than a month", desc: "Full mocks + high-impact fixes", Icon: Timer },
  { key: "1to3", label: "1–3 months", desc: "Accuracy, timing, review habits", Icon: TrendingUp },
  { key: "3to6", label: "3–6 months", desc: "Grow your band steadily", Icon: Compass },
  { key: "none", label: "No date yet", desc: "Keep the plan flexible", Icon: CalendarDays },
];
function timelineToExamDate(key: TimelineKey): string | null {
  if (key === "none") return null;
  const days = key === "lt1" ? 21 : key === "1to3" ? 60 : 135;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Onboarding wizard. A wide content column (≈70%) carries the steps; a live
 * "examiner coach" sidebar reacts to each answer in real time so collecting the
 * plan feels like a coach sizing you up.
 *
 * Two modes share the exact same steps + coach:
 *  - "signup" (at /start): final step creates the account with Google, stashing
 *    the answers in a cookie that applies after the OAuth round-trip.
 *  - "authed" (the post-login first-run takeover): the learner already has a
 *    session, so the final step just saves the plan and starts the diagnostic.
 */
export function StartWizard({ mode = "signup" }: { mode?: "signup" | "authed" }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState(7);
  const [self, setSelf] = useState<number | null>(null);
  const [timeline, setTimeline] = useState<TimelineKey>("none");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coach "is evaluating" pulse — fired from the answer handlers (never an effect,
  // so no cascading-render lint), giving the sidebar a live thinking beat.
  const [thinking, setThinking] = useState(false);
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function pulseCoach() {
    setThinking(true);
    if (thinkTimer.current) clearTimeout(thinkTimer.current);
    thinkTimer.current = setTimeout(() => setThinking(false), 620);
  }

  const onTarget = (n: number) => { setTarget(n); pulseCoach(); };
  const onSelf = (n: number | null) => { setSelf(n); pulseCoach(); };
  const onTimeline = (k: TimelineKey) => { setTimeline(k); pulseCoach(); };

  function buildPlan(): StudyPlanInput {
    return { selfReportedBand: self, targetBand: target, examDate: timelineToExamDate(timeline) };
  }
  function next() { setError(null); setStep((s) => Math.min(s + 1, STEPS.length - 1)); pulseCoach(); }
  function back() { setError(null); setStep((s) => Math.max(s - 1, 0)); }

  async function continueWithGoogle() {
    setError(null);
    setBusy(true);
    try {
      await stashOnboarding(buildPlan());
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) { setError("Couldn't start Google sign-in — please try again."); setBusy(false); }
    } catch {
      setError("Something went wrong — please try again."); setBusy(false);
    }
  }

  // Authed mode: the session already exists, so persist the plan and navigate to
  // the dashboard client-side. The save action returns (no server redirect), so
  // navigation is reliable from this onClick handler.
  async function completeAuthed() {
    setError(null);
    setBusy(true);
    try {
      await savePlanForCurrentUser(buildPlan());
      router.replace("/dashboard");
      router.refresh(); // re-run the (app) layout so it sees the new plan and
      // drops the takeover (it often sits at the /dashboard URL already).
    } catch {
      setError("Couldn't save your plan — please try again."); setBusy(false);
    }
  }

  return (
    <div className="onb-shell" style={{ height: "100dvh", overflow: "hidden", display: "grid", gridTemplateColumns: "minmax(0,1fr) clamp(380px,32vw,460px)", fontFamily: SANS, color: INK, background: "#fff" }}>
      <style>{STYLES}</style>

      {/* ── Main (≈70%): brand, horizontal stepper, step content ── */}
      <main className="onb-main" style={{ height: "100dvh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        <div className="onb-content" style={{ width: "100%", maxWidth: 780, margin: "auto", padding: "32px clamp(24px,5vw,64px)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {mode === "authed" ? <Logo /> : <Link href="/" style={{ textDecoration: "none" }}><Logo /></Link>}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 13, color: FAINT }}>Step {step + 1} of {STEPS.length}</span>
              {mode === "authed" ? (
                <form action={signOut}>
                  <button type="submit" style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 13, fontWeight: 600, color: MUTED, padding: 0 }}>Sign out</button>
                </form>
              ) : null}
            </div>
          </div>

          <Stepper step={step} />

          {step > 0 ? (
            <button type="button" onClick={back} style={backBtn}><ArrowLeft size={17} /> Back</button>
          ) : null}

          {step === 0 ? <StepWelcome mode={mode} onContinue={next} /> : null}
          {step === 1 ? <StepGoal target={target} setTarget={onTarget} onContinue={next} /> : null}
          {step === 2 ? <StepLevel self={self} setSelf={onSelf} timeline={timeline} setTimeline={onTimeline} onContinue={next} /> : null}
          {step === 3 ? (
            <StepAccount mode={mode} target={target} self={self} timeline={timeline} busy={busy} error={error} onGoogle={continueWithGoogle} onComplete={completeAuthed} />
          ) : null}
        </div>
      </main>

      {/* ── Right sidebar: the live examiner coach ── */}
      <CoachPanel step={step} target={target} self={self} timeline={timeline} thinking={thinking} />
    </div>
  );
}

// ── Horizontal stepper ───────────────────────────────────────────────────────
function Stepper({ step }: { step: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", margin: "22px 0 28px" }}>
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <Fragment key={label}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flex: "none" }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 700, fontSize: 12.5, background: active || done ? INDIGO : "#fff", color: active || done ? "#fff" : "#A6A9B8", border: `1.5px solid ${active || done ? INDIGO : "#E1E0E8"}` }}>
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className="onb-steplabel" style={{ fontFamily: SANS, fontWeight: active ? 700 : 500, fontSize: 13.5, color: active ? INDIGO : done ? INK : "#A6A9B8", whiteSpace: "nowrap" }}>{label}</span>
            </div>
            {i < STEPS.length - 1 ? (
              <span style={{ flex: 1, height: 2, margin: "0 12px", borderRadius: 2, background: i < step ? INDIGO : "#E8E7EE" }} />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Step 1: Welcome ──────────────────────────────────────────────────────────
function StepWelcome({ mode, onContinue }: { mode: "signup" | "authed"; onContinue: () => void }) {
  const skills: { Icon: LucideIcon; label: string; on: boolean }[] = [
    { Icon: PenLine, label: "Writing", on: true },
    { Icon: BookOpen, label: "Reading", on: true },
    { Icon: Headphones, label: "Listening", on: false },
    { Icon: Mic, label: "Speaking", on: false },
  ];
  return (
    <div>
      <Eyebrow tone="indigo">Takes under a minute</Eyebrow>
      <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(32px,4vw,46px)", lineHeight: 1.05, letterSpacing: "-.015em", color: INK, margin: "10px 0 0" }}>
        Build your IELTS band plan before test day
      </h1>
      <p style={{ fontFamily: SANS, fontSize: 16.5, lineHeight: 1.6, color: MUTED, margin: "12px 0 24px", maxWidth: 540 }}>
        Three quick answers and the app shapes itself around you — tasks at your level, paced to your target. Your coach is already listening on the right.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {skills.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: "14px 16px", opacity: s.on ? 1 : 0.78 }}>
            <span style={{ flex: "none", width: 40, height: 40, borderRadius: 11, background: s.on ? TINT : "#F4F4F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.Icon size={19} color={s.on ? INDIGO : "#9A9DAC"} strokeWidth={2} />
            </span>
            <span style={{ flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 15, color: s.on ? INK : FAINT }}>{s.label}</span>
            <Badge live={s.on} />
          </div>
        ))}
      </div>

      <PrimaryButton onClick={onContinue} style={{ marginTop: 26 }}>Continue</PrimaryButton>
      {mode === "signup" ? (
        <p style={signInRow}>Already have an account? <Link href="/sign-in" style={signInLink}>Sign in</Link></p>
      ) : null}
    </div>
  );
}

// ── Step 2: Goal ─────────────────────────────────────────────────────────────
function StepGoal({ target, setTarget, onContinue }: { target: number; setTarget: (n: number) => void; onContinue: () => void }) {
  return (
    <div>
      <Heading title="Set your target band" sub="Choose the band you're aiming for — your coach tunes the whole route around it." />
      <div style={{ ...cardStyle, marginTop: 22, padding: "26px 24px" }}>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 66, lineHeight: 0.9, color: INK, letterSpacing: "-.03em" }}>{target.toFixed(1)}</div>
            <Eyebrow>Target band</Eyebrow>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Eyebrow tone="indigo">Momentum route</Eyebrow>
            <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 21, color: INK, margin: "4px 0 0" }}>Make the test feel less random</div>
            <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.55, color: MUTED, margin: "6px 0 0" }}>
              Lock the easier band points first, then add timing pressure once accuracy is stable.
            </p>
          </div>
        </div>
        <input type="range" min={4} max={9} step={0.5} value={target} onChange={(e) => setTarget(Number(e.target.value))} aria-label="Target band" style={{ width: "100%", marginTop: 22, accentColor: INDIGO, height: 6, cursor: "pointer" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 12.5, color: FAINT, marginTop: 6 }}><span>4.0</span><span>9.0</span></div>
        <div style={{ marginTop: 14 }}>
          <RouteItem n={1} title="Core skills" desc="Stop easy loss" />
          <RouteItem n={2} title="Timing" desc="Reduce slow traps" />
          <RouteItem n={3} title="Full mock" desc="Measure the jump" />
        </div>
      </div>
      <PrimaryButton onClick={onContinue} style={{ marginTop: 22 }}>Continue</PrimaryButton>
    </div>
  );
}

// ── Step 3: Level + timeline ─────────────────────────────────────────────────
function StepLevel({ self, setSelf, timeline, setTimeline, onContinue }: { self: number | null; setSelf: (n: number | null) => void; timeline: TimelineKey; setTimeline: (k: TimelineKey) => void; onContinue: () => void }) {
  return (
    <div>
      <Heading title="Where are you starting from?" sub="Your best guess is fine — the diagnostic sharpens it. This sets how hard your first tasks are." />
      <div style={{ marginTop: 22 }}>
        <Label>Current level</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          <Chip selected={self === null} onClick={() => setSelf(null)}>Not sure yet</Chip>
          {SELF_REPORT_BANDS.map((b) => (
            <Chip key={b} selected={self === b} onClick={() => setSelf(b)}>{b.toFixed(1)}</Chip>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 24 }}>
        <Label>When&rsquo;s your test?</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
          {TIMELINES.map((t) => (
            <OptionCard key={t.key} Icon={t.Icon} title={t.label} desc={t.desc} selected={timeline === t.key} onClick={() => setTimeline(t.key)} />
          ))}
        </div>
      </div>
      <PrimaryButton onClick={onContinue} style={{ marginTop: 24 }}>Continue</PrimaryButton>
    </div>
  );
}

// ── Step 4: Create account (signup → Google) / lock plan (authed → save) ──────
function StepAccount({ mode, target, self, timeline, busy, error, onGoogle, onComplete }: { mode: "signup" | "authed"; target: number; self: number | null; timeline: TimelineKey; busy: boolean; error: string | null; onGoogle: () => void; onComplete: () => void }) {
  const timelineLabel = TIMELINES.find((t) => t.key === timeline)!.label;
  const authed = mode === "authed";
  return (
    <div>
      <Heading
        title={authed ? "You're all set" : "Save your IELTS plan"}
        sub={authed ? "Lock in the route you just built and jump into your first task." : "Create your account with Google to keep the route you just built — and start practising."}
      />

      <div style={{ background: TINT, border: `1px solid ${TINT_BORDER}`, borderRadius: 18, padding: 18, margin: "22px 0 18px" }}>
        <Eyebrow tone="indigo">Built from your answers</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          <StatTile Icon={Target} label="Target" value={`Band ${target.toFixed(1)}`} />
          <StatTile Icon={Gauge} label="Current" value={self != null ? `Band ${self.toFixed(1)}` : "To be set"} />
          <StatTile Icon={CalendarDays} label="Timeline" value={timelineLabel} />
          <StatTile Icon={Layers} label="Focus" value="Reading & Writing" />
        </div>
      </div>

      {authed ? (
        <>
          <PrimaryButton onClick={onComplete} disabled={busy}>
            {busy ? "Saving…" : "Start practising"}
          </PrimaryButton>
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, textAlign: "center", margin: "12px 0 0" }}>
            Next: a short diagnostic sets your real starting bands.
          </p>
        </>
      ) : (
        <>
          <button type="button" onClick={onGoogle} disabled={busy} style={googleBtn(busy)}>
            <GoogleMark /> {busy ? "Redirecting…" : "Continue with Google"}
          </button>
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: FAINT, textAlign: "center", margin: "12px 0 0" }}>
            Free to start · no card · your plan attaches instantly
          </p>
        </>
      )}

      {error ? (
        <p role="alert" style={{ margin: "14px 0 0", fontSize: 13.5, color: "#c2410c", background: "#FEF2E8", border: "1px solid #F6D7BE", borderRadius: 10, padding: "10px 12px" }}>{error}</p>
      ) : null}

      {authed ? null : (
        <p style={signInRow}>Already have an account? <Link href="/sign-in" style={signInLink}>Sign in</Link></p>
      )}
    </div>
  );
}

// ── The live examiner coach ──────────────────────────────────────────────────
type Note = { id: string; Icon: LucideIcon; text: string };

function coachNotes(step: number, target: number, self: number | null, timeline: TimelineKey): Note[] {
  const notes: Note[] = [
    { id: "hi", Icon: Sparkles, text: "I'm your examiner coach. I'm reading your answers as you go — no pressure." },
  ];

  let t: string;
  if (target >= 8) t = `Band ${target.toFixed(1)} is top-band territory. I'll grade strictly so the score is real on exam day.`;
  else if (target >= 6.5) t = `Band ${target.toFixed(1)} — the most-wanted range. Most people miss it on rounding. I won't let you.`;
  else t = `Band ${target.toFixed(1)} is a smart first milestone. Let's lock the easy points first.`;
  notes.push({ id: `t-${target}`, Icon: Target, text: t });

  if (step >= 2 || self != null) {
    if (self != null) {
      const pitch = pitchDifficulty({ measuredBand: null, selfReportedBand: self, targetBand: target });
      const gap = Math.max(0, target - self);
      notes.push({ id: `s-${self}-${target}`, Icon: Gauge, text: gap > 0 ? `Starting near Band ${self.toFixed(1)} — a ${gap.toFixed(1)}-band climb. First tasks pitched at Band ${pitch} to stretch you, not break you.` : `Already around Band ${self.toFixed(1)}. We'll harden it under exam timing.` });
    } else if (step >= 2) {
      notes.push({ id: "s-none", Icon: Gauge, text: "Level not set — no problem. Your diagnostic sets an honest baseline before we commit." });
    }
  }

  if (step >= 2) {
    const map: Record<TimelineKey, string> = {
      lt1: "Under a month — I'll front-load full mocks and only the highest-impact fixes.",
      "1to3": "1–3 months — accuracy first, then I add timing pressure once you're stable.",
      "3to6": "3–6 months — steady band growth, no cramming.",
      none: "No date yet — flexible pace; I'll keep momentum with short daily reps.",
    };
    notes.push({ id: `tl-${timeline}`, Icon: CalendarDays, text: map[timeline] });
  }

  if (step >= 3) notes.push({ id: "ready", Icon: ShieldCheck, text: "Plan ready. Create your account and I'll grade your first task." });
  return notes;
}

function CoachPanel({ step, target, self, timeline, thinking }: { step: number; target: number; self: number | null; timeline: TimelineKey; thinking: boolean }) {
  const notes = coachNotes(step, target, self, timeline);
  const pct = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <aside className="onb-coach" style={{ height: "100dvh", overflow: "hidden", borderLeft: `1px solid ${LINE}`, background: "linear-gradient(170deg,#F2F2FF 0%,#F9F9FF 55%,#FFFFFF 100%)", display: "flex", flexDirection: "column", padding: "30px clamp(22px,2vw,30px)" }}>
      <style>{COACH_STYLES}</style>

      {/* identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className={thinking ? "coach-av coach-av-on" : "coach-av"} style={{ flex: "none", width: 46, height: 46, borderRadius: 14, background: "linear-gradient(135deg,#5B55D6,#3B43B5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 22px -10px rgba(59,67,181,.7)" }}>
          <GraduationCap size={22} color="#fff" strokeWidth={2} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 15, color: INK }}>AI Examiner Coach</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 12.5, color: thinking ? INDIGO : "#1F8A5B" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: thinking ? INDIGO : "#1F8A5B", animation: "coach-pulse 1.4s infinite" }} />
            {thinking ? "Evaluating your answer…" : "Listening · live"}
          </div>
        </div>
      </div>

      {/* profile meter */}
      <div style={{ marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: FAINT, marginBottom: 6 }}>
          <span style={{ letterSpacing: ".06em", textTransform: "uppercase" }}>Building your profile</span>
          <span style={{ color: INDIGO }}>{pct}%</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, background: "#E7E7F2", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, borderRadius: 999, background: "linear-gradient(90deg,#5B55D6,#3B43B5)", transition: "width .5s cubic-bezier(.4,.7,.2,1)" }} />
        </div>
      </div>

      {/* live notes */}
      <div className="coach-notes" style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginTop: 18, paddingRight: 2 }}>
        {notes.map((n) => (
          <div key={n.id} className="coach-note" style={{ display: "flex", gap: 10, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: "12px 13px", boxShadow: "0 2px 10px -6px rgba(40,40,90,.16)" }}>
            <span style={{ flex: "none", width: 30, height: 30, borderRadius: 9, background: TINT, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <n.Icon size={15} color={INDIGO} strokeWidth={2.2} />
            </span>
            <p style={{ margin: 0, fontFamily: SANS, fontSize: 13, lineHeight: 1.5, color: "#3A3D52" }}>{n.text}</p>
          </div>
        ))}
        {thinking ? (
          <div className="coach-note" style={{ display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start", background: "#fff", border: `1px solid ${LINE}`, borderRadius: 14, padding: "11px 14px" }}>
            {[0, 0.18, 0.36].map((d) => (
              <span key={d} style={{ width: 6, height: 6, borderRadius: "50%", background: INDIGO, animation: `coach-bounce 1s ${d}s infinite` }} />
            ))}
          </div>
        ) : null}
      </div>

      {/* footer signal */}
      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontFamily: SANS, fontSize: 11.5, color: FAINT }}>
        <span style={{ display: "inline-flex", gap: 3 }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ width: 3, height: 11, borderRadius: 2, background: INDIGO, opacity: 0.35, animation: `coach-eq 1.1s ${i * 0.12}s infinite` }} />
          ))}
        </span>
        Calibrated &amp; conservative · your 7 is a real 7
      </div>
    </aside>
  );
}

// ── Shared bits ──────────────────────────────────────────────────────────────
function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(28px,3.6vw,40px)", lineHeight: 1.08, letterSpacing: "-.015em", color: INK, margin: 0 }}>{title}</h1>
      <p style={{ fontFamily: SANS, fontSize: 16, lineHeight: 1.55, color: MUTED, margin: "10px 0 0", maxWidth: 540 }}>{sub}</p>
    </>
  );
}

function Eyebrow({ children, tone }: { children: React.ReactNode; tone?: "indigo" }) {
  return <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: tone === "indigo" ? INDIGO : FAINT }}>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ display: "block", fontFamily: SANS, fontWeight: 700, fontSize: 15, color: INK }}>{children}</label>;
}

function Badge({ live }: { live: boolean }) {
  return (
    <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10.5, letterSpacing: ".05em", textTransform: "uppercase", color: live ? "#1F8A5B" : "#9A9DAC", background: live ? "#E9F5EF" : "#F2F2F4", border: `1px solid ${live ? "#CFE7DA" : "#E6E6EA"}`, borderRadius: 999, padding: "3px 9px" }}>
      {live ? "Live" : "Soon"}
    </span>
  );
}

function OptionCard({ Icon, title, desc, selected, onClick }: { Icon: LucideIcon; title: string; desc?: string; selected: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className="onb-opt" style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "13px 14px", borderRadius: 14, cursor: "pointer", background: selected ? TINT : "#fff", border: `1.5px solid ${selected ? INDIGO : LINE}`, boxShadow: selected ? "0 10px 22px -16px rgba(59,67,181,.7)" : "none", transition: "border-color .15s, box-shadow .15s, background .15s" }}>
      <span style={{ flex: "none", width: 38, height: 38, borderRadius: 11, background: selected ? "#fff" : "#F5F5F8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={18} color={selected ? INDIGO : "#6E7388"} strokeWidth={2} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: SANS, fontWeight: 700, fontSize: 14.5, color: INK }}>{title}</span>
        {desc ? <span style={{ display: "block", fontFamily: SANS, fontSize: 12.5, lineHeight: 1.35, color: MUTED, marginTop: 1 }}>{desc}</span> : null}
      </span>
      <Radio selected={selected} />
    </button>
  );
}

function Radio({ selected }: { selected: boolean }) {
  return (
    <span style={{ flex: "none", width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected ? INDIGO : "#CFCFD8"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {selected ? <span style={{ width: 10, height: 10, borderRadius: "50%", background: INDIGO }} /> : null}
    </span>
  );
}

function RouteItem({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 0", borderTop: `1px solid ${LINE}` }}>
      <span style={{ flex: "none", width: 27, height: 27, borderRadius: "50%", border: `1px solid ${TINT_BORDER}`, background: TINT, color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 700, fontSize: 12.5 }}>{n}</span>
      <span style={{ flex: 1, fontFamily: SANS, fontWeight: 700, fontSize: 14.5, color: INK }}>{title}</span>
      <span style={{ fontFamily: SANS, fontSize: 13, color: MUTED }}>{desc}</span>
    </div>
  );
}

function StatTile({ Icon, label, value }: { Icon: LucideIcon; label: string; value: string }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 13, padding: "12px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <Icon size={14} color={INDIGO} strokeWidth={2.2} />
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 10.5, letterSpacing: ".07em", textTransform: "uppercase", color: FAINT }}>{label}</span>
      </div>
      <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 17, color: INK, marginTop: 5 }}>{value}</div>
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} style={{ fontFamily: SANS, fontWeight: 600, fontSize: 14.5, padding: "9px 15px", borderRadius: 11, cursor: "pointer", background: selected ? INDIGO : "#fff", color: selected ? "#fff" : INK, border: `1.5px solid ${selected ? INDIGO : LINE}`, boxShadow: selected ? "0 8px 18px -12px rgba(59,67,181,.8)" : "none", transition: "background .12s, border-color .12s" }}>
      {children}
    </button>
  );
}

function PrimaryButton({ children, onClick, disabled, style }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ width: "100%", height: 54, border: "none", borderRadius: 13, background: INDIGO, color: "#fff", fontFamily: SANS, fontSize: 16, fontWeight: 700, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.55 : 1, boxShadow: "0 14px 28px -16px rgba(59,67,181,.9)", ...style }}>
      {children}
    </button>
  );
}

function Logo() {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: INDIGO, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 800, fontSize: 14 }}>IS</span>
      <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 19, color: INK }}>IELTS <span style={{ color: INDIGO }}>Studio</span></span>
    </span>
  );
}

function GoogleMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden style={{ flex: "none" }}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 24 44c11 0 20-9 20-20 0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.9 1.1 8 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C39.9 41.9 44 36.6 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}

const cardStyle: React.CSSProperties = { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: "0 1px 2px rgba(26,33,56,.04)" };
function googleBtn(busy: boolean): React.CSSProperties {
  return { width: "100%", height: 54, display: "flex", alignItems: "center", justifyContent: "center", gap: 10, border: `1.5px solid ${LINE}`, borderRadius: 13, background: "#fff", fontFamily: SANS, fontSize: 16, fontWeight: 700, color: INK, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1, boxShadow: "0 10px 24px -16px rgba(26,33,56,.5)" };
}
const backBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: MUTED, padding: 0, marginBottom: 16 };
const signInRow: React.CSSProperties = { fontFamily: SANS, fontSize: 14, color: MUTED, textAlign: "center", margin: "16px 0 0" };
const signInLink: React.CSSProperties = { color: INDIGO, fontWeight: 600, textDecoration: "none" };

const STYLES = `
.onb-opt:hover { border-color: #C2BEEC !important; }
.onb-main::-webkit-scrollbar { width: 0; }
@media (max-width: 980px) {
  .onb-shell { grid-template-columns: 1fr !important; }
  .onb-coach { display: none !important; }
}
@media (max-width: 560px) {
  .onb-steplabel { display: none !important; }
}
`;

const COACH_STYLES = `
@keyframes coach-pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
@keyframes coach-bounce { 0%,80%,100% { transform: translateY(0); opacity: .4 } 40% { transform: translateY(-4px); opacity: 1 } }
@keyframes coach-eq { 0%,100% { opacity: .3; transform: scaleY(.6) } 50% { opacity: 1; transform: scaleY(1.2) } }
@keyframes coach-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes coach-ring { 0%,100% { box-shadow: 0 10px 22px -10px rgba(59,67,181,.7), 0 0 0 0 rgba(59,67,181,.35) } 50% { box-shadow: 0 10px 22px -10px rgba(59,67,181,.7), 0 0 0 7px rgba(59,67,181,0) } }
.coach-note { animation: coach-in .35s ease both; }
.coach-av-on { animation: coach-ring 1.2s ease-in-out infinite; }
.coach-notes::-webkit-scrollbar { width: 0; }
`;
