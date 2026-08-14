import DOMPurify from "isomorphic-dompurify";

/**
 * The allow-list a generated lesson's HTML is held to.
 *
 * Two layers guard this, on purpose. The engine REFUSES to store anything
 * outside the list, so bad markup never reaches the database; this pass runs
 * again at render, because a stored row outlives the version of the validator
 * that wrote it — and the row is what ends up in a browser.
 *
 * A library rather than a hand-written pass. Bespoke HTML sanitisers are a
 * famous source of bypasses (mixed-case tags, nested encodings, `<svg>` foreign
 * content, mXSS after re-parsing), and a lesson is served on a PUBLIC share link
 * where anyone can open it. This is not a place to be clever.
 */

/**
 * Everything a lesson legitimately needs, and nothing else.
 *
 * `<a>` is absent deliberately. A lesson has no reason to link out, and its
 * absence means a shared link can never be turned into a phishing hop — which
 * matters far more here than the convenience of a hyperlink, because these
 * pages are handed to strangers.
 *
 * `<img>` is absent for the same reason plus one more: a remote image is a
 * tracking pixel and a request to a third party from a page we vouch for.
 */
const ALLOWED_TAGS = [
  "h2", "h3", "h4",
  "p", "span", "div", "br", "hr",
  "strong", "em", "b", "i", "u", "mark", "sub", "sup",
  "ul", "ol", "li",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "blockquote", "code", "pre", "kbd", "abbr", "dl", "dt", "dd",
];

/**
 * `class` survives, but only as `lp-*` names.
 *
 * That prefix is what lets the lesson stylesheet theme a form table or a "watch
 * out" box without the model being able to reach any other class in the app —
 * it cannot borrow `.cn-btn` and paint itself as a console button, and it
 * cannot collide with a utility class and shift the page around it.
 *
 * `style` is NOT allowed. An inline style is where a sanitised element still
 * covers the whole viewport (`position:fixed;inset:0`) and turns readable
 * markup into a clickjacking surface.
 */
const ALLOWED_ATTR = ["class", "colspan", "rowspan", "scope", "title"];

const CLASS_PREFIX = /^lp-[a-z0-9-]+$/;

let hookInstalled = false;

/** Strip any class that is not ours. Registered once per process. */
function installClassHook(): void {
  if (hookInstalled) return;
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    const el = node as unknown as Element;
    if (typeof el.getAttribute !== "function") return;
    const raw = el.getAttribute("class");
    if (raw == null) return;
    const kept = raw
      .split(/\s+/)
      .filter((c) => CLASS_PREFIX.test(c))
      .join(" ");
    if (kept) el.setAttribute("class", kept);
    else el.removeAttribute("class");
  });
  hookInstalled = true;
}

/**
 * Clean one section's HTML for rendering.
 *
 * Returns a string safe to pass to `dangerouslySetInnerHTML` — which is only
 * ever true of a string that came through here.
 */
export function sanitizeLessonHtml(html: string): string {
  installClassHook();
  return DOMPurify.sanitize(html ?? "", {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // No <a>, so no protocol to police — but if one is ever added back, these
    // stop `javascript:` and `data:` before the URL is ever honoured.
    ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i,
    // Comments can carry payloads that only become live after a re-parse.
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form", "input", "a", "img"],
    FORBID_ATTR: ["style", "id", "srcset", "href", "src", "formaction"],
  });
}

/*
 * There is deliberately no `isCleanLessonHtml()` here.
 *
 * The obvious companion — "would this lose anything?" — belongs to the WRITE
 * side, and the write side is the engine, in Python: it refuses a generation
 * whose markup falls outside the list rather than storing a quietly stripped
 * version. Reimplementing that check in TypeScript would be a second definition
 * of the same rule, free to drift from the one that actually runs.
 *
 * It is also harder than it looks from here. Diffing input against output
 * cannot tell "your <a> was deleted" from "the parser inserted the <tbody> your
 * <table> omitted", and DOMPurify's own `removed` array both accumulates across
 * calls and reports an entry for perfectly clean fragments — so neither answers
 * the question honestly. The app's job is the render-time pass above.
 */
