import { deflateRawSync } from "node:zlib";

/**
 * A minimal XLSX writer.
 *
 * WHY NOT A LIBRARY. The obvious candidates (exceljs, sheetjs) are 3–8 MB of
 * dependency for what a finance export actually needs: a few sheets of strings,
 * integers and dates, bold headers, sane column widths. On a serverless
 * function that cost is paid on every cold start of every route in the bundle.
 * What follows is the whole OOXML surface those sheets require — about 200
 * lines, no dependencies beyond node:zlib — and it emits a file Excel, Numbers,
 * LibreOffice and Google Sheets all open without a repair prompt.
 *
 * Deliberately not supported: formulas, merged cells, multiple fonts, images.
 * If a report ever needs one of those, that is the moment to reconsider, not
 * now.
 */

/* ── ZIP container ────────────────────────────────────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

interface ZipEntry {
  name: string;
  data: Buffer;
}

/** Deflated ZIP with no directory entries — every path is stored flat. */
function zip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, "utf8");
    const compressed = deflateRawSync(entry.data, { level: 9 });
    const crc = crc32(entry.data);

    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // flags
    local.writeUInt16LE(8, 8); // deflate
    local.writeUInt16LE(0, 10); // time
    local.writeUInt16LE(0x2921, 12); // date — fixed, so output is reproducible
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nameBuf.copy(local, 30);
    locals.push(local, compressed);

    const central = Buffer.alloc(46 + nameBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x2921, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    nameBuf.copy(central, 46);
    centrals.push(central);

    offset += local.length + compressed.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralBuf, end]);
}

/* ── sheet model ──────────────────────────────────────────────────────────── */

export type CellType = "text" | "number" | "money" | "date" | "percent";

export interface SheetColumn {
  header: string;
  /** Approximate characters wide. */
  width?: number;
  type?: CellType;
}

export type CellValue = string | number | null | undefined;

export interface Sheet {
  name: string;
  columns: SheetColumn[];
  rows: CellValue[][];
  /** Bold, ruled row pinned to the bottom of the sheet. */
  totals?: CellValue[];
  /** Free lines printed above the table — period, filters, who exported it. */
  notes?: string[];
}

export interface WorkbookOptions {
  /** 0 for UZS, 2 for USD — drives the money number format. */
  moneyDigits?: 0 | 2;
}

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // Control characters are illegal in XML and Excel refuses the whole file.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

function colLetter(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/** Excel serial day number. 1899-12-30 is the epoch Excel actually uses. */
function excelDate(value: string): number | null {
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 86_400_000) + 25569;
}

// Style indexes, matching the cellXfs order below.
const S_DEFAULT = 0;
const S_HEADER = 1;
const S_MONEY = 2;
const S_DATE = 3;
const S_TOTAL_TEXT = 4;
const S_TOTAL_MONEY = 5;
const S_NOTE = 6;
const S_NUMBER = 7;
const S_PERCENT = 8;

function styleFor(type: CellType | undefined, total: boolean): number {
  if (total) return type === "money" || type === "number" ? S_TOTAL_MONEY : S_TOTAL_TEXT;
  switch (type) {
    case "money":
      return S_MONEY;
    case "date":
      return S_DATE;
    case "number":
      return S_NUMBER;
    case "percent":
      return S_PERCENT;
    default:
      return S_DEFAULT;
  }
}

function cellXml(
  ref: string,
  value: CellValue,
  type: CellType | undefined,
  total: boolean,
  styleOverride?: number,
): string {
  const style = styleOverride ?? styleFor(type, total);
  if (value == null || value === "") return `<c r="${ref}" s="${style}"/>`;

  if (type === "date" && typeof value === "string") {
    const serial = excelDate(value);
    if (serial != null) return `<c r="${ref}" s="${style}"><v>${serial}</v></c>`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  }
  // inlineStr keeps every sheet self-contained: no shared-string table to keep
  // in sync, at the cost of a few bytes we are compressing anyway.
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(String(value))}</t></is></c>`;
}

function sheetXml(sheet: Sheet): string {
  const notes = sheet.notes ?? [];
  const rows: string[] = [];
  let r = 1;

  for (const note of notes) {
    rows.push(
      `<row r="${r}"><c r="A${r}" s="${S_NOTE}" t="inlineStr"><is><t xml:space="preserve">${esc(note)}</t></is></c></row>`,
    );
    r++;
  }
  if (notes.length > 0) r++; // blank spacer row

  const headerRow = r;
  rows.push(
    `<row r="${r}">${sheet.columns
      .map((c, i) => cellXml(`${colLetter(i)}${r}`, c.header, "text", false, S_HEADER))
      .join("")}</row>`,
  );
  r++;

  for (const row of sheet.rows) {
    rows.push(
      `<row r="${r}">${sheet.columns
        .map((c, i) => cellXml(`${colLetter(i)}${r}`, row[i], c.type, false))
        .join("")}</row>`,
    );
    r++;
  }

  if (sheet.totals) {
    rows.push(
      `<row r="${r}">${sheet.columns
        .map((c, i) => cellXml(`${colLetter(i)}${r}`, sheet.totals![i], c.type, true))
        .join("")}</row>`,
    );
    r++;
  }

  const cols = sheet.columns
    .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.width ?? 16}" customWidth="1"/>`)
    .join("");

  const lastCol = colLetter(Math.max(0, sheet.columns.length - 1));
  // Freeze under the header so a long ledger stays readable while scrolling,
  // and turn on the autofilter — the first thing anyone does to an export.
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${cols}</cols>
<sheetData>${rows.join("")}</sheetData>
<autoFilter ref="A${headerRow}:${lastCol}${headerRow + sheet.rows.length}"/>
</worksheet>`;
}

const STYLES = (moneyFmt: string) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="${moneyFmt}"/><numFmt numFmtId="165" formatCode="yyyy\\-mm\\-dd"/></numFmts>
<fonts count="3">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FF16162E"/><name val="Calibri"/></font>
<font><sz val="10"/><color rgb="FF6E6C87"/><name val="Calibri"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFF0EEE9"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left/><right/><top style="thin"><color rgb="FFCFCABC"/></top><bottom/><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="9">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
<xf numFmtId="164" fontId="1" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
</styleSheet>`;

/** Excel rejects these in a sheet name, and silently truncates past 31 chars. */
function safeSheetName(name: string, index: number): string {
  const cleaned = name
    .replace(/[\\/?*[\]:]/g, "-")
    .slice(0, 31)
    .trim();
  return cleaned || `Sheet${index + 1}`;
}

export function buildWorkbook(sheets: Sheet[], opts: WorkbookOptions = {}): Buffer {
  const list =
    sheets.length > 0 ? sheets : [{ name: "Empty", columns: [{ header: "—" }], rows: [] }];
  const moneyFmt = opts.moneyDigits === 2 ? "#,##0.00" : "#,##0";
  const names = list.map((s, i) => safeSheetName(s.name, i));

  const entries: ZipEntry[] = [
    {
      name: "[Content_Types].xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${list.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n")}
</Types>`,
        "utf8",
      ),
    },
    {
      name: "_rels/.rels",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
        "utf8",
      ),
    },
    {
      name: "xl/workbook.xml",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets>
</workbook>`,
        "utf8",
      ),
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      data: Buffer.from(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${list.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("\n")}
<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
        "utf8",
      ),
    },
    { name: "xl/styles.xml", data: Buffer.from(STYLES(moneyFmt), "utf8") },
    ...list.map((sheet, i) => ({
      name: `xl/worksheets/sheet${i + 1}.xml`,
      data: Buffer.from(sheetXml(sheet), "utf8"),
    })),
  ];

  return zip(entries);
}
