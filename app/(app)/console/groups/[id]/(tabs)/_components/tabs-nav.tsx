"use client";

import { usePathname } from "next/navigation";

import { Tabs } from "@/app/(app)/console/_components/crm-ui";

export type GroupTab = { href: string; label: string; exact?: boolean; prefetch?: boolean };

/**
 * The group's tab strip, with "which one am I on" worked out from the URL.
 *
 * ⚠️ WHY A CLIENT COMPONENT SITS BETWEEN THE LAYOUT AND `Tabs`. The tabs are
 * route segments now, and the layout that draws them is a server component that
 * cannot know which child segment is rendering — there is no `usePathname` on
 * the server, and a layout is deliberately not re-run per child. So the active
 * flag is derived here, in the browser, from the path.
 *
 * `Tabs` itself is left exactly as it was, taking an explicit `active`, because
 * it has some thirty other callers that pass one and none of them should have to
 * change for this page.
 *
 * EXACT vs PREFIX is the whole logic and it is not decoration: the Students tab
 * is the index route, so its href is a prefix of every other tab's and a
 * `startsWith` test would light it up on all of them. Every other tab wants the
 * prefix, so that `/settings/schedule` keeps Settings lit rather than leaving
 * the strip showing nothing while you are plainly inside it.
 */
export function GroupTabs({ tabs }: { tabs: GroupTab[] }) {
  const pathname = usePathname();
  return (
    <Tabs
      tabs={tabs.map(({ href, label, exact, prefetch }) => ({
        href,
        label,
        prefetch,
        active: exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"),
      }))}
    />
  );
}
