import type { MessageKey } from "@/lib/i18n";

/**
 * The Writing hub's tabs, and which one a visit opens on.
 *
 * ⚠️ THE TAB LIVES IN THE URL (`/write?tab=task2`), NOT IN sessionStorage. It
 * used to be remembered in sessionStorage and restored after mount, so the hub
 * painted one tab and then jumped to another, and "Writing" in the menu
 * reopened whatever tab was used last. The owner's rule is that the menu lands
 * on Task 1, at once, every time. A URL does both jobs: the server renders the
 * right tab in the first paint, a bare `/write` is always Task 1, and the
 * studio's way back names the tab of the prompt that was being written — which
 * is what the sessionStorage was there to preserve.
 *
 * Keys, not labels: a module constant is evaluated before any locale is known,
 * so it cannot call `t()`. The render translates.
 */
export const WRITE_TABS = [
  { key: "check_own", labelKey: "write.checkOwn" },
  { key: "task1_academic", labelKey: "write.acadT1" },
  { key: "task2", labelKey: "write.acadT2" },
  { key: "task1_general", labelKey: "write.gt" },
] as const satisfies readonly { key: string; labelKey: MessageKey }[];

export type WriteTab = (typeof WRITE_TABS)[number]["key"];

/** What a bare `/write` opens on. */
export const DEFAULT_WRITE_TAB: WriteTab = "task1_academic";

/** The tab a `?tab=` value asks for; anything unknown is the default. */
export function resolveWriteTab(raw: string | string[] | undefined): WriteTab {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return WRITE_TABS.find((t) => t.key === value)?.key ?? DEFAULT_WRITE_TAB;
}

/** The hub URL that opens on `tab`. The default tab is the bare path, so the
 *  menu's link and this one are the same page. */
export function writeHubHref(tab: string): string {
  const resolved = resolveWriteTab(tab);
  return resolved === DEFAULT_WRITE_TAB ? "/write" : `/write?tab=${resolved}`;
}
