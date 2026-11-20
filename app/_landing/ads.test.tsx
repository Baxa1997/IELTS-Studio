// @vitest-environment jsdom
import { readFileSync } from "node:fs";

import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sourceFiles } from "@/test/source-files";

import { parseBlockId, parsePageId } from "./_lib/ads";

/**
 * Yandex ads: where they may load, and for whom. `./_lib/ads.ts` has the
 * reasons; each block here turns red if one of them is undone.
 */

const session = vi.hoisted(() => ({ value: null as boolean | null }));
vi.mock("./_hooks/use-signed-in", () => ({ useSession: () => session.value }));

const { YandexAd, YandexAutoAds, YandexRail, railMinViewport } = await import("./_components/yandex-ad");

const yandexScripts = () =>
  [...document.querySelectorAll<HTMLScriptElement>("script")].filter((s) => s.src.includes("yandex.ru/ads"));

beforeEach(() => {
  document.head.innerHTML = "";
  window.history.replaceState(null, "", "/blog/some-article");
});
afterEach(() => vi.restoreAllMocks());

const COMPONENT = "app/_landing/_components/yandex-ad.tsx";
const code = () => sourceFiles("app", "shared", "lib").filter((f) => /\.(ts|tsx|js|mjs)$/.test(f) && !f.endsWith(".test.tsx"));
/** Files that actually import `name` from yandex-ad — an import statement,
 *  not a mention, so a comment naming the component does not count. */
const importers = (name: string) => {
  const stmt = new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["'][^"']*yandex-ad["']`);
  return code().filter((f) => stmt.test(readFileSync(f, "utf8")));
};

/**
 * The public pages that may carry a banner (owner, 2026-11-19). Everything
 * else — the learner app, the studios, the console, /admin, sign-in — may not.
 * Adding a page here is a product decision, not a refactor.
 */
const AD_PAGES = [
  "app/_landing/_components/landing-page.tsx",
  "app/blog/_components/article-view.tsx",
  "app/grade/_components/grade-page.tsx",
  "app/practice/[skill]/_components/practice-page.tsx",
];

describe("where Yandex may load", () => {
  it("only yandex-ad.tsx names a Yandex ad script", () => {
    const leaks = code().filter((f) => f !== COMPONENT && readFileSync(f, "utf8").includes("yandex.ru/ads"));
    expect(leaks).toEqual([]);
  });

  it("only the public pages render a banner", () => {
    expect(importers("YandexAd").sort()).toEqual([...AD_PAGES].sort());
  });

  // Autoplacement fills any page its script runs on and cannot be unloaded;
  // its reload-on-leave fence is written for the blog alone.
  it("the margin rail is on articles and practice pages only", () => {
    expect(importers("YandexRail").sort()).toEqual([
      "app/blog/_components/article-view.tsx",
      "app/practice/[skill]/_components/practice-page.tsx",
    ]);
  });

  it("autoplacement mounts on the blog only", () => {
    expect(importers("YandexAutoAds")).toEqual(["app/blog/layout.tsx"]);
  });
});

describe("YandexAutoAds", () => {
  it("loads nothing while the session is still unknown", () => {
    session.value = null;
    render(<YandexAutoAds pageId="20450903" />);
    expect(yandexScripts()).toEqual([]);
  });

  it("loads nothing for a signed-in reader", () => {
    session.value = true;
    render(<YandexAutoAds pageId="20450903" />);
    expect(yandexScripts()).toEqual([]);
  });

  it("loads nothing without a page id", () => {
    session.value = false;
    render(<YandexAutoAds pageId={null} />);
    expect(yandexScripts()).toEqual([]);
  });

  it("loads context.js and ap-loader with the page id for a signed-out reader", () => {
    session.value = false;
    render(<YandexAutoAds pageId="20450903" />);
    const ap = yandexScripts().find((s) => s.src.endsWith("/ap-loader.js"));
    expect(ap?.dataset.pageId).toBe("20450903");
    expect(yandexScripts().some((s) => s.src.endsWith("/context.js"))).toBe(true);
  });

  it("reloads on leaving the blog, so the script does not follow the reader", async () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, reload, pathname: "/dashboard" });
    session.value = false;
    const { unmount } = render(<YandexAutoAds pageId="20450903" />);
    unmount();
    await act(() => vi.runAllTimers());
    expect(reload).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  // Dev StrictMode unmounts and remounts in place; reloading then would loop.
  it("does not reload when unmounted while still on the blog", async () => {
    vi.useFakeTimers();
    const reload = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({ ...window.location, reload, pathname: "/blog/x" });
    session.value = false;
    const { unmount } = render(<YandexAutoAds pageId="20450903" />);
    unmount();
    await act(() => vi.runAllTimers());
    expect(reload).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("YandexAd (manual unit)", () => {
  it("renders nothing until the session is known to be signed out", () => {
    session.value = null;
    const { container } = render(<YandexAd blockId="R-A-1-1" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders a container and loads context.js for a signed-out reader", () => {
    session.value = false;
    const { container } = render(<YandexAd blockId="R-A-1-1" />);
    expect(container.querySelector("[id^=yandex_rtb_]")).not.toBeNull();
    expect(yandexScripts().some((s) => s.src.endsWith("/context.js"))).toBe(true);
  });
});

describe("YandexRail", () => {
  function screen(width: number) {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: width >= Number(/min-width: (\d+)px/.exec(q)![1]),
      addEventListener() {},
      removeEventListener() {},
    }));
  }
  afterEach(() => vi.unstubAllGlobals());

  it("mounts beside the content on a wide screen, for a signed-out reader", () => {
    screen(1920);
    session.value = false;
    const { container } = render(<YandexRail blockId="R-A-1-3" content={1200} />);
    expect(container.querySelector("aside [id^=yandex_rtb_]")).not.toBeNull();
  });

  // Hidden-but-mounted would still request an ad nobody can see.
  it("does not exist at all on a screen too narrow for it", () => {
    screen(railMinViewport(1200) - 1);
    session.value = false;
    const { container } = render(<YandexRail blockId="R-A-1-3" content={1200} />);
    expect(container.innerHTML).toBe("");
    expect(yandexScripts()).toEqual([]);
  });

  it("renders nothing without its own block id", () => {
    screen(1920);
    session.value = false;
    const { container } = render(<YandexRail blockId={null} content={1200} />);
    expect(container.innerHTML).toBe("");
  });
});

describe("slots", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  // One block id must light up every page; a slot's own id overrides it.
  it("every slot falls back to the article banner", async () => {
    vi.stubEnv("NEXT_PUBLIC_YANDEX_RTB_ARTICLE", "R-A-1-2");
    vi.stubEnv("NEXT_PUBLIC_YANDEX_RTB_GRADE", "R-A-1-9");
    vi.resetModules();
    const { YANDEX_AD_SLOTS } = await import("./_lib/ads");
    expect(YANDEX_AD_SLOTS).toMatchObject({ article: "R-A-1-2", landing: "R-A-1-2", practice: "R-A-1-2", grade: "R-A-1-9" });
  });

  // The rail shares its page with the bottom banner; one block id renders once
  // per page, so borrowing the article's would leave one of the two empty.
  it("the sidebar never falls back to the article banner", async () => {
    vi.stubEnv("NEXT_PUBLIC_YANDEX_RTB_ARTICLE", "R-A-1-2");
    vi.resetModules();
    const { YANDEX_AD_SLOTS } = await import("./_lib/ads");
    expect(YANDEX_AD_SLOTS.sidebar).toBeNull();
  });
});

describe("ids from the environment", () => {
  it("accepts only the shapes Yandex issues", () => {
    expect(parsePageId(" 20450903 ")).toBe("20450903");
    expect(parsePageId("20450903; alert(1)")).toBeNull();
    expect(parsePageId(undefined)).toBeNull();
    expect(parseBlockId("R-A-1234567-1")).toBe("R-A-1234567-1");
    expect(parseBlockId("1234567")).toBeNull();
  });
});
