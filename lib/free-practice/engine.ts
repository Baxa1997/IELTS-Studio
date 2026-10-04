import "server-only";

import { serverEnv } from "@/lib/env";

import type { PoolItem } from "./pools";

/**
 * The app calling the engine's `/listening/public/*` and `/multilevel/public/*`
 * for a visitor with NO account — server to server, with the shared `X-Internal-Key`, the same way
 * the model proxy is called (lib/ai/remote.ts).
 *
 * ⚠️ NOT THE BROWSER'S ROUTE. Every other listening call goes browser → engine
 * with the learner's Supabase token; a visitor has none, and the key must never
 * reach a browser. So the app decides which part a visitor may have today
 * (lib/free-practice/rotation), and only then asks the engine for it.
 *
 * Needs `AI_ENGINE_URL` + `AI_ENGINE_KEY` — set in production, where every model
 * call already goes through the engine; typically absent on a local machine,
 * where this throws `EngineUnavailable` and the page says so instead of failing.
 */
export class EngineUnavailable extends Error {}

/** What the engine is asked for: the whole test, or one part of it. The part
 *  is only sent for a part — an engine older than whole-test support reads a
 *  missing `part` as a bad request rather than as the wrong practice. */
export function publicTarget(item: Pick<PoolItem, "source" | "format" | "part">): {
  library_id: string;
  part?: number;
} {
  return item.format === "part" && item.part ? { library_id: item.source, part: item.part } : { library_id: item.source };
}

export async function listeningPublic<T>(path: "render" | "grade", body: unknown): Promise<T> {
  // Signing audio and marking are both quick; a hung engine must not hold a
  // page render for the whole serverless window.
  return enginePublic<T>(`/listening/public/${path}`, body, 20_000);
}

/**
 * The engine's `/multilevel/public/*` — today's free CEFR paper, served and
 * marked. Rendering and marking a Reading paper are quick; grading a Writing
 * task is a model call, so it gets most of the route's 60-second window.
 */
export async function multilevelPublic<T>(
  path: "render" | "reading/grade" | "writing/grade",
  body: unknown,
): Promise<T> {
  return enginePublic<T>(`/multilevel/public/${path}`, body, path === "writing/grade" ? 55_000 : 20_000);
}

async function enginePublic<T>(path: string, body: unknown, timeoutMs: number): Promise<T> {
  const engine = serverEnv.aiEngine;
  if (!engine) throw new EngineUnavailable("AI engine is not configured (AI_ENGINE_URL / AI_ENGINE_KEY)");
  let res: Response;
  try {
    res = await fetch(`${engine.url.replace(/\/+$/, "")}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Key": engine.key },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    throw new EngineUnavailable(`engine unreachable: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) throw new EngineUnavailable(`engine answered ${res.status}`);
  return (await res.json()) as T;
}
