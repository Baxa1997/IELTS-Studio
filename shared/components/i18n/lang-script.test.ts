import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_LOCALE, HTML_LANG, LOCALES } from "@/lib/i18n/locales";
import { sourceFiles } from "@/test/source-files";

import { LangScript } from "./lang-script";

/**
 * <html lang> before the first paint, from the URL — and the two dev-overlay
 * errors that moving it into the root layout cleared (2026-10-17).
 */

/** The real script string, run against a fake browser: what did it set? */
function langFor(pathname: string): string {
  const el = LangScript() as { props: { dangerouslySetInnerHTML: { __html: string } } };
  const html = { lang: HTML_LANG[DEFAULT_LOCALE] };
  new Function("location", "document", el.props.dangerouslySetInnerHTML.__html)(
    { pathname },
    { documentElement: html },
  );
  return html.lang;
}

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("the page's language, before the first paint", () => {
  it("names the language of every prefixed locale, on its root and below it", () => {
    for (const locale of LOCALES.filter((l) => l !== DEFAULT_LOCALE)) {
      expect(langFor(`/${locale}`), locale).toBe(HTML_LANG[locale]);
      expect(langFor(`/${locale}/how-to-use`), locale).toBe(HTML_LANG[locale]);
    }
  });

  it("leaves the default locale's bare URLs alone", () => {
    for (const path of ["/", "/practice/cefr", "/how-to-use", "/blog/some-post"]) {
      expect(langFor(path), path).toBe(HTML_LANG[DEFAULT_LOCALE]);
    }
  });

  it("does not take a word that merely starts like a prefix", () => {
    expect(langFor("/russia")).toBe(HTML_LANG[DEFAULT_LOCALE]);
    expect(langFor("/uzbekistan-guide")).toBe(HTML_LANG[DEFAULT_LOCALE]);
  });
});

describe("the root layout", () => {
  const layout = read("app/layout.tsx");

  it("lets its own pre-paint scripts write <html>'s attributes without a hydration error", () => {
    // The theme script sets class + color-scheme, the language script sets lang.
    expect(layout).toMatch(/<html\s[^>]*suppressHydrationWarning[^>]*>/);
    expect(layout).toMatch(/<body\s[^>]*suppressHydrationWarning[^>]*>/);
  });

  it("runs both scripts first in <body>, before anything is laid out", () => {
    // The JSX tag, not the word: the comments around it mention <body> too.
    const tag = /<body\s[^>]*>/.exec(layout);
    expect(tag).not.toBeNull();
    const afterBody = layout
      .slice(tag!.index + tag![0].length)
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    const elements = [...afterBody.matchAll(/<([A-Z]\w*|[a-z]+)\b/g)].map((m) => m[1]);
    expect(elements.slice(0, 2)).toEqual(["ThemeScript", "LangScript"]);
  });
});

describe("a script React might create in the browser", () => {
  /* React 19 logs "Encountered a script tag while rendering React component"
     for any EXECUTABLE <script> it creates on the client — which every page
     element is on an in-app navigation. Data blocks (JSON-LD) are exempt. So
     only the root layout's two scripts may run code; anything else is data. */
  const ROOT_SCRIPTS = [
    "shared/components/theme/theme-script.tsx",
    "shared/components/i18n/lang-script.tsx",
  ];

  it("is never executable outside the root layout's two", () => {
    const offenders: string[] = [];
    for (const file of sourceFiles("app", "shared").filter((f) => f.endsWith(".tsx"))) {
      if (ROOT_SCRIPTS.includes(file)) continue;
      const src = read(file)
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
      for (const m of src.matchAll(/<script\b([\s\S]*?)\/?>/g)) {
        if (!/type="application\/ld\+json"/.test(m[1]))
          offenders.push(`${file}: <script${m[1].slice(0, 60)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
