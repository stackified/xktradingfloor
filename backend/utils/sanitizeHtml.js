const cheerio = require("cheerio");

// Server-side sanitising of stored HTML: company description, blog content and
// event description (B3). Follows the allow-list agreed with the frontend
// (deliverables section 12.2). Designed pages keep their <style>, classes and
// data-xk-* markers. When nothing needs removing, the string is returned
// exactly as received.

const KEEP_TAGS = new Set([
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "div", "span", "section", "article", "header", "footer",
    "aside", "main", "nav", "figure", "figcaption", "blockquote", "pre", "code",
    "ul", "ol", "li", "dl", "dt", "dd", "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "colgroup", "col",
    "strong", "b", "em", "i", "u", "s", "small", "sub", "sup", "mark", "br", "hr", "img", "a", "details",
    "summary", "button", "abbr", "time",
    "style", "link",
]);

// Removed together with everything inside them.
const DROP_TAGS = new Set([
    "script", "iframe", "object", "embed", "form", "input", "textarea", "select", "option", "frame",
    "frameset", "base", "meta", "head", "title", "noscript", "template",
]);

const KEEP_ATTRS = new Set([
    "class", "id", "style", "title", "alt", "src", "srcset", "width", "height", "href", "target", "rel",
    "colspan", "rowspan", "scope", "open", "lang", "dir",
    "data-xk-design", "data-xk-look", "data-xk-title", "data-xk-description",
]);

const URL_ATTRS = new Set(["href", "src"]);
const SAFE_SCHEMES = new Set(["http", "https", "mailto"]);
const FONT_CSS = "https://fonts.googleapis.com/";

// Scheme of a URL, ignoring whitespace and control characters that browsers
// skip (so "java\nscript:" is still caught). Relative URLs have none.
function schemeOf(url) {
    const compact = String(url || "").replace(/[\u0000- \u007f]+/g, "").toLowerCase();
    const match = compact.match(/^([a-z][a-z0-9+.-]*):/);
    return match ? match[1] : "";
}

function safeUrl(url, { allowDataImage = false } = {}) {
    const scheme = schemeOf(url);
    if (!scheme) return true;
    if (SAFE_SCHEMES.has(scheme)) return true;
    if (scheme === "data" && allowDataImage) {
        return /^data:image\//i.test(String(url).replace(/[\u0000- \u007f]+/g, ""));
    }
    return false;
}

// Dangerous constructs inside CSS (a <style> block or a style attribute).
function cleanCss(css) {
    return String(css || "")
        .replace(/@import[^;]*;?/gi, "")
        .replace(/expression\s*\(/gi, "")
        .replace(/url\(\s*['"]?\s*(?:javascript|vbscript):[^;}]*/gi, "none")
        .replace(/behavior\s*:/gi, "")
        .replace(/-moz-binding/gi, "");
}

function sanitizeHtml(input) {
    if (input === undefined || input === null) return input;
    const html = String(input);
    if (!html.trim()) return html;

    const $ = cheerio.load(html, { decodeEntities: false }, false);
    let changed = false;

    $("*").each((_, node) => {
        const el = $(node);
        const tag = (node.tagName || node.name || "").toLowerCase();
        if (!tag) return;

        if (DROP_TAGS.has(tag)) {
            el.remove();
            changed = true;
            return;
        }
        if (!KEEP_TAGS.has(tag)) {
            el.replaceWith(el.contents());
            changed = true;
            return;
        }
        if (tag === "link") {
            const rel = String(el.attr("rel") || "").toLowerCase().split(/\s+/);
            const href = String(el.attr("href") || "");
            if (!rel.includes("stylesheet") || !href.startsWith(FONT_CSS)) {
                el.remove();
                changed = true;
                return;
            }
        }
        if (tag === "style") {
            const css = el.html() || "";
            const cleaned = cleanCss(css);
            if (cleaned !== css) {
                el.text(cleaned);
                changed = true;
            }
        }

        for (const [name, value] of Object.entries(node.attribs || {})) {
            const attr = name.toLowerCase();
            if (!KEEP_ATTRS.has(attr) || attr.startsWith("on")) {
                el.removeAttr(name);
                changed = true;
                continue;
            }
            if (URL_ATTRS.has(attr) && !safeUrl(value, { allowDataImage: tag === "img" && attr === "src" })) {
                el.removeAttr(name);
                changed = true;
                continue;
            }
            if (attr === "srcset") {
                const urls = String(value).split(",").map((part) => part.trim().split(/\s+/)[0]);
                if (urls.some((u) => !safeUrl(u))) {
                    el.removeAttr(name);
                    changed = true;
                }
                continue;
            }
            if (attr === "style") {
                const cleaned = cleanCss(value);
                if (cleaned !== value) {
                    el.attr(name, cleaned);
                    changed = true;
                }
            }
        }
    });

    return changed ? $.html() : html;
}

module.exports = { sanitizeHtml, cleanCss };
