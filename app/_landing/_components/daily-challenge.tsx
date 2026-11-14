"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  CHALLENGE_ANCHOR,
  CHALLENGE_PATH,
  MIN_BOARD_PLAYERS,
  type BoardEntry,
  type PublicBoard,
} from "@/lib/challenge/board";
import { useT } from "@/shared/components/i18n/locale-provider";

import { BODY, BRAND, DISPLAY, DISPLAY_LG, INK, LEDE, LINE, MUTED, SHELL, cardStyle, ctaPill, eyebrow } from "../_lib/design";

/**
 * The daily challenge on the landing page: one Reading passage everybody gets
 * today, and the day's board beside it (lib/challenge).
 *
 * ⚠️ FETCHED IN THE BROWSER, for the reason the picks above it are
 * (practice-picks.tsx): the front door is static and cached, and both the
 * board and which row is "you" change by the visitor and by the minute.
 *
 * ⚠️ COMPLETE WITHOUT THE ANSWER. The heading, the invitation and the button
 * render at once and do not wait for the fetch — the button's page works on
 * its own. What arrives later fills slots that already hold a line of the same
 * height, so nothing below this section moves. Only a day with no challenge
 * at all (an empty library) removes the section.
 *
 * ⚠️ A CLOSED BOARD SAYS SO, AND NOTHING ELSE. Until `MIN_BOARD_PLAYERS` have
 * played, the server sends no rows and no count, and this shows the sentence
 * that the board opens at N — the default it also renders before the fetch.
 */
const URL = "/api/public/practice/challenge";

interface Today {
  challenge: { title: string; questions: number | null; minutes: number; href: string } | null;
  board: PublicBoard | null;
}

export function DailyChallenge() {
  const t = useT();
  const [today, setToday] = useState<Today | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch(URL, { signal: ctrl.signal, cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<Today>) : null))
      .then((data) => data && setToday(data))
      .catch(() => {
        // Aborted on unmount, or offline: the invitation stands on its own.
      });
    return () => ctrl.abort();
  }, []);

  // Answered, and there is nothing to sit today.
  if (today && !today.challenge) return null;

  const challenge = today?.challenge ?? null;
  const board = today?.board ?? null;
  const you = board?.you ?? null;

  return (
    <section id={CHALLENGE_ANCHOR} style={{ ...SHELL, padding: "56px 28px 20px" }}>
      <div style={eyebrow(true)}>{t("ch.eyebrow")}</div>
      <h2 style={{ ...DISPLAY_LG, margin: "16px 0 0", maxWidth: 900 }}>{t("ch.title")}</h2>
      <p style={{ ...LEDE, maxWidth: 700, margin: "18px 0 0" }}>{t("ch.sub")}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginTop: 36, alignItems: "stretch" }}>
        {/* Today's passage. English: it is exam content. */}
        <div style={{ ...cardStyle(), flex: "1 1 340px", display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ ...eyebrow(), margin: 0 }}>{t("nav.reading")}</p>
          <p
            lang="en"
            style={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: "clamp(20px,2.2vw,26px)", lineHeight: 1.25, letterSpacing: "-0.02em", color: INK, margin: 0, minHeight: "2.5em" }}
          >
            {challenge?.title ?? ""}
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: BODY, margin: 0, minHeight: "1.5em" }}>
            {challenge?.questions ? t("ch.facts", { q: challenge.questions, m: challenge.minutes }) : ""}
          </p>
          <div style={{ marginTop: "auto", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px 16px" }}>
            <Link href={CHALLENGE_PATH} style={{ ...ctaPill(), textDecoration: "none", display: "inline-block" }}>
              {t("ch.start")} →
            </Link>
            {you ? (
              <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>
                {t("ch.yourScore", { score: you.score, total: you.total })}
              </span>
            ) : null}
          </div>
        </div>

        {/* The board, or the sentence that says when there will be one. */}
        <div style={{ ...cardStyle(), flex: "1 1 340px", minHeight: 220 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <p style={{ ...eyebrow(), margin: 0 }}>{t("ch.boardTitle")}</p>
            {board?.open && board.players ? (
              <span style={{ fontSize: 13, color: MUTED }}>{t("ch.players", { n: board.players })}</span>
            ) : null}
          </div>
          {board?.open ? (
            <>
              <ol style={{ listStyle: "none", margin: "14px 0 0", padding: 0 }}>
                {board.entries.map((e) => (
                  <Row key={e.rank} entry={e} youLabel={t("ch.you")} />
                ))}
              </ol>
              {you?.rank && board.players && !board.entries.some((e) => e.you) ? (
                <p style={{ fontSize: 14, fontWeight: 600, color: INK, margin: "12px 0 0" }}>
                  {t("ch.yourRank", { rank: you.rank, n: board.players })}
                </p>
              ) : null}
            </>
          ) : (
            <p style={{ fontSize: 16, lineHeight: 1.55, color: BODY, margin: "14px 0 0", maxWidth: 420 }}>
              {you ? `${t("ch.again")} ` : ""}
              {t("ch.opensAt", { n: board?.opensAt ?? MIN_BOARD_PLAYERS })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/** One row of the board. The viewer's own is marked by a rule and the word
 *  "You" in the brand ink — not by a fill, which would need its own ink in
 *  each theme. The nickname is English data, like the passage title. */
function Row({ entry, youLabel }: { entry: BoardEntry; youLabel: string }) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        padding: "9px 0 9px 10px",
        borderTop: `1px solid ${LINE}`,
        borderLeft: `3px solid ${entry.you ? BRAND : "transparent"}`,
        fontSize: 15,
        color: INK,
        fontWeight: entry.you ? 700 : 500,
      }}
    >
      <span style={{ width: 26, color: MUTED, fontVariantNumeric: "tabular-nums" }}>{entry.rank}</span>
      <span lang="en" style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {entry.nickname}
        {entry.you ? <span style={{ color: BRAND }}> · {youLabel}</span> : null}
      </span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {entry.score}/{entry.total}
      </span>
    </li>
  );
}
