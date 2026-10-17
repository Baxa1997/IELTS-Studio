import { NextResponse } from "next/server";

import { practicePicks } from "@/lib/free-practice/picks";

/**
 * GET /api/public/practice/picks — this visitor's practice for today in each
 * free skill, for the landing page's "picked for you" cards.
 *
 * ⚠️ A ROUTE, NOT THE PAGE. The front door is static and cached; reading the
 * visitor's cookie there would turn every visit into a server render. The page
 * ships the skill cards, and the browser asks this route which practice is the
 * visitor's (app/_landing/_components/practice-picks.tsx).
 *
 * Private and never cached anywhere: the answer differs per visitor. Read-only
 * — it opens nothing and spends nothing; only marking uses the free practice.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ picks: await practicePicks() }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[practice/picks] failed:", err);
    // The cards keep the copy they were rendered with.
    return NextResponse.json({ picks: [] }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
