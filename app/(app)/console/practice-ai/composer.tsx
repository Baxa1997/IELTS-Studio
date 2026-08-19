"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

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
  SERIF,
  SOFT,
  TROUGH,
  TROUGH_DEEP,
} from "@/lib/lessons/theme";
import { createClient } from "@/lib/supabase/client";

/**
 * Type what your group needs; get a lesson page.
 *
 * THE BOX HOLDS THE BRIEF AND NOTHING ELSE. Level, focus, how many exercises
 * and whether the hard part gets a note in the learner's own language are all
 * behind the gear beside Plan, in a modal. They lived in a panel that expanded
 * inside this box, which pushed send off the bottom of a laptop screen the
 * moment it opened — the control you reach for next was the one it hid.
 *
 * What stays on the face is the three things that are about this press rather
 * than about the lesson: the settings door, whether to see the outline first,
 * and send.
 *
 * A starter chip FILLS THE BOX and stops. Send is the only thing that builds:
 * the point of putting a suggestion in the brief is that it can be edited
 * before anything is written.
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
  // Both carry the brief they were built from, rather than re-reading state a
  // step later. The box stays editable while the setup dialog is open, and a
  // lesson has to be built from the words that were actually sent to intake —
  // otherwise the plan describes one brief and the lesson answers another.
  | { step: "asking"; questions: Question[]; blueprint: string | null; brief: string }
  | { step: "planned"; plan: Plan; brief: string }
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
 *  and a full worksheet. These are shortcuts, not the choice — the box beside
 *  them takes any number, because how long a lesson is depends on how long the
 *  class is and a teacher is the only one who knows that. */
const COUNTS = [8, 12, 16, 20];
/** MIRRORS THE ENGINE'S OWN LIMITS (`lessons/blueprints.py`: MIN_EXERCISES 6,
 *  MAX_EXERCISES 30). Six is the fewest that can still be staged across
 *  controlled/semi-controlled/freer; past thirty nobody finishes and the answer
 *  keys get thin. Offering a number the engine will silently clamp is worse
 *  than not offering it — a teacher who types 40 and gets 30 back learns not to
 *  trust the field. */
const COUNT_MIN = 6;
const COUNT_MAX = 30;

/**
 * The kinds of exercise a teacher can ask for.
 *
 * MIRRORS `TYPE_STAGE` in the engine's `lessons/blueprints.py`, ids included —
 * a name that does not match there is silently dropped, so the two lists have
 * to be kept together. Labels are the learner-facing ones the runner already
 * uses, because a teacher choosing "Fill the gap" should see the same words on
 * the item their class gets.
 *
 * Grouped by what the kind is FOR, because that is the choice being made: a
 * teacher wants recognition work, or manipulation, or production, and picking
 * only from the first group is exactly how you end up with a set that drills
 * and never asks anyone to write anything.
 */
const EXERCISE_KINDS: { group: string; note: string; types: { value: string; label: string }[] }[] =
  [
    {
      group: "Recognise",
      note: "supported — the form is in front of them",
      types: [
        { value: "gap_fill", label: "Fill the gap" },
        { value: "mcq_single", label: "Choose one" },
        { value: "mcq_multi", label: "Choose several" },
        { value: "matching", label: "Match them up" },
      ],
    },
    {
      group: "Change",
      note: "where understanding shows",
      types: [
        { value: "transform", label: "Rewrite it" },
        { value: "error_correction", label: "Correct the mistake" },
        { value: "ordering", label: "Put in order" },
      ],
    },
    {
      group: "Produce",
      note: "the only proof they can use it",
      types: [
        { value: "short_answer", label: "Short answer" },
        { value: "write_sentence", label: "Write a sentence" },
        { value: "write_short_text", label: "Write a paragraph" },
      ],
    },
  ];

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
  const w = window as unknown as {
    SpeechRecognition?: SpeechCtor;
    webkitSpeechRecognition?: SpeechCtor;
  };
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
  const [planFirst, setPlanFirst] = useState(true);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [level, setLevel] = useState(AUTO);
  const [focus, setFocus] = useState(AUTO);
  const [count, setCount] = useState(12);
  const [language, setLanguage] = useState("en");
  /** Empty is "Auto" and means no constraint — the right default, because a
   *  teacher who has not thought about item kinds should get the full range
   *  rather than whatever a half-made selection implies. */
  const [kinds, setKinds] = useState<string[]>([]);
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
  const fullBrief = (override?: string) => {
    const body = (override ?? brief).trim();
    const notes = [
      level !== AUTO ? `Level: ${level}.` : null,
      focus !== AUTO
        ? `Focus on ${FOCUSES.find((f) => f.value === focus)?.label.toLowerCase()}.`
        : null,
    ].filter(Boolean);
    return notes.length > 0 ? `${body}\n\n${notes.join(" ")}` : body;
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
      const said = Array.from(
        { length: e.results.length },
        (_, i) => e.results[i][0].transcript,
      ).join(" ");
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
  async function start(override?: string) {
    const text = fullBrief(override);
    if (!text.trim() || busy) return;
    setAnswers({});
    setPhase({ step: "working", stage: 0, label: "Reading your brief…" });
    try {
      const intake = await callEngine<{
        status: string;
        questions?: Question[];
        blueprint?: string | null;
      }>("intake", { brief: text, language });

      // ALWAYS STOP HERE. It used to skip straight past when the engine had no
      // questions, on the reasoning that a modal whose only content is a
      // Continue button teaches people to dismiss modals. That was right while
      // the dialog held nothing else — it no longer does. The exercise count
      // lives here now, and it is the one spec a teacher changes on almost
      // every lesson, because it is how long their class is. Skipping the
      // dialog meant they only found out they had got twelve afterwards.
      const questions = intake.questions ?? [];
      setPhase({ step: "asking", questions, blueprint: intake.blueprint ?? null, brief: text });
    } catch (err) {
      setPhase({ step: "error", message: (err as Error).message });
    }
  }

  /** Leaving the questions: plan and show it, or go straight to writing. */
  async function proceed(
    given: Record<string, string>,
    blueprint: string | null,
    override?: string,
  ) {
    const text = fullBrief(override);
    setPhase({ step: "working", stage: 1, label: "Drafting the explanation…" });
    const plan = await callEngine<Plan>("plan", {
      brief: text,
      answers: given,
      blueprint: blueprint ?? (focus === AUTO ? null : focus),
      language,
      exercise_total: count,
      exercise_types: kinds,
    });
    if (planFirst) {
      setPhase({ step: "planned", plan, brief: text });
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
    language === "en" ? null : language === "uz" ? "+ Uzbek" : "+ Russian",
    kinds.length === 0 ? null : `${kinds.length} kind${kinds.length === 1 ? "" : "s"}`,
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 18px 18px",
            flexWrap: "wrap",
          }}
        >
          {/* SETTINGS, one press from the brief. The panel that used to sit
              under the box pushed the send button off the bottom of a laptop
              screen the moment it opened; a modal costs the same one press and
              takes no room until it is wanted. */}
          <button
            type="button"
            onClick={() => setSpecsOpen(true)}
            aria-label="Lesson settings"
            title="Level, focus, how many exercises, first-language support"
            className="pa-tap"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px 8px 13px",
              borderRadius: 999,
              border: 0,
              background: "#fff",
              color: BODY_INK,
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "inset 0 0 0 1px #e4e0d6",
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
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
                <svg
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
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
              {busy ? (
                <Spinner size={20} />
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5" />
                  <path d="M5 12l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── what came back ──────────────────────────────────────────────── */}
      {phase.step === "error" ? (
        <p
          style={{
            fontSize: 15,
            color: "#a63a30",
            margin: "18px 0 0",
            maxWidth: 640,
            textAlign: "center",
          }}
          role="alert"
        >
          {phase.message}
        </p>
      ) : null}

      {specsOpen ? (
        <SpecsModal
          level={level}
          setLevel={setLevel}
          focus={focus}
          setFocus={setFocus}
          count={count}
          setCount={setCount}
          language={language}
          setLanguage={setLanguage}
          kinds={kinds}
          setKinds={setKinds}
          onClose={() => setSpecsOpen(false)}
        />
      ) : null}

      {busy ? <Working stage={phase.stage} count={count} /> : null}

      {phase.step === "asking" ? (
        <SetupDialog
          questions={phase.questions}
          answers={answers}
          onAnswer={(id, value) => setAnswers((a) => ({ ...a, [id]: value }))}
          count={count}
          setCount={setCount}
          planFirst={planFirst}
          onCancel={() => setPhase({ step: "idle" })}
          onGo={guard(() => proceed(answers, phase.blueprint, phase.brief))}
          onSkip={guard(() => proceed({}, phase.blueprint, phase.brief))}
        />
      ) : null}

      {phase.step === "planned" ? (
        <PlanModal
          plan={phase.plan}
          count={count}
          onBuild={guard(() => build(phase.brief, phase.plan))}
          onCancel={() => setPhase({ step: "idle" })}
        />
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
          {STARTERS.map((s) => {
            const mine = brief.trim() === s;
            return (
              <button
                key={s}
                type="button"
                // A starter FILLS THE BOX and stops there. It is a suggestion,
                // not a command: the whole point of putting it in the brief is
                // that a teacher can add "for my Tuesday group, they keep
                // dropping the auxiliary" before anything is built. Send is the
                // only thing that starts a lesson.
                onClick={() => setBrief(s)}
                disabled={busy}
                aria-pressed={mine}
                className="pa-chip"
                style={{
                  padding: "13px 22px",
                  borderRadius: 999,
                  border: 0,
                  background: mine ? INK : "#fff",
                  color: mine ? PAPER : INK,
                  fontSize: 15,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.5 : 1,
                  boxShadow: "0 1px 2px rgba(20,35,46,.05), 0 8px 20px -14px rgba(20,35,46,.3)",
                }}
              >
                {s}
              </button>
            );
          })}
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

/**
 * A centred sheet over the whole window.
 *
 * PORTALLED TO `document.body`, and that is the whole point rather than a
 * detail. This composer sits inside the console's scrolling content area and
 * inside a hero that runs its own entrance animation — and an ancestor with a
 * transform makes `position: fixed` resolve against THAT box instead of the
 * viewport. The setup dialog was landing three-quarters of the way down the
 * page with its buttons below the fold for exactly that reason. Leaving the
 * tree removes the whole class of bug.
 *
 * `100dvh` rather than `vh`: on iOS Safari the address bar makes `vh` taller
 * than what you can actually see, which puts the last button under it.
 */
function Overlay({
  onClose,
  label,
  children,
}: {
  onClose?: () => void;
  label: string;
  children: React.ReactNode;
}) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="presentation"
      onClick={onClose}
      className="pa-slide"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(20,35,46,0.42)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "grid",
        placeItems: "center",
        padding: 20,
        overflow: "auto",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        // The backdrop closes; the sheet must not close when its own controls
        // are pressed, which is what a click inside it would otherwise do.
        onClick={(e) => e.stopPropagation()}
        className="pa-pop"
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "calc(100dvh - 40px)",
          overflowY: "auto",
          background: PAPER,
          borderRadius: 30,
          padding: "30px 30px 28px",
          textAlign: "left",
          boxShadow: "0 40px 80px -30px rgba(20,35,46,.6)",
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** A ring that turns. Inline SVG rather than a border trick so it keeps its
 *  weight at 15px on a chip and at 20px in the send button. */
function Spinner({ size = 18 }: { size?: number }) {
  return (
    <svg
      className="pa-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ flex: "none" }}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" opacity=".25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * The wait, centred.
 *
 * FOUR NAMED STEPS rather than one spinner, because a full build takes about a
 * minute and a minute of "…" is indistinguishable from a minute of nothing.
 * Naming them also sets the right expectation: a teacher who reads "Writing 16
 * exercises" understands why this is not instant, and stops pressing things.
 *
 * It takes the window on purpose. The old version was a 5px bar tucked under
 * the box, which on a laptop was below the fold the moment the specs panel was
 * open — so the answer to "did that work?" was off screen.
 */
function Working({ stage, count }: { stage: number; count: number }) {
  const steps = [
    "Reading the brief",
    "Drafting the explanation",
    `Writing ${count} exercises`,
    "Checking every answer key",
  ];
  return (
    <Overlay label="Writing your lesson">
      <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
        <span
          style={{
            display: "inline-grid",
            placeItems: "center",
            width: 64,
            height: 64,
            borderRadius: 999,
            background: "rgba(236,106,69,.1)",
            color: EMBER,
          }}
        >
          <Spinner size={30} />
        </span>
        <h2
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: 32,
            letterSpacing: "-.02em",
            color: INK,
            margin: "18px 0 6px",
          }}
        >
          Writing your lesson
        </h2>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 24px", lineHeight: 1.55 }}>
          About a minute. You can leave this open.
        </p>
      </div>

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

      <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
        {steps.map((label, i) => {
          const done = stage > i;
          const active = stage === i;
          return (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: 11, fontSize: 15 }}
            >
              <span
                aria-hidden
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 999,
                  flex: "none",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#fff",
                  background: done ? GOOD_INK : active ? EMBER : "#dcd8cf",
                }}
              >
                {done ? "✓" : ""}
              </span>
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
    </Overlay>
  );
}

/**
 * The outline, before a word of the lesson is written.
 *
 * A MODAL rather than a card below the box. This is a decision point — build it
 * or start again — and the old inline card left both buttons under the fold on
 * a laptop while the page carried on looking idle behind them.
 */
function PlanModal({
  plan,
  count,
  onBuild,
  onCancel,
}: {
  plan: Plan;
  count: number;
  onBuild: () => void;
  onCancel: () => void;
}) {
  return (
    <Overlay label="Here's the plan" onClose={onCancel}>
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
      <h2
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 30,
          lineHeight: 1.15,
          letterSpacing: "-.02em",
          color: INK,
          margin: "10px 0 0",
          textWrap: "balance",
        }}
      >
        {String(plan.title ?? "Lesson")}
      </h2>
      {plan.objective ? (
        <p style={{ fontSize: 15.5, lineHeight: 1.6, color: MUTED, margin: "10px 0 0" }}>
          {String(plan.objective)}
        </p>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 16 }}>
        {[plan.level ? `Level ${String(plan.level)}` : null, `${count} exercises`]
          .filter(Boolean)
          .map((t) => (
            <span
              key={String(t)}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                background: TROUGH,
                fontSize: 13,
                color: MUTED,
              }}
            >
              {t}
            </span>
          ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
        <button type="button" onClick={onBuild} className="pa-ember" style={emberPill}>
          Build it
        </button>
        <button type="button" onClick={onCancel} className="pa-ghost" style={ghostPill}>
          Start again
        </button>
      </div>
    </Overlay>
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

/**
 * The settings, on demand.
 *
 * Opened by the gear beside Plan, closed by Done, Escape or the backdrop. It is
 * a modal rather than a panel because the panel it replaces expanded INSIDE the
 * composer and pushed send off the bottom of a laptop screen — the control you
 * reach for next was the one it hid.
 */
function SpecsModal({
  onClose,
  ...spec
}: React.ComponentProps<typeof Specs> & { onClose: () => void }) {
  return (
    <Overlay label="Lesson settings" onClose={onClose}>
      <h2
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: "-.02em",
          color: INK,
          margin: 0,
        }}
      >
        Settings
      </h2>
      <p style={{ fontSize: 15, color: MUTED, margin: "6px 0 22px", lineHeight: 1.55 }}>
        Anything left on Auto, I&apos;ll choose from your brief.
      </p>

      <Specs {...spec} />

      <div style={{ display: "flex", marginTop: 24 }}>
        <button type="button" onClick={onClose} className="pa-ember" style={emberPill}>
          Done
        </button>
      </div>
    </Overlay>
  );
}

/**
 * Every setting that shapes the lesson, in one place.
 *
 * ONE COMPONENT, TWO SURFACES: the panel under the composer and the setup
 * dialog. They used to be different — the dialog asked only what the engine
 * wanted to know, so a teacher who opened it had no way to change the level
 * they had picked a moment earlier without dismissing it first. Rendering the
 * same rows in both means the answer to "where do I change this?" is "wherever
 * you are", and there is no second copy to drift.
 */
function Specs({
  level,
  setLevel,
  focus,
  setFocus,
  count,
  setCount,
  language,
  setLanguage,
  kinds,
  setKinds,
}: {
  level: string;
  setLevel: (v: string) => void;
  focus: string;
  setFocus: (v: string) => void;
  count: number;
  setCount: (fn: (c: number) => number) => void;
  language: string;
  setLanguage: (v: string) => void;
  kinds: string[];
  setKinds: (fn: (k: string[]) => string[]) => void;
}) {
  const toggle = (value: string) =>
    setKinds((k) => (k.includes(value) ? k.filter((x) => x !== value) : [...k, value]));

  return (
    <div style={{ display: "grid", gap: 14 }}>
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
      <SpecRow
        label="Items"
        hint={`How many exercises to write, split across the three stages. Anything from ${COUNT_MIN} to ${COUNT_MAX}.`}
      >
        {COUNTS.map((c) => (
          <SpecChip key={c} on={count === c} onClick={() => setCount(() => c)}>
            {c}
          </SpecChip>
        ))}
        <ItemCount count={count} setCount={setCount} />
      </SpecRow>
      {/* AUTO IS A REAL CHOICE, not an empty state, so it gets its own chip —
          otherwise "none selected" and "all selected" look identical and a
          teacher cannot tell whether their selection took. */}
      <SpecRow
        label="Question kinds"
        hint="Leave it on Auto for a mix. Choosing only recognition kinds means nobody writes anything."
      >
        <SpecChip on={kinds.length === 0} onClick={() => setKinds(() => [])}>
          Auto
        </SpecChip>
      </SpecRow>
      {EXERCISE_KINDS.map((group) => (
        <SpecRow key={group.group} label={group.group} hint={group.note}>
          {group.types.map((t) => (
            <SpecChip key={t.value} on={kinds.includes(t.value)} onClick={() => toggle(t.value)}>
              {t.label}
            </SpecChip>
          ))}
        </SpecRow>
      ))}
      {/* Said here because it is the one thing teachers get wrong about this
          control: it is not "translate the lesson". A learner who reads the
          rule only in Uzbek has practised nothing. */}
      <SpecRow
        label="Support"
        hint="The lesson stays in English — this adds a short note per section."
      >
        {LANGUAGES.map((l) => (
          <SpecChip key={l.value} on={language === l.value} onClick={() => setLanguage(l.value)}>
            {l.label}
          </SpecChip>
        ))}
      </SpecRow>
    </div>
  );
}

/**
 * Any number, beside the four presets.
 *
 * The presets cover the common cases; this covers the class that needs
 * fourteen. It lives INSIDE the Items row rather than loose on the composer's
 * face, so every setting is in one panel instead of one being singled out.
 */
function ItemCount({
  count,
  setCount,
}: {
  count: number;
  setCount: (fn: (c: number) => number) => void;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: 4,
        borderRadius: 999,
        background: "#fff",
        boxShadow: "inset 0 0 0 1px #e4e0d6",
      }}
    >
      <Step label="Fewer exercises" onClick={() => setCount((c) => Math.max(COUNT_MIN, c - 1))}>
        −
      </Step>
      <input
        type="number"
        min={COUNT_MIN}
        max={COUNT_MAX}
        value={count}
        aria-label="How many exercises"
        onChange={(e) => setCount(() => Number(e.target.value))}
        onBlur={(e) =>
          setCount(() => Math.max(COUNT_MIN, Math.min(COUNT_MAX, Number(e.target.value) || 12)))
        }
        style={{
          width: 34,
          border: 0,
          outline: "none",
          background: "transparent",
          fontFamily: "inherit",
          fontSize: 15,
          fontWeight: 700,
          color: INK,
          textAlign: "center",
          padding: 0,
        }}
      />
      <Step label="More exercises" onClick={() => setCount((c) => Math.min(COUNT_MAX, c + 1))}>
        +
      </Step>
      <span style={{ fontSize: 13.5, color: SOFT, padding: "0 10px 0 4px" }}>or type it</span>
    </span>
  );
}

/** One end of the items stepper. A real button, so the count is reachable by
 *  tap and by keyboard without typing into a number field. */
function Step({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="pa-icon-btn"
      style={{
        width: 28,
        height: 28,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        background: "transparent",
        color: BODY_INK,
        fontFamily: "inherit",
        fontSize: 17,
        lineHeight: 1,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
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
 * Opens only when a model genuinely could not tell what a teacher meant, which
 * is the one case where interrupting them is worth it. The settings are not
 * here — they have their own door on the composer — so this never appears with
 * nothing in it but a Continue button. Everything stays skippable: "just build
 * it" has to remain possible at every step.
 */
function SetupDialog({
  questions,
  answers,
  onAnswer,
  count,
  setCount,
  planFirst,
  onCancel,
  onGo,
  onSkip,
}: {
  questions: Question[];
  answers: Record<string, string>;
  onAnswer: (id: string, value: string) => void;
  count: number;
  setCount: (fn: (c: number) => number) => void;
  planFirst: boolean;
  onCancel: () => void;
  onGo: () => void;
  onSkip: () => void;
}) {
  return (
    <Overlay label="Before I write this lesson" onClose={onCancel}>
      <h2
        style={{
          fontFamily: SERIF,
          fontWeight: 600,
          fontSize: 30,
          letterSpacing: "-.02em",
          color: INK,
          margin: 0,
        }}
      >
        One thing first
      </h2>
      <p style={{ fontSize: 15, color: MUTED, margin: "6px 0 0", lineHeight: 1.55 }}>
        Skip anything and I&apos;ll choose sensibly.
      </p>

      <div style={{ display: "grid", gap: 22, margin: "24px 0" }}>
        {questions.map((q) => (
          <div key={q.id} style={{ display: "grid", gap: 10 }}>
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

        {/* HOW MANY, on the way in.
            This lives in Settings too, but Settings is a door you have to know
            to open — and the count is the one spec a teacher changes on almost
            every lesson, because it is how long their class is. Asking here, in
            the dialog they are already looking at, is the difference between a
            teacher setting it and a teacher discovering afterwards that they
            got twelve. */}
        <div style={{ display: "grid", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: INK }}>How many exercises?</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <ItemCount count={count} setCount={setCount} />
          </div>
        </div>
      </div>

      {/* Sticks to the bottom of the sheet, so a long list of questions can
          scroll past without taking the answer with it. */}
      <div
        style={{
          position: "sticky",
          bottom: -28,
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          padding: "14px 0 2px",
          background: PAPER,
        }}
      >
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
    </Overlay>
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
