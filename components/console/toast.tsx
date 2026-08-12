"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { FiAlertTriangle, FiCheck, FiX } from "react-icons/fi";

import { useDrawerClose } from "./finance-ui";

/**
 * The banner that says a thing worked, and the rule about when a drawer shuts.
 *
 * THE PROBLEM THIS FIXES. A form inside a slide-over would save, print a small
 * grey sentence at the bottom of the panel, and leave the panel sitting over the
 * page it had just changed. So you could not see the result, and you could
 * submit again. Now: the panel closes and the confirmation appears at the top of
 * the page, over the thing that changed.
 *
 * THE ONE EXCEPTION, AND IT IS DELIBERATE. A form whose result you must READ —
 * a generated password, an invite link, a credentials sheet — must NOT close,
 * because the value is shown once and closing the panel destroys it. Those
 * forms pass `keepOpen`. Everything else closes.
 */

type Tone = "ok" | "error";

interface ToastMessage {
  id: number;
  tone: Tone;
  text: string;
}

const ToastContext = createContext<(text: string, tone?: Tone) => void>(() => {});

export function useToast(): (text: string, tone?: Tone) => void {
  return useContext(ToastContext);
}

export function ToastHost({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const next = useRef(0);

  const push = useCallback((text: string, tone: Tone = "ok") => {
    const id = next.current++;
    setMessages((list) => [...list, { id, tone, text }]);
    // Errors sit longer: a failure usually needs reading twice, and there is
    // nothing on the page confirming it the way a saved row confirms a success.
    const life = tone === "error" ? 7000 : 4000;
    setTimeout(() => setMessages((list) => list.filter((m) => m.id !== id)), life);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        // `polite`, not `assertive`: these confirm something the person just
        // did, so they must not interrupt what a screen reader is saying.
        aria-live="polite"
        style={{
          position: "fixed",
          top: 16,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 120,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
          width: "min(560px, calc(100vw - 32px))",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            role={m.tone === "error" ? "alert" : "status"}
            style={{
              pointerEvents: "auto",
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "11px 13px",
              borderRadius: 11,
              border: `1px solid ${m.tone === "error" ? "#F2C9C4" : "#BFE3D0"}`,
              background: m.tone === "error" ? "#FDF3F2" : "#F2FAF6",
              boxShadow: "0 12px 32px rgba(22,22,46,.14)",
              fontFamily: "var(--font-sans3), ui-sans-serif, system-ui, sans-serif",
              fontSize: 13.5,
              color: "#16162E",
              lineHeight: 1.5,
            }}
          >
            <span
              aria-hidden
              style={{
                flexShrink: 0,
                width: 20,
                height: 20,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: m.tone === "error" ? "#B3261E" : "#16794C",
                color: "#fff",
                marginTop: 1,
              }}
            >
              {m.tone === "error" ? <FiAlertTriangle size={12} /> : <FiCheck size={12} />}
            </span>
            <span style={{ flex: 1 }}>{m.text}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setMessages((list) => list.filter((x) => x.id !== m.id))}
              style={{
                background: "transparent",
                border: 0,
                cursor: "pointer",
                color: "#6E6C87",
                display: "inline-flex",
                padding: 2,
              }}
            >
              <FiX size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Every action state in the console is one of these shapes. */
interface FeedbackState {
  ok?: string;
  notice?: string;
  error?: string;
}

/**
 * Announce an action's result and, unless told otherwise, close the panel it
 * ran in.
 *
 * One line per form. Fires only when the state OBJECT changes, so a re-render
 * cannot re-announce a message that is already on screen, and an identical
 * second save (same text, new object) still announces — which is what you want,
 * because the person did press the button twice.
 *
 * @param keepOpen for forms whose result must be read before it is lost:
 *                 generated passwords, invite links, credential sheets.
 * @param onSuccess for panels that own their own open state instead of living
 *                  in a `Drawer` — `useDrawerClose` is a no-op outside one, so
 *                  those panels would otherwise sit open over the thing they
 *                  just changed with no way for this hook to shut them.
 */
export function useActionFeedback(
  state: FeedbackState,
  opts: { keepOpen?: boolean; onSuccess?: () => void } = {},
): void {
  const toast = useToast();
  const closeDrawer = useDrawerClose();
  const seen = useRef<FeedbackState | null>(null);
  // Kept in a ref so a caller passing an inline arrow does not re-run the
  // effect on every render and re-announce a message already on screen. Written
  // inside an effect, not during render — a ref mutated while rendering is torn
  // under Strict Mode's double invoke.
  const onSuccess = useRef(opts.onSuccess);
  useEffect(() => {
    onSuccess.current = opts.onSuccess;
  });

  useEffect(() => {
    if (seen.current === state) return;
    seen.current = state;

    const success = state.ok ?? state.notice;
    if (success) {
      toast(success, "ok");
      onSuccess.current?.();
      if (!opts.keepOpen) closeDrawer();
      return;
    }
    if (state.error) toast(state.error, "error");
  }, [state, toast, closeDrawer, opts.keepOpen]);
}
