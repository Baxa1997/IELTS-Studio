import Link from "next/link";

import { LucidaScope } from "../../lucida";

/**
 * A mock that will never have a band.
 *
 * Three ways to get here, and the learner deserves to know which:
 *   failed     grading itself broke — their speech was fine, our marker wasn't
 *   abandoned  the session died before it could be graded
 *   pending    it never connected, so nothing was ever recorded
 *
 * Before this existed, `failed` rendered the report and threw on
 * `overall_band.toFixed(1)` (a blank error page), and `abandoned` sat on the
 * "Marking your mock" spinner indefinitely. Both became easy to hit the moment
 * the exam started sending people straight here.
 */
export function UngradedMock({ state }: { state: string }) {
  const copy =
    state === "failed"
      ? {
          title: "We couldn't mark this one",
          body:
            "Your test was recorded, but the marking step failed. This is our fault, not " +
            "yours — nothing about your speaking caused it.",
          note: "This attempt has not been counted against your monthly mocks.",
        }
      : state === "pending"
        ? {
            title: "This mock never started",
            body:
              "The session was created but the examiner was never connected, so there is " +
              "nothing recorded to mark.",
            note: "Nothing was counted against your monthly mocks.",
          }
        : {
            title: "This mock ended before it could be marked",
            body:
              "The session stopped early — a closed tab or a lost connection — and ended " +
              "without enough recorded speech to produce a band.",
            note: "Sit all three parts end to end for a band that means something.",
          };

  return (
    <LucidaScope className="lucida-fill" style={{ background: "#FFFFFF", color: "#1A1520" }}>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          placeItems: "center",
          padding: "40px 24px",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 480 }}>
          <div
            aria-hidden
            style={{
              width: 46,
              height: 46,
              margin: "0 auto",
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "#F5F2F0",
              color: "#8C7F8A",
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.01" />
            </svg>
          </div>
          <h1
            style={{
              margin: "20px 0 0",
              fontFamily: "var(--font-display)",
              fontSize: 27,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            {copy.title}
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6, color: "#5C5460" }}>
            {copy.body}
          </p>
          <p style={{ margin: "14px 0 0", fontSize: 13, color: "#8C7F8A" }}>{copy.note}</p>
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/speak/exam"
              style={{
                padding: "14px 24px",
                borderRadius: 12,
                background: "#1A1520",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sit another mock
            </Link>
            <Link
              href="/speak"
              style={{
                padding: "14px 24px",
                borderRadius: 12,
                border: "1px solid #E7E3E0",
                color: "#5C5460",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to Speaking
            </Link>
          </div>
        </div>
      </div>
    </LucidaScope>
  );
}
