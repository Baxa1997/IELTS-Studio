import { describe, expect, it } from "vitest";

import { sanitizeLessonHtml } from "./sanitize";

/**
 * The sanitiser is the one place model-written HTML reaches a browser, and a
 * lesson can be opened by a stranger on a share link. These tests exist because
 * the library underneath was swapped (DOMPurify+jsdom → sanitize-html) and
 * "it still renders" is not the same as "it still refuses the same things".
 */

describe("what a lesson may contain", () => {
  it("keeps the markup a lesson is actually made of", () => {
    const out = sanitizeLessonHtml(
      "<h3>Rule</h3><p>Use <strong>went</strong>, not <em>goed</em>.</p><ul><li>one</li></ul>",
    );
    expect(out).toContain("<h3>Rule</h3>");
    expect(out).toContain("<strong>went</strong>");
    expect(out).toContain("<em>goed</em>");
    expect(out).toContain("<li>one</li>");
  });

  it("keeps a table, including the attributes that hold it together", () => {
    const out = sanitizeLessonHtml(
      '<table><caption>Forms</caption><tr><th scope="col" colspan="2">Past</th></tr>' +
        '<tr><td rowspan="2">went</td></tr></table>',
    );
    expect(out).toContain("<caption>Forms</caption>");
    expect(out).toContain('scope="col"');
    expect(out).toContain('colspan="2"');
    expect(out).toContain('rowspan="2"');
  });
});

describe("what it refuses", () => {
  it("drops a script AND its payload, not just the tag", () => {
    const out = sanitizeLessonHtml("<p>before</p><script>alert(1)</script><p>after</p>");
    expect(out).not.toContain("script");
    // The text of a <script> is the attack; keeping it is how a stripped tag
    // still runs after a re-parse.
    expect(out).not.toContain("alert(1)");
    expect(out).toContain("before");
    expect(out).toContain("after");
  });

  it("drops a style block and its contents", () => {
    const out = sanitizeLessonHtml("<style>body{display:none}</style><p>hi</p>");
    expect(out).not.toContain("display:none");
    expect(out).toContain("hi");
  });

  it("removes an inline style — the clickjacking surface", () => {
    const out = sanitizeLessonHtml('<p style="position:fixed;inset:0">x</p>');
    expect(out).not.toContain("style");
    expect(out).not.toContain("position:fixed");
    expect(out).toContain("x");
  });

  it("removes a link but keeps its sentence", () => {
    const out = sanitizeLessonHtml('Read <a href="https://evil.example">this</a> now');
    expect(out).not.toContain("<a");
    expect(out).not.toContain("href");
    expect(out).toContain("this");
    expect(out).toContain("now");
  });

  it("refuses javascript: and data: even if a link somehow appears", () => {
    const out = sanitizeLessonHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain("javascript:");
  });

  it("drops images — a tracking pixel from a page we vouch for", () => {
    const out = sanitizeLessonHtml('<img src="x" onerror="alert(1)">');
    expect(out).not.toContain("img");
    expect(out).not.toContain("onerror");
  });

  it("strips event handlers from tags it does allow", () => {
    const out = sanitizeLessonHtml('<p onclick="alert(1)" onmouseover="steal()">text</p>');
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("onmouseover");
    expect(out).toContain("text");
  });

  it("drops an id, which could collide with the page around it", () => {
    const out = sanitizeLessonHtml('<div id="main">x</div>');
    expect(out).not.toContain('id="main"');
  });

  it("drops iframes and forms outright", () => {
    const out = sanitizeLessonHtml(
      '<iframe src="https://evil.example"></iframe><form action="/x"><input name="p"></form>',
    );
    expect(out).not.toContain("iframe");
    expect(out).not.toContain("<form");
    expect(out).not.toContain("<input");
  });

  it("is not fooled by mixed case or whitespace in tag names", () => {
    const out = sanitizeLessonHtml("<ScRiPt>alert(1)</ScRiPt><IMG SRC=x>");
    expect(out.toLowerCase()).not.toContain("script");
    expect(out.toLowerCase()).not.toContain("<img");
    expect(out).not.toContain("alert(1)");
  });
});

describe("the lp- class boundary", () => {
  it("keeps our own classes", () => {
    const out = sanitizeLessonHtml('<div class="lp-note lp-warn-2">x</div>');
    expect(out).toContain("lp-note");
    expect(out).toContain("lp-warn-2");
  });

  it("strips app classes, so a lesson cannot repaint itself as console furniture", () => {
    const out = sanitizeLessonHtml('<div class="cn-btn lp-note danger">x</div>');
    expect(out).toContain("lp-note");
    expect(out).not.toContain("cn-btn");
    expect(out).not.toContain("danger");
  });

  it("removes the attribute entirely when nothing survives", () => {
    const out = sanitizeLessonHtml('<div class="cn-btn">x</div>');
    expect(out).not.toContain("class");
  });

  it("does not accept a near-miss prefix", () => {
    const out = sanitizeLessonHtml('<div class="lpnote lp_note LP-NOTE">x</div>');
    expect(out).not.toContain("lpnote");
    expect(out).not.toContain("lp_note");
    expect(out).not.toContain("LP-NOTE");
  });
});

describe("degenerate input", () => {
  it("survives empty and nullish html", () => {
    expect(sanitizeLessonHtml("")).toBe("");
    expect(sanitizeLessonHtml(undefined as unknown as string)).toBe("");
  });

  it("does not throw on unclosed or nested-wrong markup", () => {
    expect(() => sanitizeLessonHtml("<p><strong>x</p></strong><table><tr><td>y")).not.toThrow();
  });
});
