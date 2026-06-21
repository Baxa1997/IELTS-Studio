/**
 * Suspense fallback for the (studio) group (Writing/Reading library + the
 * full-screen runners). These routes are `force-dynamic` and live in a different
 * route group than the app shell, so a click otherwise sits on the previous page
 * until the server responds. This gives an instant, on-brand loading screen:
 * the brand mark centered inside a single spinning ring.
 */
const SANS = "var(--font-hanken), system-ui, sans-serif";

export default function StudioLoading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background: "#F4F1E7",
      }}
    >
      <div style={{ position: "relative", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* spinning ring */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid rgba(79,70,229,.18)",
            borderTopColor: "#4F46E5",
            animation: "lp-spin .7s linear infinite",
          }}
        />
        {/* brand mark */}
        <span
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "linear-gradient(135deg,#6366F1,#4F46E5)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 14,
            letterSpacing: ".02em",
            boxShadow: "0 6px 16px -6px rgba(79,70,229,.6)",
          }}
        >
          IS
        </span>
      </div>
      <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 500, color: "#7C7A86", letterSpacing: ".01em" }}>Loading…</span>
    </div>
  );
}
