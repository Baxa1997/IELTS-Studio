"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, FileText, Layers, Loader2, Sparkles } from "lucide-react";

import { READING_QUESTION_LABELS, type ReadingQuestionType } from "@/lib/reading/types";

import { GeneratePassageButton, StartTestButton } from "./generate-button";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#4338CA";
const INK = "#1C1B2E";
const MUTED = "#56556A";

/** The learner's own freshly-generated test (opens directly). */
export interface TestCard {
  id: string;
  targetBand: number | null;
  createdAt: string;
}

/** A shared, ready-to-start sample test (cloned into the learner's org on Start). */
export interface LibraryTest {
  id: string;
  targetBand: number | null;
}

/** A passage card — used for both library samples and the learner's own. */
export interface PassageCard {
  id: string;
  title: string;
  topic: string | null;
  difficulty: number | null;
  questionCount: number;
  types: ReadingQuestionType[];
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
}: {
  levelBand: number | null;
  levelMeasured: boolean;
  libraryTests: LibraryTest[];
  ownTests: TestCard[];
  libraryPassages: PassageCard[];
  ownPassages: PassageCard[];
}) {
  const [tab, setTab] = useState<Tab>("test");
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startLibrary(kind: Tab, id: string) {
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
      router.push(kind === "test" ? `/read/test/${body.id}` : `/read/${body.id}`);
    } catch {
      setError("Network error — please try again.");
      setLoadingId(null);
    }
  }

  return (
    <div
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
          <p style={{ fontSize: 15, lineHeight: 1.5, color: MUTED, margin: "6px 0 0" }}>
            Start a ready-made test in one click, or generate a fresh one — marked instantly, with
            the evidence behind every answer.
          </p>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            background: "#EAEAFB",
            border: "1px solid rgba(67,56,202,.16)",
            color: INDIGO,
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: INDIGO }} />
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
          background: "#F1F1F8",
          border: "1px solid #ECEAF2",
          borderRadius: 14,
          padding: 5,
          marginTop: 22,
          maxWidth: 520,
        }}
      >
        <TabButton
          active={tab === "test"}
          onClick={() => setTab("test")}
          icon={<Layers size={17} />}
          label="Full reading test"
          sub="3 passages · 60 min"
        />
        <TabButton
          active={tab === "passage"}
          onClick={() => setTab("passage")}
          icon={<FileText size={17} />}
          label="Passage practice"
          sub="1 passage · ~20 min"
        />
      </div>

      {/* Panel */}
      {tab === "test" ? (
        <Panel
          title="Full reading test"
          blurb="Three original passages that rise in difficulty, pitched to your band — moved through freely under one 60-minute timer."
          action={<StartTestButton label="Generate fresh test" />}
        >
          {ownTests.length > 0 ? (
            <>
              <SectionLabel>Your tests</SectionLabel>
              <Grid>
                {ownTests.map((t) => (
                  <TestTile
                    key={t.id}
                    title="Full reading test"
                    footerLeft={fmtDate(t.createdAt)}
                    isNew
                    href={`/read/test/${t.id}`}
                  />
                ))}
              </Grid>
            </>
          ) : null}

          {libraryTests.length > 0 ? (
            <>
              <SectionLabel>Ready to start</SectionLabel>
              <Grid>
                {libraryTests.map((t) => (
                  <TestTile
                    key={t.id}
                    title="Sample reading test"
                    footerLeft={
                      t.targetBand != null ? `Around band ${t.targetBand}` : "Mixed levels"
                    }
                    onStart={() => void startLibrary("test", t.id)}
                    loading={loadingId === t.id}
                  />
                ))}
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
          title="Passage practice"
          blurb="One original passage with marked questions (~20 min) — the same instant feedback, when you're short on time."
          action={<GeneratePassageButton label="Generate fresh passage" />}
        >
          {ownPassages.length > 0 ? (
            <>
              <SectionLabel>Your passages</SectionLabel>
              <Grid>
                {ownPassages.map((p) => (
                  <PassageTile key={p.id} p={p} isNew href={`/read/${p.id}`} />
                ))}
              </Grid>
            </>
          ) : null}

          {libraryPassages.length > 0 ? (
            <>
              <SectionLabel>Ready to start</SectionLabel>
              <Grid>
                {libraryPassages.map((p) => (
                  <PassageTile
                    key={p.id}
                    p={p}
                    onStart={() => void startLibrary("passage", p.id)}
                    loading={loadingId === p.id}
                  />
                ))}
              </Grid>
            </>
          ) : null}

          {libraryPassages.length === 0 && ownPassages.length === 0 ? (
            <EmptyHint>No ready passages yet — generate one above.</EmptyHint>
          ) : null}
        </Panel>
      )}

      {error ? (
        <p
          style={{ margin: "16px 0 0", fontSize: 13.5, color: "#c2410c", fontFamily: SANS }}
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <p style={{ margin: "32px 0 0", fontSize: 13, color: "#9A99A8" }}>
        Original passages in the IELTS Academic Reading format. Not affiliated with or endorsed by
        IELTS®.
      </p>
    </div>
  );
}

// ---- Cards -----------------------------------------------------------------

/** A full-test card. Renders as a link (own test → opens directly) or a button
 *  (library sample → clones on click). Identical visuals either way. */
function TestTile({
  title,
  footerLeft,
  href,
  onStart,
  loading,
  isNew,
}: {
  title: string;
  footerLeft: string;
  href?: string;
  onStart?: () => void;
  loading?: boolean;
  isNew?: boolean;
}) {
  const body = (
    <>
      {isNew ? <AiCorner /> : null}
      <div style={rowBetween}>
        <RisingBars />
      </div>
      <div>
        <h4 style={cardTitle}>{title}</h4>
        <span style={cardSub}>3 passages · ~40 questions</span>
      </div>
      <Divider />
      <div style={rowBetween}>
        <span style={metaText}>{footerLeft}</span>
        <StartAction loading={loading} />
      </div>
    </>
  );
  return href ? (
    <Link href={href} className="lp-hover" style={cardStyle}>
      {body}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onStart}
      disabled={loading}
      className="lp-hover"
      style={cardAsButton(loading)}
    >
      {body}
    </button>
  );
}

/** A passage card. Link (own) or button (library sample → clones on click). */
function PassageTile({
  p,
  href,
  onStart,
  loading,
  isNew,
}: {
  p: PassageCard;
  href?: string;
  onStart?: () => void;
  loading?: boolean;
  isNew?: boolean;
}) {
  const tier = bandTier(p.difficulty);
  const body = (
    <>
      {isNew ? <AiCorner /> : null}
      <div style={rowBetween}>
        <span style={iconTile}>
          <FileText size={19} />
        </span>
        {!isNew && tier ? (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 700,
              background: tier.bg,
              color: tier.fg,
            }}
          >
            {tier.label}
          </span>
        ) : null}
      </div>
      <div>
        <h4
          style={{
            ...cardTitle,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {p.title}
        </h4>
        <span style={cardSub}>{p.topic ?? "Academic Reading"}</span>
      </div>
      {p.types.length ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {p.types.slice(0, 3).map((t) => (
            <span key={t} style={typeTag}>
              {READING_QUESTION_LABELS[t]}
            </span>
          ))}
        </div>
      ) : null}
      <Divider />
      <div style={rowBetween}>
        <span style={metaText}>{p.questionCount} questions</span>
        <StartAction loading={loading} />
      </div>
    </>
  );
  return href ? (
    <Link href={href} className="lp-hover" style={cardStyle}>
      {body}
    </Link>
  ) : (
    <button
      type="button"
      onClick={onStart}
      disabled={loading}
      className="lp-hover"
      style={cardAsButton(loading)}
    >
      {body}
    </button>
  );
}

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
      <div
        className="lp-ai-surface"
        style={{
          marginTop: 18,
          border: "1px solid #DEDCF5",
          borderRadius: 14,
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
        }}
      >
        <div style={{ maxWidth: 560 }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 20, margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: MUTED, margin: "5px 0 0" }}>{blurb}</p>
        </div>
        {action}
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

/** Top-right corner marker for the learner's own AI-generated cards (shown instead
 *  of a band). */
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

/** Footer action: "Start" → arrow, or a spinner while the clone is in flight. */
function StartAction({ loading }: { loading?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: INDIGO,
        fontSize: 14.5,
        fontWeight: 600,
      }}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={15} /> Opening…
        </>
      ) : (
        <>
          Start <ArrowRight size={15} strokeWidth={2.2} />
        </>
      )}
    </span>
  );
}

function RisingBars() {
  const bars = [
    { h: 15, c: "#C2C5F0" },
    { h: 22, c: "#9196E8" },
    { h: 31, c: INDIGO },
  ];
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 31 }} aria-hidden>
      {bars.map((b, i) => (
        <span key={i} style={{ width: 12, height: b.h, borderRadius: 3, background: b.c }} />
      ))}
    </div>
  );
}

function bandTier(d: number | null): { label: string; bg: string; fg: string } | null {
  if (d == null) return null;
  if (d <= 5) return { label: `Band ${d}`, bg: "#DCF3E4", fg: "#147A4F" };
  if (d === 6) return { label: "Band 6", bg: "#E2EEF8", fg: "#1F6FB0" };
  if (d === 7) return { label: "Band 7", bg: "#F6EAD2", fg: "#9A5B12" };
  return { label: `Band ${d}`, bg: "#F7E1E6", fg: "#A23B53" };
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// ---- Shared styles ---------------------------------------------------------

const cardStyle: React.CSSProperties = {
  position: "relative",
  background: "#fff",
  border: "1px solid rgba(28,27,46,.09)",
  borderRadius: 16,
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 13,
  textDecoration: "none",
  color: INK,
  boxShadow: "0 1px 3px rgba(28,27,46,.04)",
};

/** cardStyle as an accessible <button> (sample cards clone on click). */
function cardAsButton(loading?: boolean): React.CSSProperties {
  return {
    ...cardStyle,
    width: "100%",
    textAlign: "left",
    fontFamily: SANS,
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
  };
}

const rowBetween: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};
const cardTitle: React.CSSProperties = {
  fontFamily: SERIF,
  fontWeight: 600,
  fontSize: 18,
  lineHeight: 1.25,
  margin: "0 0 4px",
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
const typeTag: React.CSSProperties = {
  background: "#F4F4FB",
  border: "1px solid #ECEAF2",
  color: "#5A596B",
  fontSize: 12,
  fontWeight: 600,
  padding: "3px 9px",
  borderRadius: 7,
};
