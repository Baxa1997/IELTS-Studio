import { applyUnsubscribe } from "@/lib/marketing/unsubscribe";
import { BRAND, HAIR, INK, MUTED, PANEL, SANS, SERIF, WELL } from "@/lib/theme/tokens";

import { ResubscribeButton } from "./resubscribe-button";

export const dynamic = "force-dynamic";

/**
 * One-click unsubscribe, opened straight from an email.
 *
 * ⚠️ IT UNSUBSCRIBES ON GET, WHICH NORMALLY WOULD BE WRONG. A GET that changes
 * state is bad practice everywhere except here: the reader has no session, mail
 * clients will not POST a form for them, and a page that says "click this
 * button to confirm" converts a click into a spam complaint from anyone who
 * does not bother. The token in the URL is what makes it safe — nobody can
 * unsubscribe a stranger without one, and the worst a pre-fetching mail client
 * can do is honour a request its own user asked for. The POST that
 * `List-Unsubscribe-Post` sends is answered by `app/api/unsubscribe/route.ts`,
 * which cannot live beside this file — App Router refuses a `route.ts` and a
 * `page.tsx` in one folder.
 *
 * ENGLISH ONLY, on purpose. This route lives outside the `[locale]` tree
 * because the link is minted in `lib/marketing/unsubscribe.ts` at send time,
 * where there is no request and therefore no locale to read. Marketing email is
 * English today; when it is not, the locale belongs in the token payload rather
 * than guessed here.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; t?: string }>;
}) {
  const { u, t } = await searchParams;
  const result = await applyUnsubscribe(u ?? "", t);

  return (
    <main
      style={{
        fontFamily: SANS,
        color: INK,
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: "100%",
          background: PANEL,
          border: `1px solid ${HAIR}`,
          borderRadius: 14,
          padding: "30px 28px",
        }}
      >
        <div style={{ fontSize: 12.5, letterSpacing: ".08em", textTransform: "uppercase", color: BRAND }}>
          EngProgress
        </div>

        {!result.ok ? (
          <>
            <h1 style={heading}>That link didn&apos;t work</h1>
            <p style={para}>
              It may have been broken by your email app, or it may be out of date. You can change
              your email preferences from your account settings instead.
            </p>
          </>
        ) : result.alreadyOut ? (
          <>
            <h1 style={heading}>You&apos;re already unsubscribed</h1>
            <p style={para}>
              You won&apos;t get updates about new practice content. Nothing else changes — messages
              about your own account, like password resets, still reach you.
            </p>
            <Resub u={u} t={t} />
          </>
        ) : (
          <>
            <h1 style={heading}>You&apos;re unsubscribed</h1>
            <p style={para}>
              We won&apos;t email you about new practice content again. Messages about your own
              account — password resets and the like — still reach you, because those aren&apos;t
              marketing.
            </p>
            <Resub u={u} t={t} />
          </>
        )}

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${HAIR}` }}>
          <a href="https://www.engprogress.com" style={{ fontSize: 13.5, color: BRAND }}>
            Go to EngProgress →
          </a>
        </div>
      </div>
    </main>
  );
}

function Resub({ u, t }: { u?: string; t?: string }) {
  if (!u || !t) return null;
  return (
    <div
      style={{
        marginTop: 18,
        padding: "12px 14px",
        background: WELL,
        borderRadius: 10,
        fontSize: 13,
        color: MUTED,
        lineHeight: 1.55,
      }}
    >
      Clicked this by accident? <ResubscribeButton profileId={u} token={t} />
    </div>
  );
}

const heading: React.CSSProperties = {
  fontFamily: SERIF,
  fontWeight: 600,
  fontSize: 25,
  lineHeight: 1.15,
  letterSpacing: "-.015em",
  margin: "12px 0 10px",
  color: INK,
};

const para: React.CSSProperties = {
  fontSize: 14.5,
  lineHeight: 1.6,
  color: MUTED,
  margin: 0,
};
