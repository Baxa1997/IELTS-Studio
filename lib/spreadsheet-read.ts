/**
 * Reading a spreadsheet the center already has.
 *
 * Every education center in this market keeps its class lists in Excel, and
 * "type all forty names again" is the sentence that stops them adopting
 * anything. So: hand us the .xlsx and we read it.
 *
 * WHY THIS IS HAND-ROLLED, AND WHY IT RUNS IN THE BROWSER. Hand-rolled because
 * the alternative is a megabyte-class dependency inside a serverless function
 * that runs once per new class — the writer half of this problem
 * (`lib/finance/xlsx.ts`) was written the same way for the same reason. In the
 * browser because the teacher must SEE the rows before forty auth accounts are
 * created from them: parsing on the server would mean uploading, guessing, and
 * finding out afterwards. Nothing here touches the network.
 *
 * An .xlsx is a ZIP of XML. Two members matter: the shared string table and the
 * first worksheet. Everything else — styles, themes, calc chains — is ignored,
 * which is why this is a few hundred lines instead of a library.
 *
 * `DecompressionStream("deflate-raw")` does the inflating; it is native in every
 * browser this app supports and in Node 18+, so there is no inflate
 * implementation here either.
 */

/** A sheet as a rectangle of trimmed strings. Empty cells are `""`, never null. */
export type Grid = string[][];

export class SpreadsheetError extends Error {}

/** Read the first sheet of an .xlsx, or a .csv, into a grid. */
export async function readSpreadsheet(file: File): Promise<Grid> {
  const name = file.name.toLowerCase();
  const buffer = new Uint8Array(await file.arrayBuffer());

  // A ZIP always starts "PK\x03\x04". Trusting the magic bytes over the
  // extension means a file renamed .csv by a well-meaning admin still works.
  const isZip =
    buffer.length > 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  if (isZip) return parseXlsx(await unzip(buffer));
  if (name.endsWith(".xls")) {
    throw new SpreadsheetError(
      "That's the old .xls format. Open it in Excel and save as .xlsx or CSV.",
    );
  }
  return parseCsv(new TextDecoder("utf-8").decode(buffer));
}

/* ── zip ──────────────────────────────────────────────────────────────────── */

async function unzip(buffer: Uint8Array): Promise<Map<string, string>> {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  // The end-of-central-directory record is last, after a comment of unknown
  // length, so it is found by scanning backwards for its signature.
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0 && i > buffer.length - 22 - 65536; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new SpreadsheetError("That file isn't a readable spreadsheet.");

  const entryCount = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  if (offset === 0xffffffff) {
    throw new SpreadsheetError("That spreadsheet is too large to read here — export it as CSV.");
  }

  const wanted = (path: string) =>
    path === "xl/sharedStrings.xml" || path.startsWith("xl/worksheets/sheet");

  const out = new Map<string, string>();
  const decoder = new TextDecoder("utf-8");

  for (let n = 0; n < entryCount; n++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const path = decoder.decode(buffer.subarray(offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + extraLength + commentLength;

    if (!wanted(path)) continue;

    // The central directory's copy of the name/extra lengths does not match the
    // local header's, so the data offset has to be read from the local header.
    if (view.getUint32(localOffset, true) !== 0x04034b50) continue;
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.subarray(start, start + compressedSize);

    out.set(path, method === 0 ? decoder.decode(raw) : decoder.decode(await inflateRaw(raw)));
  }

  return out;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new SpreadsheetError("This browser can't open .xlsx files — save the list as CSV.");
  }
  const stream = new Blob([data as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/* ── xlsx ─────────────────────────────────────────────────────────────────── */

function parseXlsx(files: Map<string, string>): Grid {
  // Sheet order in the archive is not guaranteed alphabetical, but sheet1.xml
  // is the first sheet in every writer anyone actually uses; falling back to
  // the lowest-numbered one covers the rest.
  const sheetPath =
    [...files.keys()]
      .filter((p) => /^xl\/worksheets\/sheet\d+\.xml$/.test(p))
      .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]))[0] ?? null;
  if (!sheetPath) throw new SpreadsheetError("That workbook has no worksheets in it.");

  const shared = parseSharedStrings(files.get("xl/sharedStrings.xml") ?? "");
  return parseSheet(files.get(sheetPath)!, shared);
}

function parseSharedStrings(xml: string): string[] {
  const out: string[] = [];
  // Each <si> is one string, possibly split across several <t> runs by
  // formatting. Concatenating the runs is what stops "Aziza Karimova" arriving
  // as "Aziza" because someone bolded the surname.
  for (const si of xml.match(/<si>[\s\S]*?<\/si>/g) ?? []) {
    let text = "";
    for (const t of si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? []) {
      text += unescapeXml(t.replace(/<t[^>]*>/, "").replace(/<\/t>$/, ""));
    }
    out.push(text);
  }
  return out;
}

function parseSheet(xml: string, shared: string[]): Grid {
  const grid: Grid = [];
  for (const rowXml of xml.match(/<row[^>]*>[\s\S]*?<\/row>/g) ?? []) {
    const row: string[] = [];
    for (const cellXml of rowXml.match(/<c[^>]*\/>|<c[^>]*>[\s\S]*?<\/c>/g) ?? []) {
      const ref = /r="([A-Z]+)\d+"/.exec(cellXml)?.[1];
      const index = ref ? columnIndex(ref) : row.length;
      const type = /t="([^"]+)"/.exec(cellXml)?.[1] ?? "n";

      let value = "";
      if (type === "inlineStr") {
        for (const t of cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? []) {
          value += unescapeXml(t.replace(/<t[^>]*>/, "").replace(/<\/t>$/, ""));
        }
      } else {
        const raw = /<v>([\s\S]*?)<\/v>/.exec(cellXml)?.[1] ?? "";
        value = type === "s" ? (shared[Number(raw)] ?? "") : unescapeXml(raw);
      }

      while (row.length < index) row.push("");
      row[index] = value.trim();
    }
    grid.push(row);
  }
  return trimGrid(grid);
}

function columnIndex(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}

/* ── csv ──────────────────────────────────────────────────────────────────── */

/**
 * RFC 4180 with the concessions reality demands: a UTF-8 BOM (Excel writes
 * one), CRLF, and semicolons — which is what Excel emits on a machine with a
 * comma decimal separator, i.e. most machines in this market.
 */
export function parseCsv(text: string): Grid {
  const body = text.replace(/^﻿/, "");
  const delimiter = pickDelimiter(body);

  const grid: Grid = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (quoted) {
      if (ch === '"') {
        if (body[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n") {
      row.push(cell.trim());
      grid.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell.trim());
    grid.push(row);
  }

  return trimGrid(grid);
}

/** Whichever of `,` `;` `\t` appears most on the first line. */
function pickDelimiter(text: string): string {
  const line = text.slice(0, text.indexOf("\n") + 1 || text.length);
  const count = (d: string) => line.split(d).length - 1;
  return [",", ";", "\t"].reduce((best, d) => (count(d) > count(best) ? d : best), ",");
}

/** Drop wholly empty rows and trailing empty columns. */
function trimGrid(grid: Grid): Grid {
  const rows = grid.filter((r) => r.some((c) => c !== ""));
  const width = rows.reduce((w, r) => Math.max(w, r.length), 0);
  return rows.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ""));
}

/* ── making sense of the columns ──────────────────────────────────────────── */

export type ColumnRole = "name" | "login" | "email" | "phone" | "ignore";

export const COLUMN_ROLE_LABEL: Record<ColumnRole, string> = {
  name: "Name",
  login: "Login",
  email: "Email",
  phone: "Phone",
  ignore: "Ignore",
};

/**
 * Guess what each column holds, from its header and its contents.
 *
 * A guess, shown and correctable — never a silent decision. A center's sheet
 * has a header row about half the time, columns in any order, and headers in
 * Uzbek, Russian or English, so the contents get a vote too: a column where
 * most cells contain an `@` is the email column whatever it is called.
 */
export function guessRoles(grid: Grid): { roles: ColumnRole[]; hasHeader: boolean } {
  const width = grid[0]?.length ?? 0;
  const header = grid[0] ?? [];

  const HEADER_HINTS: [ColumnRole, RegExp][] = [
    ["name", /name|ism|fio|ф\.?и\.?о|имя|familiya|o'quvchi|oquvchi|student|talaba/i],
    ["login", /login|username|user|логин/i],
    ["email", /e-?mail|pochta|почта|почтa/i],
    ["phone", /phone|tel|telefon|телефон|raqam|номер/i],
  ];

  const columnCells = (i: number) =>
    grid
      .slice(1)
      .map((r) => r[i] ?? "")
      .filter(Boolean);

  const roles: ColumnRole[] = [];
  for (let i = 0; i < width; i++) {
    const cells = columnCells(i);
    const mostly = (test: (s: string) => boolean) =>
      cells.length > 0 && cells.filter(test).length > cells.length / 2;

    // Contents first: they cannot lie about themselves the way a header can.
    if (mostly((s) => s.includes("@"))) {
      roles.push("email");
      continue;
    }
    if (mostly((s) => /^[+\d][\d\s()-]{6,}$/.test(s))) {
      roles.push("phone");
      continue;
    }
    const hint = HEADER_HINTS.find(([, re]) => re.test(header[i] ?? ""));
    roles.push(hint ? hint[0] : "ignore");
  }

  // Nothing claimed the name column: take the first column that holds text with
  // a space in it, and failing that, simply the first column.
  if (!roles.includes("name")) {
    const textual = roles.findIndex(
      (role, i) =>
        role === "ignore" && columnCells(i).some((s) => /\s/.test(s) && !/^\d+$/.test(s)),
    );
    const target = textual >= 0 ? textual : roles.findIndex((r) => r === "ignore");
    if (target >= 0) roles[target] = "name";
  }

  // A header row is one whose cells read like labels rather than like the data
  // underneath: no digits-only cells, no "@", and at least one known hint.
  const looksLikeHeader =
    header.length > 0 &&
    header.some((h) => HEADER_HINTS.some(([, re]) => re.test(h))) &&
    !header.some((h) => h.includes("@"));

  return { roles, hasHeader: looksLikeHeader };
}

/**
 * The grid, as the lines the bulk-add form already understands:
 * `Name, login, email`.
 *
 * Reusing that format rather than inventing an import payload means the import
 * feeds the exact same server action — one place that creates students, one set
 * of rules about logins and seats, and a teacher can still edit the text before
 * anything is created.
 */
export function toRosterLines(
  grid: Grid,
  roles: ColumnRole[],
  hasHeader: boolean,
): { lines: string[]; skipped: number } {
  const nameAt = roles.indexOf("name");
  if (nameAt < 0) return { lines: [], skipped: grid.length };

  const loginAt = roles.indexOf("login");
  const emailAt = roles.indexOf("email");

  const lines: string[] = [];
  let skipped = 0;
  for (const row of hasHeader ? grid.slice(1) : grid) {
    const name = (row[nameAt] ?? "").replace(/[,;\t]/g, " ").trim();
    // A row-number column beside the name is common; a bare number is not a name.
    if (!name || /^\d+$/.test(name)) {
      skipped++;
      continue;
    }
    const parts = [name];
    const login = loginAt >= 0 ? (row[loginAt] ?? "").trim().toLowerCase() : "";
    const email = emailAt >= 0 ? (row[emailAt] ?? "").trim().toLowerCase() : "";
    if (login) parts.push(login);
    if (email.includes("@")) parts.push(email);
    lines.push(parts.join(", "));
  }
  return { lines, skipped };
}
