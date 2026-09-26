"use client";

/**
 * "PDF worksheet" — the browser's own print-to-PDF.
 *
 * A deliberate choice rather than a shortcut. The alternative was the
 * hand-rolled builder in lib/finance/pdf.ts, which encodes WinAnsi: every
 * Cyrillic character in a Russian note would print as "?". Printing the real
 * page gets correct Uzbek and Russian, the real typography, and no font
 * embedding.
 *
 * What it prints is the explanation plus a clean question sheet — never the
 * answers. The key used to sit on this page behind a toggle, and printing
 * followed it; now the sheet is the only document this button makes, so there
 * is nothing to get wrong and nothing to hand a class by accident.
 */
export function WorksheetButton({ style, className }: { style: React.CSSProperties; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      title="Print or save as PDF — the questions, no answers"
      className={className}
      style={style}
    >
      PDF worksheet
    </button>
  );
}
