import "server-only";

import { createHash } from "node:crypto";

import { serverEnv } from "@/lib/env";
import { loadPool, loadPoolCached, type PoolItem } from "@/lib/free-practice/pools";
import { dayNumber, practiceDay, type FreeSkill } from "@/lib/free-practice/rotation";
import { visitorId } from "@/lib/free-practice/visitor";
import { createAdminClient } from "@/lib/supabase/admin";

import { CHALLENGE_PATH, challengeIndex, nicknameFor, publicBoard, type PublicBoard, type ScoreRow } from "./board";

/**
 * The daily challenge: ONE Reading passage, the same for every visitor, with
 * their first score kept for the day's board.
 *
 * HOW IT DIFFERS FROM THE FREE DAILY PRACTICE, which it is built beside. There,
 * each visitor gets their OWN practice (lib/free-practice/rotation hashes it
 * from their id) and nothing is stored. Here everybody gets the SAME passage —
 * that is what makes scores comparable — and a row is kept. It is a separate
 * allowance: sitting the challenge does not use the day's free Reading.
 *
 * A PASSAGE, NOT A FULL TEST: about twenty minutes and thirteen questions is
 * something a visitor does on a whim; an hour is not.
 */

const TABLE = "daily_challenge_scores";
/** More than any day will hold for a long while; past it the board is still
 *  right at the top, and only a late player's own rank would be missing. */
const MAX_ROWS = 1000;

export interface Challenge {
  day: string;
  item: PoolItem;
}

/**
 * Today's passage. The candidates are the Reading pool's single passages, in
 * the pool's own stable order; the day picks one.
 *
 * `load` as in `practiceList`: fresh for the runner and the marking route, the
 * ten-minute cache for the landing page's read.
 */
export async function todaysChallenge(
  load: (skill: FreeSkill) => Promise<PoolItem[]> = loadPool,
): Promise<Challenge | null> {
  const day = practiceDay();
  const passages = (await load("reading")).filter((i) => i.format === "part");
  const index = challengeIndex(passages.length, dayNumber(day));
  return index < 0 ? null : { day, item: passages[index] };
}

/** This visitor on the board: a salted hash of their anonymous id — the id
 *  itself is never stored (see the migration). */
export async function visitorHash(): Promise<string> {
  return createHash("sha256")
    .update(`${serverEnv.publicGrader.salt}:challenge:${await visitorId()}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Keep a visitor's score — their FIRST of the day only: a second insert meets
 * the table's unique (day, visitor_hash) and is ignored.
 *
 * ⚠️ NEVER THROWS. The visitor has just finished a passage and is owed their
 * marking whether or not the board could be written — including before the
 * migration is applied, when the table does not exist.
 */
export async function recordScore(input: {
  day: string;
  practiceKey: string;
  score: number;
  total: number;
  durationSeconds: number | null;
}): Promise<void> {
  try {
    const hash = await visitorHash();
    const { error } = await createAdminClient()
      .from(TABLE)
      .upsert(
        {
          day: input.day,
          visitor_hash: hash,
          nickname: nicknameFor(hash),
          practice_key: input.practiceKey,
          score: input.score,
          total: input.total,
          duration_seconds: input.durationSeconds,
        },
        { onConflict: "day,visitor_hash", ignoreDuplicates: true },
      );
    if (error) console.error("[challenge] score not kept:", error.message);
  } catch (err) {
    console.error("[challenge] score not kept:", err);
  }
}

/** Today's board as this visitor may see it. A failed read — the table not
 *  there yet, above all — is a closed, empty board, never an error. */
export async function loadBoard(day: string): Promise<PublicBoard> {
  let rows: ScoreRow[] = [];
  try {
    const { data, error } = await createAdminClient()
      .from(TABLE)
      .select("visitor_hash, nickname, score, total, created_at")
      .eq("day", day)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(MAX_ROWS);
    if (error) console.error("[challenge] board unavailable:", error.message);
    else rows = (data ?? []) as ScoreRow[];
  } catch (err) {
    console.error("[challenge] board unavailable:", err);
  }
  return publicBoard(rows, await visitorHash());
}

/** What the landing page's section asks for: today's passage and its board. */
export async function challengeToday(): Promise<{
  challenge: { title: string; questions: number | null; minutes: number; href: string } | null;
  board: PublicBoard | null;
}> {
  const today = await todaysChallenge(loadPoolCached);
  if (!today) return { challenge: null, board: null };
  return {
    challenge: {
      title: today.item.title,
      questions: today.item.questions,
      minutes: today.item.minutes,
      href: CHALLENGE_PATH,
    },
    board: await loadBoard(today.day),
  };
}
