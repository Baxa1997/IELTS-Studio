"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INDIGO = "#4338CA";
const INK = "#1A1C33";

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
  variant = "default",
  label = "Generate a passage",
}: {
  variant?: "default" | "outline";
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

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    // Reserve width for the widest label state so swapping to "Generating… ~1 min"
    // (or back) never resizes the button and shifts its position.
    minWidth: 236,
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: 15,
    padding: "11px 18px",
    borderRadius: 11,
    border: "none",
    cursor: loading ? "default" : "pointer",
    opacity: loading ? 0.7 : 1,
  };
  const style: React.CSSProperties =
    variant === "outline"
      ? { ...base, background: "#fff", border: "1px solid #DAD8C9", color: INK }
      : { ...base, background: INDIGO, color: "#fff", boxShadow: "0 12px 24px -12px rgba(59,67,181,.7)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
      <button
        onClick={() => void go()}
        disabled={loading}
        className={loading ? undefined : "lp-ai-pulse"}
        style={style}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} /> Generating… ~1 min
          </>
        ) : (
          <>
            <Sparkles size={16} className="lp-ai-spark" /> {label}
          </>
        )}
      </button>
      {error ? (
        <p style={{ fontFamily: SANS, fontSize: 13, color: "#c2410c", margin: 0 }} role="alert">
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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
      <button
        onClick={() => void go()}
        disabled={loading}
        className={loading ? undefined : "lp-ai-pulse"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          // Reserve width for the longest state ("Building your test… ~2 min") so the
          // button doesn't grow and jump left when generation starts.
          minWidth: 258,
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 15,
          padding: "11px 18px",
          borderRadius: 11,
          border: "none",
          background: INDIGO,
          color: "#fff",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.75 : 1,
          boxShadow: "0 12px 24px -14px rgba(67,56,202,.7)",
        }}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} /> Building your test… ~2 min
          </>
        ) : (
          <>
            <Sparkles size={16} className="lp-ai-spark" /> {label}
          </>
        )}
      </button>
      {loading ? (
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: "#6b6e84", margin: 0 }}>
          Writing 3 original passages at your level — hang tight, don’t close this tab.
        </p>
      ) : null}
      {error ? (
        <p style={{ fontFamily: SANS, fontSize: 13, color: "#c2410c", margin: 0 }} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
