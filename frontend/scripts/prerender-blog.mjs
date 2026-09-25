// Build-time prerender of published blog posts.
//
// Runs after scripts/prerender.mjs. For every published post it loads
// /blog/<slug> in headless Chrome with the real API, waits for the article,
// and writes the page to docs/blog/<slug>.html. The servers answer
// /blog/<slug> with that file (.htaccess rule on Bluehost; GitHub Pages maps
// extensionless URLs to .html on its own).
//
// Why: only the homepage used to ship real HTML. Link previews (WhatsApp,
// LinkedIn, X, Facebook, Slack) and any crawler that does not run
// JavaScript saw the generic site title and logo for every article. The
// snapshot carries the post's own <title>, description, Open Graph/Twitter
// tags, canonical URL and JSON-LD, plus the article text itself.
//
// These pages are NOT hydrated. The inline script after #root in index.html
// clears the snapshot before first paint on any route but the homepage, and
// main.jsx renders the route fresh - so a post changing after the build can
// never cause a hydration mismatch; visitors always get live content.
//
// Never fails the build: if the API is down or a post fails to render, it
// logs and moves on, and that URL keeps working through the SPA fallback.

import http from "node:http";
import { readFile, writeFile, mkdir, readdir, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(__dirname, "../docs");
const OUT_DIR = path.join(DOCS, "blog");
const rawBase = process.env.VITE_BASE_PATH || "/";
const BASE = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
const PORT = Number(process.env.PRERENDER_BLOG_PORT || 5197);
const MAX_POSTS = Number(process.env.PRERENDER_BLOG_MAX || 300);

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

const log = (...a) => console.log("prerender-blog:", ...a);

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

async function getJson(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// Slugs are written to disk, so only allow what the site itself generates.
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OBJECT_ID = /^[a-f0-9]{24}$/;

async function publishedSlugs() {
  // Render's free tier sleeps; the first request can take ~30-60 s.
  await getJson(`${API}/settings/mock-mode`, 90000).catch(() => {});
  const list = await getJson(`${API}/blogs/getpublishedblogs?page=1&size=${MAX_POSTS}`, 60000);
  const posts = Array.isArray(list?.data) ? list.data : list?.data?.docs || [];
  const slugs = [];
  for (const p of posts) {
    let slug = p.slug;
    if (!slug && p._id) {
      // Older API builds leave the slug out of the list response.
      const one = await getJson(`${API}/blogs/${p._id}/getblogbyid`, 30000).catch(() => null);
      slug = one?.data?.slug || one?.data?.blog?.slug;
    }
    if (slug && SAFE_SLUG.test(slug)) slugs.push(slug);
    // Posts created before slugs existed have none; their public URL is
    // /blog/<id> (the app's canonical URL for them), so prerender that.
    else if (!slug && OBJECT_ID.test(String(p._id))) slugs.push(String(p._id));
    else log(`skipping post ${p._id}: unusable slug ${JSON.stringify(slug)}`);
  }
  return [...new Set(slugs)];
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
// does NOT serve docs/blog/*.html, so every post renders from the live app.
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

const ABORT = /googlesyndication|googletagmanager|google-analytics|analytics\.google|doubleclick|adtrafficquality|pagead|clarity\.ms|fonts\.googleapis\.com|fonts\.gstatic\.com/i;

let slugs;
try {
  slugs = await publishedSlugs();
} catch (e) {
  log(`could not list published posts from ${API} (${e.message}); skipping`);
  process.exit(0);
}
if (!slugs.length) {
  log("no published posts; skipping");
  process.exit(0);
}

// Start from a clean folder so unpublished or renamed posts do not linger.
await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });
await new Promise((r) => server.listen(PORT, r));

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

let written = 0;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setRequestInterception(true);
  page.on("request", (r) => (ABORT.test(r.url()) ? r.abort() : r.continue()));

  for (const slug of slugs) {
    try {
      await page.goto(`http://localhost:${PORT}${BASE}blog/${slug}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForSelector("article.article-content", { timeout: 60000 });
      // Let Helmet flush the head tags and images get their src.
      await page.waitForFunction(() => document.querySelector('meta[property="og:type"][content="article"]'), { timeout: 15000 });
      await new Promise((r) => setTimeout(r, 400));

      const title = await page.evaluate(() => {
        // Tags the snapshot must not keep.
        document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]').forEach((el) => el.remove());
        // index.html carries site-wide fallback meta; Helmet adds the post's
        // own copies (data-rh). Scrapers read the first match, so drop the
        // fallbacks wherever Helmet supplied a replacement.
        const key = (el) =>
          el.tagName === "LINK" ? `link:${el.getAttribute("rel")}` :
          el.getAttribute("property") ? `p:${el.getAttribute("property")}` :
          el.getAttribute("name") ? `n:${el.getAttribute("name")}` : null;
        const managed = new Set([...document.head.querySelectorAll("meta[data-rh], link[data-rh]")].map(key).filter(Boolean));
        document.head.querySelectorAll("meta:not([data-rh]), link[rel=canonical]:not([data-rh])").forEach((el) => {
          if (managed.has(key(el))) el.remove();
        });
        return document.title;
      });

      const html = await page.content();
      if (!/og:type" content="article"|content="article" property="og:type"/.test(html)) throw new Error("article meta missing");
      await writeFile(path.join(OUT_DIR, `${slug}.html`), html, "utf8");
      written++;
      log(`wrote blog/${slug}.html  "${title.slice(0, 60)}"`);
    } catch (e) {
      log(`failed ${slug}: ${e.message}`);
    }
  }
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}

const files = (await readdir(OUT_DIR)).filter((f) => f.endsWith(".html"));
if (!files.length) await rm(OUT_DIR, { recursive: true, force: true });
log(`${written}/${slugs.length} posts prerendered`);
