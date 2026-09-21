import { NextResponse, type NextRequest } from "next/server";

import { applyUnsubscribe } from "@/lib/marketing/unsubscribe";
import { serverEnv } from "@/lib/env";

/**
 * The endpoint Gmail and Outlook hit for one-click unsubscribe.
 *
 * RFC 8058: when a message carries `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
 * the client POSTs here by itself — no browser, no session, no human. That is
 * the entire point: the reader presses the client's own "Unsubscribe" button
 * beside the sender name and never leaves the inbox, which is the difference
 * between an opt-out and a spam complaint. A bulk sender without this is
 * treated as a worse citizen by both providers.
 *
 * ⚠️ IT MUST ANSWER 200 EVEN WHEN THE TOKEN IS JUNK. A mail client that gets an
 * error shows the reader "unsubscribe failed", and their next move is the spam
 * button — which costs the sending domain far more than honouring a request we
 * could not verify would have. The verification still happens; it just decides
 * what we DO, not what we say back.
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  await applyUnsubscribe(searchParams.get("u") ?? "", searchParams.get("t"));
  return new NextResponse(null, { status: 200 });
}

/**
 * A person who follows the header link by hand — some clients expose it as an
 * ordinary link — gets the page that explains what happened, rather than a
 * blank 200.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const u = searchParams.get("u") ?? "";
  const t = searchParams.get("t") ?? "";
  const target = `${serverEnv.outboundSiteUrl}/unsubscribe?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}`;
  return NextResponse.redirect(target, { status: 302 });
}
