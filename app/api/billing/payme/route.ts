import { NextResponse } from "next/server";

import { handlePayme, paymeAuthorized } from "@/lib/billing/payme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/payme — the Payme Merchant API endpoint (JSON-RPC).
 *
 * Payme authenticates with HTTP Basic `Paycom:<key>`; an unauthorized call gets
 * the protocol's -32504. The method router in handlePayme drives the transaction
 * lifecycle and activates the plan on PerformTransaction.
 */
export async function POST(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (!paymeAuthorized(auth)) {
    return NextResponse.json({
      id: (body.id as number | string | null) ?? null,
      error: { code: -32504, message: "Insufficient privileges to perform this operation" },
    });
  }

  const result = await handlePayme(body);
  return NextResponse.json(result);
}
