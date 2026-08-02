import { Bricolage_Grotesque, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";

// The Speaking "Lucida" surface — and nothing else under (shell) — uses these
// three. They were loaded by the (shell) layout, so Reading, Writing, Listening
// and CEFR each downloaded twelve weights they never render. Scoped here the
// speaking screens are unchanged and the other routes stop paying.
//
// (app/(studio)/layout.tsx loads the same three for the studio runners; that is
// a separate layout tree, so both need their own copy. next/font dedupes the
// underlying files at build time.)
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});
// Numbers and small-caps labels — timers, bands, wpm. Mono so a running clock
// does not jitter as its digits change width.
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono-data",
  display: "swap",
});

export default function SpeakFontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${bricolage.variable} ${jakarta.variable} ${jetbrains.variable}`}
      style={{ display: "contents" }}
    >
      {children}
    </div>
  );
}
