"use client";

import { Moon, Sun } from "lucide-react";

import { useT } from "@/components/i18n/locale-provider";
import { FAB_CLEARANCE, LINE, PANEL, SANS, SLATE_BODY } from "@/lib/theme/tokens";

import { useTheme } from "./theme-provider";

/**
 * The always-there dark-mode switch, pinned bottom-right.
 *
 * It flips between light and dark ONLY — it does not cycle through "system".
 * A one-button control cannot say which of three states it is in, and a reader
 * who taps it expecting dark and lands on "system" (which may resolve to light)
 * reads that as the button being broken. "System" is a deliberate preference
 * rather than something you reach for mid-task, so it lives in Settings with
 * the three-way control; tapping here is an explicit choice and is stored as
 * one.
 *
 * ⚠️ z-index 25, DELIBERATELY LOW. Four things share this corner: the dashboard
 * study coach (z 50), the reading coach (z 40), the console's assign-to-class
 * panel (z 60) and the shell's mobile scrim (z 30). A theme button floating on
 * top of an open chat panel or a menu overlay reads as a rendering bug, so it
 * sits under all of them while still clearing ordinary page content (≤ 21).
 * Their LAUNCHERS move up by `FAB_CLEARANCE` instead of overlapping it.
 */
export function ThemeFab() {
  const t = useT();
  const { resolved, setMode } = useTheme();
  const dark = resolved === "dark";

  return (
    <button
      type="button"
      onClick={() => setMode(dark ? "light" : "dark")}
      aria-label={t(dark ? "theme.switchToLight" : "theme.switchToDark")}
      title={t(dark ? "theme.switchToLight" : "theme.switchToDark")}
      style={{
        position: "fixed",
        right: 22,
        bottom: 22,
        zIndex: 25,
        width: 44,
        height: 44,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        border: `1px solid ${LINE}`,
        background: PANEL,
        color: SLATE_BODY,
        fontFamily: SANS,
        cursor: "pointer",
        // Enough lift to read as floating over page content on both themes —
        // a light shadow vanishes on a dark ground, so this one is near-black
        // and leans on opacity rather than colour.
        boxShadow: "0 10px 26px -12px rgba(0,0,0,.45)",
        // Respects a reader who has asked for less motion; the icon swap is
        // instant for them rather than crossfading.
        transition: "background .18s ease, color .18s ease, border-color .18s ease",
      }}
    >
      {dark ? <Sun size={19} strokeWidth={1.9} /> : <Moon size={18} strokeWidth={1.9} />}
    </button>
  );
}
