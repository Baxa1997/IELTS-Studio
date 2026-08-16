"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * What a server error looks like when it reaches a person.
 *
 * The app had NO error boundary at all until a lesson page started throwing in
 * production and every teacher who opened one got Next's stock "This page
 * couldn't load. A server error occurred." — no route, no digest, nothing to
 * report and nothing to search a log for. The page that broke was findable only
 * by reproducing it by hand.
 *
 * So this exists to make the next failure legible rather than to look nice:
 * the digest is shown, because that string is what matches a line in the
 * runtime log, and it is written to the console so a screenshot of devtools
 * carries it too. Everything else is a way out of the dead end — back to work,
 * or try again, since a good share of server errors are transient.
 */

const INK = "#15171C";
const MUTED = "#5C616C";
const FAINT = "#8B909B";
const LINE = "#E7E5DF";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side console only — the server has already logged the real stack.
    console.error("[app error]", error.digest ?? "(no digest)", error.message);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: "40px 24px",
        background: "#FDFDFD",
      }}
    >
      <div style={{ maxWidth: 460, textAlign: "center" }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: FAINT,
            fontWeight: 700,
          }}
        >
          Something broke
        </div>
        <h1
          style={{
            fontFamily: "var(--font-serif4), Georgia, serif",
            fontSize: 26,
            fontWeight: 700,
            color: INK,
            margin: "10px 0 8px",
            letterSpacing: "-.02em",
          }}
        >
          This page didn&apos;t load
        </h1>
        <p style={{ fontSize: 15, lineHeight: 1.55, color: MUTED, margin: "0 0 20px" }}>
          It&apos;s our fault, not yours, and nothing you had saved is lost. Trying again often
          works — if it doesn&apos;t, send us the code below and we can find this exact failure.
        </p>

        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              border: 0,
              borderRadius: 10,
              background: INK,
              color: "#fff",
              padding: "10px 18px",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              border: `1px solid ${LINE}`,
              borderRadius: 10,
              background: "#fff",
              color: MUTED,
              padding: "10px 16px",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Go back
          </Link>
        </div>

        {error.digest ? (
          <p style={{ marginTop: 22, fontSize: 12, color: FAINT }}>
            Error code{" "}
            <code
              style={{
                background: "#F4F2ED",
                borderRadius: 6,
                padding: "2px 7px",
                fontSize: 12,
                color: MUTED,
              }}
            >
              {error.digest}
            </code>
          </p>
        ) : null}
      </div>
    </div>
  );
}
