"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useT } from "@/shared/components/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n";
import { THEME_MODES, type ThemeMode } from "@/lib/theme/mode";
import { BRAND, BRAND_SOFT, LINE, MUTED, PANEL, SANS } from "@/lib/theme/tokens";

import { useTheme } from "./theme-provider";

const OPTION: Record<ThemeMode, { key: MessageKey; Icon: typeof Sun }> = {
  light: { key: "theme.light", Icon: Sun },
  dark: { key: "theme.dark", Icon: Moon },
  system: { key: "theme.system", Icon: Monitor },
};

/**
 * Light / Dark / System, as a radio group.
 *
 * The selected row is safe to render directly — no mounted guard — because the
 * provider reads the preference through `useSyncExternalStore`, which serves the
 * server snapshot during hydration and swaps afterwards. An earlier version held
 * the mode in `useState` and had to leave every option unhighlighted on the
 * first frame to avoid a hydration mismatch; see the note in `theme-provider`
 * for why that is no longer necessary.
 *
 * `radiogroup` rather than three buttons: these are three states of ONE setting,
 * so a screen reader should say "2 of 3" instead of reading three unrelated
 * buttons.
 */
export function ThemeToggle() {
  const t = useT();
  const { mode, setMode } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label={t("theme.label")}
      style={{
        display: "inline-flex",
        gap: 4,
        padding: 4,
        border: `1px solid ${LINE}`,
        borderRadius: 12,
        background: PANEL,
      }}
    >
      {THEME_MODES.map((m) => {
        const { key, Icon } = OPTION[m];
        const on = mode === m;
        return (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setMode(m)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              border: "none",
              borderRadius: 9,
              cursor: "pointer",
              fontFamily: SANS,
              fontSize: 14,
              fontWeight: on ? 700 : 500,
              background: on ? BRAND_SOFT : "transparent",
              color: on ? BRAND : MUTED,
            }}
          >
            <Icon size={16} strokeWidth={1.9} aria-hidden />
            {t(key)}
          </button>
        );
      })}
    </div>
  );
}
