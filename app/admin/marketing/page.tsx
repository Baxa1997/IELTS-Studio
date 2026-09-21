import {
  Card,
  CardHead,
  INK,
  LINE,
  MUTED,
  PageTitle,
  SANS,
  Surface,
  TONE,
} from "@/components/admin/ui";
import { requireSuperAdmin } from "@/lib/auth";
import { marketingBucketExists } from "@/lib/marketing/assets";
import { inSegment, loadAudience } from "@/lib/marketing/audience";
import { loadBroadcasts } from "@/lib/marketing/broadcast";

import { Composer } from "./composer";

export const dynamic = "force-dynamic";

/**
 * Telling learners about new practice content.
 *
 * ⚠️ THE ONLY PLACE THE PLATFORM SENDS NON-TRANSACTIONAL EMAIL, and everything
 * unusual about this screen follows from that. The audience is derived rather
 * than stored, unsubscribed people are shown but not selected, and the send
 * runs in batches the browser drives — see the notes in `lib/marketing/`.
 *
 * The default segment is SOLO LEARNERS, not everybody. A centre student only
 * ever practises what their teacher attaches to their group, so advertising new
 * practice to them promotes something they cannot go and use and goes around
 * the teacher who picks their material. They can still be chosen by hand.
 */
export default async function MarketingPage() {
  await requireSuperAdmin();

  /* ONE LISTING, SLICED THREE WAYS. `loadAudience` paginates the whole
     `auth.users` table through the Admin API, so calling it once per segment
     meant three full listings to render one screen. */
  const [everyone, broadcasts, bucketReady] = await Promise.all([
    loadAudience("everyone"),
    loadBroadcasts(),
    marketingBucketExists(),
  ]);
  const learners = everyone.filter((r) => inSegment(r, "learners"));
  const staff = everyone.filter((r) => inSegment(r, "staff"));


  return (
    <Surface>
      <PageTitle
        eyebrow="Platform"
        title="Broadcast"
        subtitle="Email learners about new practice content. Everyone here has an account and a working address; anyone who has unsubscribed is listed but cannot be selected."
      />

      {!bucketReady ? (
        <div
          style={{
            fontFamily: SANS,
            fontSize: 13.5,
            lineHeight: 1.55,
            color: TONE.amber.ink,
            background: TONE.amber.tint,
            border: `1px solid ${TONE.amber.border}`,
            borderRadius: 10,
            padding: "12px 14px",
            margin: "0 0 18px",
          }}
        >
          <strong>File uploads are unavailable.</strong> The <code>marketing</code> storage bucket
          does not exist yet — apply migration{" "}
          <code>20260921120000_marketing_broadcasts.sql</code>. You can still send a message with
          links typed by hand.
        </div>
      ) : null}

      <Composer
        learners={learners}
        staff={staff}
        everyone={everyone}
        uploadsEnabled={bucketReady}
      />

      <Card style={{ marginTop: 20 }}>
        <CardHead
          title="Sent before"
          note="What was said, to how many, and what bounced. A broadcast stuck on “sending” was interrupted — open it again to finish."
        />
        {broadcasts.length === 0 ? (
          <div style={{ fontFamily: SANS, fontSize: 13.5, color: MUTED, padding: "18px 0" }}>
            Nothing has been sent yet.
          </div>
        ) : (
          <div style={{ fontFamily: SANS }}>
            {broadcasts.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "11px 0",
                  borderTop: `1px solid ${LINE}`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: INK, fontWeight: 500 }}>{b.subject}</div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>
                    {new Date(b.createdAt).toLocaleString("en", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: MUTED, whiteSpace: "nowrap" }}>
                  {b.sent} sent
                  {b.failed > 0 ? ` · ${b.failed} failed` : ""}
                  {b.skipped > 0 ? ` · ${b.skipped} skipped` : ""}
                  {b.queued > 0 ? ` · ${b.queued} still queued` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p
        style={{
          fontFamily: SANS,
          fontSize: 12.5,
          lineHeight: 1.6,
          color: MUTED,
          margin: "16px 0 0",
          maxWidth: 680,
        }}
      >
        Every message carries a one-click unsubscribe link, and the same sender also carries your
        password resets and centre approvals — so complaints here would damage those too. Send
        rarely, and only when there is genuinely something new.
      </p>
    </Surface>
  );
}
