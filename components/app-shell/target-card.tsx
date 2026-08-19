const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";

/**
 * "Your target" card pinned to the bottom of the sidebar rail — the learner's
 * current target band and whether they've been calibrated by the diagnostic. Shared
 * by the app layout (dashboard/activities) and the writing library so the rail looks
 * the same everywhere.
 *
 * NOTHING IMPORTS THIS TODAY. The rail it was drawn for no longer mounts it,
 * and the only surviving reference is a doc comment in lib/plan/service.ts. It
 * is kept rather than deleted because the design it belongs to is still live —
 * but if the rail has not taken it back by the next pass over this folder, it
 * should go, and git will still have it.
 *
 * The `done` prop went with the line that used it: that line had been commented
 * out, so the component took a boolean it could not act on and every caller had
 * to invent one.
 */
export function TargetCard({ target }: { target: number }) {
  // Sits on the dark green rail (see shell.tsx) — a quiet translucent tile
  // rather than a loud gradient card.
  return (
    <div
      style={{
        background: "rgba(255,255,255,.05)",
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 14,
        padding: 16,
        color: "#fff",
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 11,
          letterSpacing: ".1em",
          textTransform: "uppercase",
          color: "#9096B0",
        }}
      >
        Your target
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
        <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 30 }}>
          {target.toFixed(1)}
        </span>
        <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13, color: "#5BDD9B" }}>
          overall
        </span>
      </div>
    </div>
  );
}
