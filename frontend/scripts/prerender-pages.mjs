// Build-time prerender of the public pages other than the homepage and blog
// posts (those have their own scripts): the static pages (about, reviews hub,
// events, live spreads, ...), every approved company review and every event.
//
// Runs after scripts/prerender.mjs. Each page is loaded in headless Chrome
// with the live API, and once its content and <head> tags have settled it is
// written to docs/<path>.html. Bluehost serves /reviews/abc from
// reviews/abc.html via .htaccess.
//
// Why: crawlers that don't run JavaScript (most AI crawlers, link previews,
// some search engines) only ever saw the homepage shell, with the homepage's
// title and a canonical link pointing at "/". Every page now ships its own
// title, description, canonical URL, structured data and visible text.
//
// The snapshots are NOT hydrated. The inline script after #root in index.html
// clears them before first paint, and the app renders the page fresh, so
// content that changes after a build can never cause a hydration mismatch.
//
// Never fails the build: a page that doesn't render is skipped (it still works
// through the SPA fallback), and if the API is unreachable only the static
// pages are attempted.

import http from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(__dirname, "../docs");
const rawBase = process.env.VITE_BASE_PATH || "/";
const BASE = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
const PORT = Number(process.env.PRERENDER_PAGES_PORT || 5196);
const MAX_DYNAMIC = Number(process.env.PRERENDER_PAGES_MAX || 400);

// Public, indexable pages. Must stay in step with STATIC_ROUTES in
// scripts/build-sitemap.js (minus "/", which prerender.mjs handles).
export const STATIC_PAGES = [
  "about",
  "contact",
  "services",
  "events",
  "blog",
  "merch",
  "reviews",
  "reviews/broker",
  "reviews/propfirm",
  "reviews/crypto",
  "reviews/traders",
  "live-spreads",
  "payouts",
  "privacy-policy",
  "terms",
];

const log = (...a) => console.log("prerender-pages:", ...a);

function apiBase() {
  if (process.env.VITE_API_BASE_URL) return process.env.VITE_API_BASE_URL.replace(/\/$/, "");
  try {
    const env = readFileSync(path.resolve(__dirname, "../.env.production"), "utf8");
    const m = env.match(/^VITE_API_BASE_URL=(.+)$/m);
    if (m) return m[1].trim().replace(/\/$/, "");
  } catch {}
  return "https://xktradingfloor-backend.onrender.com/api";
}
const API = apiBase();

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!executablePath) {
  log("no Chrome found, skipping");
  process.exit(0);
}

async function getJson(url, { method = "GET", timeoutMs = 60000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      signal: ctrl.signal,
      headers: { accept: "application/json", ...(method === "POST" ? { "content-type": "application/json" } : {}) },
      body: method === "POST" ? "{}" : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const docsOf = (payload) => {
  const d = payload?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.docs)) return d.docs;
  return [];
};
const OBJECT_ID = /^[a-f0-9]{24}$/;

async function dynamicPages() {
  try {
    // Render's free tier sleeps; the first request can take ~30-60 s.
    await getJson(`${API}/settings/mock-mode`, { timeoutMs: 90000 }).catch(() => {});
    const [companies, events] = await Promise.all([
      getJson(`${API}/companies/getallcompanies?size=${MAX_DYNAMIC}`, { method: "POST" }).catch(() => null),
      getJson(`${API}/events/getallevents?size=${MAX_DYNAMIC}`).catch(() => null),
    ]);
    const companyPages = docsOf(companies)
      .map((c) => String(c._id || c.id || ""))
      .filter((id) => OBJECT_ID.test(id))
      .map((id) => `reviews/${id}`);
    const eventPages = docsOf(events)
      .map((e) => String(e._id || e.id || ""))
      .filter((id) => OBJECT_ID.test(id))
      .map((id) => `events/${id}`);
    return { companyPages, eventPages };
  } catch (e) {
    log(`API unreachable (${e.message}); static pages only`);
    return { companyPages: [], eventPages: [] };
  }
}

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".webp": "image/webp",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".woff": "font/woff", ".ico": "image/x-icon", ".xml": "application/xml",
  ".txt": "text/plain", ".webmanifest": "application/manifest+json",
};

// Static server for docs/ with SPA fallback to index.html. It deliberately
// never serves the *.html snapshots, so each page renders from the live app.
const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (BASE !== "/" && urlPath.startsWith(BASE.slice(0, -1))) {
      urlPath = urlPath.slice(BASE.length - 1) || "/";
    }
    let filePath = path.join(DOCS, urlPath);
    if (urlPath.endsWith("/")) filePath = path.join(filePath, "index.html");
    if (!existsSync(filePath) || !path.extname(filePath)) filePath = path.join(DOCS, "index.html");
    res.setHeader("Content-Type", MIME[path.extname(filePath)] || "application/octet-stream");
    res.end(await readFile(filePath));
  } catch {
    res.statusCode = 404;
    res.end("not found");
  }
});

const ABORT = /googlesyndication|googletagmanager|google-analytics|analytics\.google|doubleclick|adtrafficquality|pagead|clarity\.ms|fonts\.googleapis\.com|fonts\.gstatic\.com|youtube\.com\/embed|ytimg|myfxbook/i;
const DEFAULT_TITLE_PREFIX = "XK Trading Floor | Trusted";

const { companyPages, eventPages } = await dynamicPages();
const pages = [...STATIC_PAGES, ...companyPages, ...eventPages];
log(`${STATIC_PAGES.length} static, ${companyPages.length} company, ${eventPages.length} event pages`);

await new Promise((r) => server.listen(PORT, r));
const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

let written = 0;
const failed = [];
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setRequestInterception(true);
  page.on("request", (r) => (ABORT.test(r.url()) ? r.abort() : r.continue()));

  for (const route of pages) {
    try {
      await page.goto(`http://localhost:${PORT}${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      // The page's own <title> (set by its Seo component) and a heading.
      await page.waitForFunction(
        (prefix) => document.title && !document.title.startsWith(prefix) && document.querySelector("#root main h1, #root main h2"),
        { timeout: 45000 },
        DEFAULT_TITLE_PREFIX
      );
      // Let the data the page asked for arrive and render.
      await page.waitForNetworkIdle({ idleTime: 800, timeout: 30000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 300));

      const head = await page.evaluate(() => {
        document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]').forEach((el) => el.remove());
        // index.html carries site-wide fallback tags (the homepage's canonical,
        // description, og:*). Helmet adds the page's own (data-rh). Crawlers
        // read the first match, so drop each fallback Helmet replaced.
        const key = (el) =>
          el.tagName === "LINK" ? `link:${el.getAttribute("rel")}` :
          el.getAttribute("property") ? `p:${el.getAttribute("property")}` :
          el.getAttribute("name") ? `n:${el.getAttribute("name")}` : null;
        const managed = new Set([...document.head.querySelectorAll("meta[data-rh], link[data-rh]")].map(key).filter(Boolean));
        document.head.querySelectorAll("meta:not([data-rh]), link[rel=canonical]:not([data-rh])").forEach((el) => {
          if (managed.has(key(el))) el.remove();
        });
        const canon = document.querySelector('link[rel="canonical"]')?.getAttribute("href") || "";
        return { title: document.title, canon, canonicals: document.querySelectorAll('link[rel="canonical"]').length };
      });

      if (head.canonicals !== 1) throw new Error(`expected 1 canonical, found ${head.canonicals}`);
      const html = await page.content();
      const out = path.join(DOCS, `${route}.html`);
      await mkdir(path.dirname(out), { recursive: true });
      await writeFile(out, html, "utf8");
      written++;
      log(`wrote ${route}.html  "${head.title.slice(0, 60)}"`);
    } catch (e) {
      failed.push(route);
      log(`failed ${route}: ${e.message.split("\n")[0]}`);
    }
  }
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}

log(`${written}/${pages.length} pages prerendered${failed.length ? `; skipped: ${failed.join(", ")}` : ""}`);
