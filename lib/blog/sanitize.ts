import { BLOCK_TYPES, type Block } from "./types";

/**
 * A body that arrived from a browser, made into blocks the renderer can trust.
 *
 * ⚠️ THE EDITOR SENDS JSON NOW, AND JSON IS WHATEVER THE SENDER SAYS. A server
 * action is an endpoint anybody can POST to; the TypeScript type of the form is
 * a hope, not a check. So every block is rebuilt field by field from strings:
 * an unknown type is dropped, a missing field becomes "", nothing outside the
 * shape survives into the jsonb column. Whether the result is PUBLISHABLE is a
 * separate question that `publishProblems` answers with reasons.
 */
const str = (v: unknown): string => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const opt = <K extends string>(key: K, v: unknown): Partial<Record<K, string>> => {
  const s = str(v);
  return s ? ({ [key]: s } as Record<K, string>) : {};
};
const TYPES = new Set<string>(BLOCK_TYPES);

function block(raw: unknown): Block | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  if (typeof b.type !== "string" || !TYPES.has(b.type)) return null;
  switch (b.type as Block["type"]) {
    case "p":
    case "h2":
    case "h3": {
      const text = str(b.text);
      return text ? ({ type: b.type, text } as Block) : null;
    }
    case "list": {
      const items = (Array.isArray(b.items) ? b.items : []).map(str).filter(Boolean);
      return items.length ? { type: "list", items, ...(b.ordered === true ? { ordered: true } : {}) } : null;
    }
    case "quote": {
      const text = str(b.text);
      return text ? { type: "quote", text, ...opt("cite", b.cite) } : null;
    }
    case "tip":
      return { type: "tip", title: str(b.title), text: str(b.text) };
    case "example": {
      const rows = (Array.isArray(b.rows) ? b.rows : [])
        .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : {}))
        .map((r) => ({ label: str(r.label), text: str(r.text) }))
        .filter((r) => r.label || r.text);
      return { type: "example", ...opt("title", b.title), rows };
    }
    case "image": {
      const src = str(b.src);
      // A caption ends at a double quote in the text format (lib/blog/source).
      const caption = str(b.caption).replace(/"/g, "”");
      return src ? { type: "image", src, alt: str(b.alt), ...(caption ? { caption } : {}) } : null;
    }
    case "video": {
      const id = str(b.id);
      return id ? { type: "video", id, ...opt("title", b.title) } : null;
    }
  }
}

export function sanitizeBlocks(raw: unknown): Block[] {
  return (Array.isArray(raw) ? raw : []).map(block).filter((b): b is Block => b !== null);
}

/** Keywords as stored: lower-case, trimmed, de-duplicated, in the order given. */
export function sanitizeKeywords(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
  return [...new Set(list.map((k) => str(k).toLowerCase()).filter(Boolean))];
}
