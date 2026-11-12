import { describe, expect, it } from "vitest";

import { DEFAULT_THEME_MODE, readThemeCookie, themeCookie } from "@/lib/theme/mode";

import { ThemeScript } from "./theme-script";

/**
 * The no-flash script decides the FIRST FRAME's theme, before React exists, so
 * it is the one place the default can quietly go back to following the OS.
 * These run the real script string against a fake browser and read what it did
 * to <html>.
 */
function runScript({
  stored,
  osDark,
  legacy = null,
}: {
  stored: string | null;
  osDark: boolean;
  /** What the old `localStorage` key still holds from before the switch. */
  legacy?: string | null;
}) {
  const el = ThemeScript() as { props: { dangerouslySetInnerHTML: { __html: string } } };
  const classes = new Set<string>();
  const html = {
    classList: {
      toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)),
    },
    style: { colorScheme: "" },
  };
  const ls = new Map<string, string>(legacy ? [["ep-theme", legacy]] : []);
  // The three globals the script reads, passed in as parameters so they shadow
  // whatever the test runner has (or lacks) under those names.
  new Function("localStorage", "window", "document", el.props.dangerouslySetInnerHTML.__html)(
    { getItem: (k: string) => ls.get(k) ?? null, removeItem: (k: string) => ls.delete(k) },
    { matchMedia: () => ({ matches: osDark }) },
    { documentElement: html, cookie: stored === null ? "other=1" : `other=1; ${themeCookie(stored as never)}` },
  );
  return { dark: classes.has("dark"), scheme: html.style.colorScheme, legacyLeft: ls.size > 0 };
}

describe("the theme a first visit gets", () => {
  it("is light by default — the owner's call, not the OS's", () => {
    expect(DEFAULT_THEME_MODE).toBe("light");
  });

  it("stays light on a dark-mode device when nothing has been chosen", () => {
    expect(runScript({ stored: null, osDark: true })).toEqual({ dark: false, scheme: "light", legacyLeft: false });
  });

  it("treats a junk stored value as never having chosen", () => {
    expect(runScript({ stored: "sepia", osDark: true })).toEqual({ dark: false, scheme: "light", legacyLeft: false });
  });

  it("still follows the device once System has been chosen", () => {
    expect(runScript({ stored: "system", osDark: true })).toEqual({ dark: true, scheme: "dark", legacyLeft: false });
  });

  it("keeps an explicit dark choice on a light device", () => {
    expect(runScript({ stored: "dark", osDark: false })).toEqual({ dark: true, scheme: "dark", legacyLeft: false });
  });

  it("ignores — and clears — a dark choice remembered in localStorage from before", () => {
    expect(runScript({ stored: null, osDark: true, legacy: "dark" })).toEqual({
      dark: false,
      scheme: "light",
      legacyLeft: false,
    });
  });
});

describe("the theme cookie", () => {
  // ⚠️ The whole point: the choice must die with the browser session, so the
  // next visit is light again. An Expires or Max-Age turns it into a forever
  // preference without anything else failing.
  it("is a session cookie — no Expires, no Max-Age", () => {
    expect(themeCookie("dark")).not.toMatch(/expires|max-age/i);
  });

  it("round-trips through a document.cookie string", () => {
    expect(readThemeCookie(`a=1; ${themeCookie("dark").split(";")[0]}; b=2`)).toBe("dark");
    expect(readThemeCookie("a=1")).toBeNull();
    expect(readThemeCookie("ep-theme=sepia")).toBeNull();
  });
});
