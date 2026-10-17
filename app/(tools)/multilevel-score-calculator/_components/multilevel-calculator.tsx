"use client";

import { useState } from "react";

import { NumberField } from "../../_components/controls";
import { fill, plain, type MultilevelCopy } from "../../_lib/copy";
import {
  MULTILEVEL_LEVELS,
  MULTILEVEL_MAX,
  MULTILEVEL_SECTIONS,
  RATER_MAX,
  WRITING_TASK_MAX,
  multilevelLevelFromCorrect,
  multilevelNext,
  multilevelResult,
  raterScore,
  type MultilevelSection,
} from "../../_lib/scores";
import { MULTILEVEL_GROUND, levelBackground } from "../../_lib/tool-css";

/** A worked example on arrival, as on the IELTS calculator. */
const START: Record<MultilevelSection, number> = { listening: 58, reading: 61, writing: 52, speaking: 57 };

/** The level ranges in scale order, lowest first, for the coloured bar. */
const BAR = [...MULTILEVEL_LEVELS].reverse();

type Copy = Pick<MultilevelCopy, "overall" | "rater" | "correct" | "levelNames">;

export function MultilevelCalculator({ copy }: { copy: Copy }) {
  const { overall: o, rater: w, correct: c, levelNames } = copy;
  const [scores, setScores] = useState(START);
  const [task1, setTask1] = useState(8);
  const [task2, setTask2] = useState(16);
  const [speaking, setSpeaking] = useState(24);
  const [correct, setCorrect] = useState(22);
  const [used, setUsed] = useState<MultilevelSection | null>(null);

  const list = MULTILEVEL_SECTIONS.map((s) => scores[s]);
  const result = multilevelResult(list);
  const next = multilevelNext(list);
  // A borderline average wears the lower level's colour: the cautious reading.
  const shown = result.kind === "level" ? result.level : result.below.level;
  const level = multilevelLevelFromCorrect(correct);

  const writingMark = task1 + task2;
  const writingScore = raterScore(writingMark);
  const speakingScore = raterScore(speaking);

  const set = (s: MultilevelSection, v: number) => {
    setScores((x) => ({ ...x, [s]: v }));
    setUsed(null);
  };

  return (
    <>
      <div className="tl-calc">
        <div className="tl-card" style={{ display: "grid", gap: 18 }}>
          {MULTILEVEL_SECTIONS.map((s) => (
            <NumberField
              key={s}
              id={`ml-${s}`}
              label={`${o.sections[s]} · ${fill(o.outOf, { max: MULTILEVEL_MAX })}`}
              value={scores[s]}
              min={0}
              max={MULTILEVEL_MAX}
              step={1}
              onChange={(v) => set(s, v)}
            />
          ))}
        </div>

        <div className="tl-sticky">
          <div className="tl-result" style={{ backgroundImage: levelBackground(MULTILEVEL_GROUND[shown]) }} aria-live="polite">
            <span className="tl-pill">{o.resultLabel}</span>
            <div key={shown + result.kind} className="tl-big tl-pop" style={{ marginTop: 14 }}>
              {result.kind === "level"
                ? levelNames[result.level]
                : `${levelNames[result.below.level]}/${levelNames[result.above.level]}`}
            </div>
            <p className="tl-lead">{fill(o.average, { avg: plain(result.average) })}</p>
            {result.kind === "borderline" ? (
              <p className="tl-soft">
                {fill(o.borderline, {
                  avg: plain(result.average),
                  lower: result.below.to,
                  upper: result.above.from,
                  a: levelNames[result.below.level],
                  b: levelNames[result.above.level],
                })}
              </p>
            ) : null}
            <p className="tl-tip">{next ? fill(o.next, { level: levelNames[next.level], points: next.points }) : o.top}</p>
          </div>

          <div className="tl-card" style={{ marginTop: 14, padding: 18 }}>
            <div className="tl-caption" style={{ marginBottom: 12 }}>
              {o.scale}
            </div>
            <div style={{ position: "relative" }}>
              <div className="tl-scale">
                {BAR.map((l) => (
                  <div
                    key={l.level}
                    style={{
                      width: `${((l.to - l.from + 1) / (MULTILEVEL_MAX + 1)) * 100}%`,
                      backgroundImage: levelBackground(MULTILEVEL_GROUND[l.level]),
                    }}
                  />
                ))}
              </div>
              {/* The bar is 76 whole points (0 to 75), so a score sits in the
                  middle of its own slot — at 65 the marker is inside C1, not on
                  the seam before it. */}
              <div
                className="tl-marker"
                style={{ left: `calc(${((result.average + 0.5) / (MULTILEVEL_MAX + 1)) * 100}% - 2px)` }}
              />
            </div>
            <div className="tl-legend">
              {BAR.map((l) => (
                <span key={l.level}>
                  <i aria-hidden style={{ backgroundImage: levelBackground(MULTILEVEL_GROUND[l.level]) }} />
                  {levelNames[l.level]} {l.from}–{l.to}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="tl-card" style={{ marginTop: 22 }}>
        <h3 className="tl-h3">{w.title}</h3>
        <p className="tl-hint">{w.hint}</p>
        <div className="tl-calc">
          <Converter
            title={w.writing}
            mark={fill(w.mark, { mark: plain(writingMark) })}
            score={fill(w.score, { score: writingScore })}
            button={used === "writing" ? `✓ ${w.used}` : fill(w.use, { section: o.sections.writing })}
            onUse={() => {
              set("writing", writingScore);
              setUsed("writing");
            }}
          >
            <NumberField id="ml-task1" label={w.task1} value={task1} min={0} max={WRITING_TASK_MAX.task1} step={0.5} onChange={setTask1} />
            <NumberField id="ml-task2" label={w.task2} value={task2} min={0} max={WRITING_TASK_MAX.task2} step={0.5} onChange={setTask2} />
          </Converter>
          <Converter
            title={w.speaking}
            mark={fill(w.mark, { mark: plain(speaking) })}
            score={fill(w.score, { score: speakingScore })}
            button={used === "speaking" ? `✓ ${w.used}` : fill(w.use, { section: o.sections.speaking })}
            onUse={() => {
              set("speaking", speakingScore);
              setUsed("speaking");
            }}
          >
            <NumberField id="ml-speaking" label={w.speakingMark} value={speaking} min={0} max={RATER_MAX} step={0.5} onChange={setSpeaking} />
          </Converter>
        </div>
        <p className="tl-note">{w.note}</p>
      </div>

      <div className="tl-card" style={{ marginTop: 22 }}>
        <h3 className="tl-h3">{c.title}</h3>
        <p className="tl-hint">{c.hint}</p>
        <div className="tl-calc" style={{ alignItems: "center" }}>
          <NumberField id="ml-correct" label={c.label} value={correct} min={0} max={35} step={1} onChange={setCorrect} />
          <div aria-live="polite">
            <div className="tl-kicker">{fill(c.outOf, { n: correct })}</div>
            <div key={level} className="tl-answer tl-pop">
              {fill(c.result, { level: levelNames[level] })}
            </div>
          </div>
        </div>
        <p className="tl-note">{c.note}</p>
      </div>
    </>
  );
}

/** One rater-mark converter: its inputs, the mark and score they give, and the
 *  button that carries the score up into the level. */
function Converter({
  title,
  mark,
  score,
  button,
  onUse,
  children,
}: {
  title: string;
  mark: string;
  score: string;
  button: string;
  onUse: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 14, alignContent: "start" }}>
      <div className="tl-skill">{title}</div>
      {children}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div aria-live="polite">
          <div className="tl-kicker">{mark}</div>
          <div key={score} className="tl-answer tl-pop" style={{ fontSize: 30 }}>
            {score}
          </div>
        </div>
        <button type="button" className="tl-use" onClick={onUse}>
          {button}
        </button>
      </div>
    </div>
  );
}
