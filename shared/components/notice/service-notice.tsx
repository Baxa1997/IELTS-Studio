"use client";

import { Wrench } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { translator } from "@/lib/i18n";
import { HTML_LANG } from "@/lib/i18n/locales";
import { AMBER, INK, PANEL, withAlpha } from "@/lib/theme/tokens";
import { useLocale } from "@/shared/components/i18n/locale-provider";

import { backByLabel, noticeLocale } from "./notice";

const noSubscription = () => () => {};

/**
 * A band across the top of every page: technical work is under way, and the
 * date the platform will be fully back. Mounted once, in app/layout.tsx — see
 * ./notice.ts for taking it down.
 *
 * ⚠️ THE WORDS ARE WRITTEN IN THE BROWSER, NOT ON THE SERVER. The root layout
 * is static and cannot know the visitor's language, so server-rendered text
 * would be English for everybody and then swap. On every cacheable page it
 * would also sit in the HTML that search engines and AI crawlers read for as
 * long as the notice is up. So the server sends the band empty, at its
 * expected height (`.ep-notice` in globals.css), and nothing below it moves
 * when the words arrive. `data-nosnippet` keeps Google from quoting them.
 *
 * ⚠️ IT PUBLISHES ITS OWN HEIGHT as `--ep-notice-h` on <html>. Full-screen
 * frames subtract it (`SCREEN` in lib/theme/tokens); without that, every
 * one-screen frame would run off the bottom by the band's height. The
 * stylesheet's estimate covers the first paint, and this replaces it with the
 * measured height, again whenever the text wraps differently.
 */
export function ServiceNotice() {
  const pathname = usePathname() ?? "/";
  const { locale: chosen } = useLocale();
  const locale = noticeLocale(pathname, chosen);
  // false on the server and through hydration, true from the first client
  // render after it, so the words never have to match server markup.
  const live = useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
  const band = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = band.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--ep-notice-h", `${el.offsetHeight}px`);
    publish();
    // Mounted on every page, so it must never be what breaks one: without the
    // observer it keeps its first measurement instead of throwing.
    if (typeof ResizeObserver === "undefined")
      return () => root.style.removeProperty("--ep-notice-h");
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--ep-notice-h");
    };
  }, []);

  const t = translator(locale);
  return (
    <div
      ref={band}
      className="ep-notice"
      role="status"
      data-nosnippet=""
      style={{
        background: `color-mix(in oklab, ${AMBER} 16%, ${PANEL})`,
        borderBottom: `1px solid ${withAlpha(AMBER, 45)}`,
        color: INK,
      }}
    >
      {live ? (
        <p lang={HTML_LANG[locale]}>
          <Wrench aria-hidden size={15} style={{ color: AMBER, flex: "none", marginTop: 2 }} />
          <span>
            <strong>{t("notice.title")}</strong> {t("notice.body", { date: backByLabel(locale) })}
          </span>
        </p>
      ) : null}
    </div>
  );
}
