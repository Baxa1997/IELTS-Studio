"use client";

import dynamic from "next/dynamic";
import { RUN } from "./theme";
import type {
  ClusterView,
  FormRow,
  GroupType,
  GroupView,
  MapView,
  McqView,
  NoteSection,
  PartView,
  QCtx,
} from "./types";

import { ChooseTwoPanel, MatchingPanel, McqPanel, QuestionsHeading } from "./choice-panels";
import {
  CardHeader,
  FormPanel,
  Gapped,
  NotesPanel,
  TablePanel,
  rangeLabel,
} from "./completion-panels";
import { FlowChartPanel } from "./flow-chart-panel";
import { partQuestionNums } from "./part-questions";

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
export function PartPanels({ p, ctx }: { p: PartView; ctx: QCtx }) {
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
