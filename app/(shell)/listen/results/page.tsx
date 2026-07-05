import Link from "next/link";
import { redirect } from "next/navigation";

import { requireOrgUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INK = "#1C1B2E";
const MUTED = "#56556A";
const INDIGO = "#4338CA";
const TINT = "#EFEEFC";
const GOOD = "#15803d";
const BAD = "#b91c1c";

type AttemptRow = {
  id: string;
  score: number | null;
  max_score: number | null;
  created_at: string;
  kind: string | null;
  topic: string | null;
  band: number | null;
  part: number | null;
};

function titleOf(a: AttemptRow): string {
  if (a.topic && a.topic !== "Full listening test") return a.topic;
  if (a.kind === "test" || a.part === 0) return "Full listening test";
  return a.part ? `Part ${a.part} practice` : "Listening practice";
}

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Listening results — every graded attempt, newest first, each opening its
 * full feedback report. Reads listening_attempts directly (RLS scopes rows
 * to the signed-in learner).
 */
export default async function ListeningResultsPage() {
  const { profile } = await requireOrgUser();
  if (profile.role !== "student") redirect("/console");

  const supabase = await createClient();
  const { data } = await supabase
    .from("listening_attempts")
    .select(
      "id, score, max_score, created_at, kind:result->>kind, topic:result->>topic, band:result->band, part:result->part",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  const attempts = (data ?? []) as unknown as AttemptRow[];

  return (
    <div style={{ width: "100%", padding: "26px 24px 64px", fontFamily: SANS, color: INK }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        <Link
          href="/listen"
          style={{ fontSize: 14, fontWeight: 600, color: MUTED, textDecoration: "none" }}
        >
          ← Listening
        </Link>
        <h1
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: "clamp(28px,3.6vw,38px)",
            lineHeight: 1.05,
            letterSpacing: "-.4px",
            margin: "10px 0 6px",
          }}
        >
          Listening results
        </h1>
        <p style={{ fontSize: 15, color: MUTED, margin: "0 0 26px" }}>
          Every graded attempt, newest first — open one for the full feedback report.
        </p>

        {attempts.length === 0 ? (
          <div
            style={{
              background: "#fff",
              border: "1px solid #E8E6F0",
              borderRadius: 16,
              padding: "36px 28px",
              textAlign: "center",
              color: MUTED,
              fontSize: 15,
            }}
          >
            No graded listening practice yet.{" "}
            <Link href="/listen" style={{ color: INDIGO, fontWeight: 700 }}>
              Start one →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {attempts.map((a) => {
              const ratio =
                a.score != null && a.max_score ? a.score / a.max_score : null;
              return (
                <Link
                  key={a.id}
                  href={`/listen/results/${a.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    background: "#fff",
                    border: "1px solid #E8E6F0",
                    borderRadius: 14,
                    padding: "16px 20px",
                    textDecoration: "none",
                    color: INK,
                  }}
                >
                  <span
                    style={{
                      flex: "none",
                      minWidth: 74,
                      textAlign: "center",
                      fontWeight: 800,
                      fontSize: 18,
                      color: ratio == null ? MUTED : ratio >= 0.7 ? GOOD : ratio >= 0.4 ? INK : BAD,
                    }}
                  >
                    {a.score ?? "—"}
                    <span style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>
                      /{a.max_score ?? "—"}
                    </span>
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontWeight: 700,
                        fontSize: 15.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {titleOf(a)}
                    </span>
                    <span style={{ fontSize: 13, color: MUTED }}>{when(a.created_at)}</span>
                  </span>
                  {a.band != null ? (
                    <span
                      style={{
                        flex: "none",
                        background: TINT,
                        border: "1px solid rgba(67,56,202,.16)",
                        color: INDIGO,
                        padding: "5px 12px",
                        borderRadius: 999,
                        fontSize: 13.5,
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Band {Number(a.band).toFixed(1)}
                    </span>
                  ) : null}
                  <span style={{ flex: "none", color: MUTED, fontSize: 18 }}>›</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
