// "Designed HTML": a complete, styled HTML page (typically generated with
// ChatGPT) that an admin pastes as a company review or blog post and expects
// to see exactly as designed — cards, tables, callouts, FAQ — rather than
// flattened into plain rich text.
//
// Storage format (a plain string in the existing description/content field,
// so the backend needs no change to store it):
//
//   <div data-xk-design="1" class="<body classes>">
//     <link rel="stylesheet" href="https://fonts.googleapis.com/...">   (optional)
//     <style>…the page's own CSS, untouched…</style>
//     …the page's body markup…
//   </div>
//
// Rendering (renderDesignedHtml) makes that safe to drop into our page:
//   • markup is sanitised with DOMPurify (no scripts, event handlers, forms,
//     iframes or javascript: URLs);
//   • every class name is prefixed (card → xkd-card) so the design can't pick
//     up the site's own .card/.btn/.container rules, and vice versa;
//   • every CSS selector is scoped to one wrapper class, html/body/:root map
//     to the wrapper itself, and @import is dropped;
//   • a low-specificity `all: revert` resets the site's global element styles
//     (Tailwind preflight strips list bullets, heading sizes, etc.) inside the
//     wrapper, so the design renders as it did in the author's preview.
// The result stays in the light DOM, so crawlers, the blog prerender and the
// "On this page" contents all see the real text.

import DOMPurify from "dompurify";

const DESIGN_ATTR = "data-xk-design";
const CLASS_PREFIX = "xkd-";
const FONT_HOSTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//i;

// Stored designed content, or pasted source that carries its own stylesheet.
export function isDesignedHtml(html) {
  return typeof html === "string" && (html.includes(DESIGN_ATTR) || /<style[\s>]/i.test(html));
}

function parse(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

// Turn pasted source — a full document with <!doctype>/<head>, a fragment,
// or an already-stored designed block being edited again — into the storage
// format above. Idempotent.
export function buildDesignedHtml(source) {
  if (typeof source !== "string" || !source.trim()) return "";
  if (typeof DOMParser === "undefined") return source;
  const doc = parse(source);

  // Re-editing stored content: unwrap our own wrapper first.
  let root = doc.body;
  let rootClass = doc.body.getAttribute("class") || "";
  const only = root.children.length === 1 ? root.firstElementChild : null;
  if (only && only.hasAttribute(DESIGN_ATTR)) {
    root = only;
    rootClass = only.getAttribute("class") || "";
  }

  const css = [...doc.querySelectorAll("style")].map((s) => s.textContent || "").join("\n");
  const fonts = [...doc.querySelectorAll('link[rel~="stylesheet"][href]')]
    .map((l) => l.getAttribute("href"))
    .filter((href) => FONT_HOSTS.test(href));

  root
    .querySelectorAll("script, style, link, meta, title, base, noscript, template")
    .forEach((el) => el.remove());
  const body = root.innerHTML.trim();
  if (!body) return "";

  const classAttr = rootClass.trim() ? ` class="${rootClass.trim().replace(/"/g, "")}"` : "";
  const links = [...new Set(fonts)]
    .map((href) => `<link rel="stylesheet" href="${href.replace(/"/g, "%22")}">`)
    .join("");
  const style = css.trim() ? `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>` : "";
  return `<div ${DESIGN_ATTR}="1"${classAttr}>${links}${style}${body}</div>`;
}

// The SEO bits of a pasted full document, for future use (company meta).
export function extractDocumentMeta(source) {
  if (typeof source !== "string" || typeof DOMParser === "undefined") return {};
  const doc = parse(source);
  return {
    title: doc.querySelector("title")?.textContent?.trim() || "",
    description: doc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() || "",
  };
}

// Plain text of designed content (reading time, excerpts).
export function designedText(html) {
  if (typeof html !== "string") return "";
  if (typeof DOMParser === "undefined") return html.replace(/<[^>]*>/g, " ");
  const doc = parse(html);
  doc.querySelectorAll("style, script, link").forEach((el) => el.remove());
  return doc.body.textContent || "";
}

// ---------------------------------------------------------------------------
// CSS scoping

// Split a selector list on top-level commas (not inside (), [] or quotes).
function splitSelectors(text) {
  const out = [];
  let depth = 0;
  let quote = null;
  let cur = "";
  for (const ch of text) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth--;
    else if (ch === "," && depth === 0) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// Prefix class tokens (.card → .xkd-card) outside quoted attribute values.
function prefixClassTokens(selector) {
  let out = "";
  let quote = null;
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (quote) {
      out += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === "." && /[_a-zA-Z-]/.test(selector[i + 1] || "") && selector[i - 1] !== "\\") {
      out += "." + CLASS_PREFIX;
      continue;
    }
    out += ch;
  }
  return out;
}

// html / body / :root (alone or as a leading compound like `body.dark` or
// `html body`) become the wrapper itself.
const ROOT_RE = /^(?:(?:html|:root)(?=$|[\s.#:[>+~])\s*)?(?:body(?=$|[\s.#:[>+~]))?/i;

function scopeSelector(selector, scope) {
  const prefixed = prefixClassTokens(selector);
  const m = prefixed.match(ROOT_RE);
  if (m && m[0]) {
    const rest = prefixed.slice(m[0].length);
    return { selector: `${scope}${rest}`, isRoot: !rest.trim() || /^[.#:[]/.test(rest) };
  }
  return { selector: `${scope} ${prefixed}`, isRoot: false };
}

// Page-level sizing that makes sense on a whole page but not inside our
// wrapper (a 100vh-tall review box, a scroll trap).
const ROOT_DROP = new Set(["height", "min-height", "max-height", "overflow", "overflow-x", "overflow-y", "position"]);

// Split a declaration block on top-level semicolons (not inside () or quotes,
// e.g. data: URLs).
function splitDeclarations(text) {
  const out = [];
  let depth = 0;
  let quote = null;
  let cur = "";
  for (const ch of text) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === ";" && depth === 0) {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// Use the declaration block's own serialisation: iterating longhands would
// lose shorthands that contain var() (their longhands read back as "").
function declarations(style, dropForRoot) {
  if (!dropForRoot) return style.cssText;
  return splitDeclarations(style.cssText)
    .filter((decl) => !ROOT_DROP.has(decl.slice(0, decl.indexOf(":")).trim().toLowerCase()))
    .map((decl) => `${decl};`)
    .join("");
}

function scopeRules(rules, scope) {
  let out = "";
  for (const rule of rules) {
    // Style rule
    if (rule.selectorText !== undefined && rule.style) {
      const roots = [];
      const others = [];
      for (const sel of splitSelectors(rule.selectorText)) {
        const scoped = scopeSelector(sel, scope);
        (scoped.isRoot ? roots : others).push(scoped.selector);
      }
      if (roots.length) out += `${roots.join(",")}{${declarations(rule.style, true)}}`;
      if (others.length) out += `${others.join(",")}{${declarations(rule.style, false)}}`;
      continue;
    }
    const type = rule.constructor?.name;
    if (type === "CSSImportRule" || rule.type === 3) continue; // never fetch other stylesheets
    if (rule.media && rule.cssRules) {
      out += `@media ${rule.media.mediaText}{${scopeRules(rule.cssRules, scope)}}`;
    } else if (rule.conditionText !== undefined && rule.cssRules) {
      out += `@supports ${rule.conditionText}{${scopeRules(rule.cssRules, scope)}}`;
    } else if (rule.cssRules && type === "CSSLayerBlockRule") {
      out += scopeRules(rule.cssRules, scope); // flatten: layered rules would lose to our reset
    } else {
      out += rule.cssText; // @font-face, @keyframes, @page, …
    }
  }
  return out;
}

function cleanCss(css) {
  return css
    .replace(/@import[^;]*;/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/url\(\s*(['"]?)\s*javascript:[^)]*\)/gi, "none")
    .replace(/-moz-binding|behavior\s*:/gi, "");
}

export function scopeCss(css, scope) {
  if (!css || typeof document === "undefined") return "";
  const sandbox = document.implementation.createHTMLDocument("");
  const style = sandbox.createElement("style");
  style.textContent = cleanCss(css);
  sandbox.head.appendChild(style);
  const rules = style.sheet?.cssRules;
  return rules ? scopeRules(rules, scope) : "";
}

// ---------------------------------------------------------------------------
// Rendering

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

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

let hooked = false;
function purifier() {
  if (!hooked) {
    // External links open in a new tab without handing over window.opener.
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node.tagName === "A" && node.getAttribute("href")) {
        const href = node.getAttribute("href");
        if (/^https?:\/\//i.test(href) && !/(^|\.)xktradingfloor\.com/i.test(new URL(href, "https://x").hostname)) {
          node.setAttribute("target", "_blank");
          node.setAttribute("rel", "noopener noreferrer");
        }
      }
    });
    hooked = true;
  }
  return DOMPurify;
}

/**
 * Stored designed content → { html, css, scopeClass, headings }.
 * `html` is sanitised markup with prefixed classes and ids on h2/h3;
 * `css` is the scoped stylesheet (reset first, then the author's rules).
 */
export function renderDesignedHtml(stored) {
  const empty = { html: "", css: "", scopeClass: "", fonts: [], headings: [] };
  if (typeof stored !== "string" || typeof DOMParser === "undefined") return empty;

  const built = buildDesignedHtml(stored);
  const doc = parse(built);
  const wrapper = doc.body.firstElementChild;
  if (!wrapper) return empty;

  const rawCss = [...wrapper.querySelectorAll("style")].map((s) => s.textContent || "").join("\n");
  const fonts = [...wrapper.querySelectorAll("link[href]")]
    .map((l) => l.getAttribute("href"))
    .filter((href) => FONT_HOSTS.test(href));
  wrapper.querySelectorAll("style, link").forEach((el) => el.remove());

  const clean = purifier().sanitize(wrapper.innerHTML, {
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form", "input", "textarea", "select", "link", "meta", "base"],
    FORBID_ATTR: ["srcdoc", "formaction"],
    ADD_ATTR: ["target"],
  });

  const body = parse(`<div>${clean}</div>`).body.firstElementChild;

  body.querySelectorAll("[class]").forEach((el) => {
    const classes = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean);
    el.setAttribute("class", classes.map((c) => CLASS_PREFIX + c).join(" "));
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

  const scopeClass = `xkds-${hash(built)}`;
  const scope = `.${scopeClass}`;
  const rootClasses = (wrapper.getAttribute("class") || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((c) => CLASS_PREFIX + c)
    .join(" ");

  // Reset first (so any author rule wins), then the author's own CSS.
  const reset =
    `${scope},${scope} *,${scope} *::before,${scope} *::after{all:revert;}` +
    `${scope}{display:block;}${scope} img{max-width:100%;height:auto;}`;
  const css = reset + scopeCss(rawCss, scope);

  return {
    html: body.innerHTML,
    css,
    scopeClass: rootClasses ? `${scopeClass} ${rootClasses}` : scopeClass,
    fonts,
    headings,
  };
}
