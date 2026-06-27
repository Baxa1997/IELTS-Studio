"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AiGenerateButton } from "@/components/ai-generate-section";
import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

const SANS = "var(--font-hanken), system-ui, sans-serif";

type GenResult = { ok: boolean; id?: string; message?: string };

/**
 * Kick off a reading generation. Prefers the self-hosted AI backend: the browser
 * POSTs straight to it with the user's Supabase access token, so the request
 * never rides a Vercel function and escapes the 60s serverless cap that 504s
 * full-test generation. Falls back to the same-origin /api/reading/* route
 * (cookie auth) when no backend URL is configured — fine for local dev.
 */
async function postReadingGenerate(path: "next" | "test"): Promise<GenResult> {
  const backend = clientEnv.aiBackendUrl;
  if (backend) {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return { ok: false, message: "Your session expired — please sign in again." };

    const res = await fetch(`${backend}/reading/${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = (await res.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      detail?: string | { message?: string };
    };
    const detailMsg =
      typeof body.detail === "string" ? body.detail : body.detail?.message;
    return { ok: res.ok && Boolean(body.id), id: body.id, message: body.message ?? detailMsg };
  }

  // Local-dev fallback: same-origin Next route (these 504 on Vercel Hobby).
  const res = await fetch(`/api/reading/${path}`, { method: "POST" });
  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  return { ok: res.ok && Boolean(body.id), id: body.id, message: body.message };
}

/**
 * B2C reading: generate one fresh passage on demand. POSTs to /api/reading/next
 * (passage + validated questions, auto-approved) then opens it. The call is two
 * model passes, so it takes ~1 min — we show that wait explicitly.
 */
export function GeneratePassageButton({
  label = "Generate a passage",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const result = await postReadingGenerate("next");
      if (!result.ok || !result.id) {
        setError(result.message ?? "Couldn't generate a passage. Please try again.");
        setLoading(false);
        return;
      }
      router.push(`/read/${result.id}`); // navigate away — keep the spinner until then
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <AiGenerateButton
        label={label}
        busyLabel="Generating… ~1 min"
        busy={loading}
        generating={loading}
        onClick={() => void go()}
        minWidth={244}
      />
      {error ? (
        <p style={{ fontFamily: SANS, fontSize: 13, color: "#fecaca", margin: 0, textAlign: "right" }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * B2C full reading test: generate 3 original passages + ~40 questions on demand
 * (POST /api/reading/test) then open the test. Three passages generate in parallel
 * but it's still two model passes each, so it takes ~2 min — we show that wait.
 */
export function StartTestButton({ label = "Start a full reading test" }: { label?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setLoading(true);
    setError(null);
    try {
      const result = await postReadingGenerate("test");
      if (!result.ok || !result.id) {
        setError(result.message ?? "Couldn't build your test. Please try again.");
        setLoading(false);
        return;
      }
      router.push(`/read/test/${result.id}`); // navigate away — keep the spinner until then
    } catch {
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
      <AiGenerateButton
        label={label}
        busyLabel="Building your test… ~2 min"
        busy={loading}
        generating={loading}
        onClick={() => void go()}
        minWidth={266}
      />
      {loading ? (
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: "rgba(255,255,255,0.78)", margin: 0, textAlign: "right", maxWidth: 280 }}>
          Writing 3 original passages at your level — hang tight, don’t close this tab.
        </p>
      ) : null}
      {error ? (
        <p style={{ fontFamily: SANS, fontSize: 13, color: "#fecaca", margin: 0, textAlign: "right" }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
