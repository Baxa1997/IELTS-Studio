"use client";

import Link from "next/link";

import { useT } from "@/shared/components/i18n/locale-provider";
import {
  CONTACT_EMAIL,
  CONTACT_MAILTO,
  CONTACT_PHONE,
  CONTACT_TEL_HREF,
} from "@/lib/contact";

import {
  BODY,
  BRAND,
  DISPLAY,
  eyebrow,
  ghostButton,
  INK,
  RULE,
  solidButton,
  STRONG,
  WELL,
} from "../_lib/design";

/**
 * The "For education centers" band above the footer.
 *
 * ⚠️ A CLIENT COMPONENT SO IT CAN SPEAK THE VISITOR'S LANGUAGE. It used to live
 * in `design-chrome.tsx`, which is a server module, and a server component on a
 * STATIC marketing route cannot read the locale cookie — reading it would opt
 * every one of those pages out of the static rendering they exist for. So the
 * locale reaches it through the provider instead, exactly as the header nav
 * does: `LandingPage` pins the route's own language, and on the other five
 * pages the chrome follows the cookie a tick after hydration.
 *
 * The email and phone number are NOT translated. They are addresses.
 */
export function CentersBand() {
  const t = useT();

  return (
    <section style={{ borderTop: `1px solid ${RULE}`, background: WELL, padding: "52px 28px" }}>
      <div
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: 32,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ ...eyebrow(true), color: BRAND }}>{t("mk.bandEyebrow")}</div>
          <h3
            style={{
              fontFamily: DISPLAY,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: "-0.03em",
              margin: "12px 0 0",
              textWrap: "pretty",
              color: INK,
            }}
          >
            {t("mk.bandTitle")}
          </h3>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: BODY,
              maxWidth: 620,
              margin: "12px 0 0",
            }}
          >
            {t("mk.bandBody")}
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              marginTop: 18,
              fontSize: 15,
              color: STRONG,
            }}
          >
            <span>
              ✉{" "}
              <a href={CONTACT_MAILTO} style={{ fontWeight: 700, color: BRAND }}>
                {CONTACT_EMAIL}
              </a>
            </span>
            <span>
              ✆{" "}
              <a href={CONTACT_TEL_HREF} style={{ fontWeight: 700, color: BRAND }}>
                {CONTACT_PHONE}
              </a>
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link
            href="/contact"
            className="lp-solid"
            style={{
              ...solidButton(),
              padding: "17px 32px",
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            {t("mk.bandContact")}
          </Link>
          <Link
            href="/how-to-use/education-centers"
            className="lp-ghost"
            style={{
              ...ghostButton(),
              padding: "17px 32px",
              textAlign: "center",
              display: "block",
            }}
          >
            {t("mk.bandGuide")}
          </Link>
        </div>
      </div>
    </section>
  );
}
