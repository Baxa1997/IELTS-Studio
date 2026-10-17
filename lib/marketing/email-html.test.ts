/**
 * A broadcast body, from the editor's HTML to what a mail client shows.
 *
 * Every case is a way an email goes out wrong with nobody noticing until a
 * learner opens it: a script or a `javascript:` link reaching an inbox, a site
 * path that means nothing outside the site, a button that arrives as a bare
 * link, styles in a stylesheet no mail client reads, or a text part that says
 * something different from the HTML beside it.
 */

import { describe, expect, it } from "vitest";

import { serverEnv } from "@/lib/env";

import { bodyToHtml, cleanBody, EMAIL_PALETTE, htmlToText, isHtmlBody, legacyToHtml, toEmailHtml } from "./email-html";

const SITE = serverEnv.outboundSiteUrl;

/** What the editor's getHTML() gives for a message using every block it has. */
const EDITOR =
  `<h2>New tests</h2><p>Twenty <strong>new</strong> tests &amp; a <a target="_blank" rel="noopener noreferrer nofollow" href="/practice/reading">free one</a>.</p>` +
  `<ul><li><p>Matching headings</p></li><li><p>Not Given</p></li></ul><ol><li><p>Open the hub</p></li><li><p>Pick a test</p></li></ol>` +
  `<blockquote><p>Practise on what you have not seen.</p></blockquote>` +
  `<img src="https://cdn.example.com/pic.png" alt="The hub"><p data-button=""><a href="https://www.engprogress.com/read">Try a test</a></p>` +
  `<hr><p>Line one<br>line two</p><p></p>`;

describe("cleaning what the editor wrote", () => {
  it("keeps everything an email can carry", () => {
    const clean = cleanBody(EDITOR);
    for (const piece of ["<h2>", "<strong>", "<ul>", "<ol>", "<blockquote>", "<hr />", "<br />", `alt="The hub"`, "<p data-button>"]) {
      expect(clean, piece).toContain(piece);
    }
  });

  it("drops scripts, styles, frames, event handlers and classes", () => {
    const clean = cleanBody(
      `<script>alert(1)</script><style>p{color:red}</style><iframe src="https://x.example"></iframe><p onclick="steal()" style="color:red" class="c">Hi</p>`,
    );
    expect(clean).toBe("<p>Hi</p>");
  });

  it("takes the address off a link a phishing filter looks for, and keeps its words", () => {
    for (const href of ["javascript:alert(1)", "data:text/html,hi", "//evil.example/x"]) {
      expect(cleanBody(`<p><a href="${href}">words</a></p>`), href).toBe("<p><a>words</a></p>");
    }
  });

  it("makes a site path absolute — and only a site path", () => {
    expect(cleanBody(`<p><a href="/practice/reading">x</a></p>`)).toContain(`href="${SITE}/practice/reading"`);
    expect(cleanBody(`<p><a href="https://other.example/a">x</a></p>`)).toContain(`href="https://other.example/a"`);
    expect(cleanBody(`<p><a href="mailto:hi@example.com">x</a></p>`)).toContain(`href="mailto:hi@example.com"`);
  });

  it("drops a picture that is not https, which a mail client would block", () => {
    expect(cleanBody(`<img src="http://cdn.example.com/a.png" alt="a"><p>x</p>`)).toBe("<p>x</p>");
    expect(cleanBody(`<img src="https://cdn.example.com/a.png" alt="a">`)).toContain("<img");
  });

  it("unwraps the paragraph the editor puts in a list item or a quote", () => {
    const clean = cleanBody(EDITOR);
    expect(clean).toContain("<li>Matching headings</li>");
    expect(clean).toContain("<blockquote>Practise on what you have not seen.</blockquote>");
  });

  it("is safe to run twice — it runs on save and again on every render", () => {
    const once = cleanBody(EDITOR);
    expect(cleanBody(once)).toBe(once);
  });
});

describe("dressing it for the inbox", () => {
  const email = toEmailHtml(cleanBody(EDITOR));

  it("puts the styles on the elements, with no stylesheet to lose", () => {
    expect(email).toMatch(/<p style="[^"]+">/);
    expect(email).toMatch(/<h2 style="[^"]+">/);
    expect(email).toMatch(/<a href="[^"]+" style="[^"]*color:#7d0132/);
    expect(email).not.toContain("<style");
  });

  it("builds the button as a filled table cell, the shape Outlook pads", () => {
    expect(email).toMatch(
      new RegExp(`<td style="border-radius:10px;background:${EMAIL_PALETTE.brandFill};"><a href="https://www.engprogress.com/read"[^>]*>Try a test</a></td>`),
    );
    expect(email).not.toContain("data-button");
  });

  it("keeps a button's words as a paragraph when its link was refused", () => {
    const out = toEmailHtml(cleanBody(`<p data-button=""><a href="javascript:void(0)">Go</a></p>`));
    expect(out).not.toContain("<table");
    expect(out).toMatch(/<p style="[^"]+">Go<\/p>/);
  });

  it("drops a button with no words at all", () => {
    expect(toEmailHtml(cleanBody(`<p data-button=""><a href="https://www.engprogress.com/"></a></p><p>x</p>`))).not.toContain("<table");
  });
});

describe("the plain-text part", () => {
  const text = htmlToText(cleanBody(EDITOR));

  it("says what the HTML says, readable without it", () => {
    expect(text).toBe(
      [
        "New tests",
        "",
        `Twenty new tests & a free one (${SITE}/practice/reading).`,
        "",
        "- Matching headings",
        "- Not Given",
        "",
        "1. Open the hub",
        "2. Pick a test",
        "",
        "Practise on what you have not seen.",
        "",
        "[The hub]",
        "",
        "Try a test: https://www.engprogress.com/read",
        "",
        "---",
        "",
        "Line one",
        "line two",
      ].join("\n"),
    );
  });

  it("gives a link whose words are its address only once", () => {
    expect(htmlToText(cleanBody(`<p><a href="https://example.com/a">https://example.com/a</a></p>`))).toBe("https://example.com/a");
  });

  it("decodes what the HTML had to escape", () => {
    expect(htmlToText(cleanBody(`<p>5 &lt; 6 &amp;&nbsp;Tom&#39;s</p>`))).toBe("5 < 6 & Tom's");
  });
});

describe("bodies written before the editor", () => {
  it("tells the editor's HTML from a textarea's text", () => {
    expect(isHtmlBody("<p>New tests</p>")).toBe(true);
    expect(isHtmlBody("<h2>New</h2><p>x</p>")).toBe(true);
    expect(isHtmlBody("New tests are <b>live</b>")).toBe(false);
    expect(isHtmlBody("5 < 6")).toBe(false);
  });

  it("makes paragraphs of blank lines and escapes everything else", () => {
    expect(legacyToHtml("A & B\n\nC <D>\nE")).toBe("<p>A &amp; B</p><p>C &lt;D&gt;<br />E</p>");
    expect(bodyToHtml("<script>x</script> typed")).toBe("<p>&lt;script&gt;x&lt;/script&gt; typed</p>");
  });
});
