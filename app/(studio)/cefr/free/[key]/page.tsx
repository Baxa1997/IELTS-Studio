import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PublicCefrRunner, type ReadingPaper, type WritingPaper } from "@/shared/components/cefr/multilevel-client";
import { FreeTrialGate } from "@/shared/components/practice/free-trial-nudge";
import { onTodaysList } from "@/lib/free-practice/assignment";
import { freeTrialCopy } from "@/lib/free-practice/copy";
import { multilevelPublic } from "@/lib/free-practice/engine";
import { freePracticePage } from "@/lib/free-practice/links";
import { spentOnToday } from "@/lib/free-practice/visitor";
import { translator } from "@/lib/i18n";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";
import { BRAND_FILL, PANEL, SLATE_BODY, SLATE_INK, SLATE_LINE, WHITE } from "@/lib/theme/tokens";

/**
 * /cefr/free/[key] — one free CEFR (Multilevel) paper, for a visitor with no
 * account: a full Reading paper (five parts, 35 questions) or a full Writing
 * paper (three tasks) from the shared library — the visitor's list says which
 * (lib/free-practice/pools). `key` is the paper's id.
 *
 * The paper must be on this visitor's list today; the page asks the engine for
 * its answer-free view server to server and hands it to the signed-in runner in
 * public mode — same runner, same marking (/api/public/practice/cefr).
 * Today's free practice used on ANOTHER paper → the gate; used on this one (a
 * Writing paper with tasks still to grade) → the paper, to finish. Engine
 * unreachable → a plain "not right now" page. In (studio), not (shell),
 * because the shell requires an account. Not indexed — the list is the page
 * that ranks.
 */
const t = translator(SOURCE_LOCALE);

export const metadata: Metadata = {
  title: t("free.runnerTitleCefr"),
  robots: { index: false, follow: true },
};

export default async function FreeCefrPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const entry = await onTodaysList("cefr", decodeURIComponent(key));
  if (!entry) redirect(freePracticePage("cefr"));
  const copy = freeTrialCopy(t, "cefr");

  if (entry.done && (await spentOnToday(entry.day, "cefr")) !== entry.item.key) {
    return (
      <div lang="en">
        <FreeTrialGate
          copy={copy}
          title={t("free.doneTitle")}
          body={t("free.doneBody")}
          backHref={freePracticePage("cefr")}
          backLabel={t("free.allFreePractice")}
        />
      </div>
    );
  }

  // `redirect()` throws, so it must not sit inside this try — the catch would
  // swallow it. The engine call alone is guarded.
  let paper: ReadingPaper | WritingPaper | null = null;
  try {
    paper = await multilevelPublic<ReadingPaper | WritingPaper>("render", { item_id: entry.item.source });
  } catch (err) {
    console.error("[cefr/free] engine render failed:", err);
  }

  return (
    <div lang="en">
      {paper ? (
        <PublicCefrRunner
          paper={paper}
          publicMode={{
            submitUrl: "/api/public/practice/cefr",
            practiceKey: entry.item.key,
            exitHref: freePracticePage("cefr"),
            copy,
          }}
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
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <section
        style={{
          maxWidth: 480,
          padding: "28px 26px",
          background: PANEL,
          border: `1px solid ${SLATE_LINE}`,
          borderRadius: 18,
          textAlign: "center",
          color: SLATE_INK,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>CEFR practice isn&rsquo;t available right now</h1>
        <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.6, color: SLATE_BODY }}>
          The practice service is taking a moment. Your free practice for today is still waiting — try again shortly.
        </p>
        <Link
          href={freePracticePage("cefr")}
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
      </section>
    </main>
  );
}
