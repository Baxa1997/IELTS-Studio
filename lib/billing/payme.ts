import "server-only";

import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

import { applyPlanChange, planForUzsAmount } from "./service";

/**
 * Payme Merchant API (JSON-RPC). Payme calls THIS endpoint to drive a payment's
 * lifecycle: CheckPerformTransaction → CreateTransaction → PerformTransaction
 * (or CancelTransaction). Auth is HTTP Basic `Paycom:<PAYME_KEY>`. The payment
 * identifies the org via account.organization_id and the plan via the amount.
 *
 * Transaction state is stored in billing_events (keyed by the Paycom tx id), so no
 * extra table is needed. NOTE: going live requires passing Payme's sandbox test
 * suite — treat amounts/account config as merchant-cabinet-specific.
 *
 * Tiyin = UZS × 100. Error codes follow the Payme protocol.
 */

const ACCOUNT_FIELD = "organization_id";

interface JsonRpc {
  method?: string;
  params?: Record<string, unknown>;
  id?: number | string | null;
}
type RpcResponse = { jsonrpc?: string; id: unknown } & (
  | { result: unknown }
  | { error: { code: number; message: string; data?: unknown } }
);

const ERR = {
  auth: { code: -32504, message: "Insufficient privileges" },
  method: { code: -32601, message: "Method not found" },
  amount: { code: -31001, message: "Invalid amount" },
  account: { code: -31050, message: "Order not found" },
  txNotFound: { code: -31003, message: "Transaction not found" },
  cannotPerform: { code: -31008, message: "Unable to perform operation" },
} as const;

export function paymeAuthorized(authHeader: string | null): boolean {
  const cfg = serverEnv.payme;
  if (!cfg) return false;
  const expected = "Basic " + Buffer.from(`Paycom:${cfg.key}`).toString("base64");
  return authHeader === expected;
}

export async function handlePayme(body: JsonRpc): Promise<RpcResponse> {
  const id = body.id ?? null;
  const params = body.params ?? {};
  switch (body.method) {
    case "CheckPerformTransaction":
      return wrap(id, await checkPerform(params));
    case "CreateTransaction":
      return wrap(id, await createTransaction(params));
    case "PerformTransaction":
      return wrap(id, await performTransaction(params));
    case "CancelTransaction":
      return wrap(id, await cancelTransaction(params));
    case "CheckTransaction":
      return wrap(id, await checkTransaction(params));
    case "GetStatement":
      return wrap(id, { transactions: [] });
    default:
      return { id, error: ERR.method };
  }
}

// ---- Methods ---------------------------------------------------------------

type MethodResult = { _error: (typeof ERR)[keyof typeof ERR] } | Record<string, unknown>;

async function checkPerform(params: Record<string, unknown>): Promise<MethodResult> {
  const amount = Number(params.amount);
  const account = (params.account ?? {}) as Record<string, unknown>;
  const organizationId = String(account[ACCOUNT_FIELD] ?? "");
  if (!(await orgExists(organizationId))) return { _error: ERR.account };
  if (!planForUzsAmount(amount)) return { _error: ERR.amount };
  return { allow: true };
}

async function createTransaction(params: Record<string, unknown>): Promise<MethodResult> {
  const paycomId = String(params.id ?? "");
  const amount = Number(params.amount);
  const account = (params.account ?? {}) as Record<string, unknown>;
  const organizationId = String(account[ACCOUNT_FIELD] ?? "");
  const plan = planForUzsAmount(amount);

  const existing = await loadTx(paycomId);
  if (existing) {
    // Idempotent re-call: echo current state.
    return { create_time: existing.create_time, transaction: paycomId, state: existing.state };
  }
  if (!(await orgExists(organizationId))) return { _error: ERR.account };
  if (!plan) return { _error: ERR.amount };

  const createTime = Date.now();
  await saveTx(paycomId, organizationId, {
    state: 1,
    create_time: createTime,
    perform_time: 0,
    cancel_time: 0,
    amount,
    plan,
  });
  return { create_time: createTime, transaction: paycomId, state: 1 };
}

async function performTransaction(params: Record<string, unknown>): Promise<MethodResult> {
  const paycomId = String(params.id ?? "");
  const tx = await loadTx(paycomId);
  if (!tx) return { _error: ERR.txNotFound };
  if (tx.state === 2) {
    return { transaction: paycomId, perform_time: tx.perform_time, state: 2 }; // idempotent
  }
  if (tx.state !== 1) return { _error: ERR.cannotPerform };

  const performTime = Date.now();
  await saveTx(paycomId, tx.organization_id, { ...tx, state: 2, perform_time: performTime });
  // Payment confirmed → activate the plan for a month.
  await applyPlanChange({
    organizationId: tx.organization_id,
    plan: tx.plan,
    status: "active",
    provider: "payme",
    externalSubscriptionId: paycomId,
    currentPeriodEnd: monthFromNow(),
  });
  return { transaction: paycomId, perform_time: performTime, state: 2 };
}

async function cancelTransaction(params: Record<string, unknown>): Promise<MethodResult> {
  const paycomId = String(params.id ?? "");
  const tx = await loadTx(paycomId);
  if (!tx) return { _error: ERR.txNotFound };
  const cancelTime = tx.cancel_time || Date.now();
  const state = tx.state === 2 ? -2 : -1;
  await saveTx(paycomId, tx.organization_id, { ...tx, state, cancel_time: cancelTime });
  return { transaction: paycomId, cancel_time: cancelTime, state };
}

async function checkTransaction(params: Record<string, unknown>): Promise<MethodResult> {
  const tx = await loadTx(String(params.id ?? ""));
  if (!tx) return { _error: ERR.txNotFound };
  return {
    create_time: tx.create_time,
    perform_time: tx.perform_time,
    cancel_time: tx.cancel_time,
    transaction: String(params.id),
    state: tx.state,
    reason: null,
  };
}

// ---- Transaction store (billing_events) ------------------------------------

interface TxState {
  state: number; // 1 created, 2 performed, -1/-2 cancelled
  create_time: number;
  perform_time: number;
  cancel_time: number;
  amount: number;
  plan: import("./plans").OrgPlan;
  organization_id: string;
}

async function loadTx(paycomId: string): Promise<TxState | null> {
  if (!paycomId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("billing_events")
    .select("payload, organization_id")
    .eq("provider", "payme")
    .eq("external_event_id", paycomId)
    .maybeSingle();
  if (!data) return null;
  const p = data.payload as Omit<TxState, "organization_id">;
  return { ...p, organization_id: data.organization_id as string };
}

async function saveTx(
  paycomId: string,
  organizationId: string,
  payload: Omit<TxState, "organization_id">,
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("billing_events").upsert(
    {
      provider: "payme",
      event_type: "transaction",
      external_event_id: paycomId,
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

// ---- Helpers ---------------------------------------------------------------

function wrap(id: unknown, r: MethodResult): RpcResponse {
  if ("_error" in r) {
    return { id, error: (r as { _error: { code: number; message: string } })._error };
  }
  return { id, result: r };
}

function monthFromNow(): string {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d.toISOString();
}
