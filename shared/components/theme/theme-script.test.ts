import { describe, expect, it } from "vitest";

import { DEFAULT_THEME_MODE } from "@/lib/theme/mode";

import { ThemeScript } from "./theme-script";

/**
 * The no-flash script decides the FIRST FRAME's theme, before React exists, so
 * it is the one place the default can quietly go back to following the OS.
 * These run the real script string against a fake browser and read what it did
 * to <html>.
 */
function runScript({ stored, osDark }: { stored: string | null; osDark: boolean }) {
  const el = ThemeScript() as { props: { dangerouslySetInnerHTML: { __html: string } } };
  const classes = new Set<string>();
  const html = {
    classList: {
      toggle: (name: string, on: boolean) => (on ? classes.add(name) : classes.delete(name)),
    },
    style: { colorScheme: "" },
  };
  // The three globals the script reads, passed in as parameters so they shadow
  // whatever the test runner has (or lacks) under those names.
  new Function("localStorage", "window", "document", el.props.dangerouslySetInnerHTML.__html)(
    { getItem: () => stored },
    { matchMedia: () => ({ matches: osDark }) },
    { documentElement: html },
  );
  return { dark: classes.has("dark"), scheme: html.style.colorScheme };
}

describe("the theme a first visit gets", () => {
  it("is light by default — the owner's call, not the OS's", () => {
    expect(DEFAULT_THEME_MODE).toBe("light");
  });

  it("stays light on a dark-mode device when nothing has been chosen", () => {
    expect(runScript({ stored: null, osDark: true })).toEqual({ dark: false, scheme: "light" });
  });

  it("treats a junk stored value as never having chosen", () => {
    expect(runScript({ stored: "sepia", osDark: true })).toEqual({ dark: false, scheme: "light" });
  });

  it("still follows the device once System has been chosen", () => {
    expect(runScript({ stored: "system", osDark: true })).toEqual({ dark: true, scheme: "dark" });
  });

  it("keeps an explicit dark choice on a light device", () => {
    expect(runScript({ stored: "dark", osDark: false })).toEqual({ dark: true, scheme: "dark" });
  });
});
