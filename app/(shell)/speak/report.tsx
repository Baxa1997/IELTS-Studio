/**
 * Speaking report — shared presentational block (no hooks) rendered inline by
 * the practice flow right after grading AND by /speak/results/[id]. Mirrors the
 * writing-feedback design language: bandColor hero strip (big number + tier
 * chip + lift pill + criterion mini-cards with bars), then per-criterion
 * evidence/caps/fix cards, delivery metrics, upgrades.
 */

import { bandColor } from "@/lib/ui/band";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1C1B2E";
const MUTED = "#56556A";
const INDIGO = "#4338CA";
const TINT = "#EFEEFC";
const LINE = "#E8E6F0";
const GOOD = "#15803d";
const GOOD_BG = "#e7f7ee";
const AMBER = "#B5852A";

export interface SpeakCriterion {
  band: number;
  evidence: string;
  what_caps_it: string;
  fix: string;
  beta?: boolean;
}

export interface SpeakResult {
  overall_band: number;
  criteria: Record<string, SpeakCriterion>;
  score_blocker?: { criterion: string; why: string };
  band_with_fixes?: number;
  highlights?: string[];
  upgrades?: { you_said: string; stronger: string; note: string }[];
  cue_card?: { title: string; bullets: string[]; closing: string };
  non_attempt?: boolean;
  /** full-mock only: parts the candidate never sat (e.g. ["2","3"]) */
  partial?: string[];
  pronunciation_beta?: boolean;
}

export interface SpeakMetrics {
  duration_s?: number;
  words?: number;
  wpm?: number;
  fillers?: number;
  filler_per_min?: number;
  distinct_ratio?: number;
}

const CARD: React.CSSProperties = {
  background: "#fff",
  border: `1px solid ${LINE}`,
  borderRadius: 16,
  padding: "18px 20px",
};

const CRIT_NAME: Record<string, string> = {
  FC: "Fluency & Coherence",
  LR: "Lexical Resource",
  GRA: "Grammar Range & Accuracy",
  P: "Pronunciation",
};

const CRIT_SHORT: Record<string, string> = {
  FC: "Fluency",
  LR: "Vocabulary",
  GRA: "Grammar",
  P: "Pronunciation",
};

function fmtBand(b: number): string {
  return Number.isInteger(b) ? `${b}.0` : String(b);
}

export function SpeakingReport({
  result,
  metrics,
  transcript,
  audioUrl,
}: {
  result: SpeakResult;
  metrics: SpeakMetrics;
  transcript: string;
  audioUrl?: string | null;
}) {
  const cue = result.cue_card;
  const fixes = result.band_with_fixes ?? result.overall_band;
  const critKeys = ["FC", "LR", "GRA", "P"].filter((k) => result.criteria?.[k]);
  // With real long-turn audio behind Pronunciation, the band uses the official
  // four-criterion structure; otherwise P is an estimate and stays out.
  const pBeta = result.criteria?.P ? result.criteria.P.beta !== false : true;
  const partial = result.partial ?? [];
  const bc = bandColor(result.overall_band);

  return (
    <div style={{ fontFamily: SANS, color: INK, display: "flex", flexDirection: "column", gap: 14 }}>
      {/* partial-test banner — a 3-minute walkout must never read like a full-test verdict */}
      {partial.length ? (
        <div
          style={{
            border: "1px solid #F0E1BB",
            background: "#FBF3DE",
            borderRadius: 14,
            padding: "12px 16px",
            fontSize: 13.5,
            lineHeight: 1.55,
            color: "#7A5B14",
          }}
        >
          <strong>Partial test.</strong> {partial.length === 2 ? "Parts 2 and 3 were" : `Part ${partial[0]} was`} not
          attempted, so this band reflects only what you completed — an examiner can&rsquo;t credit
          speech that never happened. Sit all three parts for a full assessment.
        </div>
      ) : null}

      {/* hero — the writing report's score strip: big banded number + tier
          chip + lift pill + criterion mini-cards with bars */}
      <div style={{ ...CARD, display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
        <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              fontSize: 62, fontWeight: 800, lineHeight: 0.82, color: bc.fg,
              fontVariantNumeric: "tabular-nums", letterSpacing: "-.03em",
            }}
          >
            {result.overall_band.toFixed(1)}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".04em", color: "#8A8FA0", textTransform: "uppercase", lineHeight: 1.1 }}>
              Overall<br />band
            </span>
            <span style={{ alignSelf: "flex-start", fontSize: 11.5, fontWeight: 700, color: bc.fg, background: bc.bg, padding: "2px 9px", borderRadius: 999, whiteSpace: "nowrap" }}>
              {bc.label}
            </span>
          </div>
        </div>
        {fixes > result.overall_band ? (
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8, padding: "7px 13px", background: GOOD_BG, border: "1px solid #cfe7da", borderRadius: 11 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOOD} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
            <span style={{ fontSize: 13.5, color: "#2C7A52", fontWeight: 600 }}>
              Up to <strong style={{ fontWeight: 800, color: "#1A7A48" }}>{fixes.toFixed(1)}</strong> with the fixes
            </span>
          </div>
        ) : null}
        <div
          style={{
            flex: 1, minWidth: 250, display: "grid", gap: 10,
            gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))",
          }}
        >
          {critKeys.map((k) => {
            const c = result.criteria[k];
            const isBlocker = result.score_blocker?.criterion === k;
            const isBeta = k === "P" && pBeta;
            const color = isBlocker ? "#C2410C" : c.band >= 6 ? "#2C3247" : AMBER;
            const tag = isBeta
              ? "Beta — not counted"
              : isBlocker
                ? "Fix this first"
                : c.band >= 7
                  ? "Strong"
                  : c.band >= 6
                    ? "Solid"
                    : "Needs work";
            const tagColor = isBeta ? AMBER : isBlocker ? "#C2410C" : c.band >= 6 ? "#9A9EAE" : AMBER;
            return (
              <div
                key={k}
                style={{
                  background: isBlocker ? "#FCEEEA" : "#F7F7FB",
                  border: `1px solid ${isBlocker ? "#F3CFC6" : LINE}`,
                  borderRadius: 12, padding: "10px 12px", minWidth: 0,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {CRIT_SHORT[k] ?? k}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 800, color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
                    {c.band.toFixed(1)}
                  </span>
                </div>
                <div style={{ marginTop: 8, height: 5, borderRadius: 3, background: isBlocker ? "#F3DAD3" : "#EBEAF3", overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((Math.min(9, c.band) / 9) * 100)}%`, height: "100%", borderRadius: 3, background: isBlocker ? "#C2410C" : INDIGO, opacity: isBeta ? 0.45 : 1 }} />
                </div>
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 600, color: tagColor }}>{tag}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* what holds it down + how the band is built */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {result.score_blocker?.why ? (
          <div style={{ fontSize: 13.5, color: MUTED }}>
            <strong style={{ color: INK }}>{CRIT_NAME[result.score_blocker.criterion] ?? result.score_blocker.criterion}</strong>{" "}
            holds it down: {result.score_blocker.why}
          </div>
        ) : null}
        <div style={{ fontSize: 12, color: "#9A9EAE" }}>
          {pBeta
            ? "Average of Fluency, Vocabulary and Grammar, rounded down to the half band — deliberately conservative. Pronunciation is shown but not counted until it hears enough audio."
            : "Official structure: all four criteria weigh 25% each, rounded down to the half band — deliberately conservative. Pronunciation was assessed from your Part 2 recording."}
        </div>
      </div>

      {/* cue card + audio */}
      {cue ? (
        <div style={{ ...CARD, background: TINT, borderColor: "#DDDAF6" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{cue.title}</div>
          <div style={{ fontSize: 13.5, color: MUTED, marginTop: 6 }}>
            You should say: {cue.bullets?.join(" · ")} — {cue.closing}
          </div>
          {audioUrl ? (
            <audio controls src={audioUrl} style={{ width: "100%", marginTop: 12 }} preload="none" />
          ) : null}
        </div>
      ) : audioUrl ? (
        <audio controls src={audioUrl} style={{ width: "100%" }} preload="none" />
      ) : null}

      {/* delivery metrics */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[
          ["Speaking time", metrics.duration_s != null ? `${Math.round(metrics.duration_s)}s` : "—"],
          ["Words", metrics.words ?? "—"],
          ["Pace", metrics.wpm ? `${metrics.wpm} wpm` : "—"],
          ["Fillers", metrics.fillers != null ? `${metrics.fillers} (${metrics.filler_per_min}/min)` : "—"],
          ["Distinct words", metrics.distinct_ratio != null ? `${Math.round((metrics.distinct_ratio ?? 0) * 100)}%` : "—"],
        ].map(([k, v]) => (
          <span key={String(k)} style={{ fontSize: 13, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 999, padding: "7px 13px" }}>
            <span style={{ color: MUTED }}>{k}: </span>
            <strong>{String(v)}</strong>
          </span>
        ))}
      </div>

      {/* criteria */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        {critKeys.map((k) => {
          const c = result.criteria[k];
          return (
            <div key={k} style={CARD}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>
                  {CRIT_NAME[k]}
                  {c.beta ? (
                    <span style={{ marginLeft: 7, fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em", color: AMBER }}>BETA</span>
                  ) : null}
                </span>
                <span style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 600, color: INDIGO }}>{fmtBand(c.band)}</span>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "#3A3F58" }}>{c.evidence}</p>
              {c.what_caps_it ? (
                <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: MUTED }}>
                  <strong style={{ color: AMBER }}>Caps it:</strong> {c.what_caps_it}
                </p>
              ) : null}
              {c.fix ? (
                <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55 }}>
                  <strong style={{ color: GOOD }}>Fix:</strong> {c.fix}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* highlights + upgrades */}
      {result.highlights?.length ? (
        <div style={CARD}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>What worked</div>
          <ul style={{ margin: "8px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            {result.highlights.map((h) => (
              <li key={h} style={{ fontSize: 13.5, lineHeight: 1.55, color: "#3A3F58" }}>{h}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {result.upgrades?.length ? (
        <div style={CARD}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>Say it stronger</div>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {result.upgrades.map((u, i) => (
              <div key={i} style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                <span style={{ color: MUTED, textDecoration: "line-through" }}>{u.you_said}</span>{" "}
                <span aria-hidden>→</span>{" "}
                <strong style={{ color: INDIGO }}>{u.stronger}</strong>
                {u.note ? <span style={{ color: MUTED }}> — {u.note}</span> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* transcript */}
      {transcript ? (
        <details style={{ ...CARD, cursor: "pointer" }}>
          <summary style={{ fontWeight: 700, fontSize: 14 }}>Your transcript (verbatim)</summary>
          <p style={{ margin: "10px 0 0", fontSize: 13.5, lineHeight: 1.7, color: "#3A3F58", whiteSpace: "pre-wrap" }}>{transcript}</p>
        </details>
      ) : null}

      <p style={{ margin: 0, fontSize: 11.5, color: "#9A9EAE" }}>
        AI-estimated bands, deliberately conservative — not affiliated with or endorsed by IELTS®.
      </p>
    </div>
  );
}
