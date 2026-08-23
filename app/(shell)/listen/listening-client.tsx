"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Headphones, Loader2, Lock, RotateCcw, Sparkles, X } from "lucide-react";

import { AiGenerateButton, AiGenerateSection } from "@/components/ai-generate-section";
import { UpgradeNotice } from "@/components/billing/upgrade-notice";
import { engineClient } from "@/lib/engine/client";
import { AttachForm, PracticeModal } from "@/components/console/teacher-practice";

import { FlagButton, NumChip } from "./question-ui";
import { TRAP_EXPLAIN } from "./trap-explain";

/**
 * The map renderer is 750 lines of SVG cartography that only tests containing a
 * map question ever draw. Loading it on demand keeps it out of every other
 * listening practice's bundle. `ssr: false` because it renders nothing useful
 * without the learner's answers anyway, and the fallback holds the panel's
 * height so the page does not jump when it arrives.
 */
const MapPanel = dynamic(() => import("./map-panel").then((m) => m.MapPanel), {
  ssr: false,
  loading: () => (
    <div
      className="lp-skel"
      style={{ height: 360, borderRadius: 12 }}
      role="status"
      aria-label="Loading map"
    />
  ),
});
import {
  AudioStrip,
  ExamClock,
  ReplayList,
  segSecs,
  splitAudioByPart,
  useSegmentPlayer,
} from "./player";
import { BAD, GOOD, INDIGO, INK, MUTED, PART_GENRE, RUN, SANS, SERIF, TINT } from "./theme";
import type {
  Catalogue,
  ClusterView,
  FlowChartView,
  FormRow,
  Grade,
  GroupType,
  GroupView,
  LibraryItem,
  MapView,
  MatchingView,
  McqView,
  MineItem,
  NoteSection,
  PartView,
  QCtx,
  QResult,
  RenderView,
  Source,
  TableView,
} from "./types";

/** Every engine call on this screen goes to the engine's `listening` namespace. */
const callEngine = engineClient("listening");

/**
 * Listening hub + runner, backed by the SHARED practice library: practices are
 * pre-generated on the engine (script + narrator-framed TTS audio, difficulty
 * 1–5) and open instantly for every learner. Free plan unlocks 5 practices;
 * paid plans get the whole library (enforced server-side — the engine returns
 * 429 with an upgrade message past the limit). The runner plays the audio once
 * with countdown reading pauses (pause allowed for practice, no seeking),
 * grades by id server-side, and reveals the transcript + trap mechanisms.
 */

// ---- Engine call -----------------------------------------------------------

// TRAP_EXPLAIN lives in ./trap-explain — shared with the results pages.

/** Question-type tags per part format (the quick-practice cards show these
 *  instead of part numbers — a practice is just "a practice"). A part rotates
 *  through variant layouts, so the tags follow the item's stored `variant`. */
const QTYPE_TAGS: Record<number, string[]> = {
  1: ["Form completion"],
  2: ["Multiple choice", "Matching"],
  3: ["Multiple choice", "Matching"],
  4: ["Note completion"],
};
const QTYPE_TAGS_BY_VARIANT: Record<string, string[]> = {
  table: ["Table completion"],
  flowchart: ["Multiple choice", "Flow-chart completion"],
};
/** v2 (group-based) items carry a `layout` id instead of a `variant`; map it to
 *  the question-type tags so a map / flow-chart / sentence item is identifiable. */
const QTYPE_TAGS_BY_LAYOUT: Record<string, string[]> = {
  form10: ["Form completion"],
  notes10: ["Note completion"],
  table10: ["Table completion"],
  sentence10: ["Sentence completion"],
  "table6-notes4": ["Table completion", "Note completion"],
  "mcq6-map4": ["Multiple choice", "Map labelling"],
  "match5-map5": ["Matching", "Map labelling"],
  "two4-map6": ["Multiple choice", "Map labelling"],
  "mcq4-match6": ["Multiple choice", "Matching"],
  "two4-match6": ["Multiple choice", "Matching"],
  "mcq6-match4": ["Multiple choice", "Matching"],
  "match6-mcq4": ["Matching", "Multiple choice"],
  "match5-mcq5": ["Matching", "Multiple choice"],
  "mcq3-match7": ["Multiple choice", "Matching"],
  "mcq5-flow5": ["Multiple choice", "Flow-chart completion"],
  "two4-mcq6": ["Multiple choice"],
  "two6-mcq4": ["Multiple choice"],
  "mcq6-two4": ["Multiple choice"],
};
function typeTagsFor(part: number, variant?: string, layout?: string): string[] {
  if (layout && QTYPE_TAGS_BY_LAYOUT[layout]) return QTYPE_TAGS_BY_LAYOUT[layout];
  return (variant && QTYPE_TAGS_BY_VARIANT[variant]) || QTYPE_TAGS[part] || [];
}

type HubTab = "tests" | "parts";

const LEVEL_STYLE: Record<number, { bg: string; fg: string; ring: string }> = {
  1: { bg: "#16a34a", fg: "#ffffff", ring: "rgba(22,163,74,.30)" },
  2: { bg: "#0891b2", fg: "#ffffff", ring: "rgba(8,145,178,.30)" },
  3: { bg: "#4f46e5", fg: "#ffffff", ring: "rgba(79,70,229,.30)" },
  4: { bg: "#d97706", fg: "#ffffff", ring: "rgba(217,119,6,.30)" },
  5: { bg: "#dc2626", fg: "#ffffff", ring: "rgba(220,38,38,.30)" },
};

// ---- Top-level ---------------------------------------------------------------

export function ListeningClient({
  initialLibraryId,
  isTeacher = false,
  groups = [],
}: {
  initialLibraryId?: string;
  /** Teachers get the practice bench: a generated item lands as a card with
   *  Start and Attach, instead of dropping them straight into the runner. */
  isTeacher?: boolean;
  groups?: { id: string; name: string }[];
}) {
  // Opening a library practice writes its id into the URL. Two things need
  // that: a teacher's "set this to a class" control (server-rendered from the
  // query string), and a student following an assignment link straight to the
  // practice they were set.
  const router = useRouter();
  const [tab, setTab] = useState<HubTab>("tests");
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [mine, setMine] = useState<MineItem[] | null>(null);
  const [view, setView] = useState<RenderView | null>(null);
  const [source, setSource] = useState<Source>("library");
  const [busy, setBusy] = useState<string | null>(null); // library id | "mine:<id>" | "generate"
  // A teacher's freshly generated item, held here rather than opened. `libraryId`
  // fills in once it has been promoted, which is what makes it assignable.
  const [fresh, setFresh] = useState<RenderView | null>(null);
  const [attachId, setAttachId] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    callEngine<Catalogue>("library", {})
      .then((c) => {
        if (alive) setCatalogue(c);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not load the library.");
      });
    callEngine<{ items: MineItem[] }>("list", {})
      .then((r) => {
        if (alive) setMine(r.items ?? []);
      })
      .catch(() => {
        if (alive) setMine([]);
      });
    return () => {
      alive = false;
    };
  }, [view]); // refresh progress after exiting a practice

  const open = useCallback(
    async (item: LibraryItem) => {
      if (item.locked) {
        setError(
          "You’ve used all 5 free practice unlocks for Listening — upgrade to Pro to open the full library.",
        );
        return;
      }
      setBusy(item.id);
      setError(null);
      try {
        setSource("library");
        setView(await callEngine<RenderView>("library/render", { library_id: item.id }));
        router.replace(`/listen?item=${item.id}`, { scroll: false });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not open this practice.");
      } finally {
        setBusy(null);
      }
    },
    [router],
  );

  // /listen?item=<library id> — how an assignment deep-links to the exact
  // practice a class was set. Runs once; after that the hub behaves normally.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (!initialLibraryId || autoOpened.current) return;
    autoOpened.current = true;
    let alive = true;
    setBusy(initialLibraryId);
    setSource("library");
    callEngine<RenderView>("library/render", { library_id: initialLibraryId })
      .then((v) => {
        if (alive) setView(v);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : "Could not open this practice.");
      })
      .finally(() => {
        if (alive) setBusy(null);
      });
    return () => {
      alive = false;
    };
  }, [initialLibraryId]);

  const openMine = useCallback(async (id: string) => {
    setBusy(`mine:${id}`);
    setError(null);
    try {
      setSource("mine");
      setView(await callEngine<RenderView>("render", { item_id: id }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open this practice.");
    } finally {
      setBusy(null);
    }
  }, []);

  /**
   * A whole 4-part test, on demand.
   *
   * The catalogue's full tests were all seeded offline months ago — there was
   * no way to ask for a fresh one, so a learner who had sat the six at their
   * level had nothing left. Same engine call the seeding scripts make, now
   * behind the same gate as the quick practice.
   *
   * ONE GENERATION, not four. Measured at ~2.4 minutes end to end: the four
   * parts compose in parallel, so 40 questions cost barely more wall-clock
   * than the slowest single part (139s of 143s). That is why this is a button
   * you wait on rather than a job you come back to — it is the same wait the
   * quick practice already asks for.
   */
  const composeTest = useCallback(
    async (difficulty: number) => {
      setBusy("compose");
      setError(null);
      try {
        setSource("mine");
        const v = await callEngine<RenderView>("compose", { difficulty });
        if (isTeacher) setFresh(v);
        else setView(v);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Generation failed — please try again.");
      } finally {
        setBusy(null);
      }
    },
    [isTeacher],
  );

  const generate = useCallback(
    async (difficulty: number) => {
      setBusy("generate");
      setError(null);
      try {
        setSource("mine");
        // No part is sent — the engine draws a random format, like the real exam.
        const v = await callEngine<RenderView>("generate", { difficulty });
        // A learner generated this to sit it, so open it. A teacher generated it
        // to look at and set, so it becomes a card instead.
        if (isTeacher) setFresh(v);
        else setView(v);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Generation failed — please try again.");
      } finally {
        setBusy(null);
      }
    },
    [isTeacher],
  );

  /**
   * Make a generated item assignable. It lives in `listening_items` (this org),
   * but an assignment references `listening_library` — so the engine clones it
   * into the center's own library first. See docs/engine-changes-2026-08-09.md;
   * until that endpoint ships this surfaces the engine's error rather than
   * pretending the attach worked.
   */
  const promoteThenAttach = useCallback(
    async (itemId: string) => {
      if (attaching) return;
      setAttaching(true);
      setError(null);
      try {
        const { library_id } = await callEngine<{ library_id: string }>("promote", {
          item_id: itemId,
        });
        setAttachId(library_id);
      } catch (e) {
        setError(
          e instanceof Error
            ? `Couldn't prepare this for a class: ${e.message}`
            : "Couldn't prepare this for a class.",
        );
      } finally {
        setAttaching(false);
      }
    },
    [attaching],
  );

  if (view) return <Runner view={view} source={source} onExit={() => setView(null)} />;
  return (
    <>
      {fresh ? (
        <FreshPractice
          view={fresh}
          canAttach={groups.length > 0}
          attaching={attaching}
          onStart={() => {
            setSource("mine");
            setView(fresh);
          }}
          onAttach={() => void promoteThenAttach(fresh.id)}
          onDismiss={() => setFresh(null)}
        />
      ) : null}
      {attachId ? (
        <PracticeModal title="Attach to a class" onClose={() => setAttachId(null)}>
          <AttachForm
            kind="listening"
            contentId={attachId}
            groups={groups}
            onDone={() => setAttachId(null)}
          />
        </PracticeModal>
      ) : null}
      <Hub
        tab={tab}
        setTab={setTab}
        catalogue={catalogue}
        mine={mine}
        busy={busy}
        error={error}
        onOpen={open}
        onOpenMine={openMine}
        onGenerate={generate}
        onComposeTest={composeTest}
        // A library item IS a listening_library row, so it can be assigned as
        // it stands. A generated one lives in listening_items and has to be
        // cloned into the center's library first — hence the two factories.
        attachLibrary={
          isTeacher
            ? (id) => ({ onAttach: () => setAttachId(id), disabled: groups.length === 0 })
            : undefined
        }
        attachMine={
          isTeacher
            ? (id) => ({
                onAttach: () => void promoteThenAttach(id),
                disabled: groups.length === 0 || attaching,
              })
            : undefined
        }
      />
    </>
  );
}

/** The teacher's just-generated item: read it, sit it, or set it to a class. */
function FreshPractice({
  view,
  canAttach,
  attaching,
  onStart,
  onAttach,
  onDismiss,
}: {
  view: RenderView;
  canAttach: boolean;
  attaching: boolean;
  onStart: () => void;
  onAttach: () => void;
  onDismiss: () => void;
}) {
  const parts = view.kind === "test" ? "Full test · 4 parts" : `Part ${view.part ?? "?"}`;
  return (
    <div style={{ padding: "20px 24px 0", fontFamily: SANS }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #ECEAF2",
          borderRadius: 16,
          padding: 18,
          display: "flex",
          gap: 16,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 220, flex: 1 }}>
          <div
            style={{
              fontSize: 11.5,
              letterSpacing: ".08em",
              fontWeight: 700,
              textTransform: "uppercase",
              color: INDIGO,
            }}
          >
            Just generated
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: INK, margin: "4px 0 3px" }}>
            {view.topic || "Listening practice"}
          </div>
          <div style={{ fontSize: 13, color: "#5A6076" }}>
            {parts}
            {view.difficulty ? ` · Level ${view.difficulty}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onStart}
            style={{
              background: "#fff",
              border: "1px solid #ECEAF2",
              borderRadius: 10,
              padding: "10px 16px",
              fontFamily: SANS,
              fontSize: 13.5,
              fontWeight: 600,
              color: INK,
              cursor: "pointer",
            }}
          >
            Start
          </button>
          <button
            type="button"
            onClick={onAttach}
            disabled={!canAttach || attaching}
            title={canAttach ? undefined : "Create a class first"}
            style={{
              background: INDIGO,
              color: "#fff",
              border: 0,
              borderRadius: 10,
              padding: "10px 16px",
              fontFamily: SANS,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: !canAttach || attaching ? "not-allowed" : "pointer",
              opacity: !canAttach || attaching ? 0.55 : 1,
            }}
          >
            {attaching ? "Preparing…" : "Attach"}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            style={{
              background: "none",
              border: 0,
              color: "#8A8FA0",
              cursor: "pointer",
              fontSize: 18,
              padding: "0 4px",
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Hub (mirrors the Reading hub: two tabs, numbered cards) -------------------

function Hub({
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
  // Tab 1: FULL tests only (part 0). Tab 2: single-recording quick practices.
  const tests = useMemo(
    () =>
      (catalogue?.items ?? [])
        .filter((it) => it.part === 0)
        .sort((a, b) => (b.version ?? 1) - (a.version ?? 1) || a.difficulty - b.difficulty)
        .map((it, i) => ({ ...it, seq: i + 1 })),
    [catalogue],
  );
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
              background: "#fff",
              border: "1px solid rgba(28,27,46,.14)",
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
                border: "1px solid rgba(67,56,202,.16)",
                color: INDIGO,
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
          background: "#F1F1F8",
          border: "1px solid #ECEAF2",
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
              description="All four parts, forty questions, recorded as studio audio at your chosen level — the same shape as the real exam. About two and a half minutes to make, and it counts as one generation."
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
              <Grid>
                {tests.map((it) => (
                  <TestCard
                    key={it.id}
                    it={it}
                    loading={busy === it.id}
                    disabled={!!busy}
                    onOpen={() => onOpen(it)}
                    attach={attachLibrary?.(it.id)}
                  />
                ))}
              </Grid>
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
              <Grid>
                {quick.map((it) => (
                  <QuickCard
                    key={it.id}
                    it={it}
                    loading={busy === it.id}
                    disabled={!!busy}
                    onOpen={() => onOpen(it)}
                    attach={attachLibrary?.(it.id)}
                  />
                ))}
              </Grid>
            </>
          ) : null}
        </>
      )}

      <p style={{ margin: "32px 0 0", fontSize: 13, color: "#9A99A8" }}>
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
                background: on ? "#fff" : "rgba(255,255,255,.12)",
                color: on ? INDIGO : "rgba(255,255,255,.85)",
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

function LevelChip({ level, mr }: { level: number; mr?: number }) {
  const lvl = LEVEL_STYLE[level] ?? LEVEL_STYLE[3];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 11px",
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 800,
        letterSpacing: 0.2,
        background: lvl.bg,
        color: lvl.fg,
        boxShadow: `0 1px 2px ${lvl.ring}, 0 0 0 3px ${lvl.ring}`,
        whiteSpace: "nowrap",
        marginRight: mr,
      }}
    >
      Level {level}
    </span>
  );
}

function BestChip({ score, max }: { score: number; max: number }) {
  const good = score / max >= 0.7;
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 8,
        fontSize: 12.5,
        fontWeight: 700,
        background: good ? "#E9F5EE" : "#FFF7E8",
        color: good ? GOOD : "#B45309",
        whiteSpace: "nowrap",
      }}
    >
      Best {score}/{max}
    </span>
  );
}

function StartAction({
  loading,
  locked,
  done,
}: {
  loading: boolean;
  locked: boolean;
  done: boolean;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: locked ? "#8A899A" : INDIGO,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={14} /> Opening…
        </>
      ) : locked ? (
        <>
          <Lock size={13} /> Pro
        </>
      ) : done ? (
        <>
          Retake <RotateCcw size={13} />
        </>
      ) : (
        <>
          Start <ArrowRight size={14} />
        </>
      )}
    </span>
  );
}

function TypeTags({ part, variant, layout }: { part: number; variant?: string; layout?: string }) {
  const tags = typeTagsFor(part, variant, layout);
  if (tags.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tags.map((t) => (
        <span
          key={t}
          style={{
            background: "#F4F4FB",
            border: "1px solid #ECEAF2",
            color: "#5A596B",
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 9px",
            borderRadius: 7,
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

/** A FULL 4-part test card ("Practice test N" — 40 questions). */

/** What a teacher's card needs for its Attach action. */
type AttachSlot = { onAttach: () => void; disabled: boolean };

/**
 * The card's outer element. A student's card is one big <button> — the whole
 * surface opens the practice. A teacher's carries two actions, so it cannot be:
 * a button inside a button is invalid, and the outer target would swallow
 * Attach. Same visuals either way.
 */
function CardBox({
  attach,
  onOpen,
  disabled,
  style,
  children,
}: {
  attach?: AttachSlot;
  onOpen: () => void;
  disabled: boolean;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (attach) return <div style={style}>{children}</div>;
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className="lp-hover"
      style={{ ...style, textAlign: "left", cursor: disabled ? "default" : "pointer" }}
    >
      {children}
    </button>
  );
}

/** Footer: the meta line and Start for a student; Attach + Start for a teacher. */
function CardFoot({
  meta,
  attach,
  onOpen,
  loading,
  locked,
  done,
}: {
  meta: string;
  attach?: AttachSlot;
  onOpen: () => void;
  loading: boolean;
  locked?: boolean;
  done?: boolean;
}) {
  if (!attach) {
    return (
      <div style={rowBetween}>
        <span style={metaText}>{meta}</span>
        <StartAction loading={loading} locked={!!locked} done={!!done} />
      </div>
    );
  }
  const act: React.CSSProperties = {
    flex: 1,
    borderRadius: 10,
    padding: "9px 12px",
    fontFamily: SANS,
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
  };
  return (
    <>
      <div style={{ ...metaText, marginBottom: 10 }}>{meta}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={attach.onAttach}
          disabled={attach.disabled}
          title={attach.disabled ? "Create a class first" : undefined}
          style={{
            ...act,
            background: INDIGO,
            border: 0,
            color: "#fff",
            cursor: attach.disabled ? "not-allowed" : "pointer",
            opacity: attach.disabled ? 0.45 : 1,
          }}
        >
          Attach
        </button>
        <button
          type="button"
          onClick={onOpen}
          disabled={loading}
          style={{ ...act, background: "#1F8A53", border: 0, color: "#fff" }}
        >
          {loading ? "Opening…" : done ? "Retake" : "Start"}
        </button>
      </div>
    </>
  );
}

function TestCard({
  it,
  loading,
  disabled,
  onOpen,
  attach,
}: {
  it: LibraryItem & { seq: number };
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
  attach?: AttachSlot;
}) {
  const done = it.best_score != null;
  return (
    <CardBox
      attach={attach}
      onOpen={onOpen}
      disabled={disabled}
      style={{
        ...cardStyle,
        width: "100%",
        fontFamily: SANS,
        opacity: it.locked ? 0.66 : disabled && !loading ? 0.7 : 1,
      }}
    >
      <div style={rowBetween}>
        <span style={iconTile}>
          <Headphones size={19} />
        </span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {done ? <BestChip score={it.best_score ?? 0} max={40} /> : null}
          <LevelChip level={it.difficulty} />
        </span>
      </div>
      <div>
        <h4 style={cardTitle}>Practice test {it.seq}</h4>
        <span style={{ ...cardSub, display: "block" }}>4 parts · 40 questions · band score</span>
      </div>
      <Divider />
      <CardFoot
        meta={"≈ 35 min · replay anytime"}
        attach={attach}
        onOpen={onOpen}
        loading={loading}
        locked={it.locked}
        done={done}
      />
    </CardBox>
  );
}

/** A ready-made single-recording practice ("Quick practice N"). */
function QuickCard({
  it,
  loading,
  disabled,
  onOpen,
  attach,
}: {
  it: LibraryItem & { seq: number };
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
  attach?: AttachSlot;
}) {
  const done = it.best_score != null;
  return (
    <CardBox
      attach={attach}
      onOpen={onOpen}
      disabled={disabled}
      style={{
        ...cardStyle,
        width: "100%",
        fontFamily: SANS,
        opacity: it.locked ? 0.66 : disabled && !loading ? 0.7 : 1,
      }}
    >
      <div style={rowBetween}>
        <span style={iconTile}>
          <Headphones size={19} />
        </span>
        <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {done ? <BestChip score={it.best_score ?? 0} max={10} /> : null}
          <LevelChip level={it.difficulty} />
        </span>
      </div>
      <div>
        <h4 style={cardTitle}>Quick practice {it.seq}</h4>
        <span
          style={{
            ...cardSub,
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {it.topic || "Listening practice"}
        </span>
      </div>
      <TypeTags part={it.part} variant={it.variant} layout={it.layout} />
      <Divider />
      <CardFoot
        meta={"10 questions · replay anytime"}
        attach={attach}
        onOpen={onOpen}
        loading={loading}
        locked={it.locked}
        done={done}
      />
    </CardBox>
  );
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
  const when = it.created_at
    ? new Date(it.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
  return (
    <CardBox
      attach={attach}
      onOpen={onOpen}
      disabled={disabled}
      style={{
        ...cardStyle,
        width: "100%",
        fontFamily: SANS,
        opacity: disabled && !loading ? 0.7 : 1,
      }}
    >
      <AiCorner />
      <div style={rowBetween}>
        <span style={iconTile}>
          <Sparkles size={19} />
        </span>
        <LevelChip level={it.difficulty} mr={34} />
      </div>
      <div>
        <h4 style={cardTitle}>My practice {it.seq}</h4>
        <span
          style={{
            ...cardSub,
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {it.topic || "Listening practice"}
        </span>
      </div>
      <TypeTags part={it.part} variant={it.variant} layout={it.layout} />
      <Divider />
      <CardFoot
        meta={when ? `Generated ${when}` : "Saved to your account"}
        attach={attach}
        onOpen={onOpen}
        loading={loading}
      />
    </CardBox>
  );
}

// ---- Hub pieces (visual language shared with the Reading hub) ------------------

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
        background: active ? "#fff" : "transparent",
        color: active ? INDIGO : MUTED,
        boxShadow: active ? "0 2px 8px -3px rgba(28,27,46,.28)" : "none",
        transition: "background .15s ease",
      }}
    >
      <span style={{ display: "flex", flex: "none", color: active ? INDIGO : "#8A899A" }}>
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
            color: active ? "#7C78C9" : "#9A99A8",
            marginTop: 2,
          }}
        >
          {sub}
        </span>
      </span>
    </button>
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

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ marginTop: 18, fontSize: 13.5, color: "#8A899A", fontFamily: SANS }}>{children}</p>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "rgba(28,27,46,.07)" }} />;
}

/** Top-right corner marker for the learner's own AI-generated cards. */
function AiCorner() {
  return (
    <span
      title="AI-generated"
      aria-label="AI-generated"
      style={{
        position: "absolute",
        top: 14,
        right: 14,
        zIndex: 2,
        width: 26,
        height: 26,
        borderRadius: 8,
        background: "linear-gradient(135deg,#5B55D6,#3B43B5)",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 16px -6px rgba(59,67,181,.7)",
      }}
    >
      <Sparkles size={14} strokeWidth={2.4} />
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  position: "relative",
  background: "#fff",
  border: "1px solid rgba(28,27,46,.09)",
  borderRadius: 14,
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 11,
  color: INK,
  boxShadow: "0 1px 3px rgba(28,27,46,.04)",
};
const rowBetween: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};
const cardTitle: React.CSSProperties = {
  fontFamily: SANS,
  fontWeight: 700,
  fontSize: 15.5,
  lineHeight: 1.3,
  margin: "0 0 3px",
  color: INK,
};
const cardSub: React.CSSProperties = { fontSize: 13.5, color: "#7A7989", fontWeight: 500 };
const metaText: React.CSSProperties = { fontSize: 13, color: "#8A899A" };
const iconTile: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 11,
  background: "#EFEEFC",
  color: INDIGO,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "none",
};

// ---- Runner --------------------------------------------------------------------

/** Every question number a part view carries (gaps, clusters, MCQs, matching). */
function partQuestionNums(p: PartView): number[] {
  // v2: every group states its own question numbers.
  if (p.groups) return p.groups.flatMap((g) => g.questions).sort((a, b) => a - b);
  const templates = p.form
    ? p.form.rows.map((r) => r.template)
    : p.table
      ? p.table.rows.flat()
      : p.flow_chart
        ? p.flow_chart.steps
        : (p.notes?.sections ?? []).flatMap((s) => s.lines.map((l) => l.template));
  const nums = templates.flatMap((t) => [...t.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1])));
  for (const c of p.clusters ?? []) nums.push(...c.questions);
  for (const m of p.mcqs ?? []) nums.push(m.q);
  for (const it of p.matching?.items ?? []) nums.push(it.q);
  return nums.sort((a, b) => a - b);
}

/** Everything a question panel needs to render + drive the runner's shared
 *  state (answers, review results, focus highlight, per-question flags). */

function Runner({
  view,
  source,
  onExit,
}: {
  view: RenderView;
  source: Source;
  onExit: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flags, setFlags] = useState<Set<number>>(() => new Set());
  const [grade, setGrade] = useState<Grade | null>(null);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedQ, setFocusedQ] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isTest = view.kind === "test";
  const partViews = useMemo(() => (isTest ? (view.parts ?? []) : [view]), [view, isTest]);

  // Each part is its own audio stream: switching tabs loads that part's
  // segments and plays them from the top (its intro announces the questions),
  // exactly like the separate per-part recordings of a real test.
  const audioParts = useMemo(() => splitAudioByPart(view.audio), [view.audio]);
  const [apIdx, setApIdx] = useState(0);
  const pendingAutoStart = useRef(false);

  // A finished part flows straight into the next one (pre-grade). The player
  // fires this from the stream's `ended` event.
  const onPartEnd = useCallback(() => {
    if (!isTest || grade || apIdx >= audioParts.length - 1) return;
    const next = audioParts[apIdx + 1];
    pendingAutoStart.current = true;
    setApIdx(apIdx + 1);
    setCurrentQ(
      partQuestionNums(partViews.find((p) => p.part === next.part) ?? partViews[0])[0] ?? 0,
    );
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [isTest, grade, apIdx, audioParts, partViews]);

  const player = useSegmentPlayer(audioParts[apIdx]?.segments ?? view.audio, onPartEnd);

  // The visible part is the part whose stream is loaded — questions and audio
  // can never disagree.
  const currentPart = audioParts[apIdx]?.part ?? partViews[0]?.part ?? 1;

  // Start a freshly loaded part when the switch asked for it (tab click while
  // the audio was rolling, or the end-of-part auto-advance). The hook resets
  // to idle on a segment swap, so this fires once the new stream is in place.
  const playerPhase = player.phase;
  const playerStart = player.start;
  useEffect(() => {
    if (pendingAutoStart.current && playerPhase === "idle") {
      pendingAutoStart.current = false;
      playerStart();
    }
  }, [playerPhase, playerStart]);

  const questionNums = useMemo(
    () => partViews.flatMap(partQuestionNums).sort((a, b) => a - b),
    [partViews],
  );
  const answered = questionNums.filter((n) => (answers[n] ?? "").trim()).length;

  const visiblePart = useMemo(
    () => partViews.find((p) => p.part === currentPart) ?? partViews[0],
    [partViews, currentPart],
  );
  const partNums = useMemo(() => (visiblePart ? partQuestionNums(visiblePart) : []), [visiblePart]);
  // A valid highlighted question for the visible part (derived, not stored).
  const currentQChip = partNums.includes(currentQ) ? currentQ : (partNums[0] ?? 0);

  const toggleFlag = useCallback((n: number) => {
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }, []);

  const setFocus = useCallback((n: number) => {
    setFocusedQ(n);
    setCurrentQ(n);
  }, []);

  const goTo = useCallback((n: number) => {
    setCurrentQ(n);
    const el = document.getElementById(`q-${n}`);
    const c = scrollRef.current;
    if (el && c) c.scrollTo({ top: el.offsetTop - 16, behavior: "smooth" });
  }, []);

  const submit = useCallback(async () => {
    setGrading(true);
    setError(null);
    try {
      const body: Record<string, string> = {};
      for (const [k, v] of Object.entries(answers)) body[k] = v;
      const graded =
        source === "library"
          ? await callEngine<Grade>("library/grade", { library_id: view.id, answers: body })
          : await callEngine<Grade>("grade", { item_id: view.id, answers: body });
      setGrade(graded);
      scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Grading failed — please try again.");
    } finally {
      setGrading(false);
    }
  }, [answers, view.id, source]);

  const practiceAgain = useCallback(() => {
    setAnswers({});
    setFlags(new Set());
    setGrade(null);
    setError(null);
    pendingAutoStart.current = false;
    setApIdx(0);
    setCurrentQ(0);
    player.reset();
    scrollRef.current?.scrollTo({ top: 0 });
  }, [player]);

  const resultByQ = useMemo(() => {
    const map = new Map<number, QResult>();
    for (const r of grade?.results ?? []) map.set(r.q, r);
    return map;
  }, [grade]);

  const qctx: QCtx = {
    answers,
    setAnswers,
    results: grade ? resultByQ : null,
    flags,
    toggleFlag,
    focusedQ,
    setFocus,
  };

  // Exam clock spans the whole recording: manifest totals for the parts not
  // loaded plus the live player for the one that is.
  const partTotals = useMemo(
    () => audioParts.map((p) => p.segments.reduce((a, s) => a + segSecs(s), 0)),
    [audioParts],
  );
  const beforeSecs = partTotals.slice(0, apIdx).reduce((a, b) => a + b, 0);
  const grandTotal = partTotals.reduce((a, b) => a + b, 0);
  const total = isTest
    ? grandTotal > 0
      ? grandTotal
      : 1800
    : player.duration > 0
      ? player.duration
      : 480;

  const partIdx = partViews.findIndex((p) => p.part === currentPart);
  // Parts are freely navigable: a tab click mid-test loads that part's own
  // stream and restarts it from the beginning (its "look at the questions"
  // intro included); in review it just swaps the visible questions.
  const goPart = (n: number) => {
    if (n !== currentPart) {
      const i = audioParts.findIndex((p) => p.part === n);
      if (i >= 0 && i !== apIdx) {
        pendingAutoStart.current = !grade && player.phase !== "idle";
        setApIdx(i);
      }
    }
    setCurrentQ(partQuestionNums(partViews.find((p) => p.part === n) ?? partViews[0])[0] ?? 0);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: RUN.desk,
        display: "flex",
        fontFamily: RUN.sans,
        color: RUN.t1,
      }}
    >
      <style>{`
        @keyframes lp-pulse-ring { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(1.45); opacity: 0; } }
        .lp-qscroll::-webkit-scrollbar { width: 12px; }
        .lp-qscroll::-webkit-scrollbar-thumb { background:#DAD5E2; border-radius:9999px; border:4px solid transparent; background-clip:content-box; }
        .lp-run-input::placeholder { color:${RUN.t4}; }
        .lp-run-input:focus { border-color:${RUN.focusBorder} !important; box-shadow:0 0 0 3px rgba(124,92,252,0.10); }
        .lp-form2 { display:grid; grid-template-columns:1fr 1fr; grid-auto-flow:column; column-gap:56px; }
        @media (max-width: 760px) { .lp-form2 { display:block; } }
        .lp-map-panel { grid-template-columns:minmax(360px,600px) minmax(260px,1fr); }
        @media (max-width: 900px) { .lp-map-panel { grid-template-columns:1fr !important; } }
      `}</style>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          background: RUN.frame,
          overflow: "hidden",
        }}
      >
        {/* ===== TOP BAR ===== */}
        <header
          style={{
            flexShrink: 0,
            minHeight: 52,
            background: "#fff",
            borderBottom: `1px solid ${RUN.bBar}`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 20px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onExit}
            className="lp-run-exit"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "transparent",
              border: "none",
              color: RUN.t2,
              fontFamily: RUN.sans,
              fontSize: 14,
              fontWeight: 600,
              padding: "8px 10px",
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            <Chevron dir="left" />
            Exit
          </button>
          <div style={{ width: 1, height: 26, background: RUN.bBar }} />
          <div style={{ fontSize: 14, fontWeight: 600, color: RUN.t1, letterSpacing: "-0.005em" }}>
            {isTest ? "Listening · Practice test" : "Listening · Quick practice"}
          </div>

          <div style={{ flex: 1, minWidth: 8 }} />

          {isTest ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                background: RUN.desk,
                borderRadius: 9,
                padding: 3,
              }}
            >
              {[1, 2, 3, 4].map((n) => (
                <PartTab
                  key={n}
                  n={n}
                  active={currentPart === n}
                  unlocked
                  onClick={() => goPart(n)}
                />
              ))}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: RUN.vBg,
              color: RUN.vDeep,
              fontFamily: RUN.mono,
              fontSize: 14,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              padding: "5px 11px",
              borderRadius: 9,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <ExamClock player={player} isTest={isTest} beforeSecs={beforeSecs} total={total} />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 5,
              background: "#fff",
              border: `1px solid ${RUN.bPill}`,
              padding: "5px 11px",
              borderRadius: 9,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: RUN.t1 }}>{answered}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: RUN.t3 }}>
              / {questionNums.length}
            </span>
          </div>
        </header>

        {/* ===== AUDIO STRIP ===== */}
        <AudioStrip player={player} />

        {/* ===== MAIN ===== */}
        <main
          id="lp-qscroll"
          ref={scrollRef}
          className="lp-qscroll"
          style={{
            flex: 1,
            minHeight: 0,
            position: "relative",
            overflowY: "auto",
            background: "#fff",
            padding: "18px clamp(20px,4vw,40px) 32px",
          }}
        >
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            {/* part label + jump chips */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: RUN.vDeep,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Part {visiblePart?.part ?? 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: RUN.t2 }}>
                  {PART_GENRE[visiblePart?.part ?? 1] ?? ""}
                </span>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {partNums.map((n) => (
                  <JumpChip
                    key={n}
                    n={n}
                    current={currentQChip === n}
                    flagged={flags.has(n)}
                    answered={(answers[n] ?? "").trim() !== ""}
                    onClick={() => goTo(n)}
                  />
                ))}
              </div>
            </div>

            {/* the announcer's scenario line, kept on screen so the setting and
                purpose of the recording survive the one-shot audio intro */}
            {visiblePart?.narrator_intro ? (
              <p
                style={{
                  margin: "-4px 0 18px",
                  fontFamily: RUN.sans,
                  fontSize: 13.5,
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  color: RUN.t2,
                }}
              >
                {visiblePart.narrator_intro}
              </p>
            ) : null}

            {/* questions — flat, full-bleed, no card chrome (matches handoff) */}
            <section>{visiblePart ? <PartPanels p={visiblePart} ctx={qctx} /> : null}</section>

            {grade ? <ReviewPanel grade={grade} /> : null}
            {grade ? <ReplayList segments={view.audio} /> : null}
            {error ? (
              <div style={{ marginTop: 16 }}>
                <UpgradeNotice message={error} />
              </div>
            ) : null}
          </div>
        </main>

        {/* ===== FOOTER ===== */}
        <RunnerFooter
          isTest={isTest}
          grade={grade}
          grading={grading}
          answered={answered}
          totalQ={questionNums.length}
          flagCount={flags.size}
          canBack={partIdx > 0}
          isLastPart={partIdx >= partViews.length - 1}
          source={source}
          onBack={() => partIdx > 0 && goPart(partViews[partIdx - 1].part)}
          onNext={() => partIdx < partViews.length - 1 && goPart(partViews[partIdx + 1].part)}
          onSubmit={submit}
          onPracticeAgain={practiceAgain}
          onExit={onExit}
        />
      </div>
    </div>
  );
}

/** Chevron glyph matching the handoff (2.4 stroke Lucide path). */
function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={dir === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"} />
    </svg>
  );
}

/** Segmented part tab (1–4). Active = white pill; locked = greyed, not-allowed. */
function PartTab({
  n,
  active,
  unlocked,
  onClick,
}: {
  n: number;
  active: boolean;
  unlocked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!unlocked}
      title={unlocked ? `Part ${n}` : `Part ${n} — locked until it plays`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 28,
        borderRadius: 7,
        border: "none",
        fontFamily: RUN.sans,
        fontSize: 13,
        fontWeight: 600,
        transition: "all .15s",
        background: active ? "#fff" : "transparent",
        color: active ? RUN.vDeep : unlocked ? RUN.t3 : RUN.t5,
        boxShadow: active ? "0 1px 3px rgba(20,20,40,0.12)" : "none",
        cursor: unlocked ? "pointer" : "not-allowed",
      }}
    >
      {n}
    </button>
  );
}

/** Per-question navigation chip (current / flagged / answered / default). */
function JumpChip({
  n,
  current,
  flagged,
  answered,
  onClick,
}: {
  n: number;
  current: boolean;
  flagged: boolean;
  answered: boolean;
  onClick: () => void;
}) {
  let bg: string = "#fff";
  let color: string = RUN.t3;
  let border: string = RUN.bField;
  let title = `Question ${n}`;
  if (current) {
    bg = RUN.v;
    color = "#fff";
    border = RUN.v;
    title = `Question ${n} (current)`;
  } else if (flagged) {
    bg = RUN.flagBg;
    color = RUN.flagText;
    border = RUN.flagBorder;
    title = `Question ${n} (flagged)`;
  } else if (answered) {
    bg = RUN.okBg;
    color = RUN.ok;
    border = RUN.okBorder;
    title = `Question ${n} (answered)`;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: 8,
        fontFamily: RUN.sans,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        transition: "all .12s",
        border: `1.5px solid ${border}`,
        background: bg,
        color,
      }}
    >
      {n}
    </button>
  );
}

/** Footer: hint + Back + Next part / Submit, switching to the score row after
 *  grading (score + Practice again + Exit). */
function RunnerFooter({
  isTest,
  grade,
  grading,
  answered,
  totalQ,
  flagCount,
  canBack,
  isLastPart,
  source,
  onBack,
  onNext,
  onSubmit,
  onPracticeAgain,
  onExit,
}: {
  isTest: boolean;
  grade: Grade | null;
  grading: boolean;
  answered: number;
  totalQ: number;
  flagCount: number;
  canBack: boolean;
  isLastPart: boolean;
  source: Source;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onPracticeAgain: () => void;
  onExit: () => void;
}) {
  const good = grade ? grade.score / grade.max_score >= 0.7 : false;
  const primary: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    background: RUN.v,
    border: "none",
    color: "#fff",
    fontFamily: RUN.sans,
    fontSize: 14,
    fontWeight: 600,
    padding: "0 18px",
    borderRadius: 10,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(124,92,252,0.3)",
  };
  const ghost: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    background: "#fff",
    border: `1px solid ${RUN.bBar}`,
    color: RUN.t2,
    fontFamily: RUN.sans,
    fontSize: 14,
    fontWeight: 600,
    padding: "0 16px",
    borderRadius: 10,
    cursor: "pointer",
  };
  const showNextPart = isTest && !isLastPart;
  return (
    <footer
      style={{
        flexShrink: 0,
        minHeight: 56,
        background: "#fff",
        borderTop: `1px solid ${RUN.bBar}`,
        padding: "9px 20px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      {grade ? (
        <>
          <span style={{ fontSize: 15, fontWeight: 800, color: good ? RUN.ok : RUN.t1 }}>
            {grade.score}
            <span style={{ color: RUN.t4, fontWeight: 600 }}>/{grade.max_score}</span> correct
          </span>
          {grade.band != null ? (
            <span
              style={{
                padding: "5px 12px",
                borderRadius: 9,
                background: RUN.vBg,
                border: `1px solid ${RUN.vBorder}`,
                color: RUN.vDeep,
                fontSize: 13.5,
                fontWeight: 700,
              }}
            >
              Band {grade.band.toFixed(1)}
            </span>
          ) : null}
          <div style={{ flex: 1 }} />
          {grade.attempt_id ? (
            <a
              href={`/listen/results/${grade.attempt_id}`}
              style={{ ...ghost, textDecoration: "none" }}
            >
              Full report
              <ArrowRight size={15} />
            </a>
          ) : null}
          <button type="button" onClick={onPracticeAgain} style={ghost}>
            <RotateCcw size={15} /> Practice again
          </button>
          <button type="button" onClick={onExit} style={primary}>
            {source === "library" ? "Back to library" : "Back to Listening"}
            <Chevron dir="right" />
          </button>
        </>
      ) : (
        <>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9999,
              background: "#2b2b33",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#fff",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: RUN.t3 }}>
            {answered} of {totalQ} answered
            {flagCount ? ` · ${flagCount} flagged for review` : ""}
            {isTest ? " · Switch parts with the tabs above" : ""}
          </span>
          <div style={{ flex: 1 }} />
          {isTest ? (
            <button
              type="button"
              onClick={onBack}
              disabled={!canBack}
              style={{
                ...ghost,
                color: canBack ? RUN.t2 : RUN.t5,
                cursor: canBack ? "pointer" : "not-allowed",
              }}
            >
              <Chevron dir="left" /> Back
            </button>
          ) : null}
          {/* Submit is always reachable — on a test you can grade from any part,
              not only the last one. Next part stays the primary "keep going". */}
          {showNextPart ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={grading}
              style={{
                ...ghost,
                background: RUN.vBg,
                borderColor: "transparent",
                color: RUN.vDeep,
                opacity: grading ? 0.75 : 1,
                cursor: grading ? "default" : "pointer",
              }}
            >
              {grading ? (
                <>
                  <Loader2 className="animate-spin" size={16} /> Checking…
                </>
              ) : (
                "Submit & finish"
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={showNextPart ? onNext : onSubmit}
            disabled={grading && !showNextPart}
            style={{
              ...primary,
              opacity: grading && !showNextPart ? 0.75 : 1,
              cursor: grading && !showNextPart ? "default" : "pointer",
            }}
          >
            {showNextPart ? (
              <>
                Next part <Chevron dir="right" />
              </>
            ) : grading ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Checking…
              </>
            ) : (
              <>
                Submit answers <Chevron dir="right" />
              </>
            )}
          </button>
        </>
      )}
    </footer>
  );
}

// ---- Question panels ---------------------------------------------------------

/** A template split into literal text and gap placeholders ("For {2} days" →
 *  [{text:"For "},{gap:2},{text:" days"}]). */
type TplPart = { text: string } | { gap: number };
function templateParts(t: string): TplPart[] {
  const out: TplPart[] = [];
  const re = /\{(\d+)\}/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    if (m.index > last) out.push({ text: t.slice(last, m.index) });
    out.push({ gap: Number(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < t.length) out.push({ text: t.slice(last) });
  return out;
}
const gapNums = (t: string): number[] => [...t.matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
const rangeLabel = (nums: number[]): string =>
  nums.length ? `${Math.min(...nums)}–${Math.max(...nums)}` : "";

/** The 30×30 question-number chip — green once its answer is filled. */
function AnswerField({
  n,
  ctx,
  variant,
  grow,
}: {
  n: number;
  ctx: QCtx;
  variant: "block" | "inline";
  grow?: boolean;
}) {
  const result = ctx.results?.get(n) ?? null;
  const graded = result != null;
  const correct = graded && result.is_correct;
  const wrong = graded && !result.is_correct;
  const answered = (ctx.answers[n] ?? "").trim() !== "";
  const focused = ctx.focusedQ === n;
  const inline = variant === "inline";
  const border = correct
    ? RUN.okBorder
    : wrong
      ? "#E6B0B0"
      : focused
        ? RUN.v
        : answered
          ? RUN.okBorder
          : RUN.bField;
  const bg = correct
    ? RUN.okTint
    : wrong
      ? "#FDF2F2"
      : focused
        ? RUN.fieldFocus
        : answered
          ? RUN.okTint
          : RUN.field;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        flex: grow ? 1 : undefined,
        minWidth: grow ? 0 : undefined,
        verticalAlign: inline ? "middle" : undefined,
      }}
    >
      {inline ? (
        <span
          style={{
            width: 25,

            fontFamily: RUN.sans,
            fontSize: 11.5,
            fontWeight: 500,
            color: answered ? RUN.ok : RUN.vHover,
            background: answered ? RUN.okBg : RUN.vBg,
            borderRadius: 6,
            padding: "1px 6px",
          }}
        >
          {n}
        </span>
      ) : null}
      <input
        className="lp-run-input"
        value={ctx.answers[n] ?? ""}
        onChange={(e) => ctx.setAnswers((a) => ({ ...a, [n]: e.target.value }))}
        onFocus={() => ctx.setFocus(n)}
        disabled={graded}
        placeholder={inline ? "answer" : "Type your answer"}
        aria-label={`Answer ${n}`}
        style={{
          flex: grow ? 1 : undefined,
          width: grow ? undefined : inline ? 150 : 150,
          minWidth: 0,
          height: inline ? 28 : 36,
          padding: inline ? "0 11px" : "0 15px",
          fontFamily: RUN.sans,
          fontSize: inline ? 15 : 15.5,
          fontWeight: 400,
          color: RUN.t1,
          background: bg,
          border: `1.5px solid ${border}`,
          borderRadius: inline ? 8 : 9,
          outline: "none",
        }}
      />
      {wrong ? (
        <span style={{ fontSize: 13.5, fontWeight: 700, color: RUN.ok, whiteSpace: "nowrap" }}>
          → {result?.correct_answer}
        </span>
      ) : null}
      {graded ? correct ? <Check size={16} color={RUN.ok} /> : <X size={16} color={BAD} /> : null}
    </span>
  );
}

function CardHeader({
  range,
  title,
  instruction,
}: {
  range: string;
  title: string;
  instruction?: string;
}) {
  return (
    <div style={{ padding: "6px 0 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontFamily: RUN.sans,
            fontSize: 11.5,
            fontWeight: 600,
            color: RUN.report,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Questions {range}
        </div>
        <ReportButton />
      </div>
      <h2
        style={{
          fontFamily: RUN.display,
          fontSize: "clamp(20px,2.2vw,20px)",
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: RUN.t1,
          margin: "0 0 12px",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {instruction ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: RUN.vSoft,
            color: "#5a4ec4",
            fontSize: 13,
            fontWeight: 600,
            padding: "10px 16px",
            borderRadius: 10,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={RUN.vDeep}
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
          {instruction}
        </div>
      ) : null}
    </div>
  );
}

function ReportButton() {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setDone(true)}
      disabled={done}
      title="Report a problem with these questions"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "5px 11px",
        borderRadius: 8,
        border: `1px solid ${done ? RUN.okBorder : RUN.reportBorder}`,
        background: done ? RUN.okBg : RUN.reportBg,
        color: done ? RUN.ok : RUN.report,
        fontFamily: RUN.sans,
        fontSize: 12,
        fontWeight: 600,
        cursor: done ? "default" : "pointer",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {done ? (
        <>
          <Check size={12} /> Reported
        </>
      ) : (
        <>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2 1 21h22L12 2z" />
            <line x1="12" y1="9" x2="12" y2="14" />
            <circle cx="12" cy="17.5" r="0.6" fill="currentColor" stroke="none" />
          </svg>
          Report
        </>
      )}
    </button>
  );
}

function Gapped({ template, ctx }: { template: string; ctx: QCtx }) {
  return (
    <>
      {templateParts(template).map((p, i) =>
        "text" in p ? (
          <span key={i}>{p.text}</span>
        ) : (
          <span
            key={i}
            id={`q-${p.gap}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              verticalAlign: "middle",
            }}
          >
            <AnswerField n={p.gap} ctx={ctx} variant="inline" />
            <FlagButton flagged={ctx.flags.has(p.gap)} onClick={() => ctx.toggleFlag(p.gap)} />
          </span>
        ),
      )}
    </>
  );
}

function FormRowView({ r, ctx }: { r: FormRow; ctx: QCtx }) {
  const parts = templateParts(r.template);
  const gaps = parts.filter((p): p is { gap: number } => "gap" in p).map((p) => p.gap);
  const primary = gaps[0] ?? 0;
  const single = gaps.length === 1;
  const answeredPrimary = (ctx.answers[primary] ?? "").trim() !== "";
  return (
    <div
      id={`q-${primary}`}
      style={{
        display: "grid",
        gridTemplateColumns: "26px minmax(72px,150px) 1fr",
        gap: 14,
        alignItems: "center",
        minHeight: 58,
        padding: "9px 0",
        borderBottom: `1px solid ${RUN.bRow}`,
      }}
    >
      <NumChip n={primary} answered={answeredPrimary} />
      <div style={{ fontFamily: RUN.sans, fontSize: 15, fontWeight: 600, color: RUN.t1 }}>
        {r.label}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        {parts.map((p, i) =>
          "text" in p ? (
            p.text.trim() ? (
              <span key={i} style={{ fontSize: 14.5, color: RUN.report, whiteSpace: "nowrap" }}>
                {p.text.trim()}
              </span>
            ) : null
          ) : (
            <AnswerField key={i} n={p.gap} ctx={ctx} variant="block" grow={single} />
          ),
        )}
        <FlagButton flagged={ctx.flags.has(primary)} onClick={() => ctx.toggleFlag(primary)} />
      </div>
    </div>
  );
}

/** Small bold title used when a completion panel renders inside a multi-group
 *  part (bare mode): the group's QuestionsHeading already shows the range +
 *  instruction, so the panel must not repeat its own full CardHeader. */
function BareTitle({ title }: { title?: string }) {
  if (!title) return null;
  return (
    <div
      style={{
        fontFamily: RUN.sans,
        fontSize: 16,
        fontWeight: 700,
        color: RUN.t1,
        padding: "2px 0 10px",
      }}
    >
      {title}
    </div>
  );
}

function FormPanel({
  form,
  ctx,
  bare,
}: {
  form: NonNullable<RenderView["form"]>;
  ctx: QCtx;
  bare?: boolean;
}) {
  const rows = useMemo(
    () =>
      form.rows.map((r, i) => {
        const prev =
          form.rows
            .slice(0, i)
            .map((x) => x.section)
            .filter(Boolean)
            .pop() ?? null;
        return { ...r, header: r.section && r.section !== prev ? r.section : null };
      }),
    [form],
  );
  const range = rangeLabel(form.rows.flatMap((r) => gapNums(r.template)));
  const hasSections = rows.some((r) => r.header);
  return (
    <>
      {bare ? (
        <BareTitle title={form.title} />
      ) : (
        <CardHeader
          range={range}
          title={form.title}
          instruction={`Write ${form.word_limit} for each answer`}
        />
      )}
      {hasSections ? (
        <div>
          {rows.map((r, i) => (
            <div key={i}>
              {r.header ? (
                <div
                  style={{
                    fontFamily: RUN.sans,
                    fontSize: 14,
                    fontWeight: 700,
                    color: RUN.t1,
                    padding: "16px 0 4px",
                  }}
                >
                  {r.header}
                </div>
              ) : null}
              <FormRowView r={r} ctx={ctx} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="lp-form2"
          style={{ gridTemplateRows: `repeat(${Math.ceil(rows.length / 2)}, auto)` }}
        >
          {rows.map((r, i) => (
            <FormRowView key={i} r={r} ctx={ctx} />
          ))}
        </div>
      )}
    </>
  );
}

function NotesPanel({
  notes,
  ctx,
  bare,
}: {
  notes: NonNullable<RenderView["notes"]>;
  ctx: QCtx;
  bare?: boolean;
}) {
  const range = rangeLabel(
    notes.sections.flatMap((s) => s.lines).flatMap((l) => gapNums(l.template)),
  );
  return (
    <>
      {bare ? (
        <BareTitle title={notes.title} />
      ) : (
        <CardHeader
          range={range}
          title={notes.title}
          instruction={`Write ${notes.word_limit} for each answer`}
        />
      )}
      <div style={{ padding: "0 0 8px" }}>
        {notes.sections.map((s, si) => (
          <div key={si} style={{ marginBottom: 6 }}>
            <div
              style={{
                fontFamily: RUN.sans,
                fontSize: 14,
                fontWeight: 500,
                color: RUN.t1,
                padding: "18px 0 6px",
              }}
            >
              {s.heading}
            </div>
            {s.lines.map((l, li) => (
              <div
                key={li}
                style={{
                  padding: "6px 0",
                  paddingLeft: l.sub ? 34 : 14,
                  fontFamily: RUN.sans,
                  fontSize: 15,
                  lineHeight: 2,
                  color: RUN.t1,
                  display: "flex",
                  gap: 8,
                }}
              >
                <span style={{ color: RUN.t5, flex: "none", lineHeight: 2 }}>•</span>
                <span>
                  <Gapped template={l.template} ctx={ctx} />
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

/** Table completion (P1/P4 table variant) — a grid whose cells carry `{n}` gaps.
 *  Same word-answer machinery as the form/notes panels, laid out in columns. */
function TablePanel({ table, ctx, bare }: { table: TableView; ctx: QCtx; bare?: boolean }) {
  const range = rangeLabel(table.rows.flat().flatMap(gapNums));
  const cell: React.CSSProperties = {
    border: `1px solid ${RUN.bField}`,
    padding: "10px 14px",
    fontFamily: RUN.sans,
    fontSize: 15,
    color: RUN.t1,
    verticalAlign: "middle",
    textAlign: "left",
  };
  return (
    <>
      {bare ? (
        <BareTitle title={table.title} />
      ) : (
        <CardHeader
          range={range}
          title={table.title}
          instruction={`Write ${table.word_limit} for each answer`}
        />
      )}
      <div style={{ overflowX: "auto", paddingBottom: 6 }}>
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            minWidth: Math.max(420, table.columns.length * 180),
          }}
        >
          <thead>
            <tr>
              {table.columns.map((c, i) => (
                <th
                  key={i}
                  style={{
                    ...cell,
                    background: RUN.vSoft,
                    color: "#5a4ec4",
                    fontWeight: 700,
                    fontSize: 13.5,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((c, ci) => (
                  <td
                    key={ci}
                    style={{
                      ...cell,
                      fontWeight: ci === 0 ? 700 : 400,
                      background: ci === 0 ? RUN.strip : "#fff",
                      whiteSpace: ci === 0 ? "nowrap" : "normal",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 4,
                        lineHeight: 2,
                      }}
                    >
                      <Gapped template={c} ctx={ctx} />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---- Letter-answer panels (Parts 2 & 3) -----------------------------------------

function QuestionsHeading({ text, instruction }: { text: string; instruction: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          fontFamily: RUN.sans,
          fontSize: 11.5,
          fontWeight: 700,
          color: RUN.t6,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          marginBottom: 7,
        }}
      >
        {text}
      </div>
      <div
        style={{
          display: "inline-flex",
          background: RUN.vBg,
          color: RUN.vDeep,
          border: `1px solid ${RUN.vBorder}`,
          borderRadius: 9999,
          padding: "6px 12px",
          fontSize: 12.5,
          fontWeight: 700,
        }}
      >
        {instruction}
      </div>
    </div>
  );
}

// ---- v2 group rendering ------------------------------------------------------

const COMPLETION_TYPES = new Set<GroupType>(["form", "notes", "table", "sentence"]);

/** Sentence completion (P1/P4 sentence layout) — ten standalone gapped
 *  sentences, one `{n}` gap each, filled with the same word-answer machinery. */
function SentencePanel({
  sentences,
  title,
  wordLimit,
  range,
  ctx,
}: {
  sentences: string[];
  title?: string;
  wordLimit: string;
  range: string;
  ctx: QCtx;
}) {
  return (
    <>
      <CardHeader
        range={range}
        title={title || "Complete the sentences"}
        instruction={`Write ${wordLimit} for each answer`}
      />
      <div style={{ padding: "2px 0 8px" }}>
        {sentences.map((s, i) => (
          <div
            key={i}
            style={{
              padding: "9px 0",
              borderBottom: `1px solid ${RUN.bRow}`,
              fontFamily: RUN.sans,
              fontSize: 15,
              lineHeight: 2,
              color: RUN.t1,
              display: "flex",
              gap: 10,
            }}
          >
            <span style={{ color: RUN.t5, flex: "none", lineHeight: 2 }}>•</span>
            <span>
              <Gapped template={s} ctx={ctx} />
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/** P2 map/plan labelling — draws the abstract map from geometry (roads, named
 *  landmarks, lettered sites, the 'You are here' marker + a compass), then a
 *  place list where each location is answered with a site letter. Origin is
 *  top-left and y grows SOUTH, matching the engine's coordinates, so points map
 *  straight onto the SVG. */
function GroupBody({
  g,
  ctx,
  bare,
  context,
}: {
  g: GroupView;
  ctx: QCtx;
  bare?: boolean;
  context?: string;
}) {
  switch (g.type) {
    case "form": {
      const pl = g.payload as { title?: string; rows?: FormRow[] };
      return (
        <FormPanel
          form={{
            title: pl.title ?? "",
            word_limit: g.word_limit ?? "ONE WORD ONLY",
            rows: pl.rows ?? [],
          }}
          ctx={ctx}
          bare={bare}
        />
      );
    }
    case "notes": {
      const pl = g.payload as { title?: string; sections?: NoteSection[] };
      return (
        <NotesPanel
          notes={{
            title: pl.title ?? "",
            word_limit: g.word_limit ?? "ONE WORD ONLY",
            sections: pl.sections ?? [],
          }}
          ctx={ctx}
          bare={bare}
        />
      );
    }
    case "table": {
      const pl = g.payload as { title?: string; columns?: string[]; rows?: string[][] };
      return (
        <TablePanel
          table={{
            title: pl.title ?? "",
            word_limit: g.word_limit ?? "ONE WORD ONLY",
            columns: pl.columns ?? [],
            rows: pl.rows ?? [],
          }}
          ctx={ctx}
          bare={bare}
        />
      );
    }
    case "sentence": {
      const pl = g.payload as { sentences?: string[]; title?: string };
      return (
        <SentencePanel
          sentences={pl.sentences ?? []}
          title={pl.title}
          wordLimit={g.word_limit ?? "ONE WORD ONLY"}
          range={rangeLabel(g.questions)}
          ctx={ctx}
        />
      );
    }
    case "mc_single": {
      const pl = g.payload as { items?: McqView[] };
      return <McqPanel mcqs={pl.items ?? []} context={context} ctx={ctx} bare={bare} />;
    }
    case "mc_two": {
      const pl = g.payload as { clusters?: ClusterView[] };
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {(pl.clusters ?? []).map((c) => (
            <ChooseTwoPanel key={c.questions[0]} cluster={c} ctx={ctx} />
          ))}
        </div>
      );
    }
    case "matching": {
      const pl = g.payload as {
        heading?: string;
        items?: { q: number; label: string }[];
        options?: Record<string, string>;
      };
      return (
        <MatchingPanel
          matching={{ heading: pl.heading ?? "", items: pl.items ?? [], options: pl.options ?? {} }}
          ctx={ctx}
          bare={bare}
        />
      );
    }
    case "flow_chart": {
      const pl = g.payload as {
        title?: string;
        steps?: string[];
        options?: Record<string, string>;
      };
      return (
        <FlowChartPanel
          flow={{ title: pl.title ?? "", steps: pl.steps ?? [], options: pl.options ?? {} }}
          ctx={ctx}
          bare={bare}
        />
      );
    }
    case "map": {
      const pl = g.payload as unknown as MapView;
      return <MapPanel map={pl} ctx={ctx} />;
    }
    default:
      return null;
  }
}

/** v2 renderer: a part is an ordered list of question groups. A single
 *  completion group (P1/P4) uses its panel's own header; the two-group
 *  letter parts (P2/P3) get a topic header plus each group's printed
 *  instruction. */
function GroupPanels({ p, ctx }: { p: PartView; ctx: QCtx }) {
  const groups = p.groups ?? [];
  if (groups.length === 1 && COMPLETION_TYPES.has(groups[0].type)) {
    return <GroupBody g={groups[0]} ctx={ctx} />;
  }
  return (
    <>
      <CardHeader range={rangeLabel(partQuestionNums(p))} title={p.topic || "Listening"} />
      <div style={{ padding: "8px 0 16px", display: "flex", flexDirection: "column", gap: 34 }}>
        {groups.map((g, i) => (
          <div key={i}>
            <QuestionsHeading
              text={`Questions ${g.questions[0]}–${g.questions[g.questions.length - 1]}`}
              instruction={g.instruction}
            />
            <GroupBody g={g} ctx={ctx} bare context={p.context} />
          </div>
        ))}
      </div>
    </>
  );
}

/** Renders whichever question material a part carries. Form/notes bring their
 *  own card header; the letter-answer parts (2 & 3) get one here. */
function PartPanels({ p, ctx }: { p: PartView; ctx: QCtx }) {
  if (p.groups) return <GroupPanels p={p} ctx={ctx} />;
  if (p.form) return <FormPanel form={p.form} ctx={ctx} />;
  if (p.notes) return <NotesPanel notes={p.notes} ctx={ctx} />;
  if (p.table) return <TablePanel table={p.table} ctx={ctx} />;
  return (
    <>
      <CardHeader range={rangeLabel(partQuestionNums(p))} title={p.topic || "Listening"} />
      <div
        style={{
          padding: "8px 0 16px",
          display: "flex",
          flexDirection: "column",
          gap: 30,
        }}
      >
        {(p.clusters ?? []).map((c) => (
          <ChooseTwoPanel key={c.questions[0]} cluster={c} ctx={ctx} />
        ))}
        {(p.mcqs ?? []).length > 0 ? (
          <McqPanel mcqs={p.mcqs ?? []} context={p.context} ctx={ctx} />
        ) : null}
        {p.matching && (p.matching.items ?? []).length > 0 ? (
          <MatchingPanel matching={p.matching} ctx={ctx} />
        ) : null}
        {p.flow_chart ? <FlowChartPanel flow={p.flow_chart} ctx={ctx} /> : null}
      </div>
    </>
  );
}

/** "Choose TWO letters" — a pair of questions answered by one 5-option set. */
function ChooseTwoPanel({ cluster, ctx }: { cluster: ClusterView; ctx: QCtx }) {
  const [qa, qb] = cluster.questions;
  const graded = ctx.results != null;
  const selected = [ctx.answers[qa], ctx.answers[qb]].filter(Boolean) as string[];
  const correctLetters = graded
    ? (ctx.results?.get(qa)?.correct_answer ?? "").split(" or ").filter(Boolean)
    : [];

  const toggle = (letter: string) => {
    if (graded) return;
    ctx.setFocus(qa);
    ctx.setAnswers((prev) => {
      const cur = [prev[qa], prev[qb]].filter(Boolean) as string[];
      let next: string[];
      if (cur.includes(letter)) next = cur.filter((l) => l !== letter);
      else if (cur.length >= 2)
        return prev; // already two picked — deselect one first
      else next = [...cur, letter];
      next.sort();
      return { ...prev, [qa]: next[0] ?? "", [qb]: next[1] ?? "" };
    });
  };

  return (
    <div id={`q-${qa}`}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <QuestionsHeading text={`Questions ${qa} and ${qb}`} instruction="Choose TWO letters." />
        <FlagButton flagged={ctx.flags.has(qa)} onClick={() => ctx.toggleFlag(qa)} />
      </div>
      <div
        style={{
          fontFamily: RUN.sans,
          fontWeight: 400,
          fontSize: 15,
          color: RUN.t1,
          margin: "2px 0 10px",
        }}
      >
        {cluster.stem}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {Object.entries(cluster.options)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, text]) => {
            const on = selected.includes(letter);
            const isCorrect = correctLetters.includes(letter);
            const border = graded
              ? isCorrect
                ? RUN.ok
                : on
                  ? BAD
                  : RUN.bField
              : on
                ? RUN.v
                : RUN.bField;
            const bg = graded
              ? isCorrect
                ? RUN.okTint
                : on
                  ? "#FDF2F2"
                  : "#fff"
              : on
                ? RUN.vBg
                : "#fff";
            return (
              <button
                key={letter}
                type="button"
                onClick={() => toggle(letter)}
                disabled={graded}
                aria-pressed={on}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: "11px 13px",
                  borderRadius: 11,
                  border: `1.5px solid ${border}`,
                  background: bg,
                  fontFamily: RUN.sans,
                  fontSize: 14.5,
                  color: RUN.t1,
                  cursor: graded ? "default" : "pointer",
                  textAlign: "left",
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: `1.5px solid ${on || (graded && isCorrect) ? border : "#C9C3D2"}`,
                    background: on && !graded ? RUN.v : "transparent",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  {on && !graded ? (
                    <Check size={14} />
                  ) : graded && isCorrect ? (
                    <Check size={14} color={RUN.ok} />
                  ) : graded && on ? (
                    <X size={14} color={BAD} />
                  ) : null}
                </span>
                <strong style={{ width: 16, flex: "none" }}>{letter}</strong>
                <span style={{ flex: 1 }}>{text}</span>
              </button>
            );
          })}
      </div>
      {graded && selected.length < 2 ? (
        <div style={{ marginTop: 8, fontSize: 13, color: BAD }}>
          You needed to choose two letters.
        </div>
      ) : null}
    </div>
  );
}

/** Single-answer multiple choice (Part 3, Q21–23). */
function McqPanel({
  mcqs,
  context,
  ctx,
  bare,
}: {
  mcqs: McqView[];
  context?: string;
  ctx: QCtx;
  bare?: boolean;
}) {
  const graded = ctx.results != null;
  return (
    <div>
      {bare ? null : (
        <QuestionsHeading
          text={`Questions ${mcqs[0].q}–${mcqs[mcqs.length - 1].q}`}
          instruction="Choose the correct letter, A, B or C."
        />
      )}
      {context ? (
        <div
          style={{
            fontFamily: RUN.sans,
            fontStyle: "italic",
            fontWeight: 600,
            fontSize: 14.5,
            color: RUN.t2,
            margin: "4px 0 8px",
          }}
        >
          {context}
        </div>
      ) : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {mcqs.map((m) => {
          const r = ctx.results?.get(m.q) ?? null;
          return (
            <div key={m.q} id={`q-${m.q}`}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    fontFamily: RUN.sans,
                    fontSize: 12,
                    fontWeight: 700,
                    color: RUN.vHover,
                    background: RUN.vBg,
                    borderRadius: 6,
                    padding: "2px 7px",
                    flex: "none",
                    marginTop: 1,
                  }}
                >
                  {m.q}
                </span>
                <div
                  style={{
                    flex: 1,
                    fontFamily: RUN.sans,
                    fontWeight: 600,
                    fontSize: 14.5,
                    color: RUN.t1,
                  }}
                >
                  {m.stem}
                </div>
                <FlagButton flagged={ctx.flags.has(m.q)} onClick={() => ctx.toggleFlag(m.q)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {Object.entries(m.options)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([letter, text]) => {
                    const on = ctx.answers[m.q] === letter;
                    const isCorrect = graded && r?.correct_answer === letter;
                    const border = graded
                      ? isCorrect
                        ? RUN.ok
                        : on
                          ? BAD
                          : RUN.bField
                      : on
                        ? RUN.v
                        : RUN.bField;
                    const bg = graded
                      ? isCorrect
                        ? RUN.okTint
                        : on
                          ? "#FDF2F2"
                          : "#fff"
                      : on
                        ? RUN.vBg
                        : "#fff";
                    return (
                      <button
                        key={letter}
                        type="button"
                        disabled={graded}
                        aria-pressed={on}
                        onClick={() => {
                          ctx.setFocus(m.q);
                          ctx.setAnswers((prev) => ({
                            ...prev,
                            [m.q]: prev[m.q] === letter ? "" : letter,
                          }));
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 11,
                          padding: "10px 13px",
                          borderRadius: 11,
                          border: `1.5px solid ${border}`,
                          background: bg,
                          fontFamily: RUN.sans,
                          fontSize: 14.5,
                          color: RUN.t1,
                          cursor: graded ? "default" : "pointer",
                          textAlign: "left",
                        }}
                      >
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            border: `1.5px solid ${on || isCorrect ? border : "#C9C3D2"}`,
                            background: on && !graded ? RUN.v : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "none",
                          }}
                        >
                          {on && !graded ? (
                            <span
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#fff",
                              }}
                            />
                          ) : isCorrect ? (
                            <Check size={12} color={RUN.ok} />
                          ) : graded && on ? (
                            <X size={12} color={BAD} />
                          ) : null}
                        </span>
                        <strong style={{ width: 16, flex: "none" }}>{letter}</strong>
                        <span style={{ flex: 1 }}>{text}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Matching run — items matched to a boxed option list by letter. */
function MatchingPanel({
  matching,
  ctx,
  bare,
}: {
  matching: MatchingView;
  ctx: QCtx;
  bare?: boolean;
}) {
  const graded = ctx.results != null;
  const qs = matching.items.map((it) => it.q);
  const letters = Object.keys(matching.options).sort();
  return (
    <div>
      {bare ? null : (
        <QuestionsHeading
          text={`Questions ${qs[0]}–${qs[qs.length - 1]}`}
          instruction={`Choose your answers from the box — write the correct letter, ${letters[0]}–${letters[letters.length - 1]}.`}
        />
      )}
      {matching.heading ? (
        <div
          style={{
            fontFamily: RUN.sans,
            fontWeight: 600,
            fontSize: 15,
            color: RUN.t1,
            margin: "2px 0 10px",
          }}
        >
          {matching.heading}
        </div>
      ) : null}

      {/* The option box */}
      <div
        style={{
          border: `1.5px solid ${RUN.bField}`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 14,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          background: RUN.field,
        }}
      >
        {letters.map((letter) => (
          <div
            key={letter}
            style={{ fontFamily: RUN.sans, fontSize: 14, color: RUN.t1, display: "flex", gap: 10 }}
          >
            <strong style={{ width: 16, flex: "none", color: RUN.vHover }}>{letter}</strong>
            <span>{matching.options[letter]}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {matching.items.map((it) => {
          const r = ctx.results?.get(it.q) ?? null;
          const border = r ? (r.is_correct ? RUN.ok : BAD) : RUN.bField;
          return (
            <div
              key={it.q}
              id={`q-${it.q}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 0",
                borderTop: `1px solid ${RUN.bRow}`,
                fontFamily: RUN.sans,
                fontSize: 14.5,
              }}
            >
              <NumChip n={it.q} answered={(ctx.answers[it.q] ?? "").trim() !== ""} />
              <span style={{ flex: 1, color: RUN.t2, fontWeight: 600 }}>{it.label}</span>
              <select
                value={ctx.answers[it.q] ?? ""}
                disabled={graded}
                aria-label={`Answer ${it.q}`}
                onChange={(e) => {
                  ctx.setFocus(it.q);
                  ctx.setAnswers((prev) => ({ ...prev, [it.q]: e.target.value }));
                }}
                style={{
                  width: 70,
                  height: 38,
                  padding: "0 10px",
                  borderRadius: 9,
                  border: `1.5px solid ${border}`,
                  background: r ? (r.is_correct ? RUN.okTint : "#FDF2F2") : "#fff",
                  fontFamily: RUN.sans,
                  fontSize: 14,
                  fontWeight: 700,
                  color: RUN.t1,
                }}
              >
                <option value="">–</option>
                {letters.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
              {r ? (
                r.is_correct ? (
                  <Check size={16} color={RUN.ok} />
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <X size={16} color={BAD} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: RUN.ok }}>
                      → {r.correct_answer}
                    </span>
                  </span>
                )
              ) : null}
              <FlagButton flagged={ctx.flags.has(it.q)} onClick={() => ctx.toggleFlag(it.q)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** One flow-chart gap — a letter `<select>` drawn from the shared word bank,
 *  with the same graded border / correct-letter reveal as the matching run. */
function FlowGapSelect({ n, letters, ctx }: { n: number; letters: string[]; ctx: QCtx }) {
  const r = ctx.results?.get(n) ?? null;
  const graded = ctx.results != null;
  const border = r ? (r.is_correct ? RUN.ok : BAD) : ctx.focusedQ === n ? RUN.v : RUN.bField;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, verticalAlign: "middle" }}>
      <select
        value={ctx.answers[n] ?? ""}
        disabled={graded}
        aria-label={`Answer ${n}`}
        onChange={(e) => {
          ctx.setFocus(n);
          ctx.setAnswers((prev) => ({ ...prev, [n]: e.target.value }));
        }}
        style={{
          width: 70,
          height: 36,
          padding: "0 10px",
          borderRadius: 9,
          border: `1.5px solid ${border}`,
          background: r ? (r.is_correct ? RUN.okTint : "#FDF2F2") : "#fff",
          fontFamily: RUN.sans,
          fontSize: 14,
          fontWeight: 700,
          color: RUN.t1,
        }}
      >
        <option value="">–</option>
        {letters.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
      {r ? (
        r.is_correct ? (
          <Check size={16} color={RUN.ok} />
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <X size={16} color={BAD} />
            <span style={{ fontSize: 13, fontWeight: 700, color: RUN.ok, whiteSpace: "nowrap" }}>
              → {r.correct_answer}
            </span>
          </span>
        )
      ) : null}
    </span>
  );
}

/** Flow-chart completion (P3 flow variant) — an ordered process whose gaps are
 *  filled from a shared A–H word bank (letter answers, like the matching run). */
function FlowChartPanel({ flow, ctx, bare }: { flow: FlowChartView; ctx: QCtx; bare?: boolean }) {
  const letters = Object.keys(flow.options).sort();
  const range = rangeLabel(flow.steps.flatMap(gapNums));
  return (
    <div>
      {bare ? null : (
        <QuestionsHeading
          text={`Questions ${range}`}
          instruction={`Choose your answers from the box — write the correct letter, ${letters[0]}–${letters[letters.length - 1]}.`}
        />
      )}
      {flow.title ? (
        <div
          style={{
            fontFamily: RUN.sans,
            fontWeight: 600,
            fontSize: 15,
            color: RUN.t1,
            margin: "2px 0 12px",
          }}
        >
          {flow.title}
        </div>
      ) : null}

      {/* The word bank */}
      <div
        style={{
          border: `1.5px solid ${RUN.bField}`,
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
          background: RUN.field,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "7px 18px",
        }}
      >
        {letters.map((letter) => (
          <div
            key={letter}
            style={{ fontFamily: RUN.sans, fontSize: 14, color: RUN.t1, display: "flex", gap: 10 }}
          >
            <strong style={{ width: 16, flex: "none", color: RUN.vHover }}>{letter}</strong>
            <span>{flow.options[letter]}</span>
          </div>
        ))}
      </div>

      {/* The ordered steps, top to bottom */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {flow.steps.map((step, si) => {
          const n = gapNums(step)[0] ?? null;
          const r = n != null ? (ctx.results?.get(n) ?? null) : null;
          const last = si === flow.steps.length - 1;
          return (
            <Fragment key={si}>
              <div
                id={n != null ? `q-${n}` : undefined}
                style={{
                  border: `1.5px solid ${r ? (r.is_correct ? RUN.ok : BAD) : RUN.bField}`,
                  borderRadius: 12,
                  background: r ? (r.is_correct ? RUN.okTint : "#FDF2F2") : "#fff",
                  padding: "13px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  fontFamily: RUN.sans,
                  fontSize: 15,
                  color: RUN.t1,
                  lineHeight: 1.9,
                }}
              >
                {n != null ? (
                  <NumChip n={n} answered={(ctx.answers[n] ?? "").trim() !== ""} />
                ) : null}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 6,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {templateParts(step).map((part, i) =>
                    "text" in part ? (
                      part.text.trim() ? (
                        <span key={i}>{part.text}</span>
                      ) : null
                    ) : (
                      <FlowGapSelect key={i} n={part.gap} letters={letters} ctx={ctx} />
                    ),
                  )}
                </span>
                {n != null ? (
                  <FlagButton flagged={ctx.flags.has(n)} onClick={() => ctx.toggleFlag(n)} />
                ) : null}
              </div>
              {!last ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    color: RUN.t4,
                    padding: "5px 0",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="6 13 12 19 18 13" />
                  </svg>
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ---- Review -------------------------------------------------------------------

function ReviewPanel({ grade }: { grade: Grade }) {
  const wrong = grade.results.filter((r) => !r.is_correct);
  const trapped = grade.results.filter((r) => r.trap && TRAP_EXPLAIN[r.trap]);
  const ratio = grade.score / grade.max_score;
  const card: React.CSSProperties = {
    background: "#fff",
    border: `1px solid ${RUN.bCard}`,
    borderRadius: 16,
    padding: "20px 22px",
  };
  const heading: React.CSSProperties = {
    fontFamily: RUN.display,
    fontWeight: 700,
    fontSize: 19,
    letterSpacing: "-0.01em",
    margin: "0 0 12px",
    color: RUN.t1,
  };
  return (
    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Score summary */}
      <div style={{ ...card, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: RUN.display,
            fontSize: 40,
            fontWeight: 700,
            color: ratio >= 0.7 ? RUN.ok : ratio >= 0.4 ? RUN.t1 : BAD,
            lineHeight: 1,
          }}
        >
          {grade.score}
          <span style={{ fontSize: 20, color: RUN.t4 }}>/{grade.max_score}</span>
        </span>
        {grade.band != null ? (
          <span
            style={{
              padding: "8px 16px",
              borderRadius: 12,
              background: RUN.vBg,
              border: `1px solid ${RUN.vBorder}`,
              color: RUN.vDeep,
              fontWeight: 700,
              fontSize: 17,
              whiteSpace: "nowrap",
            }}
          >
            Band {grade.band.toFixed(1)}
          </span>
        ) : null}
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontFamily: RUN.sans, fontWeight: 700, fontSize: 15.5, color: RUN.t1 }}>
            {grade.score === grade.max_score
              ? "Perfect — every answer caught."
              : wrong.length <= 3
                ? "Strong listening — review the ones that got away."
                : "Good practice — the traps below are where the marks went."}
          </div>
          <div style={{ fontFamily: RUN.sans, fontSize: 13.5, color: RUN.t3, marginTop: 3 }}>
            Corrections are marked next to each question above. The transcript below shows exactly
            where each answer was said.
          </div>
        </div>
        {(grade.parts ?? []).length > 0 ? (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", width: "100%" }}>
            {(grade.parts ?? []).map((p) => (
              <span
                key={p.part}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  background: RUN.bRow,
                  border: `1px solid ${RUN.bTab}`,
                  fontFamily: RUN.sans,
                  fontSize: 13,
                  fontWeight: 700,
                  color: p.score / p.max_score >= 0.7 ? RUN.ok : RUN.t2,
                }}
              >
                Part {p.part}: {p.score}/{p.max_score}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Trap explanations */}
      {trapped.length > 0 ? (
        <div style={card}>
          <h3 style={heading}>Why the traps worked</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {trapped.map((r) => (
              <div key={r.q} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span
                  style={{
                    flex: "none",
                    width: 30,
                    height: 24,
                    borderRadius: 7,
                    background: r.is_correct ? RUN.okBg : "#FDECEC",
                    color: r.is_correct ? RUN.ok : BAD,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: RUN.sans,
                    fontSize: 12.5,
                    fontWeight: 700,
                  }}
                >
                  {r.q}
                </span>
                <div
                  style={{ fontFamily: RUN.sans, fontSize: 13.5, lineHeight: 1.55, color: RUN.t2 }}
                >
                  <strong style={{ color: RUN.t1 }}>{r.correct_answer}</strong> —{" "}
                  {TRAP_EXPLAIN[r.trap as string]}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Transcript */}
      <div style={card}>
        <h3 style={heading}>Transcript</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {grade.transcript.map((l, i) => (
            <div
              key={i}
              style={{ fontFamily: RUN.sans, fontSize: 14, lineHeight: 1.6, color: RUN.t1 }}
            >
              <span style={{ fontWeight: 700, color: RUN.v }}>{l.speaker}: </span>
              {l.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
