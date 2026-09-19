"use client";

import { useT } from "@/components/i18n/locale-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Layers,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";

import { AiGenerateSection } from "@/components/ai-generate-section";
import { UpgradeNotice } from "@/components/billing/upgrade-notice";
import { LegalFooter } from "@/components/legal-footer";
import {
  CardAction,
  CardBody,
  CardFoot,
  CardHead,
  CardTags,
  PracticeCard,
  StatusPill,
  minutes,
  shortDate,
} from "@/components/practice/card";
import { levelChipForBand } from "@/lib/practice/levels";
import { READING_QUESTION_LABELS, type ReadingQuestionType } from "@/lib/reading/constants";
import { titleCase } from "@/lib/reading/titles";

import { AttachForm, PracticeModal } from "@/components/console/teacher-practice";

import { GeneratePassageButton, StartTestButton } from "./generate-button";
import {
  BRAND,
  BRAND_FILL,
  BRAND_LIGHT,
  BRAND_SOFT,
  CANVAS,
  PANEL,
  SLATE_BODY as MUTED,
  SLATE_INK as INK,
  SLATE_LINE,
  SLATE_MUTED,
} from "@/lib/theme/tokens";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";

/** A finished attempt, reduced to what the card's graded state draws. */
export interface Graded {
  /** Links the card's Review action straight at the stored feedback. */
  attemptId: string;
  band: number | null;
  correct: number;
  total: number;
  durationSeconds: number | null;
  at: string | null;
}

/** An attempt still open — the card's t("card.paused") state. */
export interface Live {
  /** Which passage was showing (1-based). Null on a single-passage run. */
  cursorIndex: number | null;
  secondsLeft: number | null;
  answered: number;
}

/** What every reading card carries, whichever shelf it came from. */
interface CardState {
  /** Composed from the test's passages — see lib/reading/titles.ts. */
  title: string;
  subtitle: string;
  graded?: Graded | null;
  live?: Live | null;
}

/** The learner's own freshly-generated test (opens directly). */
export interface TestCard extends CardState {
  id: string;
  targetBand: number | null;
  createdAt: string;
  /** 1-based number ("Reading test 3") in the order the learner generated them. */
  seq: number;
}

/** A shared, ready-to-start sample test (cloned into the learner's org on Start). */
export interface LibraryTest extends CardState {
  id: string;
  targetBand: number | null;
  /** Beyond the free shelf: shown with a Pro badge, and the route refuses it. */
  locked?: boolean;
}

/** A passage card — used for both library samples and the learner's own. */
export interface PassageCard {
  id: string;
  title: string;
  topic: string | null;
  difficulty: number | null;
  questionCount: number;
  types: ReadingQuestionType[];
  graded?: Graded | null;
  live?: Live | null;
  /** Beyond the free shelf: shown with a Pro badge, and the route refuses it. */
  locked?: boolean;
}

type Tab = "test" | "passage";

/**
 * The Reading hub body — a compact, tabbed chooser. One tab is the full 3-passage
 * exam, the other is single-passage practice. Each tab shows ready-to-start sample
 * content (the shared library) plus anything the learner has generated; every card
 * is just a "Start". Library cards clone into the learner's org on click. Client
 * component (tab state + clone-on-start).
 */
export function ReadingHub({
  levelBand,
  levelMeasured,
  libraryTests,
  ownTests,
  libraryPassages,
  ownPassages,
  isTeacher = false,
  groups = [],
  freeUsed = 0,
  freeLimit = null,
}: {
  levelBand: number | null;
  levelMeasured: boolean;
  libraryTests: LibraryTest[];
  ownTests: TestCard[];
  libraryPassages: PassageCard[];
  ownPassages: PassageCard[];
  /** Teachers get an Attach control under every card. */
  isTeacher?: boolean;
  groups?: { id: string; name: string }[];
  /** Ready-made practices opened, and the plan's allowance. null = the whole
   *  shelf (any paid plan, and every centre — they run unmetered). */
  freeUsed?: number;
  freeLimit?: number | null;
}) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("test");
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The card a teacher is setting to a class. Library ids are fine to pass
  // straight through: assignPractice clones a library test into the center's
  // own org before writing the assignment.
  const [attachId, setAttachId] = useState<string | null>(null);

  /** What a teacher's card needs to show its Attach action. Undefined for a
   *  student, which keeps their card exactly as it was: one big click target. */
  const attachFor = (id: string) =>
    isTeacher ? { onAttach: () => setAttachId(id), disabled: groups.length === 0 } : undefined;

  async function startLibrary(kind: Tab, id: string, num?: number) {
    if (loadingId) return;
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/reading/library/${kind}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok || !body.id) {
        setError(body.message ?? "Couldn't open this one — please try again.");
        setLoadingId(null);
        return;
      }
      // Carry the card's "Practice test N" number into the runner so the header
      // shows the same number the learner clicked.
      const suffix = num != null ? `?n=${num}` : "";
      router.push(kind === "test" ? `/read/test/${body.id}${suffix}` : `/read/${body.id}${suffix}`);
    } catch {
      setError("Network error — please try again.");
      setLoadingId(null);
    }
  }

  return (
    <div
      className="lp-hub-pad"
      style={{
        width: "100%",
        padding: "26px 24px 64px",
        fontFamily: SANS,
        color: INK,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: "clamp(28px,3.6vw,38px)",
              lineHeight: 1.05,
              letterSpacing: "-.4px",
              margin: 0,
            }}
          >
            Reading
          </h1>
          {/* <p style={{ fontSize: 15, lineHeight: 1.5, color: MUTED, margin: "6px 0 0" }}>
            Start a ready-made test in one click, or generate a fresh one — marked instantly, with
            the evidence behind every answer.
          </p> */}
        </div>
        {/* The free shelf, stated before anything is clicked. Listening carries
            the same counter in the same place — a learner should not have to
            learn two different rules for the same allowance. Absent entirely on
            a paid plan and in a centre, where the shelf has no bottom. */}
        {freeLimit != null ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "var(--hb-lav-bg)",
              border: "1px solid var(--hb-lav-line)",
              color: "var(--hb-lav-ink)",
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            <Lock size={13} /> Free practices: {Math.min(freeUsed, freeLimit)}/{freeLimit} used
          </span>
        ) : null}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            background: BRAND_SOFT,
            border: "1px solid rgba(125,1,50,.16)",
            color: BRAND,
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: BRAND_FILL }} />
          {levelBand != null
            ? `${levelMeasured ? "Your band" : "Target"} · ${levelBand.toFixed(1)}`
            : "Level not set"}
        </span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          background: CANVAS,
          border: `1px solid ${SLATE_LINE}`,
          borderRadius: 14,
          padding: 5,
          marginTop: 18,
          maxWidth: 520,
        }}
      >
        <TabButton
          active={tab === "test"}
          onClick={() => setTab("test")}
          icon={<Layers size={17} />}
          label={t("read.fullTest")}
          sub={t("read.fullTestMeta")}
        />
        <TabButton
          active={tab === "passage"}
          onClick={() => setTab("passage")}
          icon={<FileText size={17} />}
          label={t("read.passage")}
          sub={t("read.passageMeta")}
        />
      </div>

      {/* Panel */}
      {tab === "test" ? (
        <Panel
          title={t("read.fullTest")}
          blurb={t("read.fullTestBlurb")}
          action={<StartTestButton label={t("read.generateTest")} />}
        >
          {ownTests.length > 0 ? (
            <>
              <SectionLabel>{t("read.yourTests")}</SectionLabel>
              <Grid>
                {ownTests.map((t, i) => (
                  <TestTile
                    key={t.id}
                    seq={i + 1}
                    title={t.title}
                    subtitle={t.subtitle}
                    targetBand={t.targetBand}
                    createdAt={t.createdAt}
                    graded={t.graded}
                    live={t.live}
                    href={`/read/test/${t.id}?n=${i + 1}`}
                    attach={attachFor(t.id)}
                  />
                ))}
              </Grid>
            </>
          ) : null}

          {libraryTests.length > 0 ? (
            <>
              <SectionLabel>{t("read.ready")}</SectionLabel>
              <Grid>
                {libraryTests.map((t, i) => {
                  const num = ownTests.length + i + 1;
                  return (
                    <TestTile
                      key={t.id}
                      seq={num}
                      title={t.title}
                      subtitle={t.subtitle}
                      targetBand={t.targetBand}
                      graded={t.graded}
                      live={t.live}
                      onStart={() => void startLibrary("test", t.id, num)}
                      loading={loadingId === t.id}
                      attach={attachFor(t.id)}
                      locked={t.locked}
                    />
                  );
                })}
              </Grid>
            </>
          ) : null}

          {libraryTests.length === 0 && ownTests.length === 0 ? (
            <EmptyHint>
              No ready tests yet — generate one above. Each is 3 passages, marked over all 40
              questions.
            </EmptyHint>
          ) : null}
        </Panel>
      ) : (
        <Panel
          title={t("read.passage")}
          blurb={t("read.passageBlurb")}
          action={<GeneratePassageButton label={t("read.generatePassage")} />}
        >
          {ownPassages.length > 0 ? (
            <>
              <SectionLabel>{t("read.yourPassages")}</SectionLabel>
              <Grid>
                {ownPassages.map((p, i) => (
                  <PassageTile
                    key={p.id}
                    p={p}
                    seq={i + 1}
                    href={`/read/${p.id}?n=${i + 1}`}
                    attach={attachFor(p.id)}
                  />
                ))}
              </Grid>
            </>
          ) : null}

          {libraryPassages.length > 0 ? (
            <>
              <SectionLabel>{t("read.ready")}</SectionLabel>
              <Grid>
                {libraryPassages.map((p, i) => {
                  const num = ownPassages.length + i + 1;
                  return (
                    <PassageTile
                      key={p.id}
                      p={p}
                      seq={num}
                      onStart={() => void startLibrary("passage", p.id, num)}
                      loading={loadingId === p.id}
                      attach={attachFor(p.id)}
                    />
                  );
                })}
              </Grid>
            </>
          ) : null}

          {libraryPassages.length === 0 && ownPassages.length === 0 ? (
            <EmptyHint>{t("read.noPassages")}</EmptyHint>
          ) : null}
        </Panel>
      )}

      {error ? <UpgradeNotice message={error} /> : null}

      {attachId ? (
        <PracticeModal title={t("card.attachClass")} onClose={() => setAttachId(null)}>
          <AttachForm
            kind="reading"
            contentId={attachId}
            groups={groups}
            onDone={() => setAttachId(null)}
          />
        </PracticeModal>
      ) : null}

      <LegalFooter note={t("read.disclaimer")} />
    </div>
  );
}

// ---- Cards -----------------------------------------------------------------

/**
 * A full-test card, built from the shared kit in components/practice/card.tsx.
 *
 * FOUR STATES, in the order the card prefers them:
 *   graded    — a real band, the score, how long it took, and a Review action
 *   live      — an unfinished run: progress bar, what's left, Resume
 *   fresh     — the learner's own just-generated test, badged New
 *   target    — a library test nobody has opened: what band it's pitched at
 *
 * `href` opens directly (the learner already owns the row); `onStart` clones a
 * library row first. A teacher additionally gets Attach, which is now simply a
 * third pill in the footer rather than a reason to restructure the card — see
 * the note at the top of components/practice/card.tsx.
 */
function TestTile({
  seq,
  title,
  subtitle,
  targetBand,
  createdAt,
  graded,
  live,
  href,
  onStart,
  loading,
  locked,
  attach,
}: {
  seq: number;
  title: string;
  subtitle: string;
  targetBand: number | null;
  /** Own tests only — the date they were generated. */
  createdAt?: string;
  graded?: Graded | null;
  live?: Live | null;
  href?: string;
  onStart?: () => void;
  loading?: boolean;
  locked?: boolean;
  attach?: { onAttach: () => void; disabled: boolean };
}) {
  const t = useT();
  // A resumable run outranks a past result: the thing the learner left open is
  // more urgent than the thing they finished.
  const state = live ? "live" : graded ? "graded" : createdAt ? "fresh" : "target";
  const finished = state === "graded";
  return (
    <PracticeCard
      tone={locked || loading ? null : finished ? "done" : "brand"}
      surface={locked ? "locked" : finished ? "done" : "open"}
      // No opacity on a locked card any more: it faded the very content that
      // makes the plan worth buying. The PRO pill states the gate instead.
      style={{ opacity: loading ? 0.7 : 1 }}
    >
      <CardHead
        seq={seq}
        icon={<BookOpen size={12} strokeWidth={1.9} />}
        label="READING"
        level={levelChipForBand(targetBand)}
        dim={finished}
        pill={<TilePill state={state} graded={graded} locked={locked} />}
      />
      {/* Two lines for the title: it is the three passages' topics as a list
          (lib/reading/titles.ts), which one line cuts after the first topic at
          every width this grid produces. */}
      <CardBody
        title={title || `Practice test ${seq}`}
        titleLines={2}
        subtitle={subtitle || "3 passages · 40 questions"}
        progress={live ? testProgress(live) : undefined}
        dim={finished}
      />
      <CardFoot meta={testMeta({ state, graded, live, createdAt })}>
        {attach ? (
          <CardAction
            kind="attach"
            onClick={attach.onAttach}
            disabled={attach.disabled}
            title={attach.disabled ? "Create a class first" : undefined}
          >
            {t("card.attach")}
          </CardAction>
        ) : null}
        {/* ⚠️ ON A FINISHED CARD, REVIEW IS THE PRIMARY AND RETAKE IS NOT.
            Reading the feedback is what a learner does with work they have
            already done; sitting it again is the rarer choice. The primary is
            also last, so the order swaps with the emphasis. */}
        {graded && !live ? (
          <>
            <OpenAction
              href={href}
              onStart={onStart}
              loading={loading}
              kind="secondary"
              label={t("card.retake")}
            />
            <CardAction href={`/activities/reading/${graded.attemptId}`}>
              {t("card.review")}
            </CardAction>
          </>
        ) : (
          <OpenAction
            href={href}
            onStart={onStart}
            loading={loading}
            locked={locked}
            label={live ? "Resume" : "Start"}
          />
        )}
      </CardFoot>
    </PracticeCard>
  );
}

/** A passage card. Same anatomy; a passage is one text, so its subtitle is the
 *  topic and its question types keep the kit's tag row. */
function PassageTile({
  p,
  seq,
  href,
  onStart,
  loading,
  attach,
}: {
  p: PassageCard;
  seq: number;
  href?: string;
  onStart?: () => void;
  loading?: boolean;
  attach?: { onAttach: () => void; disabled: boolean };
}) {
  const t = useT();
  const { graded, live, locked } = p;
  const state = live ? "live" : graded ? "graded" : href ? "fresh" : "target";
  const finished = state === "graded";
  return (
    <PracticeCard
      tone={locked || loading ? null : finished ? "done" : "brand"}
      surface={locked ? "locked" : finished ? "done" : "open"}
      style={{ opacity: loading ? 0.7 : 1 }}
    >
      <CardHead
        seq={seq}
        icon={<FileText size={12} strokeWidth={1.9} />}
        label="READING"
        level={levelChipForBand(p.difficulty)}
        dim={finished}
        pill={<TilePill state={state} graded={graded} locked={locked} />}
      />
      {/* Passage titles are written long ("How the deep ocean floor was
          mapped"); they belong on the card in full, not ellipsised. */}
      <CardBody
        title={p.title}
        titleLines={2}
        // Same lowercase-fragment field the test title is composed from.
        subtitle={p.topic ? titleCase(p.topic) : "Academic Reading"}
        dim={finished}
        progress={
          live
            ? {
                pct: p.questionCount ? (live.answered / p.questionCount) * 100 : 0,
                label: `${live.answered} of ${p.questionCount}`,
              }
            : undefined
        }
      />
      {p.types.length ? (
        <CardTags tags={p.types.slice(0, 3).map((t) => READING_QUESTION_LABELS[t])} />
      ) : null}
      <CardFoot
        meta={
          graded && !live
            ? [
                `${graded.correct} of ${graded.total} correct`,
                minutes(graded.durationSeconds),
                shortDate(graded.at),
              ]
                .filter(Boolean)
                .join(" · ")
            : live
              ? `${live.answered} of ${p.questionCount} answered`
              : `${p.questionCount} questions · ~20 min`
        }
      >
        {attach ? (
          <CardAction
            kind="attach"
            onClick={attach.onAttach}
            disabled={attach.disabled}
            title={attach.disabled ? "Create a class first" : undefined}
          >
            {t("card.attach")}
          </CardAction>
        ) : null}
        {graded && !live ? (
          <>
            <OpenAction
              href={href}
              onStart={onStart}
              loading={loading}
              kind="secondary"
              label={t("card.retake")}
            />
            <CardAction href={`/activities/reading/${graded.attemptId}`}>
              {t("card.review")}
            </CardAction>
          </>
        ) : (
          <OpenAction
            href={href}
            onStart={onStart}
            loading={loading}
            locked={locked}
            label={live ? "Resume" : "Start"}
          />
        )}
      </CardFoot>
    </PracticeCard>
  );
}

/** The one action every card has: open it. A <Link> when the learner owns the
 *  row, a button when it still has to be cloned. */
function OpenAction({
  href,
  onStart,
  loading,
  locked,
  kind = "primary",
  label,
}: {
  href?: string;
  onStart?: () => void;
  loading?: boolean;
  locked?: boolean;
  /** "secondary" is a finished card's Retake, which yields the primary slot to
   *  Review. */
  kind?: "primary" | "secondary";
  label: string;
}) {
  const t = useT();
  // The arrow marks the action that moves you on; a secondary Retake is not it.
  const arrow = kind === "primary" ? <ArrowRight size={14} strokeWidth={2.4} /> : undefined;
  if (locked) {
    return (
      <CardAction onClick={onStart ?? (() => {})} icon={<Lock size={13} />}>
        {t("card.unlockPro")}
      </CardAction>
    );
  }
  if (href) {
    return (
      <CardAction href={href} kind={kind} icon={arrow}>
        {label}
      </CardAction>
    );
  }
  return (
    <CardAction
      onClick={onStart ?? (() => {})}
      disabled={loading}
      kind={kind}
      icon={loading ? <Loader2 className="animate-spin" size={14} /> : arrow}
    >
      {loading ? "Opening…" : label}
    </CardAction>
  );
}

/** Which status pill a card wears, given its state. */
function TilePill({
  state,
  graded,
  locked,
}: {
  state: "graded" | "live" | "fresh" | "target";
  graded?: Graded | null;
  locked?: boolean;
}) {
  const t = useT();
  /* The gate outranks every state: a locked card cannot be started, so what it
     scored or how far in it got is not the thing to say about it. */
  if (locked) {
    return (
      <StatusPill tone="locked" icon={<Lock size={9} strokeWidth={2.6} />}>
        Pro
      </StatusPill>
    );
  }
  if (state === "live") return <StatusPill tone="progress">{t("card.paused")}</StatusPill>;
  if (state === "graded" && graded) {
    return (
      <StatusPill tone="band" icon={<Check size={9} strokeWidth={3} />}>
        {graded.band != null ? `Band ${graded.band.toFixed(1)}` : "Marked"}
      </StatusPill>
    );
  }
  if (state === "fresh") {
    return (
      <StatusPill tone="new" icon={<Sparkles size={9} strokeWidth={2.2} />}>
        New
      </StatusPill>
    );
  }
  /* Nothing. The level used to live here, which meant it disappeared the moment
     the card had any state to report; it is a permanent chip in the head now. */
  return null;
}

/** A full test is three passages, so the bar tracks passages and the label says
 *  which one — the canvas's "Passage 2 of 3". Falls back to answered/40 when the
 *  runner saved no cursor. */
function testProgress(live: Live): { pct: number; label: string } {
  if (live.cursorIndex != null) {
    return {
      pct: (live.cursorIndex / TEST_PASSAGES) * 100,
      label: `Passage ${Math.min(live.cursorIndex, TEST_PASSAGES)} of ${TEST_PASSAGES}`,
    };
  }
  return {
    pct: (live.answered / TEST_QUESTIONS) * 100,
    label: `${live.answered} of ${TEST_QUESTIONS}`,
  };
}

/** The footer's left-hand line, which says something different in every state. */
function testMeta({
  state,
  graded,
  live,
  createdAt,
}: {
  state: "graded" | "live" | "fresh" | "target";
  graded?: Graded | null;
  live?: Live | null;
  createdAt?: string;
}): string {
  if (state === "live" && live) {
    return [
      `${live.answered} of ${TEST_QUESTIONS} answered`,
      live.secondsLeft != null ? `${Math.max(0, Math.round(live.secondsLeft / 60))} min left` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (state === "graded" && graded) {
    return [
      `${graded.correct} of ${graded.total || TEST_QUESTIONS} correct`,
      minutes(graded.durationSeconds),
      shortDate(graded.at),
    ]
      .filter(Boolean)
      .join(" · ");
  }
  if (state === "fresh" && createdAt) {
    return `3 passages · 40 questions · ${shortDate(createdAt)}`;
  }
  // A library test nobody has opened: what it IS, since there is nothing to report
  // about it yet. The band it is pitched at is already on the pill.
  return `${TEST_PASSAGES} passages · ${TEST_QUESTIONS} questions · 60 min`;
}

/** A full test's shape, which the progress label and meta line both count against. */
const TEST_PASSAGES = 3;
const TEST_QUESTIONS = 40;

// ---- Pieces ----------------------------------------------------------------

function TabButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        background: active ? PANEL : "transparent",
        color: active ? BRAND : MUTED,
        boxShadow: active ? "0 2px 8px -3px rgba(28,27,46,.28)" : "none",
        transition: "background .15s ease",
      }}
    >
      <span style={{ display: "flex", flex: "none", color: active ? BRAND : SLATE_MUTED }}>
        {icon}
      </span>
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <span style={{ fontFamily: SANS, fontWeight: active ? 700 : 600, fontSize: 14.5 }}>
          {label}
        </span>
        <span
          style={{
            fontFamily: SANS,
            fontSize: 12,
            color: active ? BRAND_LIGHT : SLATE_MUTED,
            marginTop: 2,
          }}
        >
          {sub}
        </span>
      </span>
    </button>
  );
}

function Panel({
  title,
  blurb,
  action,
  children,
}: {
  title: string;
  blurb: string;
  action: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <div style={{ marginTop: 18, marginBottom: 30 }}>
        <AiGenerateSection title={title} description={blurb} cta={action} />
      </div>
      {children}
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "26px 0 14px" }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INK }}>
        {children}
      </span>
      <span style={{ height: 1, flex: 1, background: "rgba(28,27,46,.1)" }} />
    </div>
  );
}

/**
 * Three cards to a row, dropping to two and then one as the shell narrows.
 *
 * ⚠️ INLINE, AND WITHOUT A MEDIA QUERY — deliberately, on both counts.
 * A `.pc-grid-3` class in globals.css was the first attempt and never reached the
 * running dev server: every other rule in that file was live, this one was not,
 * and the grid silently fell back to block-stacked full-width cards. Writing the
 * columns here removes the stylesheet from the question entirely.
 *
 * The cap is expressed in the track size rather than in breakpoints. Each track
 * is at least a THIRD of the row, so a fourth column can never fit; once a third
 * would be narrower than 280px the 280px floor wins instead and `auto-fit` drops
 * the row to two, then one. That is why there is no media query for an inline
 * style to outrank — the arithmetic is the breakpoint.
 *
 * 28px is the two 14px gaps between three columns; it has to match `gap` below.
 */
function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(max(280px, (100% - 28px) / 3), 1fr))",
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ marginTop: 18, fontSize: 13.5, color: SLATE_MUTED, fontFamily: SANS }}>
      {children}
    </p>
  );
}
