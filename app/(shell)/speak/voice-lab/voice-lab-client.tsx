"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";

import { clientEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";

import { LucidaScope } from "../lucida";

/**
 * Voice ear-test lab (owner tool, not linked from the app). Renders each
 * allowlisted Chirp3-HD candidate reading three lines — a greeting, a teaching
 * correction, a praise — so the four persona voices can be chosen BY EAR rather
 * than by name. The engine caps to a server-side allowlist (see router.py
 * VOICE_LAB_VOICES); this list just mirrors it with a hint of each voice's
 * character. Pick one per row and tell me — I wire the winners into the personas.
 */

const LINES = ["Greeting", "Teaching", "Praise"] as const;

const GROUPS: { manner: string; accent: string; voices: { name: string; note: string }[] }[] = [
  {
    manner: "Warmer",
    accent: "var(--color-primary-500)",
    voices: [
      { name: "Aoede", note: "breezy & warm — Emily today" },
      { name: "Autonoe", note: "bright, warm" },
      { name: "Callirrhoe", note: "easy-going, warm" },
      { name: "Sulafat", note: "mellow, warm" },
    ],
  },
  {
    manner: "Calmer / formal",
    accent: "var(--color-info)",
    voices: [
      { name: "Charon", note: "measured, informative — Daniel today" },
      { name: "Iapetus", note: "clear, even" },
      { name: "Rasalgethi", note: "steady, informative" },
      { name: "Alnilam", note: "firm, calm" },
    ],
  },
  {
    manner: "Brisker",
    accent: "var(--color-amber-500)",
    voices: [
      { name: "Orus", note: "firm, brisk — James today" },
      { name: "Fenrir", note: "lively, energetic" },
      { name: "Kore", note: "firm, direct" },
      { name: "Puck", note: "upbeat" },
    ],
  },
  {
    manner: "Friendlier / lighter",
    accent: "var(--color-success)",
    voices: [
      { name: "Leda", note: "youthful, light — Sofia today" },
      { name: "Zephyr", note: "bright" },
      { name: "Despina", note: "smooth, friendly" },
      { name: "Achird", note: "friendly" },
    ],
  },
];

export function VoiceLabClient() {
  const [busy, setBusy] = useState<string | null>(null); // `${voice}:${line}` loading/playing
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback(async (voice: string, line: number) => {
    const backend = clientEnv.aiBackendUrl;
    if (!backend) return;
    const tag = `${voice}:${line}`;
    try {
      setError(null);
      setBusy(tag);
      audioRef.current?.pause();
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("signed out");
      const res = await fetch(`${backend}/speaking/tutor/voice-lab?voice=${voice}&line=${line}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`${voice} unavailable (${res.status})`);
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setBusy((b) => (b === tag ? null : b));
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : "Couldn't play that voice.");
    }
  }, []);

  const kicker: React.CSSProperties = {
    fontSize: "var(--text-xs)",
    fontWeight: 700,
    letterSpacing: "var(--ls-wide)",
    textTransform: "uppercase",
  };

  return (
    <LucidaScope style={{ minHeight: "100vh", background: "var(--color-neutral-50)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 40px 72px" }}>
        <Link
          href="/speak"
          className="lc-tab"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: "var(--color-neutral-500)",
            textDecoration: "none",
            marginBottom: 24,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Speaking
        </Link>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "var(--text-4xl)",
            color: "var(--color-neutral-1000)",
            letterSpacing: "var(--ls-snug)",
            marginBottom: 10,
          }}
        >
          Voice ear-test
        </div>
        <p
          style={{
            fontSize: "var(--text-md)",
            color: "var(--color-neutral-600)",
            maxWidth: 680,
            lineHeight: "var(--lh-relaxed)",
            margin: "0 0 8px",
          }}
        >
          Every candidate reads the same three lines — a greeting, a teaching correction, and a
          praise. Listen across a row, pick the one you like best per manner, and tell me the four
          names. I&rsquo;ll wire them into Emily / Daniel / James / Sofia.
        </p>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--color-neutral-500)",
            margin: "0 0 32px",
          }}
        >
          (Emotion-capable Gemini-TTS voices come in a second round once these are picked.)
        </p>

        {error ? (
          <div
            style={{
              background: "var(--color-error-bg)",
              border: "1px solid rgba(220,38,38,0.3)",
              borderRadius: "var(--radius-lg)",
              padding: "10px 14px",
              color: "var(--color-error)",
              fontSize: "var(--text-sm)",
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        ) : null}

        {GROUPS.map((g) => (
          <div key={g.manner} style={{ marginBottom: 32 }}>
            <div style={{ ...kicker, color: g.accent, marginBottom: 12 }}>{g.manner}</div>
            <div style={{ display: "grid", gap: 10 }}>
              {g.voices.map((v) => (
                <div
                  key={v.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    background: "var(--color-neutral-0)",
                    border: "1px solid var(--color-neutral-200)",
                    borderRadius: "var(--radius-xl)",
                    padding: "16px 20px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ minWidth: 150, flex: "0 0 auto" }}>
                    <div
                      style={{
                        fontSize: "var(--text-md)",
                        fontWeight: 600,
                        color: "var(--color-neutral-1000)",
                      }}
                    >
                      {v.name}
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-neutral-500)" }}>
                      {v.note}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
                    {LINES.map((label, i) => {
                      const tag = `${v.name}:${i}`;
                      const on = busy === tag;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => play(v.name, i)}
                          className="lc-btn"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            border: `1px solid ${on ? g.accent : "var(--color-neutral-200)"}`,
                            background: on ? "var(--color-neutral-50)" : "var(--color-neutral-0)",
                            color: on ? g.accent : "var(--color-neutral-600)",
                            fontSize: "var(--text-sm)",
                            fontWeight: 600,
                            padding: "8px 14px",
                            borderRadius: "var(--radius-pill)",
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                          {on ? "Playing…" : label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </LucidaScope>
  );
}
