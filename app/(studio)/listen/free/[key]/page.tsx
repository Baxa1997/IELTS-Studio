import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { listeningFont } from "@/shared/components/listening/font";
import { PublicListeningRunner } from "@/shared/components/listening/listening-client";
import type { RenderView } from "@/shared/components/listening/types";
import { FreeTrialGate } from "@/shared/components/practice/free-trial-nudge";
import { onTodaysList } from "@/lib/free-practice/assignment";
import { freeTrialCopy } from "@/lib/free-practice/copy";
import { listeningPublic, publicTarget } from "@/lib/free-practice/engine";
import { freePracticePage } from "@/lib/free-practice/links";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import { BRAND_FILL, PANEL, SLATE_BODY, SLATE_INK, SLATE_LINE, WHITE } from "@/lib/theme/tokens";

/**
 * /listen/free/[key] — one free Listening practice, for a visitor with no
 * account: a FULL shared library test (four parts, 40 questions) or one part
 * of one (~8 minutes, 10 questions) — the visitor's list says which
 * (lib/free-practice/pools). `key` is `libraryId` or `libraryId_part`.
 *
 * The part must be on this visitor's list today; the page asks the engine for
 * it server to server (lib/free-practice/engine) and hands the answer-free view
 * to the signed-in runner in its `public` source — same runner, same marking.
 * Today's free practice already used → the gate. Engine unreachable (a local
 * machine without AI_ENGINE_* set, or the box mid-restart) → a plain "not right
 * now" page. In (studio), not (shell), because the shell requires an account.
 */
const t = translator(SOURCE_LOCALE);

export const metadata: Metadata = {
  title: t("free.runnerTitleListening"),
  robots: { index: false, follow: true },
};

export default async function FreeListeningPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const entry = await onTodaysList("listening", decodeURIComponent(key));
  if (!entry) redirect(freePracticePage("listening"));
  const copy = freeTrialCopy(t, "listening");

  if (entry.done) {
    return (
      <div lang="en">
        <FreeTrialGate
          copy={copy}
          title={t("free.doneTitle")}
          body={t("free.doneBody")}
          backHref={freePracticePage("listening")}
          backLabel={t("free.allFreePractice")}
        />
      </div>
    );
  }

  // `redirect()` throws, so it must not sit inside this try — the catch would
  // swallow it. The engine call alone is guarded.
  let view: RenderView | null = null;
  try {
    view = await listeningPublic<RenderView>("render", publicTarget(entry.item));
  } catch (err) {
    console.error("[listen/free] engine render failed:", err);
  }

  return (
    <div
      lang="en"
      className={listeningFont.variable}
      style={{ height: "100dvh", display: "flex", flexDirection: "column" }}
    >
      {view ? (
        <PublicListeningRunner
          view={view}
          practiceKey={entry.item.key}
          gradeUrl="/api/public/practice/listening"
          exitHref={freePracticePage("listening")}
          copy={copy}
        />
      ) : (
        <Unavailable />
      )}
    </div>
  );
}

function Unavailable() {
  return (
    <main
      style={{
        margin: "auto",
        maxWidth: 480,
        padding: "28px 26px",
        background: PANEL,
        border: `1px solid ${SLATE_LINE}`,
        borderRadius: 18,
        textAlign: "center",
        color: SLATE_INK,
      }}
    >
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Listening practice isn&rsquo;t available right now</h1>
      <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6, color: SLATE_BODY }}>
        The audio service is taking a moment. Your free practice for today is still waiting — try again shortly.
      </p>
      <Link
        href={freePracticePage("listening")}
        style={{
          display: "inline-block",
          marginTop: 18,
          background: BRAND_FILL,
          color: WHITE,
          borderRadius: 999,
          padding: "11px 22px",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        {t("free.allFreePractice")}
      </Link>
    </main>
  );
}
