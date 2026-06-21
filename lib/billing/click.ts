import "server-only";

import { createHash } from "node:crypto";

import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

import { applyPlanChange, planForUzsAmount } from "./service";

/**
 * Click (Merchant API) Prepare/Complete callbacks. Click POSTs form-encoded params
 * to this endpoint twice: action=0 (Prepare) then action=1 (Complete). We verify
 * the MD5 sign_string, then on a clean Complete activate the plan. merchant_trans_id
 * carries our organization id; the plan is derived from the amount.
 *
 * NOTE: production use requires Click merchant onboarding + passing their test
 * cases. Error codes follow the Click protocol (0 = success).
 */

export interface ClickParams {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id?: string;
  merchant_trans_id: string; // we use organization_id
  merchant_prepare_id?: string;
  amount: string;
  action: string; // "0" prepare, "1" complete
  error?: string;
  error_note?: string;
  sign_time: string;
  sign_string: string;
}

export interface ClickResponse {
  click_trans_id: string;
  merchant_trans_id: string;
  merchant_prepare_id?: number;
  merchant_confirm_id?: number;
  error: number;
  error_note: string;
}

const E = {
  OK: { error: 0, error_note: "Success" },
  SIGN: { error: -1, error_note: "SIGN CHECK FAILED" },
  AMOUNT: { error: -2, error_note: "Incorrect parameter amount" },
  ACTION: { error: -3, error_note: "Action not found" },
  NOT_FOUND: { error: -5, error_note: "User does not exist" },
  ALREADY: { error: -4, error_note: "Already paid" },
  TX_NOT_FOUND: { error: -6, error_note: "Transaction does not exist" },
} as const;

export async function handleClick(p: ClickParams): Promise<ClickResponse> {
  const base = { click_trans_id: p.click_trans_id, merchant_trans_id: p.merchant_trans_id };

  if (!verifySign(p)) return { ...base, ...E.SIGN };

  const organizationId = p.merchant_trans_id;
  const amountTiyin = Math.round(Number(p.amount) * 100);
  const plan = planForUzsAmount(amountTiyin);
  if (!plan) return { ...base, ...E.AMOUNT };
  if (!(await orgExists(organizationId))) return { ...base, ...E.NOT_FOUND };

  if (p.action === "0") return prepare(p, base, organizationId, amountTiyin);
  if (p.action === "1") return complete(p, base, organizationId, plan);
  return { ...base, ...E.ACTION };
}

async function prepare(
  p: ClickParams,
  base: Pick<ClickResponse, "click_trans_id" | "merchant_trans_id">,
  organizationId: string,
  amountTiyin: number,
): Promise<ClickResponse> {
  const prepareId = Date.now();
  await saveTx(p.click_trans_id, organizationId, { state: 0, prepare_id: prepareId, amount: amountTiyin });
  return { ...base, merchant_prepare_id: prepareId, ...E.OK };
}

async function complete(
  p: ClickParams,
  base: Pick<ClickResponse, "click_trans_id" | "merchant_trans_id">,
  organizationId: string,
  plan: import("./plans").OrgPlan,
): Promise<ClickResponse> {
  const tx = await loadTx(p.click_trans_id);
  if (!tx) return { ...base, ...E.TX_NOT_FOUND };
  if (tx.state === 1) return { ...base, merchant_confirm_id: tx.prepare_id, ...E.ALREADY };

  // Click sends error<0 on its side when the user cancels — don't activate then.
  if (Number(p.error) < 0) {
    await saveTx(p.click_trans_id, organizationId, { ...tx, state: -1 });
    return { ...base, error: Number(p.error), error_note: p.error_note ?? "Cancelled" };
  }

  await saveTx(p.click_trans_id, organizationId, { ...tx, state: 1 });
  await applyPlanChange({
    organizationId,
    plan,
    status: "active",
    provider: "click",
    externalSubscriptionId: p.click_trans_id,
    currentPeriodEnd: monthFromNow(),
  });
  return { ...base, merchant_confirm_id: tx.prepare_id, ...E.OK };
}

// ---- Sign: md5(click_trans_id + service_id + SECRET + merchant_trans_id +
//                [merchant_prepare_id] + amount + action + sign_time) ----------
function verifySign(p: ClickParams): boolean {
  const cfg = serverEnv.click;
  if (!cfg) return false;
  const prepareId = p.action === "1" ? (p.merchant_prepare_id ?? "") : "";
  const raw =
    p.click_trans_id +
    p.service_id +
    cfg.secretKey +
    p.merchant_trans_id +
    prepareId +
    p.amount +
    p.action +
    p.sign_time;
  return createHash("md5").update(raw).digest("hex") === p.sign_string;
}

// ---- Transaction store (billing_events) ------------------------------------

interface ClickTx {
  state: number; // 0 prepared, 1 completed, -1 cancelled
  prepare_id: number;
  amount: number;
  organization_id: string;
}

async function loadTx(clickTransId: string): Promise<ClickTx | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("billing_events")
    .select("payload, organization_id")
    .eq("provider", "click")
    .eq("external_event_id", clickTransId)
    .maybeSingle();
  if (!data) return null;
  const p = data.payload as Omit<ClickTx, "organization_id">;
  return { ...p, organization_id: data.organization_id as string };
}

async function saveTx(
  clickTransId: string,
  organizationId: string,
  payload: Omit<ClickTx, "organization_id">,
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("billing_events").upsert(
    {
      provider: "click",
      event_type: "transaction",
      external_event_id: clickTransId,
      organization_id: organizationId,
      payload,
    },
    { onConflict: "provider,external_event_id" },
  );
}

async function orgExists(organizationId: string): Promise<boolean> {
  if (!organizationId) return false;
  const admin = createAdminClient();
  const { data } = await admin.from("organizations").select("id").eq("id", organizationId).maybeSingle();
  return Boolean(data);
}

function monthFromNow(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString();
}
