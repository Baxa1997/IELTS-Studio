"use client";

import Link from "next/link";

import { SignUpButton } from "@/app/_landing/_components/sign-up-dialog";
import { useSignedIn } from "@/app/_landing/_hooks/use-signed-in";
import {
  BODY,
  BRAND,
  DISPLAY,
  INK,
  LINE,
  MUTED,
  PANEL,
  SANS,
  eyebrow,
  solidButton,
} from "@/app/_landing/_lib/design";

export interface AccountOfferCopy {
  eyebrow: string;
  title: string;
  lines: string[];
  note: string;
  cta: string;
  have: string;
  signIn: string;
}

/**
 * The free account, offered under an article: what it holds, that paying opens
 * more, and the dialog that makes one without leaving the page.
 *
 * ⚠️ THE WORDS ARRIVE AS PROPS, translated on the server in English like the
 * rest of the article. `useT()` here would follow the visitor's interface
 * language and hang an Uzbek card under an English article. (The dialog it opens
 * does follow the interface language, as it does everywhere else.)
 *
 * GONE ONCE THE BROWSER FINDS A SESSION: offering an account to someone signed
 * in to it is the one wrong thing this card can do. The article stays static;
 * for a signed-in reader the card goes a moment after paint, at the end of the
 * page, where nothing moves under them.
 */
export function AccountOffer({ copy }: { copy: AccountOfferCopy }) {
  const signedIn = useSignedIn();
  if (signedIn) return null;

  return (
    <aside
      style={{
        marginTop: 20,
        padding: "20px 22px",
        borderRadius: 16,
        background: PANEL,
        border: `1px solid ${LINE}`,
        fontFamily: SANS,
      }}
    >
      <div style={eyebrow(true)}>{copy.eyebrow}</div>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 600,
          fontSize: 19,
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          color: INK,
          margin: "8px 0 0",
        }}
      >
        {copy.title}
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "12px 0 0",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(min(250px,100%),1fr))",
          gap: "8px 18px",
        }}
      >
        {copy.lines.map((line) => (
          <li key={line} style={{ display: "flex", gap: 8, fontSize: 15, lineHeight: 1.45, color: INK }}>
            <span aria-hidden style={{ color: BRAND, fontWeight: 700 }}>
              →
            </span>
            {line}
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 14.5, lineHeight: 1.55, color: BODY, margin: "12px 0 0" }}>{copy.note}</p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "12px 18px",
          marginTop: 16,
        }}
      >
        <SignUpButton label={copy.cta} className="lp-solid" style={solidButton("md")} />
        <span style={{ fontSize: 14.5, color: MUTED }}>
          {copy.have}{" "}
          <Link href="/sign-in" style={{ color: BRAND, fontWeight: 700, textDecoration: "none" }}>
            {copy.signIn}
          </Link>
        </span>
      </div>
    </aside>
  );
}
