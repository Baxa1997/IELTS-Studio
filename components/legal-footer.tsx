import Link from "next/link";

/**
 * Small in-app footer: the IELTS® non-affiliation disclaimer plus Privacy / Terms
 * links. Used at the bottom of the practice hubs (writing studio library, reading
 * practice) so the legal pages are reachable from inside the app, not just the
 * marketing site. Server-safe (no "use client").
 */

const SANS = "var(--font-hanken), system-ui, sans-serif";

export function LegalFooter({ note }: { note?: string }) {
  return (
    <footer
      style={{
        margin: "40px 0 0",
        paddingTop: 18,
        borderTop: "1px solid #ECE8DA",
        display: "flex",
        flexWrap: "wrap",
        gap: 12,
        alignItems: "baseline",
        justifyContent: "space-between",
        fontFamily: SANS,
      }}
    >
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: "#9A99A8", maxWidth: 520 }}>
        {note ?? "Not affiliated with or endorsed by IELTS®, the British Council, IDP, or Cambridge Assessment English."}
      </p>
      <nav style={{ display: "flex", gap: 16, flexShrink: 0 }}>
        <Link href="/privacy" style={link}>Privacy Policy</Link>
        <Link href="/terms" style={link}>Terms of Service</Link>
      </nav>
    </footer>
  );
}

const link: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: "#767C90",
  textDecoration: "none",
};
