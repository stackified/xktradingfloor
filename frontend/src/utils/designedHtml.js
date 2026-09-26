// "Designed HTML": a complete, styled HTML page (typically generated with
// ChatGPT) that an admin pastes as a company review or blog post and expects
// to see designed — cards, tables, callouts, FAQ — rather than flattened into
// plain rich text.
//
// Storage format (a plain string in the existing description/content field,
// so the backend needs no change to store it):
//
//   <div data-xk-design="1" data-xk-look="site|original"
//        data-xk-title="…" data-xk-description="…" class="<body classes>">
//     <link rel="stylesheet" href="https://fonts.googleapis.com/...">   (optional)
//     <style>…the page's own CSS, untouched…</style>
//     …the page's body markup…
//   </div>
//
// Two looks:
//   • "site" (default) — the page's components (cards, fact grids, callouts,
//     tables, buttons, FAQ) keep their styling, but it blends into the site:
//     the site's background and font, the site's heading scale, and no
//     duplicate top bar or navigation. Asked for by the client.
//   • "original" — rendered exactly as the author's preview.
//
// Rendering (renderDesignedHtml) makes either safe to drop into our page:
//   • markup is sanitised with DOMPurify (no scripts, event handlers, forms,
//     iframes or javascript: URLs);
//   • every class name is prefixed (card → xkd-card) so the design can't pick
//     up the site's own .card/.btn/.container rules, and vice versa;
//   • every CSS selector is scoped to one wrapper class, html/body/:root map
//     to the wrapper itself, and @import is dropped;
//   • width media queries become container queries and vw becomes cqw, so the
//     design responds to the column it sits in (a 720px blog column behaves
//     like a phone-width page, as the author's own breakpoints intend);
//   • the site's global element resets (Tailwind preflight strips list
//     bullets, heading sizes, …) are undone inside the wrapper.
// The result stays in the light DOM, so crawlers, the blog prerender and the
// "On this page" contents all see the real text.

import DOMPurify from "dompurify";

const DESIGN_ATTR = "data-xk-design";
const CLASS_PREFIX = "xkd-";
const CONTAINER = "xkd";
const FONT_HOSTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//i;

export const DESIGN_LOOKS = { site: "site", original: "original" };

// Stored designed content, or pasted source that carries its own stylesheet.
export function isDesignedHtml(html) {
  return typeof html === "string" && (html.includes(DESIGN_ATTR) || /<style[\s>]/i.test(html));
}

function parse(html) {
  return new DOMParser().parseFromString(html, "text/html");
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// The wrapper of stored content, if `doc` is one.
function storedWrapper(doc) {
  const only = doc.body.children.length === 1 ? doc.body.firstElementChild : null;
  return only && only.hasAttribute(DESIGN_ATTR) ? only : null;
}

/** Look ("site" | "original") of stored content or pasted source. */
export function designedLook(html) {
  if (typeof html !== "string" || typeof DOMParser === "undefined") return DESIGN_LOOKS.site;
  const look = storedWrapper(parse(html))?.getAttribute("data-xk-look");
  return look === DESIGN_LOOKS.original ? DESIGN_LOOKS.original : DESIGN_LOOKS.site;
}

/** Title and meta description carried by stored content or pasted source. */
export function designedMeta(html) {
  if (typeof html !== "string" || typeof DOMParser === "undefined") return { title: "", description: "" };
  const doc = parse(html);
  const wrapper = storedWrapper(doc);
  if (wrapper) {
    return {
      title: wrapper.getAttribute("data-xk-title") || "",
      description: wrapper.getAttribute("data-xk-description") || "",
    };
  }
  return {
    title: doc.querySelector("title")?.textContent?.trim() || "",
    description: doc.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() || "",
  };
}

// Turn pasted source — a full document with <!doctype>/<head>, a fragment,
// or an already-stored designed block being edited again — into the storage
// format above. Idempotent. `look` overrides the stored/default look.
export function buildDesignedHtml(source, { look } = {}) {
  if (typeof source !== "string" || !source.trim()) return "";
  if (typeof DOMParser === "undefined") return source;
  const doc = parse(source);

  // Re-editing stored content: unwrap our own wrapper first.
  const wrapper = storedWrapper(doc);
  const root = wrapper || doc.body;
  const rootClass = root.getAttribute("class") || "";
  const meta = designedMeta(source);
  const finalLook =
    look || (wrapper?.getAttribute("data-xk-look") === DESIGN_LOOKS.original ? DESIGN_LOOKS.original : DESIGN_LOOKS.site);

  const css = [...doc.querySelectorAll("style")].map((s) => s.textContent || "").join("\n");
  const fonts = [...doc.querySelectorAll('link[rel~="stylesheet"][href]')]
    .map((l) => l.getAttribute("href"))
    .filter((href) => FONT_HOSTS.test(href));

  root
    .querySelectorAll("script, style, link, meta, title, base, noscript, template")
    .forEach((el) => el.remove());
  const body = root.innerHTML.trim();
  if (!body) return "";

  const attrs = [
    `${DESIGN_ATTR}="1"`,
    `data-xk-look="${finalLook}"`,
    meta.title && `data-xk-title="${escapeAttr(meta.title)}"`,
    meta.description && `data-xk-description="${escapeAttr(meta.description)}"`,
    rootClass.trim() && `class="${escapeAttr(rootClass.trim())}"`,
  ]
    .filter(Boolean)
    .join(" ");
  const links = [...new Set(fonts)]
    .map((href) => `<link rel="stylesheet" href="${href.replace(/"/g, "%22")}">`)
    .join("");
  const style = css.trim() ? `<style>${css.replace(/<\/style/gi, "<\\/style")}</style>` : "";
  return `<div ${attrs}>${links}${style}${body}</div>`;
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

// Split on a top-level separator (not inside (), [] or quotes).
function splitTopLevel(text, sep) {
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
    else if (ch === sep && depth === 0) {
      if (cur.trim()) out.push(cur.trim());
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

// A selector made only of heading elements (h1, h2 a, h3:hover, …): in the
// "site" look these give way to the site's own heading scale.
const HEADING_ONLY_RE = /^h[1-6](?:[\s>+~]+(?:h[1-6]|a|span|strong|em|b|i))*(?::[a-z-]+(?:\([^)]*\))?)*$/i;

// Page-level sizing that makes sense on a whole page but not inside our
// wrapper (a 100vh-tall review box, a scroll trap).
const ROOT_DROP = new Set(["height", "min-height", "max-height", "overflow", "overflow-x", "overflow-y", "position"]);
// In the "site" look the page adopts the site's font everywhere.
const SITE_DROP = new Set(["font-family"]);

function propName(decl) {
  return decl.slice(0, decl.indexOf(":")).trim().toLowerCase();
}

// Serialise from the block's own cssText: iterating longhands would lose
// shorthands that contain var() (their longhands read back as "").
function declarations(style, { root = false, site = false } = {}) {
  let decls = splitTopLevel(style.cssText, ";");
  if (root && site) {
    // Page background, font, spacing, colour come from the site; only the
    // design's variables (colours its components use) are kept.
    decls = decls.filter((d) => propName(d).startsWith("--"));
  } else if (root) {
    decls = decls.filter((d) => !ROOT_DROP.has(propName(d)));
  }
  if (site) decls = decls.filter((d) => !SITE_DROP.has(propName(d)));
  // Viewport units → container units: size relative to the column, not the window.
  return decls.map((d) => `${d.replace(/(\d*\.?\d+)vw\b/g, "$1cqw")};`).join("");
}

// `(max-width: 850px)`, `screen and (min-width:600px)` → container query text.
// Anything else (print, hover, prefers-color-scheme) stays a media query.
function toContainerQuery(mediaText) {
  const text = mediaText.replace(/^\s*(only\s+)?(screen|all)\s+and\s+/i, "").trim();
  const parts = text.split(/\s+and\s+/i);
  const widthOnly = parts.every((p) => /^\(\s*(min-|max-)?width\s*:[^)]+\)$/i.test(p.trim()));
  return widthOnly ? text : null;
}

function scopeRules(rules, scope, opts) {
  let out = "";
  for (const rule of rules) {
    // Style rule
    if (rule.selectorText !== undefined && rule.style) {
      const roots = [];
      const others = [];
      for (const sel of splitTopLevel(rule.selectorText, ",")) {
        if (opts.site && HEADING_ONLY_RE.test(sel.trim())) continue;
        const scoped = scopeSelector(sel, scope);
        (scoped.isRoot ? roots : others).push(scoped.selector);
      }
      if (roots.length) {
        const body = declarations(rule.style, { root: true, site: opts.site });
        if (body) out += `${roots.join(",")}{${body}}`;
      }
      if (others.length) {
        const body = declarations(rule.style, { site: opts.site });
        if (body) out += `${others.join(",")}{${body}}`;
      }
      continue;
    }
    const type = rule.constructor?.name;
    if (type === "CSSImportRule" || rule.type === 3) continue; // never fetch other stylesheets
    if (rule.media && rule.cssRules) {
      const cq = toContainerQuery(rule.media.mediaText);
      const inner = scopeRules(rule.cssRules, scope, opts);
      out += cq ? `@container ${CONTAINER} ${cq}{${inner}}` : `@media ${rule.media.mediaText}{${inner}}`;
    } else if (rule.conditionText !== undefined && rule.cssRules) {
      out += `@supports ${rule.conditionText}{${scopeRules(rule.cssRules, scope, opts)}}`;
    } else if (rule.cssRules && type === "CSSLayerBlockRule") {
      out += scopeRules(rule.cssRules, scope, opts); // flatten: layered rules would lose to our base
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

export function scopeCss(css, scope, opts = {}) {
  if (!css || typeof document === "undefined") return "";
  const sandbox = document.implementation.createHTMLDocument("");
  const style = sandbox.createElement("style");
  style.textContent = cleanCss(css);
  sandbox.head.appendChild(style);
  const rules = style.sheet?.cssRules;
  return rules ? scopeRules(rules, scope, opts) : "";
}

// Base styles under the author's rules. `.scope :where(x)` is (0,1,0): enough
// to beat the site's global element rules (0,0,1), never an author rule.
function baseCss(scope, site) {
  const container = `${scope}{display:block;container:${CONTAINER} / inline-size;}`;
  if (!site) {
    // Original look: undo everything the site set, then the author's CSS.
    return (
      `${scope},${scope} *,${scope} *::before,${scope} *::after{all:revert;}` +
      container +
      `${scope} img{max-width:100%;height:auto;}`
    );
  }
  const w = (sel) => `${scope} :where(${sel})`;
  return (
    container +
    `${scope}{color:#e5e7eb;line-height:1.7;font-size:16px;}` +
    `${w("h1")}{font-size:clamp(1.9rem,5cqw,2.6rem);line-height:1.15;font-weight:800;letter-spacing:-0.02em;margin:0.4em 0 0.5em;color:#fff;}` +
    `${w("h2")}{font-size:clamp(1.4rem,3.4cqw,1.85rem);line-height:1.25;font-weight:700;letter-spacing:-0.01em;margin:1.4em 0 0.6em;color:#fff;}` +
    `${w("h3")}{font-size:1.2rem;line-height:1.35;font-weight:700;margin:1.2em 0 0.5em;color:#fff;}` +
    `${w("h4,h5,h6")}{font-size:1rem;font-weight:700;margin:1em 0 0.4em;color:#fff;}` +
    `${w("p")}{margin:0.8em 0;}` +
    `${w("ul")}{list-style:disc;padding-left:1.4em;margin:0.8em 0;}` +
    `${w("ol")}{list-style:decimal;padding-left:1.4em;margin:0.8em 0;}` +
    `${w("li")}{margin:0.3em 0;}` +
    `${w("a")}{color:#60a5fa;}` +
    `${w("strong,b")}{font-weight:700;color:#fff;}` +
    `${w("table")}{border-collapse:collapse;width:100%;}` +
    `${w("img")}{max-width:100%;height:auto;}` +
    `${w("hr")}{border:0;border-top:1px solid rgba(255,255,255,0.1);margin:1.5em 0;}` +
    `${w("summary")}{cursor:pointer;display:list-item;}` +
    `${w("blockquote")}{border-left:3px solid rgba(96,165,250,0.5);padding-left:1em;margin:1em 0;color:#cbd5e1;}`
  );
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

function normalise(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
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

// Site chrome a pasted page often brings along (its own brand bar / nav),
// which duplicates the site's header in the "site" look.
const CHROME_SELECTOR = 'nav, [class~="topbar"], [class~="navbar"], [class~="site-header"], [class~="site-nav"]';

/**
 * Stored designed content → { html, css, scopeClass, fonts, headings, look, meta }.
 * Options:
 *   pageTitle — the page already shows this as its <h1> (blog posts): a
 *               matching <h1> in the design is dropped, not repeated.
 */
export function renderDesignedHtml(stored, { pageTitle } = {}) {
  const empty = { html: "", css: "", scopeClass: "", fonts: [], headings: [], look: DESIGN_LOOKS.site, meta: {} };
  if (typeof stored !== "string" || typeof DOMParser === "undefined") return empty;

  const built = buildDesignedHtml(stored);
  const doc = parse(built);
  const wrapper = doc.body.firstElementChild;
  if (!wrapper) return empty;
  const site = wrapper.getAttribute("data-xk-look") !== DESIGN_LOOKS.original;

  const rawCss = [...wrapper.querySelectorAll("style")].map((s) => s.textContent || "").join("\n");
  const fonts = site
    ? [] // the site's own font is used
    : [...wrapper.querySelectorAll("link[href]")].map((l) => l.getAttribute("href")).filter((h) => FONT_HOSTS.test(h));
  wrapper.querySelectorAll("style, link").forEach((el) => el.remove());

  const clean = purifier().sanitize(wrapper.innerHTML, {
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form", "input", "textarea", "select", "link", "meta", "base"],
    FORBID_ATTR: ["srcdoc", "formaction"],
    ADD_ATTR: ["target"],
  });

  const body = parse(`<div>${clean}</div>`).body.firstElementChild;

  if (site) body.querySelectorAll(CHROME_SELECTOR).forEach((el) => el.remove());
  if (pageTitle) {
    const h1 = body.querySelector("h1");
    const a = normalise(h1?.textContent);
    const b = normalise(pageTitle);
    if (h1 && a && b && (a === b || a.includes(b) || b.includes(a))) h1.remove();
  }

  body.querySelectorAll("[class]").forEach((el) => {
    const classes = (el.getAttribute("class") || "").split(/\s+/).filter(Boolean);
    el.setAttribute("class", classes.map((c) => CLASS_PREFIX + c).join(" "));
  });

  const used = new Set([...body.querySelectorAll("[id]")].map((el) => el.id));
  const headings = [];
  body.querySelectorAll("h2, h3").forEach((el) => {
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!text) return;
    let id = el.id;
    if (!id) {
      id = slugify(text);
      let n = 2;
      while (used.has(id)) id = `${slugify(text)}-${n++}`;
      used.add(id);
      el.id = id;
    }
    headings.push({ id, text, level: el.tagName === "H2" ? 2 : 3 });
  });

  const scopeClass = `xkds-${hash(built)}`;
  const scope = `.${scopeClass}`;
  const rootClasses = (wrapper.getAttribute("class") || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((c) => CLASS_PREFIX + c)
    .join(" ");

  const css = baseCss(scope, site) + scopeCss(rawCss, scope, { site });

  return {
    html: body.innerHTML,
    css,
    scopeClass: rootClasses ? `${scopeClass} ${rootClasses}` : scopeClass,
    fonts,
    headings,
    look: site ? DESIGN_LOOKS.site : DESIGN_LOOKS.original,
    meta: {
      title: wrapper.getAttribute("data-xk-title") || "",
      description: wrapper.getAttribute("data-xk-description") || "",
    },
  };
}
