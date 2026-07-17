/**
 * Speaking report — shared presentational block (no hooks) rendered inline by
 * the practice flow right after grading AND by /speak/results/[id]. Mirrors the
 * writing-feedback shape: band hero, per-criterion evidence/caps/fix cards
 * (P flagged beta, excluded from overall), delivery metrics, upgrades.
 */

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

      {/* hero */}
      <div style={{ ...CARD, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 18, justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".1em", color: MUTED, textTransform: "uppercase" }}>
            {pBeta ? "Overall band · FC + LR + GRA" : "Overall band · all four criteria"}
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 600, lineHeight: 1.1, color: INDIGO }}>
            {fmtBand(result.overall_band)}
          </div>
          {result.score_blocker?.why ? (
            <div style={{ fontSize: 13.5, color: MUTED, maxWidth: 460, marginTop: 4 }}>
              <strong style={{ color: INK }}>{CRIT_NAME[result.score_blocker.criterion] ?? result.score_blocker.criterion}</strong>{" "}
              holds it down: {result.score_blocker.why}
            </div>
          ) : null}
          <div style={{ fontSize: 12, color: "#9A9EAE", marginTop: 6 }}>
            {pBeta
              ? "Average of Fluency, Vocabulary and Grammar, rounded down to the half band — deliberately conservative. Pronunciation is shown below but not counted until it hears enough audio."
              : "The official structure: all four criteria weigh 25% each, rounded down to the half band — deliberately conservative. Pronunciation was assessed from your Part 2 recording."}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
          {fixes > result.overall_band ? (
            <span style={{ fontSize: 13, fontWeight: 700, color: GOOD, background: GOOD_BG, border: "1px solid #cfe7da", borderRadius: 999, padding: "6px 13px" }}>
              {fmtBand(fixes)} with the fixes below
            </span>
          ) : null}
          {pBeta ? (
            <span style={{ fontSize: 12, fontWeight: 600, color: AMBER, background: "#FBF3DE", border: "1px solid #F0E1BB", borderRadius: 999, padding: "5px 11px" }}>
              Pronunciation is beta — reported, not counted
            </span>
          ) : (
            <span style={{ fontSize: 12, fontWeight: 600, color: GOOD, background: GOOD_BG, border: "1px solid #cfe7da", borderRadius: 999, padding: "5px 11px" }}>
              Pronunciation heard from your recording
            </span>
          )}
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
