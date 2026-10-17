"use client";

import { useT } from "@/shared/components/i18n/locale-provider";
import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Headphones, Loader2, Lock, Sparkles } from "lucide-react";
import { AiGenerateButton, AiGenerateSection } from "@/shared/components/ai-generate-section";
import { UpgradeNotice } from "@/shared/components/billing/upgrade-notice";
import {
  CardAction,
  CardBody,
  CardFoot,
  CardHead,
  CardTags,
  clock,
  LevelLabel,
  PracticeCard,
  shortDate,
  StatusPill,
  Waveform,
} from "@/shared/components/practice/card";
import { groupByLevel, levelChipForLevel, levelSectionTitle } from "@/lib/practice/levels";
import { BRAND, INK, MUTED, SANS, SERIF, TINT } from "./theme";
import type { Catalogue, LibraryItem, LiveRun, MineItem } from "./types";
import { CANVAS, PANEL, SLATE_LINE, SLATE_MUTED, WHITE, withAlpha } from "@/lib/theme/tokens";

import { EmptyHint, Grid, SectionLabel, TabButton } from "./hub-pieces";
import { typeTagsFor } from "./qtype-tags";

export type HubTab = "tests" | "parts";

// ---- Hub (mirrors the Reading hub: two tabs, numbered cards) -------------------

export function Hub({
  tab,
  setTab,
  catalogue,
  mine,
  busy,
  error,
  onOpen,
  onOpenMine,
  onGenerate,
  onComposeTest,
  attachLibrary,
  attachMine,
}: {
  tab: HubTab;
  setTab: (t: HubTab) => void;
  catalogue: Catalogue | null;
  mine: MineItem[] | null;
  busy: string | null;
  error: string | null;
  onOpen: (item: LibraryItem) => void;
  onOpenMine: (id: string) => void;
  onGenerate: (difficulty: number) => void;
  /** A whole 4-part test, made to order. */
  onComposeTest: (difficulty: number) => void;
  /** Attach for a LIBRARY item — assignable as-is, it is already a
   *  listening_library row. */
  attachLibrary?: (id: string) => AttachSlot | undefined;
  /** Attach for a GENERATED item — needs the engine's promote step first. */
  attachMine?: (id: string) => AttachSlot | undefined;
}) {
  const t = useT();
  // Tab 1: FULL tests only (part 0). Tab 2: single-recording quick practices.
  const tests = useMemo(
    () =>
      (catalogue?.items ?? [])
        .filter((it) => it.part === 0)
        .sort((a, b) => (b.version ?? 1) - (a.version ?? 1) || a.difficulty - b.difficulty)
        .map((it, i) => ({ ...it, seq: i + 1 })),
    [catalogue],
  );
  /* ⚠️ A CHIP THAT SAYS THE SAME THING ON EVERY CARD IS NOISE, NOT INFORMATION.
     Every prompt in the engine's listening/tts.py asks for a British voice, so
     the accent chip read "BRITISH" on all 45 library items — a whole element in
     the busiest row of the card carrying nothing. Derived rather than hardcoded
     against a constant the other repo owns: the day a second accent is
     synthesised the chip comes back by itself, on exactly the cards that need
     it, with nothing to remember here. */
  const accentsVary = useMemo(() => {
    const seen = new Set((catalogue?.items ?? []).map((it) => it.accent).filter(Boolean));
    return seen.size > 1;
  }, [catalogue]);
  const quick = useMemo(
    () =>
      (catalogue?.items ?? [])
        .filter((it) => it.part > 0)
        .sort((a, b) => (b.version ?? 1) - (a.version ?? 1) || a.difficulty - b.difficulty)
        .map((it, i) => ({ ...it, seq: i + 1 })),
    [catalogue],
  );

  // "My practice N" — 1 = the first one the learner ever generated.
  const mineSeq = useMemo(() => {
    const list = mine ?? [];
    return list.map((it, i) => ({ ...it, seq: list.length - i }));
  }, [mine]);

  return (
    <div
      className="lp-hub-pad"
      style={{ width: "100%", padding: "26px 24px 64px", fontFamily: SANS, color: INK }}
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
              color: INK,
            }}
          >
            Listening
          </h1>
          {/* <p style={{ fontSize: 15, lineHeight: 1.5, color: MUTED, margin: "6px 0 0", maxWidth: 660 }}>
            Full 4-part practice tests with the real exam&rsquo;s framing — the announcer introduces
            each part, the audio plays once, and every answer is explained after grading.
          </p> */}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Link
            href="/listen/results"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: PANEL,
              border: "1px solid var(--ex-hub-pill-line)",
              color: INK,
              padding: "8px 14px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              whiteSpace: "nowrap",
              textDecoration: "none",
            }}
          >
            My results
            <ArrowRight size={14} />
          </Link>
          {catalogue ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 9,
                background: TINT,
                border: `1px solid ${withAlpha(BRAND, 16)}`,
                color: BRAND,
                padding: "8px 14px",
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
                whiteSpace: "nowrap",
              }}
            >
              <Headphones size={15} />
              {catalogue.plan_paid
                ? "Full library"
                : `Free: ${Math.min(catalogue.free_used, catalogue.free_limit)}/${catalogue.free_limit} used`}
            </span>
          ) : null}
        </div>
      </div>

      {/* Tabs — the same chooser as the Reading hub */}
      <div
        style={{
          display: "flex",
          gap: 6,
          background: CANVAS,
          border: `1px solid ${SLATE_LINE}`,
          borderRadius: 14,
          padding: 5,
          marginTop: 22,
          maxWidth: 520,
        }}
      >
        <TabButton
          active={tab === "tests"}
          onClick={() => setTab("tests")}
          icon={<Headphones size={17} />}
          label="Practice tests"
          sub="4 parts · 40 questions"
        />
        <TabButton
          active={tab === "parts"}
          onClick={() => setTab("parts")}
          icon={<Sparkles size={17} />}
          label="Quick practice"
          sub="1 recording · ~8 min"
        />
      </div>

      {error ? (
        <div style={{ marginTop: 18 }}>
          <UpgradeNotice message={error} />
        </div>
      ) : null}

      {tab === "tests" ? (
        <>
          <div style={{ marginTop: 18 }}>
            <AiGenerateSection
              title="Generate a full test"
              badge="AI Studio"
              description="All four parts, forty questions"
              cta={
                <GenerateCta
                  generating={busy === "compose"}
                  disabled={!!busy}
                  onGo={onComposeTest}
                />
              }
            />
          </div>
          {!catalogue ? (
            <p
              style={{
                marginTop: 30,
                fontSize: 14.5,
                color: MUTED,
                display: "flex",
                alignItems: "center",
                gap: 9,
              }}
            >
              <Loader2 className="animate-spin" size={16} /> Loading the practice tests…
            </p>
          ) : tests.length === 0 ? (
            <EmptyHint>
              No ready-made tests at your level yet — generate one above. Four parts, forty
              questions, about two and a half minutes.
            </EmptyHint>
          ) : (
            <div style={{ marginTop: 20 }}>
              {/* Listening stores the level outright, so no band mapping here. */}
              {groupByLevel(tests, (it) => it.difficulty).map(({ level, items }) => (
                <Fragment key={level ?? "mixed"}>
                  <LevelLabel>{levelSectionTitle(t, level)}</LevelLabel>
                  <Grid>
                    {items.map((it) => (
                      <TestCard
                        key={it.id}
                        it={it}
                        showAccent={accentsVary}
                        loading={busy === it.id}
                        disabled={!!busy}
                        onOpen={() => onOpen(it)}
                        attach={attachLibrary?.(it.id)}
                      />
                    ))}
                  </Grid>
                </Fragment>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ marginTop: 18 }}>
            <AiGenerateSection
              title="Generate a quick practice"
              badge="AI Studio"
              description="One recording, ten questions — the format is a surprise until the announcer speaks, so every practice trains a different listening question type. Recorded as studio audio at your chosen level in about two minutes, and saved to your account."
              cta={
                <GenerateCta generating={busy === "generate"} disabled={!!busy} onGo={onGenerate} />
              }
            />
          </div>

          {mineSeq.length > 0 ? (
            <>
              <SectionLabel>Your practices</SectionLabel>
              <Grid>
                {mineSeq.map((it) => (
                  <MineCard
                    key={it.id}
                    it={it}
                    loading={busy === `mine:${it.id}`}
                    disabled={!!busy}
                    onOpen={() => onOpenMine(it.id)}
                    attach={attachMine?.(it.id)}
                  />
                ))}
              </Grid>
            </>
          ) : mine != null ? (
            <EmptyHint>
              Nothing here yet — generate your first practice above. Every one you make is saved to
              your account and stays reopenable.
            </EmptyHint>
          ) : null}

          {quick.length > 0 ? (
            <>
              <SectionLabel>Ready-made quick practices</SectionLabel>
              {groupByLevel(quick, (it) => it.difficulty).map(({ level, items }) => (
                <Fragment key={level ?? "mixed"}>
                  <LevelLabel>{levelSectionTitle(t, level)}</LevelLabel>
                  <Grid>
                    {items.map((it) => (
                      <QuickCard
                        key={it.id}
                        it={it}
                        showAccent={accentsVary}
                        loading={busy === it.id}
                        disabled={!!busy}
                        onOpen={() => onOpen(it)}
                        attach={attachLibrary?.(it.id)}
                      />
                    ))}
                  </Grid>
                </Fragment>
              ))}
            </>
          ) : null}
        </>
      )}

      <p style={{ margin: "32px 0 0", fontSize: 13, color: SLATE_MUTED }}>
        Original audio and questions in the IELTS Listening format — not affiliated with or endorsed
        by IELTS®.
      </p>
    </div>
  );
}

/** Level picker + shimmer CTA for the aurora banner. The part is never chosen —
 *  the generator picks one at random, like walking into the real exam. */
function GenerateCta({
  generating,
  disabled,
  onGo,
}: {
  generating: boolean;
  disabled: boolean;
  onGo: (difficulty: number) => void;
}) {
  const [difficulty, setDifficulty] = useState(3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
      <div style={{ display: "flex", gap: 5 }}>
        {[1, 2, 3, 4, 5].map((lv) => {
          const on = lv === difficulty;
          return (
            <button
              key={lv}
              type="button"
              onClick={() => setDifficulty(lv)}
              disabled={generating}
              aria-pressed={on}
              style={{
                padding: "5px 10px",
                borderRadius: 8,
                border: on ? "1px solid rgba(255,255,255,.9)" : "1px solid rgba(255,255,255,.28)",
                background: on ? WHITE : "rgba(255,255,255,.12)",
                color: on ? BRAND : "rgba(255,255,255,.85)",
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 700,
                cursor: generating ? "default" : "pointer",
              }}
            >
              L{lv}
            </button>
          );
        })}
      </div>
      <AiGenerateButton
        label="Generate practice"
        busyLabel="Recording audio… ~2 min"
        busy={disabled}
        generating={generating}
        onClick={() => onGo(difficulty)}
        minWidth={230}
      />
    </div>
  );
}

/** What a teacher's card needs for its Attach action. */
type AttachSlot = { onAttach: () => void; disabled: boolean };

/**
 * A FULL 4-part test card ("Practice test N" — 40 questions), on the shared kit
 * in shared/components/practice/card.tsx.
 *
 * The canvas gives Listening a head of its own: two bordered chips (the skill,
 * then the accent the audio is actually in) where Reading and Writing carry a
 * single mono eyebrow. Its footer leads with a waveform before the running time.
 */
function TestCard({
  it,
  showAccent,
  loading,
  disabled,
  onOpen,
  attach,
}: {
  it: LibraryItem & { seq: number };
  showAccent: boolean;
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
  attach?: AttachSlot;
}) {
  return (
    <ListenCard
      it={it}
      showAccent={showAccent}
      title={`Practice test ${it.seq}`}
      subtitle="4 parts · 40 questions · band score"
      maxScore={40}
      questions={40}
      sections={4}
      loading={loading}
      disabled={disabled}
      onOpen={onOpen}
      attach={attach}
    />
  );
}

/** A ready-made single-recording practice ("Quick practice N"). */
function QuickCard({
  it,
  showAccent,
  loading,
  disabled,
  onOpen,
  attach,
}: {
  it: LibraryItem & { seq: number };
  showAccent: boolean;
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
  attach?: AttachSlot;
}) {
  return (
    <ListenCard
      it={it}
      showAccent={showAccent}
      title={`Quick practice ${it.seq}`}
      subtitle={it.topic || "Listening practice"}
      maxScore={10}
      questions={10}
      sections={1}
      tags={typeTagsFor(it.part, it.variant, it.layout)}
      loading={loading}
      disabled={disabled}
      onOpen={onOpen}
      attach={attach}
    />
  );
}

/**
 * The shared body of both library cards. A test and a quick practice differ only
 * in their title, how many questions they carry, and whether they show type tags.
 */
function ListenCard({
  it,
  showAccent,
  title,
  subtitle,
  maxScore,
  questions,
  sections,
  tags,
  loading,
  disabled,
  onOpen,
  attach,
}: {
  it: LibraryItem & { seq: number };
  /** Only when the library holds more than one accent — see accentsVary. */
  showAccent: boolean;
  title: string;
  subtitle: string;
  maxScore: number;
  questions: number;
  /** How many sections the recording has — 4 for a full test, 1 for a quick
   *  practice. Drives the canvas's "Section 2 of 4" on a paused card. */
  sections: number;
  tags?: string[];
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
  attach?: AttachSlot;
}) {
  const t = useT();
  const done = it.best_score != null;
  const length = clock(it.duration_seconds);
  // An unfinished run outranks a past score: the thing left open is the urgent one.
  const live = it.live ?? null;
  const state = live ? "live" : done ? "done" : "fresh";
  return (
    <PracticeCard
      tone={it.locked || loading || disabled ? null : state === "done" ? "done" : "brand"}
      surface={it.locked ? "locked" : state === "done" ? "done" : "open"}
      // No opacity on a locked card: it faded the topic and the level, which is
      // the material that sells the plan. The PRO pill states the gate instead.
      style={{ opacity: disabled && !loading ? 0.7 : 1 }}
    >
      <CardHead
        seq={it.seq}
        chips={[
          { icon: <Headphones size={12} strokeWidth={1.9} />, label: "LISTENING" },
          // Only when it distinguishes this card from the next one, and absent
          // rather than guessed if the engine did not say.
          ...(showAccent && it.accent ? [{ label: it.accent.toUpperCase() }] : []),
        ]}
        // Shown in every state now. It used to be the "target" status pill, so
        // it vanished as soon as the learner paused or finished the practice.
        // Same 1-5 scale reading is mapped onto — see lib/practice/levels.ts.
        level={levelChipForLevel(it.difficulty)}
        dim={state === "done"}
        pill={
          it.locked ? (
            <StatusPill tone="locked" icon={<Lock size={9} strokeWidth={2.6} />}>
              Pro
            </StatusPill>
          ) : state === "live" ? (
            <StatusPill tone="progress">Paused</StatusPill>
          ) : done ? (
            <StatusPill tone="band" icon={<Check size={9} strokeWidth={3} />}>
              {it.best_score}/{maxScore}
            </StatusPill>
          ) : null
        }
      />
      <CardBody
        title={title}
        subtitle={subtitle}
        dim={state === "done"}
        progress={live ? sectionProgress(live, sections) : undefined}
      />
      {tags?.length ? <CardTags tags={tags} /> : null}
      <CardFoot
        lead={state === "fresh" ? <Waveform /> : undefined}
        meta={
          live
            ? playedMeta(live, it.duration_seconds)
            : done
              ? `${it.best_score} of ${maxScore} correct${length ? ` · ${length}` : ""}`
              : [length, `${questions} questions`].filter(Boolean).join(" · ")
        }
      >
        {attach ? (
          <CardAction
            kind="attach"
            onClick={attach.onAttach}
            disabled={attach.disabled}
            title={attach.disabled ? "Create a class first" : undefined}
          >
            Attach
          </CardAction>
        ) : null}
        <OpenAction
          onOpen={onOpen}
          loading={loading}
          locked={it.locked}
          label={
            state === "live" ? t("listen.resume") : done ? t("card.retake") : t("common.start")
          }
        />
      </CardFoot>
    </PracticeCard>
  );
}

/** The canvas's "Section 2 of 4" for a full test. A quick practice is one
 *  recording, so it reports answers instead — there is no section to be on. */
function sectionProgress(live: LiveRun, sections: number): { pct: number; label: string } {
  const answered = live.answered ?? 0;
  if (sections > 1 && live.part_index != null) {
    // part_index is 0-based on the wire; the label is 1-based.
    const at = Math.min(live.part_index + 1, sections);
    return { pct: (at / sections) * 100, label: `Section ${at} of ${sections}` };
  }
  return { pct: Math.min(100, answered * 10), label: `${answered} answered` };
}

/** "11:38 of 30:12 played" — how far in they were when they stopped. Falls back
 *  to the answer count when the engine could not measure the recording. */
function playedMeta(live: LiveRun, total: number | null | undefined): string {
  const at = clock(live.elapsed_seconds);
  const whole = clock(total);
  if (at && whole) return `${at} of ${whole} played`;
  if (at) return `${at} played`;
  return `${live.answered ?? 0} answered`;
}

/** One of the learner's own AI-generated practices ("My practice N"). */
function MineCard({
  it,
  loading,
  disabled,
  onOpen,
  attach,
}: {
  it: MineItem & { seq: number };
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
  attach?: AttachSlot;
}) {
  const tags = typeTagsFor(it.part, it.variant, it.layout);
  return (
    <PracticeCard
      tone={loading || disabled ? null : "brand"}
      style={{ opacity: disabled && !loading ? 0.7 : 1 }}
    >
      <CardHead
        seq={it.seq}
        chips={[{ icon: <Headphones size={12} strokeWidth={1.9} />, label: "LISTENING" }]}
        pill={
          <StatusPill tone="new" icon={<Sparkles size={9} strokeWidth={2.2} />}>
            New
          </StatusPill>
        }
      />
      <CardBody title={`My practice ${it.seq}`} subtitle={it.topic || "Listening practice"} />
      {tags.length ? <CardTags tags={tags} /> : null}
      <CardFoot
        lead={<Waveform />}
        meta={
          it.created_at
            ? `Generated ${shortDate(it.created_at)} · Level ${it.difficulty}`
            : `Level ${it.difficulty}`
        }
      >
        {attach ? (
          <CardAction
            kind="attach"
            onClick={attach.onAttach}
            disabled={attach.disabled}
            title={attach.disabled ? "Create a class first" : undefined}
          >
            Attach
          </CardAction>
        ) : null}
        <OpenAction onOpen={onOpen} loading={loading} label="Start" />
      </CardFoot>
    </PracticeCard>
  );
}

/** Open a practice — always a button here, since every listening practice is
 *  opened through the engine rather than by following a link. */
function OpenAction({
  onOpen,
  loading,
  locked,
  label,
}: {
  onOpen: () => void;
  loading: boolean;
  locked?: boolean;
  label: string;
}) {
  const t = useT();
  if (locked) {
    return (
      <CardAction onClick={onOpen} icon={<Lock size={13} />}>
        {t("card.unlockPro")}
      </CardAction>
    );
  }
  return (
    <CardAction
      onClick={onOpen}
      disabled={loading}
      icon={
        loading ? (
          <Loader2 className="animate-spin" size={14} />
        ) : (
          <ArrowRight size={14} strokeWidth={2.4} />
        )
      }
    >
      {loading ? "Opening…" : label}
    </CardAction>
  );
}
