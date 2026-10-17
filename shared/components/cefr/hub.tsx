"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, FileText, History, Layers, Loader2, PenLine } from "lucide-react";
import { AiGenerateSection, AiGenerateButton } from "@/shared/components/ai-generate-section";
import { UpgradeNotice } from "@/shared/components/billing/upgrade-notice";
import {
  BRAND,
  BRAND_LIGHT,
  BRAND_PALE as TINT_BORDER,
  BRAND_SOFT,
  BRAND_SOFT as TINT,
  CANVAS,
  PANEL,
  SLATE_BODY as MUTED,
  SLATE_INK as INK,
  SLATE_LINE,
  SLATE_MUTED,
} from "@/lib/theme/tokens";
import { PRACTICE_GRID_COLUMNS } from "@/lib/practice/grid";

import { callEngine } from "./api";
import { READING_PARTS, WRITING_TASKS_META } from "./catalogue";
import { SANS, SERIF } from "./design";
import { ReadingGenerateModal } from "./reading-generate-modal";
import type { ReadingItem, ReadingMode, ReadingReq, Tab, WritingReq } from "./types";

// ---- Hub (tabbed, full-width landing) --------------------------------------


function fmtWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
  } catch {
    return "Saved";
  }
}

export function Hub({
  tab,
  onTab,
  busy,
  error,
  onReading,
  onWriting,
  onOpenItem,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
  busy: string | null;
  error: string | null;
  onReading: (req: ReadingReq, key: string, mode: ReadingMode) => void;
  onWriting: (req: WritingReq, key: string) => void;
  onOpenItem: (item: ReadingItem) => void;
}) {
  const [recent, setRecent] = useState<ReadingItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  // Load the learner's recent reading papers so they can reopen one instead of
  // regenerating. Reloads whenever the hub remounts (i.e. after exiting a paper).
  useEffect(() => {
    let alive = true;
    callEngine<{ items: ReadingItem[] }>("reading/list", {})
      .then((r) => {
        if (alive) setRecent(r.items ?? []);
      })
      .catch(() => {
        /* history is non-essential — the hub still generates fresh */
      });
    return () => {
      alive = false;
    };
  }, []);
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
            CEFR practice
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.5,
              color: MUTED,
              margin: "6px 0 0",
              maxWidth: 660,
            }}
          >
            The Uzbekistan Multilevel (DTM) exam — a 5-part / 35-question Reading paper and a 3-task
            Writing paper, generated fresh and graded instantly.
          </p>
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            background: TINT,
            border: `1px solid ${TINT_BORDER}`,
            color: BRAND,
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          <Layers size={15} /> B1 → C1
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
          marginTop: 22,
          maxWidth: 520,
        }}
      >
        <TabButton
          active={tab === "reading"}
          onClick={() => onTab("reading")}
          icon={<BookOpen size={17} />}
          label="Reading paper"
          sub="5 parts · 35 questions"
        />
        <TabButton
          active={tab === "writing"}
          onClick={() => onTab("writing")}
          icon={<PenLine size={17} />}
          label="Writing paper"
          sub="3 tasks · B1 → C1"
        />
      </div>

      {tab === "reading" ? (
        <>
          <div style={{ marginTop: 18, marginBottom: 28 }}>
            <AiGenerateSection
              title="AI Generate Reading"
              description="Generate the full 5-part DTM paper, or a single part on its own — fresh every time."
              cta={
                <AiGenerateButton
                  label="AI Generate Reading"
                  busyLabel="Writing your paper…"
                  generating={busy === "r-full"}
                  busy={!!busy}
                  minWidth={220}
                  onClick={() => setPickerOpen(true)}
                />
              }
            />
          </div>

          {pickerOpen ? (
            <ReadingGenerateModal
              onClose={() => setPickerOpen(false)}
              onFull={() => {
                setPickerOpen(false);
                onReading({ scope: "full" }, "r-full", "full");
              }}
              onPart={(part) => {
                setPickerOpen(false);
                onReading({ scope: "part", part }, `r-${part}`, "part");
              }}
            />
          ) : null}

          <SectionLabel>Practise a single part</SectionLabel>
          <Grid>
            {READING_PARTS.map((p) => (
              <PracticeCard
                key={p.part}
                Icon={p.Icon}
                eyebrow={`Part ${p.part}`}
                title={p.title}
                desc={p.desc}
                level={p.level}
                meta={`${p.count} questions`}
                loading={busy === `r-${p.part}`}
                disabled={!!busy}
                onClick={() => onReading({ scope: "part", part: p.part }, `r-${p.part}`, "part")}
              />
            ))}
          </Grid>

          {/* Recent papers load async from the engine AFTER the hub mounts, so they
              sit BELOW the static content — arriving late they append instead of
              pushing the practice grid down (the "content jump"). Compact rows, not
              cards: every entry says the same thing, so one line each is enough. */}
          {recent.length > 0 ? (
            <div style={{ marginTop: 28 }}>
              <SectionLabel>Your recent papers</SectionLabel>
              <div
                style={{
                  background: PANEL,
                  border: "1px solid var(--pc-border)",
                  borderRadius: 14,
                  overflow: "hidden",
                  boxShadow: "var(--pc-shadow)",
                }}
              >
                {recent.map((it, i) => (
                  <RecentRow
                    key={it.id}
                    it={it}
                    first={i === 0}
                    loading={busy === `item-${it.id}`}
                    disabled={!!busy}
                    onOpen={() => onOpenItem(it)}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div style={{ marginTop: 18, marginBottom: 28 }}>
            <AiGenerateSection
              title="Full writing paper"
              description="Three prompts at rising levels — an informal note (B1), a formal letter (B2) and a forum post (C1), graded on a calibrated CEFR rubric."
              cta={
                <AiGenerateButton
                  label="Generate full paper"
                  busyLabel="Writing your prompts…"
                  generating={busy === "w-full"}
                  busy={!!busy}
                  minWidth={200}
                  onClick={() => onWriting({ scope: "full" }, "w-full")}
                />
              }
            />
          </div>
          <SectionLabel>Or practise a single task</SectionLabel>
          <Grid>
            {WRITING_TASKS_META.map((t) => (
              <PracticeCard
                key={t.task}
                Icon={t.Icon}
                eyebrow={`Task ${t.task}`}
                title={t.title}
                desc={t.desc}
                level={t.level}
                meta="Graded · model answer"
                loading={busy === `w-${t.task}`}
                disabled={!!busy}
                onClick={() => onWriting({ scope: "task", task: t.task }, `w-${t.task}`)}
              />
            ))}
          </Grid>
        </>
      )}

      {error ? <UpgradeNotice message={error} /> : null}

      <p style={{ margin: "32px 0 0", fontSize: 13, color: SLATE_MUTED }}>
        Original content in the Uzbekistan Multilevel (DTM) format. Not affiliated with or endorsed
        by the State Testing Centre.
      </p>
    </div>
  );
}

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 16px" }}>
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INK }}>
        {children}
      </span>
      <span style={{ height: 1, flex: 1, background: "var(--ex-hub-rule)" }} />
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: PRACTICE_GRID_COLUMNS,
        gap: 14,
      }}
    >
      {children}
    </div>
  );
}

/** One practice option — kept deliberately plain: icon + title + level up top, a
 *  single line of description, and a meta/Start footer. No eyebrow/serif layers. */
function PracticeCard({
  Icon,
  eyebrow,
  title,
  desc,
  level,
  meta,
  loading,
  disabled,
  onClick,
  cta = "Start",
  busyLabel = "Generating…",
}: {
  Icon: typeof BookOpen;
  eyebrow: string;
  title: string;
  desc: string;
  level: string;
  meta: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  cta?: string;
  busyLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="lp-hover"
      style={{
        position: "relative",
        background: PANEL,
        border: "1px solid var(--pc-border)",
        borderRadius: 14,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        textAlign: "left",
        fontFamily: SANS,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !loading ? 0.55 : 1,
        boxShadow: "var(--pc-shadow)",
        width: "100%",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: BRAND_SOFT,
              color: BRAND,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <Icon size={17} />
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 15,
              color: INK,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {title}
          </span>
        </span>
        <span
          style={{
            padding: "3px 9px",
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 700,
            background: TINT,
            color: BRAND,
            flex: "none",
          }}
        >
          {level}
        </span>
      </div>
      <span style={{ fontSize: 13, color: SLATE_MUTED, lineHeight: 1.45 }}>{desc}</span>
      <div
        style={{
          marginTop: "auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          borderTop: "1px solid var(--pc-rule)",
          paddingTop: 10,
        }}
      >
        <span style={{ fontSize: 12.5, color: SLATE_MUTED }}>
          {eyebrow} · {meta}
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: BRAND,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={15} /> {busyLabel}
            </>
          ) : (
            <>
              {cta} <ArrowRight size={15} strokeWidth={2.2} />
            </>
          )}
        </span>
      </div>
    </button>
  );
}

/** A previously generated paper as a one-line row (reopen, no regeneration). */
function RecentRow({
  it,
  first,
  loading,
  disabled,
  onOpen,
}: {
  it: ReadingItem;
  first: boolean;
  loading: boolean;
  disabled: boolean;
  onOpen: () => void;
}) {
  const full = it.scope !== "part";
  const part = it.parts[0];
  return (
    <button
      type="button"
      onClick={onOpen}
      disabled={disabled}
      className="lp-row"
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: "transparent",
        border: "none",
        borderTop: first ? "none" : "1px solid var(--pc-rule)",
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        fontFamily: SANS,
        opacity: disabled && !loading ? 0.6 : 1,
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: BRAND_SOFT,
          color: BRAND,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flex: "none",
        }}
      >
        {full ? <History size={16} /> : <FileText size={16} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "block",
            fontSize: 14.5,
            fontWeight: 600,
            color: INK,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {full ? "Full reading paper" : `Part ${part ?? ""} practice`}
        </span>
        <span style={{ display: "block", fontSize: 12.5, color: SLATE_MUTED, marginTop: 1 }}>
          {full ? "35 questions" : "single part"} · {fmtWhen(it.created_at)}
        </span>
      </span>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: BRAND,
          fontSize: 13.5,
          fontWeight: 600,
          flex: "none",
        }}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={14} /> Opening…
          </>
        ) : (
          <>
            Open <ArrowRight size={14} />
          </>
        )}
      </span>
    </button>
  );
}
