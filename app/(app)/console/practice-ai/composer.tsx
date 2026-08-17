"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { clientEnv } from "@/lib/env";
import {
  EMBER,
  EMBER_OFF,
  FAINT,
  GHOST,
  GOOD_INK,
  INK,
  MUTED,
  PAPER,
  SOFT,
  TROUGH,
  TROUGH_DEEP,
  WASH,
} from "@/lib/lessons/theme";
import { createClient } from "@/lib/supabase/client";

/**
 * Type what your group needs; get a lesson page.
 *
 * The redesign moved the settings OUT of a dialog and into the box: level,
 * focus, how many exercises and whether the hard part gets a note in the
 * learner's own language now sit one press away under "+ Specs", visible while
 * the brief is still being written. The dialog they used to live in is still
 * here — but only for the questions the ENGINE asks, and only when it asks any.
 * A modal that opened every time to offer choices already made on the page is
 * a modal that gets dismissed without being read.
 *
 * Every control does something. A `+` that opened nothing and a mic that
 * listened to nothing would match the picture and lie about the product, so the
 * `+` opens the real specs and the mic dictates into the brief — and the mic
 * only renders where the browser can actually do it.
 *
 * Calls the ENGINE directly with the user's Supabase token, the way reading and
 * listening do: a full build runs well past the 60s a Vercel function gets.
 */

const PLACEHOLDERS = [
  "Explain the present perfect, with practice",
  "Collocations for the education topic",
  "True / False / Not Given under time pressure",
  "Articles: a, an, the — my B1 group keeps dropping them",
];

const STARTERS = [
  "Present simple vs continuous",
  "Linking words for Task 2",
  "Countable and uncountable",
  "Describing trends for Task 1",
  "True / False / Not Given",
  "Past simple irregular verbs",
];

type Question = { id: string; label: string; options: string[]; default: string };
type Plan = Record<string, unknown> & { title?: string; level?: string; objective?: string };

type Phase =
  | { step: "idle" }
  | { step: "working"; stage: number; label: string }
  | { step: "asking"; questions: Question[]; blueprint: string | null }
  | { step: "planned"; plan: Plan }
  | { step: "error"; message: string };

/* ── the specs ──────────────────────────────────────────────────────────────
   Four rows, and the reason each is here rather than left to the model:

   LEVEL and FOCUS steer what gets written, and a teacher knows both before
   they finish typing. Left unset they stay "Auto" and the engine decides —
   which is the honest default, not a placeholder.

   ITEMS and SUPPORT are facts about this class, never about the teaching. How
   long the lesson is depends on how long the class is, and whether the hard
   part needs a line of Uzbek depends on who is in the room. A model that
   guesses either is guessing about something it cannot see. */

const AUTO = "Auto";

const LEVELS = [AUTO, "A1", "A2", "B1", "B2", "C1", "C2"];

/** Matches `BLUEPRINT_LABEL` — the engine's own four kinds, not a new list. */
const FOCUSES = [
  { value: AUTO, label: AUTO },
  { value: "grammar", label: "Grammar" },
  { value: "vocabulary", label: "Vocabulary" },
  { value: "skill", label: "Skill" },
  { value: "exam_technique", label: "Exam technique" },
];

/** Sizes a real class actually needs: a warm-up, a normal lesson, a long one,
 *  and a full worksheet. Anything is allowed by the engine — these are the ones
 *  worth one press. */
const COUNTS = [8, 12, 16, 20];

const LANGUAGES = [
  { value: "en", label: "English only" },
  { value: "uz", label: "+ O'zbekcha izoh" },
  { value: "ru", label: "+ по-русски" },
];

/** The browser's own dictation. No server, no cost — and absent in browsers
 *  that can't do it, which is why the button is conditional. */
interface SpeechSession {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}
type SpeechCtor = new () => SpeechSession;

function speechCtor(): SpeechCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

async function callEngine<T>(path: string, body: unknown): Promise<T> {
  const backend = clientEnv.aiBackendUrl;
  if (!backend) throw new Error("The AI engine isn't configured for this environment.");

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Your session expired — please sign in again.");

  let res: Response;
  try {
    res = await fetch(`${backend}/lessons/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // A rejected fetch is a network fact, not an HTTP status. Saying so beats
    // the browser's bare "Failed to fetch", which sent us hunting for a timeout
    // when the engine box was simply switched off.
    throw new Error("Couldn't reach the AI engine. It may be restarting — try again shortly.");
  }

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    detail?: string | { message?: string };
    message?: string;
  };
  if (!res.ok) {
    const detail = typeof json.detail === "string" ? json.detail : json.detail?.message;
    throw new Error(detail ?? json.message ?? `That didn't work (${res.status}).`);
  }
  return json as T;
}

export function Composer() {
  const router = useRouter();
  const [brief, setBrief] = useState("");
  const [showSpecs, setShowSpecs] = useState(false);
  const [planFirst, setPlanFirst] = useState(true);
  const [level, setLevel] = useState(AUTO);
  const [focus, setFocus] = useState(AUTO);
  const [count, setCount] = useState(12);
  const [language, setLanguage] = useState("en");
  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechSession | null>(null);

  // Whether this browser can dictate is a browser-only fact, so it is read the
  // way React wants browser-only facts read: a server snapshot of `false` and a
  // client snapshot of the real answer. An effect would set state after paint
  // (and trip the cascading-render rule); a lazy useState initializer would
  // disagree between server and client and break hydration.
  const canDictate = useSyncExternalStore(
    () => () => {},
    () => speechCtor() != null,
    () => false,
  );

  const typed = useTypedPlaceholder(brief === "");
  const busy = phase.step === "working";

  /**
   * The brief as the engine sees it.
   *
   * Level and focus ride in the TEXT rather than in the answers map, because
   * the answers map is keyed by ids the engine minted for its own questions and
   * a key it never asked for is a key it is free to drop. A sentence at the end
   * of a brief is read by every model, every time.
   */
  const fullBrief = () => {
    const notes = [
      level !== AUTO ? `Level: ${level}.` : null,
      focus !== AUTO ? `Focus on ${FOCUSES.find((f) => f.value === focus)?.label.toLowerCase()}.` : null,
    ].filter(Boolean);
    return notes.length > 0 ? `${brief.trim()}\n\n${notes.join(" ")}` : brief.trim();
  };

  function toggleDictation() {
    const Ctor = speechCtor();
    if (!Ctor) return;
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const rec = new Ctor();
    // The BROWSER's language, not the lesson's. Which language a teacher
    // dictates a brief in says nothing about which language their learners need
    // a note in — that is the Support row, and it is a separate question.
    rec.lang = navigator.language || "en-US";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const said = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript).join(" ");
      setBrief((b) => (b ? `${b} ${said}` : said));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognition.current = rec;
    setListening(true);
    rec.start();
  }

  /**
   * Press send and the engine reads the brief.
   *
   * If it wants to know something the specs panel does not cover, it asks —
   * otherwise this goes straight on to planning. The dialog is no longer
   * unconditional: everything it used to insist on asking is now on the page.
   */
  async function start() {
    const text = fullBrief();
    if (!text.trim() || busy) return;
    setAnswers({});
    setPhase({ step: "working", stage: 0, label: "Reading your brief…" });
    try {
      const intake = await callEngine<{
        status: string;
        questions?: Question[];
        blueprint?: string | null;
      }>("intake", { brief: text, language });

      const questions = intake.questions ?? [];
      if (questions.length === 0) {
        await proceed({}, intake.blueprint ?? null);
        return;
      }
      setPhase({ step: "asking", questions, blueprint: intake.blueprint ?? null });
    } catch (err) {
      setPhase({ step: "error", message: (err as Error).message });
    }
  }

  /** Leaving the questions: plan and show it, or go straight to writing. */
  async function proceed(given: Record<string, string>, blueprint: string | null) {
    const text = fullBrief();
    setPhase({ step: "working", stage: 1, label: "Drafting the explanation…" });
    const plan = await callEngine<Plan>("plan", {
      brief: text,
      answers: given,
      blueprint: blueprint ?? (focus === AUTO ? null : focus),
      language,
      exercise_total: count,
    });
    if (planFirst) {
      setPhase({ step: "planned", plan });
      return;
    }
    await build(text, plan);
  }

  async function build(text: string, plan: Plan) {
    setPhase({ step: "working", stage: 2, label: `Writing ${count} exercises…` });
    const made = await callEngine<{ id: string }>("build", { plan, brief: text });
    setPhase({ step: "working", stage: 3, label: "Checking every answer key…" });
    router.push(`/console/practice-ai/${made.id}`);
  }

  const guard = (fn: () => Promise<void>) => () =>
    void fn().catch((e) => setPhase({ step: "error", message: (e as Error).message }));

  const specSummary = [
    level === AUTO ? null : level,
    focus === AUTO ? null : FOCUSES.find((f) => f.value === focus)?.label,
    `${count} items`,
    language === "en" ? null : language === "uz" ? "+ Uzbek" : "+ Russian",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* ── the box ─────────────────────────────────────────────────────── */}
      <div
        className="pa-composer"
        style={{
          width: "100%",
          maxWidth: 880,
          borderRadius: 30,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          boxShadow: "0 1px 2px rgba(20,35,46,.05), 0 30px 60px -28px rgba(20,35,46,.28)",
          overflow: "hidden",
          textAlign: "left",
        }}
      >
        <div style={{ padding: "26px 28px 10px" }}>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value.slice(0, 400))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void start();
              }
            }}
            placeholder={typed}
            disabled={busy}
            style={{
              width: "100%",
              minHeight: 92,
              border: 0,
              background: "transparent",
              outline: "none",
              resize: "none",
              fontSize: 21,
              lineHeight: 1.5,
              fontFamily: "inherit",
              color: INK,
            }}
          />
        </div>

        {showSpecs ? (
          <div
            className="pa-slide"
            style={{
              margin: "0 20px 6px",
              padding: "18px 20px",
              borderRadius: 22,
              background: WASH,
              display: "grid",
              gap: 14,
            }}
          >
            <SpecRow label="Level">
              {LEVELS.map((l) => (
                <SpecChip key={l} on={level === l} onClick={() => setLevel(l)}>
                  {l}
                </SpecChip>
              ))}
            </SpecRow>
            <SpecRow label="Focus">
              {FOCUSES.map((f) => (
                <SpecChip key={f.value} on={focus === f.value} onClick={() => setFocus(f.value)}>
                  {f.label}
                </SpecChip>
              ))}
            </SpecRow>
            <SpecRow label="Items">
              {COUNTS.map((c) => (
                <SpecChip key={c} on={count === c} onClick={() => setCount(c)}>
                  {c}
                </SpecChip>
              ))}
            </SpecRow>
            {/* Said here because it is the one thing teachers get wrong about
                this control: it is not "translate the lesson". A learner who
                reads the rule only in Uzbek has practised nothing. */}
            <SpecRow label="Support" hint="The lesson stays in English — this adds a short note per section.">
              {LANGUAGES.map((l) => (
                <SpecChip key={l.value} on={language === l.value} onClick={() => setLanguage(l.value)}>
                  {l.label}
                </SpecChip>
              ))}
            </SpecRow>
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px 18px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setShowSpecs((v) => !v)}
            aria-expanded={showSpecs}
            className="pa-tap"
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              background: showSpecs ? INK : "#fff",
              color: showSpecs ? PAPER : BODY_INK,
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "inherit",
              cursor: "pointer",
              boxShadow: showSpecs ? "none" : "inset 0 0 0 1px #e4e0d6",
            }}
          >
            {showSpecs ? "− Specs" : "+ Specs"}
          </button>

          <button
            type="button"
            onClick={() => setPlanFirst((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 16px 6px 6px",
              borderRadius: 999,
              background: "#fff",
              boxShadow: "inset 0 0 0 1px #e4e0d6",
              cursor: "pointer",
              fontFamily: "inherit",
              color: BODY_INK,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 34,
                height: 20,
                borderRadius: 999,
                background: planFirst ? EMBER : EMBER_OFF,
                position: "relative",
                transition: "background .18s",
                flex: "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: planFirst ? 16 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 2px rgba(0,0,0,.18)",
                  transition: "left .18s",
                }}
              />
            </span>
            <span style={{ fontWeight: 600, fontSize: 15 }}>Plan</span>
          </button>

          <span className="pa-bar-hide" style={{ fontSize: 13, color: SOFT }}>
            {planFirst ? "I'll show the outline first" : "Straight to writing"}
          </span>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <span className="pa-bar-hide" style={{ fontSize: 13, color: SOFT }}>
              {specSummary}
            </span>

            {canDictate ? (
              <button
                type="button"
                onClick={toggleDictation}
                aria-pressed={listening}
                title={listening ? "Stop dictating" : "Dictate your brief"}
                className="pa-icon-btn"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  display: "grid",
                  placeItems: "center",
                  background: listening ? "rgba(236,106,69,.12)" : "transparent",
                  color: listening ? EMBER : "#4a5c66",
                  cursor: "pointer",
                }}
              >
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M12 19v3" />
                  <path d="M8 22h8" />
                  <rect x="9" y="2" width="6" height="12" rx="3" />
                  <path d="M5 10a7 7 0 0 0 14 0" />
                </svg>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => void start()}
              disabled={busy || brief.trim() === ""}
              aria-label="Make this lesson"
              className="pa-send"
              style={{
                width: 48,
                height: 48,
                borderRadius: 999,
                border: 0,
                background: EMBER,
                color: "#fff",
                display: "grid",
                placeItems: "center",
                opacity: brief.trim() === "" ? 0.55 : 1,
                cursor: busy || brief.trim() === "" ? "default" : "pointer",
                boxShadow: "0 8px 20px -6px rgba(236,106,69,.7)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5" />
                <path d="M5 12l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>

        {busy ? <Progress stage={phase.stage} count={count} /> : null}
      </div>

      {/* ── what came back ──────────────────────────────────────────────── */}
      {phase.step === "error" ? (
        <p
          style={{ fontSize: 15, color: "#a63a30", margin: "18px 0 0", maxWidth: 640, textAlign: "center" }}
          role="alert"
        >
          {phase.message}
        </p>
      ) : null}

      {phase.step === "asking" ? (
        <SetupDialog
          questions={phase.questions}
          answers={answers}
          onAnswer={(id, value) => setAnswers((a) => ({ ...a, [id]: value }))}
          planFirst={planFirst}
          onCancel={() => setPhase({ step: "idle" })}
          onGo={guard(() => proceed(answers, phase.blueprint))}
          onSkip={guard(() => proceed({}, phase.blueprint))}
        />
      ) : null}

      {phase.step === "planned" ? (
        <div
          className="pa-slide"
          style={{
            width: "100%",
            maxWidth: 880,
            marginTop: 18,
            padding: "24px 26px",
            borderRadius: 26,
            background: "#fff",
            boxShadow: "0 1px 2px rgba(20,35,46,.05), 0 16px 34px -24px rgba(20,35,46,.35)",
            textAlign: "left",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: FAINT,
            }}
          >
            Here&apos;s the plan
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: INK, marginTop: 8, letterSpacing: "-.01em" }}>
            {String(phase.plan.title ?? "Lesson")}
          </div>
          {phase.plan.objective ? (
            <p style={{ fontSize: 15, lineHeight: 1.6, color: MUTED, margin: "8px 0 0" }}>
              {String(phase.plan.objective)}
            </p>
          ) : null}
          {phase.plan.level ? (
            <div style={{ fontSize: 13, color: FAINT, marginTop: 8 }}>Level {String(phase.plan.level)}</div>
          ) : null}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={guard(() => build(fullBrief(), phase.plan))}
              className="pa-ember"
              style={emberPill}
            >
              Build it
            </button>
            <button
              type="button"
              onClick={() => setPhase({ step: "idle" })}
              className="pa-ghost"
              style={ghostPill}
            >
              Start again
            </button>
          </div>
        </div>
      ) : null}

      {/* ── starters ──────────────────────────────────────────────────────
          Always on screen. They are the menu, not a first-run hint — the person
          most likely to want a lesson is the one who just made one. */}
      <div style={{ marginTop: 40, textAlign: "center" }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: SOFT,
          }}
        >
          Not sure where to start? Try one of these
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 10,
            marginTop: 18,
          }}
        >
          {STARTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setBrief(s)}
              aria-pressed={brief.trim() === s}
              className="pa-chip"
              style={{
                padding: "13px 22px",
                borderRadius: 999,
                border: 0,
                background: brief.trim() === s ? INK : "#fff",
                color: brief.trim() === s ? PAPER : INK,
                fontSize: 15,
                fontWeight: 500,
                fontFamily: "inherit",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(20,35,46,.05), 0 8px 20px -14px rgba(20,35,46,.3)",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const BODY_INK = "#3d5560";

/**
 * A brief being typed by nobody.
 *
 * The placeholder types itself, deletes itself and moves on. It is the one
 * animation on this page that carries information rather than decoration: an
 * empty box with a grey line in it looks like a search field, and this box is
 * not a search field — watching it write "Explain the present perfect, with
 * practice" says what to put there faster than any label.
 *
 * Stops dead the moment there is a real brief, so it never competes with what
 * a teacher is actually writing.
 */
function useTypedPlaceholder(active: boolean): string {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!active) return;
    // Motion-sensitive readers get the phrase whole. Checked here rather than
    // in CSS because this animation is JavaScript and a media query cannot
    // reach it — and applied through the same timeout the typing uses, because
    // a setState in the effect BODY runs on every mount and cascades a render.
    // Reading the preference during render instead would be worse: the server
    // cannot know it, so it would hydrate mismatched.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      if (text === PLACEHOLDERS[0]) return;
      const whole = setTimeout(() => setText(PLACEHOLDERS[0]), 0);
      return () => clearTimeout(whole);
    }
    const full = PLACEHOLDERS[phraseIdx % PLACEHOLDERS.length];
    let delay = 55;
    if (!deleting && text.length === full.length) delay = 1800;
    else if (deleting) delay = text.length === 0 ? 320 : 22;

    const t = setTimeout(() => {
      if (!deleting) {
        const next = full.slice(0, text.length + 1);
        setText(next);
        if (next.length === full.length) setDeleting(true);
      } else if (text.length === 0) {
        setDeleting(false);
        setPhraseIdx((i) => i + 1);
      } else {
        setText(full.slice(0, text.length - 1));
      }
    }, delay);
    return () => clearTimeout(t);
  }, [active, text, deleting, phraseIdx]);

  return active ? `${text}▏` : "";
}

/** The bar under the box while the engine works.
 *
 *  Four named steps rather than one spinner, because this takes about a minute
 *  and a minute of "…" is indistinguishable from a minute of nothing. */
function Progress({ stage, count }: { stage: number; count: number }) {
  const steps = [
    "Reading the brief",
    "Drafting the explanation",
    `Writing ${count} exercises`,
    "Checking every answer key",
  ];
  return (
    <div className="pa-slide" style={{ padding: "0 22px 22px" }}>
      <div style={{ height: 5, borderRadius: 999, background: TROUGH_DEEP, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${((stage + 1) / steps.length) * 100}%`,
            borderRadius: 999,
            background: EMBER,
            transition: "width .6s cubic-bezier(.2,.7,.3,1)",
          }}
        />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 14 }}>
        {steps.map((label, i) => {
          const done = stage > i;
          const active = stage === i;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  display: "block",
                  background: done ? GOOD_INK : active ? EMBER : "#dcd8cf",
                }}
              />
              <span
                style={{
                  color: done ? GOOD_INK : active ? INK : "#a6b0b6",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpecRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "74px 1fr", alignItems: "start", gap: 14 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: ".06em",
          textTransform: "uppercase",
          color: "#7b8891",
          paddingTop: 9,
        }}
      >
        {label}
      </span>
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>{children}</div>
        {hint ? (
          <div style={{ fontSize: 12.5, color: FAINT, marginTop: 7, lineHeight: 1.5 }}>{hint}</div>
        ) : null}
      </div>
    </div>
  );
}

function SpecChip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className="pa-tap"
      style={{
        padding: "8px 15px",
        borderRadius: 999,
        border: 0,
        fontSize: 14,
        fontWeight: on ? 700 : 500,
        fontFamily: "inherit",
        cursor: "pointer",
        background: on ? INK : "#fff",
        color: on ? PAPER : BODY_INK,
        boxShadow: on ? "none" : "inset 0 0 0 1px #e4e0d6",
      }}
    >
      {children}
    </button>
  );
}

/**
 * The engine's own questions, and only those.
 *
 * It used to open every time and carry the exercise count and the explanation
 * language too. Both are on the page now, so this appears only when a model
 * genuinely could not tell what a teacher meant — which is the only case where
 * interrupting them is worth it. Everything stays skippable: "just build it"
 * has to remain possible at every step.
 */
function SetupDialog({
  questions,
  answers,
  onAnswer,
  planFirst,
  onCancel,
  onGo,
  onSkip,
}: {
  questions: Question[];
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  planFirst: boolean;
  onCancel: () => void;
  onGo: () => void;
  onSkip: () => void;
}) {
  return (
    <div
      role="presentation"
      onClick={onCancel}
      className="pa-slide"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(20,35,46,0.42)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "grid",
        placeItems: "center",
        padding: 24,
        overflow: "auto",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Before I write this lesson"
        // The backdrop closes; the sheet must not close when its own controls
        // are pressed, which is what a click inside it would otherwise do.
        onClick={(e) => e.stopPropagation()}
        className="pa-pop"
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "min(86vh, 760px)",
          overflowY: "auto",
          background: PAPER,
          borderRadius: 32,
          padding: "30px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
          textAlign: "left",
          boxShadow: "0 40px 80px -30px rgba(20,35,46,.6)",
        }}
      >
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: INK, margin: 0, letterSpacing: "-.02em" }}>
            One thing first
          </h2>
          <p style={{ fontSize: 15, color: MUTED, margin: "6px 0 0", lineHeight: 1.55 }}>
            Skip anything and I&apos;ll choose sensibly.
          </p>
        </div>

        {questions.map((q) => (
          <div key={q.id} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>{q.label}</span>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {q.options.map((opt) => (
                <SpecChip key={opt} on={answers[q.id] === opt} onClick={() => onAnswer(q.id, opt)}>
                  {opt}
                </SpecChip>
              ))}
            </div>
          </div>
        ))}

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={onGo} className="pa-ember" style={emberPill}>
            {planFirst ? "Continue" : "Write it"}
          </button>
          <button type="button" onClick={onSkip} className="pa-ghost" style={ghostPill}>
            Skip — you decide
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="pa-ghost"
            style={{ ...ghostPill, background: "transparent", color: GHOST, marginLeft: "auto" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const emberPill: React.CSSProperties = {
  border: 0,
  borderRadius: 999,
  background: EMBER,
  color: "#fff",
  padding: "13px 26px",
  fontFamily: "inherit",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 10px 24px -12px rgba(236,106,69,.9)",
};

const ghostPill: React.CSSProperties = {
  border: 0,
  borderRadius: 999,
  background: TROUGH,
  color: MUTED,
  padding: "13px 22px",
  fontFamily: "inherit",
  fontSize: 15,
  fontWeight: 500,
  cursor: "pointer",
};
