import "server-only";

import { serverEnv } from "@/lib/env";

/**
 * The app calling the engine's `/listening/public/*` for a visitor with NO
 * account — server to server, with the shared `X-Internal-Key`, the same way
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

export async function listeningPublic<T>(path: "render" | "grade", body: unknown): Promise<T> {
  const engine = serverEnv.aiEngine;
  if (!engine) throw new EngineUnavailable("AI engine is not configured (AI_ENGINE_URL / AI_ENGINE_KEY)");
  let res: Response;
  try {
    res = await fetch(`${engine.url.replace(/\/+$/, "")}/listening/public/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Key": engine.key },
      body: JSON.stringify(body),
      cache: "no-store",
      // Signing audio and marking are both quick; a hung engine must not hold
      // a page render for the whole serverless window.
      signal: AbortSignal.timeout(20_000),
    });
  } catch (err) {
    throw new EngineUnavailable(`engine unreachable: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) throw new EngineUnavailable(`engine answered ${res.status}`);
  return (await res.json()) as T;
}
