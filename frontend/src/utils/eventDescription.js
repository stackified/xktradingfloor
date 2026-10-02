// Event descriptions can be plain text (older events), rich text from the
// editor, or a full designed HTML page pasted in "Designed HTML" mode, the
// same as blog posts (client, 2 Oct 2026: "code based description so it looks
// better"). Cards, meta tags and structured data need a short plain-text
// summary; the event page needs safe markup.

import DOMPurify from "dompurify";
import { looksLikeHtmlSource, prepareArticle } from "./richText.js";
import { isDesignedHtml } from "./designedHtml.js";
import { plainText } from "./structuredData.js";

export const isRichDescription = (text) =>
  typeof text === "string" && (isDesignedHtml(text) || looksLikeHtmlSource(text));

// Short plain-text summary: the excerpt if there is one, else the start of
// the description with any markup and CSS removed.
export function eventSummary(event, max = 180) {
  if (event?.excerpt) return event.excerpt;
  return plainText(event?.description || "", max);
}

// What the event page renders:
//   { kind: "designed", designed } – a styled page, for <DesignedHtml rendered>
//   { kind: "html", html }         – sanitised rich text
//   { kind: "text", text }         – plain text, shown with its line breaks
export function eventDescriptionView(description, { pageTitle } = {}) {
  const text = description || "";
  if (!text.trim()) return { kind: "none" };
  if (!isRichDescription(text)) return { kind: "text", text };
  const article = prepareArticle(text, { pageTitle });
  if (article.designed) return { kind: "designed", designed: article.designed };
  return {
    kind: "html",
    html: DOMPurify.sanitize(article.html, {
      FORBID_TAGS: ["form", "input", "button", "iframe", "object", "embed"],
      ADD_ATTR: ["target"],
    }),
  };
}

// Editor helpers: older plain-text descriptions become paragraphs when opened
// in the rich text editor, so their line breaks survive.
const escapeHtml = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function descriptionForEditor(description) {
  const text = description || "";
  if (!text.trim() || isRichDescription(text)) return text;
  return text
    .split(/\n{2,}/)
    .map((para) => `<p>${escapeHtml(para.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}
