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
