import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Headphones,
  Lock,
  MessagesSquare,
  SquarePen,
  Users,
  Volume2,
} from "lucide-react";

const SANS = "var(--font-hanken), system-ui, sans-serif";
const SERIF = "var(--font-newsreader), Georgia, serif";
const INDIGO = "#4338CA";
const INK = "#1C1B2E";
const MUTED = "#56556A";

/** The real IELTS Listening structure (computer-delivered format: ~30 min of
 *  audio, answered as you go, no separate paper transfer time). Preview-only —
 *  no generation or audio yet, see CLAUDE.md (Speaking/Listening are roadmap). */
const LISTENING_PARTS = [
  {
    part: 1,
    title: "Everyday conversation",
    desc: "Two speakers in a social or transactional setting — e.g. booking, an enquiry, making arrangements.",
    type: "Form / note / table completion",
    Icon: MessagesSquare,
  },
  {
    part: 2,
    title: "Everyday monologue",
    desc: "One speaker giving information in a social context — e.g. a talk about local facilities.",
    type: "Multiple choice · matching · plan labelling",
    Icon: Volume2,
  },
  {
    part: 3,
    title: "Academic conversation",
    desc: "Up to four speakers in an education or training context — e.g. a tutorial discussion.",
    type: "Multiple choice · matching",
    Icon: Users,
  },
  {
    part: 4,
    title: "Academic monologue",
    desc: "One speaker on an academic subject — a university-style lecture.",
    type: "Note / summary completion",
    Icon: GraduationCap,
  },
];

/**
 * Listening preview hub — UI only, no generation/audio/grading yet (roadmap;
 * see CLAUDE.md). Turns the sidebar's inert "Listening · SOON" badge into a
 * real page: the exam structure, previewed, plus a way back to the two live
 * skills. Static/presentational, so a plain server component — no client JS.
 */
export function ListeningHub() {
  return (
    <div style={{ width: "100%", padding: "26px clamp(16px,3vw,28px) 64px", fontFamily: SANS, color: INK }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: "clamp(28px,3.6vw,38px)", lineHeight: 1.05, letterSpacing: "-.4px", margin: 0, color: INK }}>
            Listening
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.5, color: MUTED, margin: "6px 0 0", maxWidth: 640 }}>
            The full 4-part exam, coming soon — original audio, generated and graded the same
            calibrated way as Writing and Reading.
          </p>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#EAEAFB", border: "1px solid rgba(67,56,202,.16)", color: INDIGO, padding: "8px 14px", borderRadius: 999, fontSize: 14, fontWeight: 600, whiteSpace: "nowrap" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: INDIGO }} />
          In development
        </span>
      </div>

      {/* Status banner — calm, not the AI-generate aurora (nothing to click yet) */}
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 22, padding: "20px 22px", background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 16, flexWrap: "wrap", boxShadow: "0 1px 3px rgba(28,27,46,.04)" }}>
        <span style={{ width: 48, height: 48, borderRadius: 14, background: "#EFEEFC", color: INDIGO, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Headphones size={22} />
        </span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 17, margin: 0, color: INK }}>
            Not gradable yet — here&apos;s what&apos;s built so far
          </h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: MUTED, margin: "5px 0 0" }}>
            Writing and Reading are where most scores are won or lost, so we built those first.
            Listening is next on the roadmap and will be included free for members when it
            launches.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <Link href="/write" style={hubCtaStyle(true)}>
            <SquarePen size={15} /> Practise Writing <ArrowRight size={14} strokeWidth={2.4} />
          </Link>
          <Link href="/read" style={hubCtaStyle(false)}>
            <BookOpen size={15} /> Practise Reading <ArrowRight size={14} strokeWidth={2.4} />
          </Link>
        </div>
      </div>

      {/* Exam structure preview */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "30px 0 16px" }}>
        <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 13.5, color: INK }}>The exam structure</span>
        <span style={{ height: 1, flex: 1, background: "rgba(28,27,46,.1)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
        {LISTENING_PARTS.map((p) => (
          <div key={p.part} style={{ position: "relative", background: "#fff", border: "1px solid rgba(28,27,46,.09)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12, opacity: 0.75 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span style={{ width: 40, height: 40, borderRadius: 11, background: "#F1F1F8", color: "#8A899A", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <p.Icon size={19} />
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: "#F1F1F8", color: "#8A899A" }}>
                <Lock size={11} /> Locked
              </span>
            </div>
            <div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 11.5, color: "#8A8FA0", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 3 }}>
                Part {p.part}
              </div>
              <h4 style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 18, lineHeight: 1.25, margin: "0 0 4px", color: INK }}>{p.title}</h4>
              <span style={{ fontSize: 13.5, color: "#7A7989", fontWeight: 500, lineHeight: 1.5 }}>{p.desc}</span>
            </div>
            <div style={{ height: 1, background: "rgba(28,27,46,.07)" }} />
            <span style={{ fontSize: 12.5, color: "#8A899A" }}>{p.type}</span>
          </div>
        ))}
      </div>

      <p style={{ margin: "32px 0 0", fontSize: 13, color: "#9A99A8" }}>
        Preview only — not affiliated with or endorsed by IELTS®.
      </p>
    </div>
  );
}

function hubCtaStyle(primary: boolean): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    padding: "9px 14px",
    borderRadius: 10,
    fontFamily: SANS,
    fontSize: 13.5,
    fontWeight: 700,
    textDecoration: "none",
    whiteSpace: "nowrap",
    background: primary ? INDIGO : "#fff",
    color: primary ? "#fff" : INK,
    border: primary ? "1px solid " + INDIGO : "1px solid rgba(28,27,46,.12)",
  };
}
