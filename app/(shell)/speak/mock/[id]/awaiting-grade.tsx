"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { LucidaScope } from "../../lucida";

/**
 * The report page, while the band is still being written.
 *
 * The exam now hands the learner straight to their report instead of parking
 * them on a band-reveal screen with a "see the full report" button — so this
 * page is what they land on for the ~30–60s grading takes, and it has to be a
 * real destination rather than an empty report shell.
 *
 * Polls the session row (RLS-scoped to the owner) and refreshes the route the
 * moment a band lands; the server component then renders the real thing.
 */
export function AwaitingGrade({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const startedAt = Date.now();

    const tick = async () => {
      if (stopped) return;
      const { data } = await supabase
        .from("speaking_sessions")
        .select("state, result")
        .eq("id", sessionId)
        .maybeSingle();
      if (stopped) return;
      const band = (data?.result as { overall_band?: number } | null)?.overall_band;
      // A `failed` session never gets a band — refresh anyway so the page can
      // say so, instead of polling into eternity.
      if (typeof band === "number" || data?.state === "failed") {
        router.refresh();
        return;
      }
      // Grading is a fixed ~30–60s job, so this backs off rather than
      // hammering: every 2s at first, easing to 6s, and giving up at 5 minutes
      // (past that something is wrong and a spinner is a lie).
      if (Date.now() - startedAt > 5 * 60_000) return;
      const elapsed = Date.now() - startedAt;
      timer = setTimeout(tick, elapsed < 30_000 ? 2000 : 6000);
    };

    timer = setTimeout(tick, 1500);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId, router]);

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
        <div style={{ textAlign: "center", maxWidth: 460 }}>
          <div
            aria-hidden
            style={{
              width: 38,
              height: 38,
              margin: "0 auto",
              borderRadius: "50%",
              border: "3px solid #EFEBE9",
              borderTopColor: "#1A1520",
              animation: "lcSpin .9s linear infinite",
            }}
          />
          <h1
            style={{
              margin: "22px 0 0",
              fontFamily: "var(--font-display)",
              fontSize: 27,
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Marking your mock
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6, color: "#5C5460" }}>
            Every answer is being read against the official band descriptors, criterion by
            criterion. It takes under a minute, and your report opens here by itself.
          </p>
          <p style={{ margin: "18px 0 0", fontSize: 12, color: "#8C7F8A" }}>
            You can leave this page — the report is saved to your results either way.
          </p>
        </div>
      </div>
    </LucidaScope>
  );
}
