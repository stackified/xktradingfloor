// Helpers for HTML that admins author in the rich text editor and that the
// public site renders with dangerouslySetInnerHTML. Kept out of the editor
// module so pages that only *render* content (blog posts, company profiles)
// do not pull Tiptap into their chunk.

// Cheap heuristic: does this plain text contain HTML tags?
const HTML_SOURCE_RE =
  /<\s*(!doctype|html|head|body|h[1-6]|p|div|section|article|ul|ol|li|table|thead|tbody|tr|td|th|a|img|br|hr|strong|b|em|i|u|span|blockquote|pre|code|iframe)\b[^>]*>/i;

export function looksLikeHtmlSource(text) {
  return typeof text === "string" && HTML_SOURCE_RE.test(text);
}

// Reduce any HTML — including a full document with <!doctype>, <head>,
// <meta>, <title> — to just its body markup, with the tags that never
// belong in page content (scripts, styles, head-only elements) removed.
// DOMParser is lenient, so partial or sloppy markup still comes through.
export function extractBodyHtml(html) {
  if (typeof html !== "string") return "";
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.body
    .querySelectorAll("script, style, meta, link, title, base, noscript, template")
    .forEach((el) => el.remove());
  return doc.body.innerHTML.trim();
}

// Block-level tags that only appear when a whole document was pasted as
// text. Inline code samples in a genuine article never contain these.
const ESCAPED_BLOCK_RE = /<(h[1-6]|p|div|section|article|ul|ol|li|table|hr|blockquote)\b[^>]*>/i;

// Heal content that was saved as escaped HTML.
//
// Before the editor learned to interpret pasted HTML, pasting source into it
// produced things like `<p><code>&lt;h1&gt;Title&lt;/h1&gt;</code></p>` —
// every line wrapped in an inline code mark with the tags escaped — and the
// public page showed the tags as text (the Xellion review, Feb 2026). New
// posts cannot end up like this any more; this repairs the ones already in
// the database at render time, so nothing has to be re-saved.
//
// Only fires when the content is unmistakably a pasted document: at least
// three escaped block-level tags, and nearly all of the text living inside
// code marks (or the content having no real markup at all). An article that
// merely quotes a snippet of HTML in a code block is left alone.
export function repairStoredHtml(content) {
  if (typeof content !== "string" || typeof DOMParser === "undefined") return content;
  if (!/&lt;[a-z!]/i.test(content)) return content; // no escaped tags at all

  const doc = new DOMParser().parseFromString(content, "text/html");
  const body = doc.body;
  const allText = (body.textContent || "").trim();
  if (!allText) return content;

  const codeNodes = [...body.querySelectorAll("code, pre")];
  const codeText = codeNodes.map((n) => n.textContent || "").join("\n");
  const source = codeText.trim() && codeText.length >= allText.length * 0.7 ? codeText : allText;

  const blockTags = (source.match(ESCAPED_BLOCK_RE) ? source.match(new RegExp(ESCAPED_BLOCK_RE.source, "gi")) : []).length;
  if (blockTags < 3) return content;

  // Genuine markup outside the code marks means this is a real article that
  // happens to quote HTML — do not touch it.
  const outsideCode = body.cloneNode(true);
  outsideCode.querySelectorAll("code, pre").forEach((n) => n.remove());
  if (source === codeText && (outsideCode.textContent || "").trim().length > allText.length * 0.3) {
    return content;
  }

  const repaired = extractBodyHtml(source);
  return repaired || content;
}

// Blocks the editor leaves behind as spacing: <p><br></p>, <h2><br></h2>,
// &nbsp;-only paragraphs. With real typography the article already has
// rhythm, so these only add holes.
function isEmptyBlock(el) {
  if (el.querySelector("img, iframe, video, hr, table, svg")) return false;
  return (el.textContent || "").replace(/\u00a0/g, " ").trim() === "";
}

// Authors draw section dividers as a paragraph of dashes. Anything that is
// only dashes, underscores, em/en dashes, asterisks or box-drawing lines
// (5+ characters) becomes a real <hr>.
const DIVIDER_RE = /^[\s\-_\u2013\u2014\u2500*=~]{5,}$/;

function slugify(text) {
  return (
    text
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || "section"
  );
}

// Everything the public article view needs from stored content: repaired,
// tidied HTML with ids on h2/h3, plus the heading list for the table of
// contents. Pure DOM work, no network, safe to memoise on the content string.
export function prepareArticle(content) {
  const repaired = repairStoredHtml(content || "");
  if (typeof DOMParser === "undefined") return { html: repaired, headings: [] };

  const doc = new DOMParser().parseFromString(repaired, "text/html");
  const body = doc.body;

  body.querySelectorAll("script, style, meta, link, title, base").forEach((el) => el.remove());

  body.querySelectorAll("p, div").forEach((el) => {
    if (el.children.length === 0 && DIVIDER_RE.test(el.textContent || "")) {
      el.replaceWith(doc.createElement("hr"));
    }
  });

  body.querySelectorAll("p, h1, h2, h3, h4, h5, h6").forEach((el) => {
    if (isEmptyBlock(el)) el.remove();
  });

  // Collapse runs of dividers and drop leading/trailing ones.
  body.querySelectorAll("hr").forEach((hr) => {
    const prev = hr.previousElementSibling;
    if (!prev || prev.tagName === "HR" || !hr.nextElementSibling) hr.remove();
  });

  // The page title is the article's only <h1>; demote any in the body.
  body.querySelectorAll("h1").forEach((h1) => {
    const h2 = doc.createElement("h2");
    h2.innerHTML = h1.innerHTML;
    h1.replaceWith(h2);
  });

  // Links to other sites open in a new tab and pass no referrer/opener.
  body.querySelectorAll("a[href]").forEach((a) => {
    if (/^https?:\/\//i.test(a.getAttribute("href")) && !a.href.includes("xktradingfloor.com")) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
  });

  // Wide tables scroll inside their own box instead of the page.
  body.querySelectorAll("table").forEach((table) => {
    if (table.parentElement?.classList.contains("table-scroll")) return;
    const wrap = doc.createElement("div");
    wrap.className = "table-scroll";
    table.replaceWith(wrap);
    wrap.appendChild(table);
  });

  const used = new Set();
  const headings = [];
  body.querySelectorAll("h2, h3").forEach((el) => {
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    let id = el.id || slugify(text);
    let n = 2;
    while (used.has(id)) id = `${slugify(text)}-${n++}`;
    used.add(id);
    el.id = id;
    headings.push({ id, text, level: el.tagName === "H2" ? 2 : 3 });
  });

  return { html: body.innerHTML.trim(), headings };
}

// Words in the article body, for "N min read".
export function readingMinutes(content) {
  if (!content) return null;
  const text = repairStoredHtml(content).replace(/<[^>]*>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return words ? Math.max(1, Math.round(words / 220)) : null;
}
