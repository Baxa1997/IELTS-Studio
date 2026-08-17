"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { RANGES, type RangeKey } from "@/lib/console/window";

/**
 * The one control that governs the page.
 *
 * It writes to the URL rather than to component state, for two reasons: the
 * numbers are computed on the server, so the range has to travel with the
 * request; and a range you can link to is a range two people can argue about
 * from the same screen.
 *
 * Every other filter on the page is preserved when it changes — a picker that
 * silently drops the group you were looking at is a picker people stop using.
 */
export function RangePicker({ value }: { value: RangeKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{ fontSize: 12, color: "#777581" }}>Showing</span>
      <select
        aria-label="Date range"
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString());
          next.set("range", e.target.value);
          startTransition(() => router.replace(`${pathname}?${next.toString()}`));
        }}
        style={{
          border: "1px solid #DDD9D0",
          borderRadius: 8,
          background: "#fff",
          padding: "7px 10px",
          fontFamily: "inherit",
          fontSize: 12.5,
          fontWeight: 500,
          color: "#16162E",
          cursor: pending ? "wait" : "pointer",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {RANGES.map((r) => (
          <option key={r.key} value={r.key}>
            {r.label}
          </option>
        ))}
      </select>
    </label>
  );
}
