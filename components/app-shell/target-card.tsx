const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";

/**
 * "Your target" card pinned to the bottom of the sidebar rail — the learner's
 * current target band and whether they've been calibrated by the diagnostic. Shared
 * by the app layout (dashboard/activities) and the writing library so the rail looks
 * the same everywhere.
 */
export function TargetCard({ target, done }: { target: number; done: boolean }) {
  return (
    <div style={{ background: "linear-gradient(150deg,#3B43B5,#2A2F86)", borderRadius: 14, padding: 16, color: "#fff" }}>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: "#cdcffb" }}>Your target</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
        <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 30 }}>{target.toFixed(1)}</span>
        <span style={{ fontFamily: SANS, fontWeight: 500, fontSize: 13, color: "#C7F25B" }}>overall</span>
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 400, fontSize: 12, lineHeight: 1.4, color: "#cdcffb", marginTop: 6 }}>
        {done ? "You're being tracked — keep practising to close the gap." : "Take the diagnostic to set your real starting bands."}
      </div>
    </div>
  );
}
