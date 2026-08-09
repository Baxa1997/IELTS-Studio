import { DM_Sans } from "next/font/google";

// The Listening runner is the only surface that asks for DM Sans (titles, UI,
// tabular times). It used to be loaded by the (shell) layout, which meant every
// Reading, Writing and CEFR page downloaded it too and never drew a glyph with
// it. Loading it HERE keeps the runner identical and takes it off the routes
// that were only paying for it.
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dmsans",
  display: "swap",
  preload: false,
});

export default function ListenFontLayout({ children }: { children: React.ReactNode }) {
  // A plain wrapper: --font-dmsans is an inherited custom property, so
  // everything below picks it up exactly as it did from the shell.
  return (
    <div className={dmSans.variable} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
