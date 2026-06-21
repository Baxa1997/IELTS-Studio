"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const INDIGO = "#4338CA";
const INK = "#1A1C33";

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
      const res = await fetch("/api/reading/next", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok || !body.id) {
        setError(body.message ?? "Couldn't generate a passage. Please try again.");
        setLoading(false);
        return;
      }
      router.push(`/read/${body.id}`); // navigate away — keep the spinner until then
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
      <button onClick={() => void go()} disabled={loading} style={style}>
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} /> Generating… ~1 min
          </>
        ) : (
          <>
            <Sparkles size={16} /> {label}
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
      const res = await fetch("/api/reading/test", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (!res.ok || !body.id) {
        setError(body.message ?? "Couldn't build your test. Please try again.");
        setLoading(false);
        return;
      }
      router.push(`/read/test/${body.id}`); // navigate away — keep the spinner until then
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
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
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
            <Sparkles size={16} /> {label}
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
