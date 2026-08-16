/**
 * A minimal PDF writer for finance reports.
 *
 * Same reasoning as the XLSX writer next door: headless Chrome is 50+ MB and a
 * cold start measured in seconds, @react-pdf/renderer drags in its own layout
 * engine, and what a finance report needs is a title block, a KPI strip, and
 * paginated tables in one typeface. That is a few hundred lines of PDF 1.4 with
 * the two base-14 fonts every reader already has, so nothing has to be embedded.
 *
 * LIMITATION, stated plainly: base-14 Helvetica is WinAnsi-encoded, which covers
 * Latin and Latin-1 — English, Uzbek Latin, Turkish-ish diacritics — but NOT
 * Cyrillic. A center that names its groups in Cyrillic will see those names
 * transliterated to '?' in the PDF and correct in the XLSX. Fixing that means
 * embedding a subset TrueType font, which is the right next step if it ever
 * matters, and is why all glyph handling funnels through `winAnsi()` below.
 */

/* ── page geometry (A4, points) ───────────────────────────────────────────── */

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 42;
const CONTENT_W = PAGE_W - MARGIN * 2;

const INK = "0.086 0.086 0.180"; // #16162E
const MUTED = "0.431 0.424 0.529";
const RULE = "0.906 0.898 0.875";
const GREEN = "0.086 0.475 0.298";
const RED = "0.760 0.271 0.227";

/* ── Helvetica metrics ────────────────────────────────────────────────────── */
// Widths in 1/1000 em for ASCII 32–126. Everything outside falls back to 556,
// which is close enough for a table that reserves its columns anyway.

const W_REGULAR = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667,
  611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];

const W_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667,
  611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556,
  278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

/**
 * Typographic characters the app emits happily and WinAnsi does not have, or
 * has somewhere unexpected. Mapped rather than dropped so `−12 300` doesn't
 * silently become `12 300` in a report about money.
 */
const TRANSLITERATE: Record<string, string> = {
  "−": "-", // minus sign (formatMoney's negative)
  "–": "-",
  "—": "-",
  "‘": "'",
  "’": "'",
  ʻ: "'", // oʻzbek
  ʼ: "'",
  "“": '"',
  "”": '"',
  "…": "...",
  "·": "-",
  "•": "-",
  " ": " ",
  " ": " ", // thin space — formatMoney's digit grouping
  " ": " ",
  "→": "->",
};

/** Text down to bytes a base-14 font can actually show. */
function winAnsi(text: string): string {
  let out = "";
  for (const ch of text) {
    const mapped = TRANSLITERATE[ch] ?? ch;
    for (const c of mapped) {
      const code = c.codePointAt(0)!;
      out += code <= 0xff ? c : "?";
    }
  }
  return out;
}

export function textWidth(text: string, size: number, bold = false): number {
  const table = bold ? W_BOLD : W_REGULAR;
  let total = 0;
  for (const ch of winAnsi(text)) {
    const code = ch.charCodeAt(0);
    total += code >= 32 && code <= 126 ? table[code - 32] : 556;
  }
  return (total * size) / 1000;
}

/** Cut a string to fit a column, with an ellipsis when it had to. */
export function ellipsize(text: string, maxWidth: number, size: number, bold = false): string {
  if (textWidth(text, size, bold) <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && textWidth(`${out}...`, size, bold) > maxWidth) out = out.slice(0, -1);
  return `${out}...`;
}

/**
 * Break a paragraph across lines that fit.
 *
 * Added because clipping is the wrong failure for prose. A table cell that
 * ellipsizes loses a group name the reader can guess; a NOTE or a FOOTER that
 * ellipsizes loses the end of a sentence — and on the parent report the end of
 * that sentence was "...not an official IELTS result", the one line on the page
 * that is not optional. It was silently cut to "not an official IELTS...".
 */
export function wrapText(text: string, maxWidth: number, size: number, bold = false): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(candidate, size, bold) <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    // A single word longer than the column still has to go somewhere; it is the
    // one case where cutting is the only option.
    line = textWidth(word, size, bold) > maxWidth ? ellipsize(word, maxWidth, size, bold) : word;
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [""];
}

function pdfString(text: string): string {
  return winAnsi(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/* ── document model ───────────────────────────────────────────────────────── */

export interface PdfColumn {
  header: string;
  /** Share of the content width. Normalised, so any consistent scale works. */
  width: number;
  align?: "left" | "right";
}

export interface PdfTable {
  title?: string;
  note?: string;
  columns: PdfColumn[];
  rows: string[][];
  /** Bold summary row drawn under a rule. */
  totals?: string[];
  /** Row indexes to tint green (income) or red (expense). */
  tone?: ("in" | "out" | null)[];
}

export interface PdfStat {
  label: string;
  value: string;
  tone?: "good" | "bad" | "flat";
}

export interface PdfDocument {
  /** Center name — the letterhead. */
  organization: string;
  title: string;
  subtitle?: string;
  /** Right-hand meta lines in the header block. */
  meta?: string[];
  stats?: PdfStat[];
  tables: PdfTable[];
  footer?: string;
}

/* ── the writer ───────────────────────────────────────────────────────────── */

class Page {
  ops: string[] = [];
  y = PAGE_H - MARGIN;
}

class Writer {
  pages: Page[] = [];
  page: Page;
  /**
   * Vertical space the footer will occupy, set before any content is drawn.
   * A wrapping footer can be three lines tall, and content laid out against a
   * one-line assumption would print straight through it.
   */
  footerReserve = 28;

  constructor() {
    this.page = new Page();
    this.pages.push(this.page);
  }

  newPage(): void {
    this.page = new Page();
    this.pages.push(this.page);
  }

  /** Start a new page when `needed` points won't fit above the footer. */
  ensure(needed: number): void {
    if (this.page.y - needed < MARGIN + this.footerReserve) this.newPage();
  }

  text(
    value: string,
    x: number,
    y: number,
    opts: {
      size?: number;
      bold?: boolean;
      color?: string;
      align?: "left" | "right";
      maxWidth?: number;
    } = {},
  ): void {
    const size = opts.size ?? 9.5;
    const bold = opts.bold ?? false;
    const color = opts.color ?? INK;
    let shown = value;
    if (opts.maxWidth != null) shown = ellipsize(shown, opts.maxWidth, size, bold);
    const drawX = opts.align === "right" ? x - textWidth(shown, size, bold) : x;
    this.page.ops.push(
      `BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg 1 0 0 1 ${drawX.toFixed(2)} ${y.toFixed(2)} Tm (${pdfString(shown)}) Tj ET`,
    );
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    this.page.ops.push(
      `${color} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`,
    );
  }

  rule(y: number, color = RULE, x = MARGIN, w = CONTENT_W): void {
    this.rect(x, y, w, 0.6, color);
  }
}

function drawHeader(w: Writer, doc: PdfDocument): void {
  w.text(doc.organization.toUpperCase(), MARGIN, w.page.y - 10, {
    size: 8,
    bold: true,
    color: MUTED,
  });
  w.page.y -= 26;

  w.text(doc.title, MARGIN, w.page.y - 6, { size: 18, bold: true });
  if (doc.meta?.length) {
    let metaY = w.page.y - 4;
    for (const line of doc.meta) {
      w.text(line, PAGE_W - MARGIN, metaY, { size: 8.5, color: MUTED, align: "right" });
      metaY -= 11;
    }
  }
  w.page.y -= 22;

  if (doc.subtitle) {
    w.text(doc.subtitle, MARGIN, w.page.y - 4, { size: 10, color: MUTED });
    w.page.y -= 18;
  }
  w.page.y -= 6;
  w.rule(w.page.y);
  w.page.y -= 18;
}

function drawStats(w: Writer, stats: PdfStat[]): void {
  if (stats.length === 0) return;
  const boxW = CONTENT_W / stats.length;
  const boxH = 46;
  w.ensure(boxH + 12);
  const top = w.page.y;

  stats.forEach((stat, i) => {
    const x = MARGIN + i * boxW;
    w.rect(x, top - boxH, boxW - 6, boxH, "0.976 0.973 0.965");
    w.text(stat.label.toUpperCase(), x + 10, top - 17, {
      size: 7.5,
      bold: true,
      color: MUTED,
      maxWidth: boxW - 26,
    });
    const color = stat.tone === "good" ? GREEN : stat.tone === "bad" ? RED : INK;
    w.text(stat.value, x + 10, top - 34, { size: 13, bold: true, color, maxWidth: boxW - 26 });
  });

  w.page.y = top - boxH - 20;
}

function drawTable(w: Writer, table: PdfTable): void {
  const scale = table.columns.reduce((a, c) => a + c.width, 0) || 1;
  const widths = table.columns.map((c) => (c.width / scale) * CONTENT_W);
  const xs: number[] = [];
  let acc = MARGIN;
  for (const width of widths) {
    xs.push(acc);
    acc += width;
  }

  const rowH = 17;
  const headerH = 20;

  const drawHead = () => {
    w.ensure(headerH + rowH * 2);
    const top = w.page.y;
    w.rect(MARGIN, top - headerH + 4, CONTENT_W, headerH - 4, "0.957 0.953 0.941");
    table.columns.forEach((col, i) => {
      const right = col.align === "right";
      w.text(
        col.header.toUpperCase(),
        right ? xs[i] + widths[i] - 8 : xs[i] + 8,
        top - headerH + 11,
        {
          size: 7.5,
          bold: true,
          color: MUTED,
          align: right ? "right" : "left",
          maxWidth: widths[i] - 16,
        },
      );
    });
    w.page.y = top - headerH;
  };

  if (table.title) {
    w.ensure(headerH + rowH * 3 + 26);
    w.text(table.title, MARGIN, w.page.y - 11, { size: 12, bold: true });
    w.page.y -= 20;
    if (table.note) {
      for (const line of wrapText(table.note, CONTENT_W, 8.5)) {
        w.text(line, MARGIN, w.page.y - 8, { size: 8.5, color: MUTED });
        w.page.y -= 12;
      }
      w.page.y -= 2;
    }
  }

  drawHead();

  table.rows.forEach((row, rowIndex) => {
    if (w.page.y - rowH < MARGIN + w.footerReserve) {
      w.newPage();
      drawHead();
    }
    const top = w.page.y;
    if (rowIndex % 2 === 1) w.rect(MARGIN, top - rowH, CONTENT_W, rowH, "0.988 0.988 0.984");

    const tone = table.tone?.[rowIndex];
    table.columns.forEach((col, i) => {
      const right = col.align === "right";
      const isAmount = right && i === table.columns.length - 1;
      const color = isAmount && tone === "in" ? GREEN : isAmount && tone === "out" ? RED : INK;
      w.text(row[i] ?? "", right ? xs[i] + widths[i] - 8 : xs[i] + 8, top - 12, {
        size: 9,
        color,
        align: right ? "right" : "left",
        maxWidth: widths[i] - 16,
      });
    });
    w.rule(top - rowH, "0.961 0.957 0.941");
    w.page.y = top - rowH;
  });

  if (table.rows.length === 0) {
    w.text("Nothing in this period.", MARGIN + 8, w.page.y - 12, { size: 9, color: MUTED });
    w.page.y -= rowH;
  }

  if (table.totals) {
    w.ensure(rowH + 6);
    const top = w.page.y;
    w.rule(top, "0.812 0.792 0.737");
    table.columns.forEach((col, i) => {
      const right = col.align === "right";
      w.text(table.totals![i] ?? "", right ? xs[i] + widths[i] - 8 : xs[i] + 8, top - 13, {
        size: 9.5,
        bold: true,
        align: right ? "right" : "left",
        maxWidth: widths[i] - 16,
      });
    });
    w.page.y = top - rowH - 4;
  }

  w.page.y -= 22;
}

/**
 * The footer wraps rather than clips, and the rule above it moves up to make
 * room. A footer carrying a required disclaimer must be shown in full or it is
 * not a disclaimer.
 */
function drawFooters(w: Writer, doc: PdfDocument): void {
  const total = w.pages.length;
  const lines = doc.footer ? wrapText(doc.footer, CONTENT_W - 90, 7.5) : [];
  const block = Math.max(1, lines.length) * 9;

  w.pages.forEach((page, i) => {
    const saved = w.page;
    w.page = page;
    w.rule(MARGIN + block + 12, RULE);
    lines.forEach((line, n) => {
      w.text(line, MARGIN, MARGIN + block - 9 - n * 9, { size: 7.5, color: MUTED });
    });
    w.text(`Page ${i + 1} of ${total}`, PAGE_W - MARGIN, MARGIN + block - 9, {
      size: 7.5,
      color: MUTED,
      align: "right",
    });
    w.page = saved;
  });
}

/** Assemble the objects, the xref table and the trailer. */
function serialize(pages: Page[]): Buffer {
  const chunks: string[] = [];
  const offsets: number[] = [];
  let length = 0;

  const push = (s: string) => {
    chunks.push(s);
    length += Buffer.byteLength(s, "latin1");
  };

  push("%PDF-1.4\n%âãÏÓ\n");

  // 1 catalog, 2 pages, 3 font regular, 4 font bold, then page/content pairs.
  const pageObjIds = pages.map((_, i) => 5 + i * 2);
  const contentObjIds = pages.map((_, i) => 6 + i * 2);
  const totalObjects = 4 + pages.length * 2;

  const addObject = (id: number, body: string) => {
    offsets[id] = length;
    push(`${id} 0 obj\n${body}\nendobj\n`);
  };

  addObject(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObject(
    2,
    `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
  );
  addObject(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  addObject(
    4,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  );

  pages.forEach((page, i) => {
    addObject(
      pageObjIds[i],
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W.toFixed(2)} ${PAGE_H.toFixed(2)}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjIds[i]} 0 R >>`,
    );
    const stream = page.ops.join("\n");
    addObject(
      contentObjIds[i],
      `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`,
    );
  });

  const xrefStart = length;
  let xref = `xref\n0 ${totalObjects + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= totalObjects; id++) {
    xref += `${String(offsets[id] ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  push(xref);
  push(`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  return Buffer.from(chunks.join(""), "latin1");
}

export function buildPdf(doc: PdfDocument): Buffer {
  const w = new Writer();
  // Measured before anything is laid out, so every page break already knows how
  // tall the footer will be.
  const footerLines = doc.footer ? wrapText(doc.footer, CONTENT_W - 90, 7.5).length : 0;
  w.footerReserve = Math.max(1, footerLines) * 9 + 18;
  drawHeader(w, doc);
  if (doc.stats?.length) drawStats(w, doc.stats);
  for (const table of doc.tables) drawTable(w, table);
  drawFooters(w, doc);
  return serialize(w.pages);
}
