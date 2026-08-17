import sanitizeHtml from "sanitize-html";

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
 *
 * WHY NOT DOMPURIFY. It was `isomorphic-dompurify`, and that shipped jsdom into
 * the serverless bundle, where it 500'd every lesson page in production:
 * Turbopack loads jsdom as an EXTERNAL CommonJS module, jsdom reaches
 * `html-encoding-sniffer@6`, and that requires `@exodus/bytes`, which is
 * ESM-only — `ERR_REQUIRE_ESM`. It only worked locally because Node's
 * `require(esm)` compatibility papered over it; the deployed runtime has that
 * off, so the page threw before rendering a byte. `sanitize-html` parses with
 * htmlparser2 and needs no DOM at all, so the whole failure mode is gone rather
 * than configured around. Reproduce the old break with:
 *   NODE_OPTIONS=--no-experimental-require-module npm run start
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
  // `del` and `s` earn their place on a GRAMMAR page specifically: the clearest
  // way to teach a form is to show the wrong one struck through beside the
  // right one, and a tint alone does not survive a black-and-white printout.
  // Neither tag takes an attribute we allow or carries any behaviour.
  "strong", "em", "b", "i", "u", "mark", "sub", "sup", "del", "s",
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
 * markup into a clickjacking surface. Nor is `id`, which can collide with a
 * real element and break `aria-` wiring elsewhere on the page.
 */
const ALLOWED_ATTR = ["colspan", "rowspan", "scope", "title"];

const CLASS_PREFIX = /^lp-[a-z0-9-]+$/;

/**
 * Tags whose TEXT goes too, not just their markup.
 *
 * For everything else, dropping the tag but keeping the words is right — a
 * stray `<a>` should leave its sentence behind. For these it is the opposite:
 * the text content of a `<script>` or a `<style>` IS the payload, and keeping
 * it is how a stripped tag still executes after a re-parse.
 */
const DROP_CONTENT = [
  "script", "style", "textarea", "option", "noscript",
  "iframe", "object", "embed", "form", "input", "template", "svg", "math",
];

/**
 * Clean one section's HTML for rendering.
 *
 * Returns a string safe to pass to `dangerouslySetInnerHTML` — which is only
 * ever true of a string that came through here.
 */
export function sanitizeLessonHtml(html: string): string {
  return sanitizeHtml(html ?? "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { "*": ALLOWED_ATTR },
    // Filtered rather than merely allowed: `class` is absent from
    // allowedAttributes above precisely so this is the only way one survives.
    allowedClasses: { "*": [CLASS_PREFIX] },
    disallowedTagsMode: "discard",
    nonTextTags: DROP_CONTENT,
    // No <a> and no <img>, so there is no URL to police — but if either is ever
    // allowed back, an empty scheme list refuses `javascript:` and `data:`
    // rather than waiting for someone to remember to add the rule.
    allowedSchemes: [],
    allowProtocolRelative: false,
    // Comments can carry a payload that only becomes live after a re-parse.
    allowedIframeHostnames: [],
    parser: {
      lowerCaseTags: true,
      lowerCaseAttributeNames: true,
    },
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
 * <table> omitted", so it cannot answer the question honestly. The app's job is
 * the render-time pass above.
 */
