"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

/**
 * Type what your group needs; get a lesson page.
 *
 * Laid out after the reference the owner supplied: a centred hero, one large
 * brief box, and the affordances along its foot.
 *
 * Every control here does something. A `+` that opened nothing and a mic that
 * listened to nothing would match the picture and lie about the product, so the
 * `+` adds real context to the brief and the mic dictates into it — and the mic
 * only renders where the browser can actually do it.
 *
 * Calls the ENGINE directly with the user's Supabase token, the way reading and
 * listening do: a full build runs well past the 60s a Vercel function gets.
 */

const INK = "#15171C";
const MUTED = "#5C616C";
const FAINT = "#8B909B";
const LINE = "rgba(21,23,28,0.08)";
/* The reference's ember. The owner asked for the UI exactly as pictured, and
   the accent is the most recognisable part of it — so this page departs from
   the console indigo deliberately rather than by accident. */
const EMBER = "#E85A2C";
const EMBER_OFF = "#D0D6DE";
const HERO_INK = "#15171C";
const HERO_BODY = "#2A2D34";

const PLACEHOLDERS = [
  "Explain the present perfect, with practice",
  "Collocations for the education topic",
  "Task 2 introductions — how to paraphrase the question",
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
  | { step: "thinking"; label: string }
  | { step: "asking"; questions: Question[]; blueprint: string | null }
  | { step: "planned"; plan: Plan }
  | { step: "error"; message: string };

/**
 * The two questions the ENGINE must never ask, because the answer is a fact
 * about this teacher's class rather than about the teaching, and asking costs
 * one of the three questions it is allowed.
 *
 * Both live here, always shown, so a teacher never has to accept a default they
 * were not offered — the language note used to be a lozenge in the composer
 * footer that nobody noticed, and the exercise count was not a choice at all.
 */
const LANGUAGE_CHOICES = [
  { value: "en", label: "English only" },
  { value: "uz", label: "+ O'zbekcha izoh" },
  { value: "ru", label: "+ пояснение по-русски" },
];

/** Sizes a real class actually needs: a warm-up, a normal lesson, a long one,
 *  and a full worksheet. Anything is allowed by the engine — these are the ones
 *  worth one press. */
const COUNT_CHOICES = [
  { value: 8, label: "8", hint: "quick" },
  { value: 12, label: "12", hint: "standard" },
  { value: 16, label: "16", hint: "long" },
  { value: 20, label: "20", hint: "worksheet" },
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
  const [context, setContext] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [planFirst, setPlanFirst] = useState(true);
  const [language, setLanguage] = useState("en");
  const [count, setCount] = useState(12);
  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechSession | null>(null);
  const [placeholder] = useState(
    () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)],
  );

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

  const busy = phase.step === "thinking";

  /** The brief as the engine sees it: what they typed, plus any context. */
  const fullBrief = () =>
    context.trim() ? `${brief.trim()}\n\nContext from the teacher:\n${context.trim()}` : brief.trim();

  function toggleDictation() {
    const Ctor = speechCtor();
    if (!Ctor) return;
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const rec = new Ctor();
    // The BROWSER's language, not the lesson's. These were the same setting
    // until the explanation language moved into the dialog, and conflating them
    // was always slightly wrong: which language a teacher dictates a brief in
    // says nothing about which language their learners need a note in.
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
   * Press generate and the dialog opens — ALWAYS, even when the engine says it
   * has everything it needs.
   *
   * It used to appear only when the model decided to ask something, so whether
   * a teacher was offered any say at all depended on how confidently a model
   * had read their sentence. Two of the choices in it are not the model's to
   * make in any case: how long the class is, and whether the group needs the
   * hard part explained in Uzbek or Russian. Those are always worth a press.
   */
  async function start(text: string) {
    if (!text.trim() || busy) return;
    setAnswers({});
    setPhase({ step: "thinking", label: "Reading your brief…" });
    try {
      const intake = await callEngine<{
        status: string;
        questions?: Question[];
        blueprint?: string | null;
      }>("intake", { brief: text, language });

      setPhase({
        step: "asking",
        questions: intake.questions ?? [],
        blueprint: intake.blueprint ?? null,
      });
    } catch (err) {
      setPhase({ step: "error", message: (err as Error).message });
    }
  }

  /** Leaving the dialog: plan and show it, or go straight to writing. */
  async function proceed(given: Record<string, string>, blueprint: string | null) {
    const text = fullBrief();
    setPhase({ step: "thinking", label: "Planning the lesson…" });
    const plan = await callEngine<Plan>("plan", {
      brief: text,
      answers: given,
      blueprint,
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
    setPhase({ step: "thinking", label: "Writing it — about a minute…" });
    const made = await callEngine<{ id: string }>("build", { plan, brief: text });
    router.push(`/console/practice-ai/${made.id}`);
  }

  const guard = (fn: () => Promise<void>) => () =>
    void fn().catch((e) => setPhase({ step: "error", message: (e as Error).message }));

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      {/* ── the box ─────────────────────────────────────────────────────── */}
      <div
        className="pa-composer"
        style={{
          width: "100%",
          maxWidth: 660,
          background: "rgba(255,255,255,.78)",
          border: "1px solid rgba(255,255,255,.8)",
          borderRadius: 22,
          boxShadow:
            "0 1px 0 rgba(255,255,255,.85) inset, 0 30px 60px -28px rgba(21,23,28,.30), 0 12px 28px -12px rgba(21,23,28,.10)",
          backdropFilter: "blur(22px) saturate(150%)",
          WebkitBackdropFilter: "blur(22px) saturate(150%)",
          overflow: "hidden",
        }}
      >
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void start(fullBrief());
            }
          }}
          placeholder={placeholder}
          rows={3}
          disabled={busy}
          style={{
            width: "100%",
            border: 0,
            outline: "none",
            resize: "none",
            padding: "18px 22px 4px",
            minHeight: 56,
            fontFamily: "inherit",
            fontSize: 16,
            lineHeight: 1.5,
            color: HERO_INK,
            background: "transparent",
          }}
        />

        {showContext ? (
          <div style={{ padding: "0 26px 6px" }}>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              placeholder="Anything else that should shape it — the mistakes you keep seeing, what you covered last week, the coursebook point it follows."
              style={{
                width: "100%",
                border: `1px solid ${LINE}`,
                borderRadius: 10,
                outline: "none",
                resize: "vertical",
                padding: "10px 12px",
                fontFamily: "inherit",
                fontSize: 13.5,
                lineHeight: 1.5,
                color: MUTED,
                background: "#FBFAF8",
              }}
            />
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 12px 12px",
            borderTop: "1px solid rgba(21,23,28,.06)",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => setShowContext((v) => !v)}
            aria-expanded={showContext}
            title="Add context — what you've covered, what they keep getting wrong"
            className="pa-icon-btn"
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              borderColor: showContext ? "rgba(232,90,44,.4)" : "transparent",
              background: showContext ? "rgba(232,90,44,.08)" : "transparent",
              color: showContext ? EMBER : HERO_BODY,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setPlanFirst((v) => !v)}
            title={
              planFirst
                ? "On: I'll ask a couple of questions and show you the outline before writing"
                : "Off: go straight to writing the lesson"
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,.55)",
              border: `1px solid ${LINE}`,
              borderRadius: 999,
              padding: "6px 14px 6px 6px",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 500,
              color: HERO_BODY,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 30,
                height: 18,
                borderRadius: 999,
                background: planFirst ? EMBER : EMBER_OFF,
                position: "relative",
                transition: "background .15s",
                flex: "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: planFirst ? 14 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 2px rgba(0,0,0,.18)",
                  transition: "left .15s",
                }}
              />
            </span>
            Plan
            <span
              aria-hidden
              title="On: I ask a couple of questions and show the outline before writing"
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: `1.2px solid ${FAINT}`,
                color: FAINT,
                fontSize: 10,
                fontWeight: 600,
                display: "grid",
                placeItems: "center",
              }}
            >
              i
            </span>
          </button>

          {/* The explanation language used to be a lozenge here, next to the
              plan toggle, where it was one control among several and easy never
              to notice. It is now a question in the dialog, asked every time. */}

          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {canDictate ? (
              <button
                type="button"
                onClick={toggleDictation}
                aria-pressed={listening}
                title={listening ? "Stop dictating" : "Dictate your brief"}
                className="pa-icon-btn"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: listening ? "rgba(232,90,44,.12)" : "transparent",
                  color: listening ? EMBER : HERO_BODY,
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <MicIcon />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => void start(fullBrief())}
              disabled={busy || brief.trim() === ""}
              aria-label="Make this lesson"
              className="pa-send"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                border: 0,
                background: EMBER,
                color: "#fff",
                opacity: brief.trim() === "" ? 0.8 : 1,
                cursor: busy || brief.trim() === "" ? "default" : "pointer",
                display: "grid",
                placeItems: "center",
                boxShadow:
                  "0 1px 0 rgba(255,255,255,.3) inset, 0 10px 22px -8px rgba(232,90,44,.6)",
              }}
            >
              {busy ? (
                "…"
              ) : (
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M8 13V3m0 0L4 7m4-4l4 4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </span>
        </div>
      </div>

      {/* ── state ───────────────────────────────────────────────────────── */}
      {phase.step === "thinking" ? (
        <p style={{ fontSize: 14, color: MUTED, margin: 0 }} role="status">
          {phase.label}
        </p>
      ) : null}
      {phase.step === "error" ? (
        <p style={{ fontSize: 14, color: "#A63A30", margin: 0, maxWidth: 640, textAlign: "center" }} role="alert">
          {phase.message}
        </p>
      ) : null}

      {phase.step === "asking" ? (
        <SetupDialog
          questions={phase.questions}
          answers={answers}
          onAnswer={(id, value) => setAnswers((a) => ({ ...a, [id]: value }))}
          language={language}
          onLanguage={setLanguage}
          count={count}
          onCount={setCount}
          planFirst={planFirst}
          onCancel={() => setPhase({ step: "idle" })}
          onGo={guard(() => proceed(answers, phase.blueprint))}
          onSkip={guard(() => proceed({}, phase.blueprint))}
        />
      ) : null}

      {phase.step === "planned" ? (
        <div style={panel}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: FAINT }}>
              Here&apos;s the plan
            </div>
            <div style={{ fontSize: 19, fontWeight: 650, color: INK, marginTop: 5 }}>
              {String(phase.plan.title ?? "Lesson")}
            </div>
            {phase.plan.objective ? (
              <div style={{ fontSize: 13.5, color: MUTED, marginTop: 5 }}>{String(phase.plan.objective)}</div>
            ) : null}
            {phase.plan.level ? (
              <div style={{ fontSize: 12.5, color: FAINT, marginTop: 6 }}>Level {String(phase.plan.level)}</div>
            ) : null}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" onClick={guard(() => build(fullBrief(), phase.plan))} style={primaryButton}>
              Build it
            </button>
            <button type="button" onClick={() => setPhase({ step: "idle" })} style={ghostButton}>
              Start again
            </button>
          </div>
        </div>
      ) : null}

      {/* ── starters ──────────────────────────────────────────────────────
          Always on screen. They are the menu, not a first-run hint — the person
          most likely to want a lesson is the one who just made one. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, marginTop: 30 }}>
          <span
            style={{
              fontFamily: "var(--font-mono-data), ui-monospace, monospace",
              fontSize: 11,
              letterSpacing: ".2em",
              textTransform: "uppercase",
              color: MUTED,
            }}
          >
            Not sure where to start? Try one of these:
          </span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 760 }}>
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setBrief(s)}
                className="pa-chip"
                aria-pressed={brief.trim() === s}
                style={{
                  border: `1px solid ${brief.trim() === s ? "rgba(232,90,44,.45)" : LINE}`,
                  background: brief.trim() === s ? "rgba(232,90,44,.08)" : "rgba(255,255,255,.7)",
                  borderRadius: 999,
                  padding: "11px 22px",
                  fontFamily: "inherit",
                  fontSize: 14.5,
                  fontWeight: 500,
                  lineHeight: 1,
                  letterSpacing: "-.005em",
                  color: brief.trim() === s ? "#6B2810" : HERO_BODY,
                  cursor: "pointer",
                  backdropFilter: "blur(12px) saturate(150%)",
                  WebkitBackdropFilter: "blur(12px) saturate(150%)",
                  boxShadow:
                    "0 1px 0 rgba(255,255,255,.7) inset, 0 4px 12px -8px rgba(21,23,28,.16)",
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

/**
 * The dialog between pressing generate and paying for a lesson.
 *
 * Three kinds of question, deliberately in this order: what the model needs to
 * know about the TEACHING (it asks these, and only when they would change the
 * lesson), then the two the model may never decide — how many exercises, and
 * whether the hard part gets a note in the learner's own language.
 *
 * Everything is skippable. "Just build it" has to stay possible at every step,
 * so both buttons lead somewhere and neither is a dead end.
 */
function SetupDialog({
  questions,
  answers,
  onAnswer,
  language,
  onLanguage,
  count,
  onCount,
  planFirst,
  onCancel,
  onGo,
  onSkip,
}: {
  questions: Question[];
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  language: string;
  onLanguage: (v: string) => void;
  count: number;
  onCount: (n: number) => void;
  planFirst: boolean;
  onCancel: () => void;
  onGo: () => void;
  onSkip: () => void;
}) {
  return (
    <div
      role="presentation"
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(21,23,28,.34)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Before I write this lesson"
        // The backdrop closes; the sheet must not close when its own controls
        // are pressed, which is what a click inside it would otherwise do.
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "min(86vh, 760px)",
          overflowY: "auto",
          background: "#fff",
          border: `1px solid ${LINE}`,
          borderRadius: 20,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 22,
          textAlign: "left",
          boxShadow: "0 40px 80px -30px rgba(21,23,28,.45)",
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 650, color: INK }}>
            Before I write it
          </div>
          <div style={{ fontSize: 13.5, color: MUTED, marginTop: 4 }}>
            Skip anything and I&apos;ll choose sensibly.
          </div>
        </div>

        {questions.map((q) => (
          <Field key={q.id} label={q.label}>
            {q.options.map((opt) => (
              <Pill
                key={opt}
                on={answers[q.id] === opt}
                onClick={() => onAnswer(q.id, opt)}
              >
                {opt}
              </Pill>
            ))}
          </Field>
        ))}

        <Field
          label="How many exercises?"
          hint="Your call, not mine — it depends how long the class is."
        >
          {COUNT_CHOICES.map((c) => (
            <Pill key={c.value} on={count === c.value} onClick={() => onCount(c.value)}>
              {c.label}
              <span style={{ opacity: 0.62, marginLeft: 6, fontWeight: 400 }}>{c.hint}</span>
            </Pill>
          ))}
        </Field>

        <Field
          label="Explanations"
          // Said here because it is the one thing teachers get wrong about this
          // control: it is not "translate the lesson". A learner who reads the
          // rule only in Uzbek has practised nothing.
          hint="The lesson is always in English. A second language adds a short note per section, for the part your group actually finds hard."
        >
          {LANGUAGE_CHOICES.map((l) => (
            <Pill key={l.value} on={language === l.value} onClick={() => onLanguage(l.value)}>
              {l.label}
            </Pill>
          ))}
        </Field>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={onGo} style={primaryButton}>
            {planFirst ? "Continue" : "Write it"}
          </button>
          <button type="button" onClick={onSkip} style={ghostButton}>
            Skip — you decide
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{ ...ghostButton, border: 0, marginLeft: "auto", color: FAINT }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>{label}</span>
      {hint ? (
        <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5, marginTop: -3 }}>{hint}</span>
      ) : null}
      <span style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{children}</span>
    </div>
  );
}

function Pill({
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
      style={{
        border: `1px solid ${on ? EMBER : LINE}`,
        background: on ? "rgba(232,90,44,.08)" : "#fff",
        color: on ? "#6B2810" : INK,
        borderRadius: 999,
        padding: "8px 15px",
        fontFamily: "inherit",
        fontSize: 13,
        cursor: "pointer",
        fontWeight: on ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}

function MicIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4" />
    </svg>
  );
}

const panel: React.CSSProperties = {
  width: "100%",
  maxWidth: 720,
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 16,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  textAlign: "left",
};

const primaryButton: React.CSSProperties = {
  border: 0,
  borderRadius: 10,
  background: EMBER,
  color: "#fff",
  padding: "10px 18px",
  fontFamily: "inherit",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};

const ghostButton: React.CSSProperties = {
  border: `1px solid ${LINE}`,
  borderRadius: 10,
  background: "#fff",
  color: MUTED,
  padding: "10px 16px",
  fontFamily: "inherit",
  fontSize: 14,
  cursor: "pointer",
};
