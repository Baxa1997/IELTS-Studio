import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { TRAP_EXPLAIN, type StoredQResult, type StoredResult } from "../../trap-explain";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1C1B2E";
const MUTED = "#56556A";
const INDIGO = "#4338CA";
const TINT = "#EFEEFC";
const GOOD = "#15803d";
const GOOD_BG = "#e7f7ee";
const BAD = "#b91c1c";
const BAD_BG = "#FDECEC";
const CARD: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #E8E6F0",
  borderRadius: 16,
  padding: "20px 22px",
};

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** IELTS test question ranges: 1-10 / 11-20 / 21-30 / 31-40. */
function partOfQ(q: number): number {
  return Math.min(4, Math.max(1, Math.ceil(q / 10)));
}

function QuestionRow({ r }: { r: StoredQResult }) {
  const explain = r.trap ? TRAP_EXPLAIN[r.trap] : null;
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        padding: "12px 0",
        borderBottom: "1px solid #F1EFF6",
      }}
    >
      <span
        style={{
          flex: "none",
          width: 34,
          height: 26,
          borderRadius: 8,
          background: r.is_correct ? GOOD_BG : BAD_BG,
          color: r.is_correct ? GOOD : BAD,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {r.q}
      </span>
      <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, lineHeight: 1.55 }}>
        <div>
          {r.is_correct ? (
            <strong style={{ color: GOOD }}>{r.user_answer}</strong>
          ) : (
            <>
              <span
                style={{
                  color: r.user_answer.trim() ? BAD : MUTED,
                  textDecoration: r.user_answer.trim() ? "line-through" : "none",
                }}
              >
                {r.user_answer.trim() || "no answer"}
              </span>
              <span style={{ color: MUTED }}> → </span>
              <strong style={{ color: INK }}>{r.correct_answer}</strong>
            </>
          )}
        </div>
        {explain ? (
          <div style={{ fontSize: 13.5, color: MUTED, marginTop: 3 }}>{explain}</div>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Full feedback report for one graded listening attempt — score, band,
 * per-question corrections with why-the-trap-worked notes, and the
 * transcript. Data is the grading snapshot stored at submit time, so old
 * attempts render exactly as they were marked.
 */
export default async function ListeningResultPage({ params }: PageProps) {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");
  const { id } = await params;

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("listening_attempts")
    .select("id, score, max_score, created_at, result")
    .eq("id", id)
    .maybeSingle();
  if (!attempt) notFound();

  const result = (attempt.result ?? {}) as StoredResult;
  const results = result.results ?? [];
  const isTest = result.kind === "test";
  const score = attempt.score ?? result.score ?? 0;
  const maxScore = attempt.max_score ?? result.max_score ?? results.length;
  const ratio = maxScore > 0 ? score / maxScore : 0;
  const title =
    result.topic && result.topic !== "Full listening test"
      ? result.topic
      : isTest
        ? "Full listening test"
        : `Part ${result.part || 1} practice`;

  return (
    <div style={{ width: "100%", padding: "26px 24px 64px", fontFamily: SANS, color: INK }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link
          href="/listen/results"
          style={{ fontSize: 14, fontWeight: 600, color: MUTED, textDecoration: "none" }}
        >
          ← All results
        </Link>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: "clamp(26px,3.2vw,34px)",
            lineHeight: 1.1,
            letterSpacing: "-.4px",
            margin: "10px 0 4px",
          }}
        >
          {title}
        </h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 22px" }}>
          Graded {when(attempt.created_at)}
        </p>

        {/* Score hero */}
        <div
          style={{
            ...CARD,
            display: "flex",
            alignItems: "center",
            gap: 18,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 42,
              fontWeight: 800,
              lineHeight: 1,
              color: ratio >= 0.7 ? GOOD : ratio >= 0.4 ? INK : BAD,
            }}
          >
            {score}
            <span style={{ fontSize: 20, fontWeight: 600, color: MUTED }}>/{maxScore}</span>
          </span>
          {result.band != null ? (
            <span
              style={{
                padding: "8px 16px",
                borderRadius: 12,
                background: TINT,
                border: "1px solid rgba(67,56,202,.16)",
                color: INDIGO,
                fontWeight: 800,
                fontSize: 17,
                whiteSpace: "nowrap",
              }}
            >
              Band {Number(result.band).toFixed(1)}
            </span>
          ) : null}
          {(result.parts ?? []).map((p) => (
            <span
              key={p.part}
              style={{
                padding: "6px 12px",
                borderRadius: 9,
                background: "#F7F6FB",
                border: "1px solid #E8E6F0",
                fontSize: 13.5,
                fontWeight: 700,
                color: p.max_score > 0 && p.score / p.max_score >= 0.7 ? GOOD : MUTED,
              }}
            >
              Part {p.part}: {p.score}/{p.max_score}
            </span>
          ))}
        </div>

        {/* Per-question feedback */}
        <div style={{ ...CARD, marginBottom: 16 }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, margin: "0 0 6px" }}>
            Answer review
          </h2>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 10px" }}>
            Wrong answers show the correction; the note under a question explains the trap in
            the recording.
          </p>
          {results.map((r, i) => (
            <div key={r.q}>
              {isTest && (i === 0 || partOfQ(r.q) !== partOfQ(results[i - 1].q)) ? (
                <div
                  style={{
                    margin: "18px 0 4px",
                    fontSize: 12.5,
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: INDIGO,
                  }}
                >
                  Part {partOfQ(r.q)}
                </div>
              ) : null}
              <QuestionRow r={r} />
            </div>
          ))}
        </div>

        {/* Transcript */}
        {(result.transcript ?? []).length > 0 ? (
          <details style={{ ...CARD }}>
            <summary
              style={{
                cursor: "pointer",
                fontFamily: SERIF,
                fontSize: 21,
                fontWeight: 600,
              }}
            >
              Transcript
            </summary>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}
            >
              {result.transcript.map((l, i) => (
                <div key={i} style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 700, color: INDIGO }}>{l.speaker}: </span>
                  {l.text}
                </div>
              ))}
            </div>
          </details>
        ) : null}

        <div style={{ marginTop: 22 }}>
          <Link
            href="/listen"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: INK,
              color: "#fff",
              padding: "10px 18px",
              borderRadius: 999,
              fontSize: 14.5,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Practice again →
          </Link>
        </div>
      </div>
    </div>
  );
}
