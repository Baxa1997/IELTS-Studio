import { NextResponse } from "next/server";

import { handleClick, type ClickParams } from "@/lib/billing/click";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/click — the Click Prepare/Complete callback endpoint.
 *
 * Click posts form-encoded params (action=0 prepare, action=1 complete). We verify
 * the MD5 sign_string inside handleClick, then activate the plan on a clean
 * Complete. Also tolerates a JSON body for easier local testing.
 */
export async function POST(req: Request): Promise<Response> {
  const params = await readParams(req);
  const result = await handleClick(params);
  return NextResponse.json(result);
}

async function readParams(req: Request): Promise<ClickParams> {
  const contentType = req.headers.get("content-type") ?? "";
  let raw: Record<string, string> = {};
  if (contentType.includes("application/json")) {
    raw = (await req.json().catch(() => ({}))) as Record<string, string>;
  } else {
    const form = await req.formData().catch(() => null);
    if (form) for (const [k, v] of form.entries()) raw[k] = String(v);
  }
  return {
    click_trans_id: raw.click_trans_id ?? "",
    service_id: raw.service_id ?? "",
    click_paydoc_id: raw.click_paydoc_id,
    merchant_trans_id: raw.merchant_trans_id ?? "",
    merchant_prepare_id: raw.merchant_prepare_id,
    amount: raw.amount ?? "0",
    action: raw.action ?? "",
    error: raw.error,
    error_note: raw.error_note,
    sign_time: raw.sign_time ?? "",
    sign_string: raw.sign_string ?? "",
  };
}
