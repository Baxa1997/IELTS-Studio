"use client";

import { useState, useTransition } from "react";

import { BRAND, GREEN } from "@/lib/theme/tokens";

import { resubscribe } from "../actions";

/** Undo, for somebody who clicked the footer link by mistake. Deliberately a
 *  quiet inline control rather than a button of equal weight — the page's job
 *  is to confirm the unsubscribe worked, not to argue with it. */
export function ResubscribeButton({ profileId, token }: { profileId: string; token: string }) {
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  if (done) return <span style={{ color: GREEN }}>Back on the list.</span>;

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const ok = await resubscribe(profileId, token);
            if (ok) setDone(true);
            else setFailed(true);
          })
        }
        style={{
          border: "none",
          background: "none",
          padding: 0,
          font: "inherit",
          color: BRAND,
          textDecoration: "underline",
          cursor: pending ? "default" : "pointer",
        }}
      >
        {pending ? "Just a moment…" : "Put me back on the list"}
      </button>
      {failed ? <span> — that didn&apos;t work, sorry.</span> : null}
    </>
  );
}
