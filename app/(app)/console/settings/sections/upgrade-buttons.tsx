"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Provider = "stripe" | "payme" | "click";

const LABEL: Record<Provider, string> = {
  stripe: "Card (Stripe)",
  payme: "Payme",
  click: "Click",
};

/**
 * Upgrade buttons for one purchasable plan — one per configured provider. Each
 * POSTs to the checkout route and redirects to the provider's payment page.
 */
export function UpgradeButtons({
  plan,
  providers,
}: {
  plan: "starter" | "pro";
  providers: Record<Provider, boolean>;
}) {
  const [loading, setLoading] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enabled = (["stripe", "payme", "click"] as Provider[]).filter((p) => providers[p]);

  async function go(provider: Provider) {
    setLoading(provider);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, provider }),
      });
      const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && body.url) {
        window.location.assign(body.url);
      } else {
        setError(body.error ?? "Checkout failed.");
        setLoading(null);
      }
    } catch {
      setError("Network error.");
      setLoading(null);
    }
  }

  if (enabled.length === 0) {
    return <p className="text-muted-foreground text-xs">No payment provider configured.</p>;
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {enabled.map((p, i) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant={i === 0 ? "default" : "outline"}
            disabled={loading != null}
            onClick={() => go(p)}
          >
            {loading === p ? "Redirecting…" : LABEL[p]}
          </Button>
        ))}
      </div>
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
