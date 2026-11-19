// @vitest-environment jsdom
import { readFileSync } from "node:fs";

import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { sourceFiles } from "@/test/source-files";

import { parseBlockId, parsePageId } from "./_lib/ads";

/**
 * Yandex ads: where they may load, and for whom. `app/blog/_lib/ads.ts` has
 * the reasons; each block here turns red if one of them is undone.
 */

const session = vi.hoisted(() => ({ value: null as boolean | null }));
vi.mock("@/app/_landing/_hooks/use-signed-in", () => ({ useSession: () => session.value }));

const { YandexAd, YandexAutoAds } = await import("./_components/yandex-ad");

const yandexScripts = () =>
  [...document.querySelectorAll<HTMLScriptElement>("script")].filter((s) => s.src.includes("yandex.ru/ads"));

beforeEach(() => {
  document.head.innerHTML = "";
  window.history.replaceState(null, "", "/blog/some-article");
});
afterEach(() => vi.restoreAllMocks());

describe("Yandex ads stay on the blog", () => {
  // Autoplacement fills any page its script runs on — the script is the fence.
  it("no file outside app/blog/ names a Yandex ad script", () => {
    const leaks = sourceFiles("app", "shared", "lib")
      .filter((f) => /\.(ts|tsx|js|mjs)$/.test(f) && !f.startsWith("app/blog/"))
      .filter((f) => readFileSync(f, "utf8").includes("yandex.ru/ads"));
    expect(leaks).toEqual([]);
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

describe("ids from the environment", () => {
  it("accepts only the shapes Yandex issues", () => {
    expect(parsePageId(" 20450903 ")).toBe("20450903");
    expect(parsePageId("20450903; alert(1)")).toBeNull();
    expect(parsePageId(undefined)).toBeNull();
    expect(parseBlockId("R-A-1234567-1")).toBe("R-A-1234567-1");
    expect(parseBlockId("1234567")).toBeNull();
  });
});
