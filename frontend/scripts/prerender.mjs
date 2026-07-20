// Build-time prerender of the homepage.
//
// Renders "/" in headless Chrome and writes the resulting markup back into
// docs/index.html so the hero (the LCP element) ships in the initial HTML and
// the client hydrates it. API / ads / analytics requests are blocked during
// the snapshot so the captured DOM matches the client's initial render (data
// sections stay in their loading state) — this keeps hydration clean.
//
// Chrome is located via CHROME_PATH (set in CI); falls back to common local
// install paths. Base path comes from VITE_BASE_PATH (matches the build).

import http from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import Beasties from "beasties";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(__dirname, "../docs");
const rawBase = process.env.VITE_BASE_PATH || "/";
const BASE = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
const PORT = Number(process.env.PRERENDER_PORT || 5199);

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
  console.error("prerender: no Chrome found. Set CHROME_PATH. Tried:", CHROME_CANDIDATES);
  process.exit(1);
}

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".webp": "image/webp",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".woff": "font/woff", ".ico": "image/x-icon", ".xml": "application/xml",
  ".txt": "text/plain", ".webmanifest": "application/manifest+json",
};

// Minimal static server for docs/, with SPA fallback to index.html.
const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    if (BASE !== "/" && urlPath.startsWith(BASE.slice(0, -1))) {
      urlPath = urlPath.slice(BASE.length - 1) || "/";
    }
    let filePath = path.join(DOCS, urlPath);
    if (urlPath.endsWith("/")) filePath = path.join(filePath, "index.html");
    if (!existsSync(filePath) || !path.extname(filePath)) {
      filePath = path.join(DOCS, "index.html"); // SPA fallback
    }
    const data = await readFile(filePath);
    res.setHeader("Content-Type", MIME[path.extname(filePath)] || "application/octet-stream");
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end("not found");
  }
});

await new Promise((r) => server.listen(PORT, r));

// Block backend API, ads/analytics, AND web fonts during the snapshot.
// Fonts matter: the font <link> uses media="print" onload="this.media='all'"
// to load non-blocking. If we let it load during prerender, onload fires and
// the captured markup has media="all" (render-blocking). Blocking the request
// keeps media="print" in the snapshot, so it stays non-blocking for real users.
const BLOCK = /onrender\.com|\/api\/|googlesyndication|googletagmanager|google-analytics|analytics\.google|doubleclick|adtrafficquality|pagead|fonts\.googleapis\.com|fonts\.gstatic\.com/i;

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  page.on("console", (m) => console.log("  [page console]", m.type(), m.text()));
  page.on("pageerror", (e) => console.log("  [page error]", e.message));
  page.on("requestfailed", (r) => {
    if (!BLOCK.test(r.url())) console.log("  [req failed]", r.url(), r.failure()?.errorText);
  });
  await page.setRequestInterception(true);
  page.on("request", (r) => (BLOCK.test(r.url()) ? r.abort() : r.continue()));

  const target = `http://localhost:${PORT}${BASE}`;
  await page.goto(target, { waitUntil: "domcontentloaded", timeout: 30000 });
  // Wait for React to mount and paint the hero heading.
  try {
    await page.waitForSelector("#root h1", { timeout: 20000 });
  } catch (e) {
    const rootHtml = await page.evaluate(() => document.getElementById("root")?.innerHTML?.slice(0, 500) || "(no #root)");
    console.log("  [debug] #root after wait:", JSON.stringify(rootHtml));
    throw e;
  }

  const html = await page.content();
  if (!/id="root">\s*<[^>]/.test(html) && !html.includes("A Transparent")) {
    throw new Error("prerender: hero content not found in snapshot");
  }

  // Inline critical CSS and load the full stylesheet async, so the prerendered
  // hero paints without waiting for the render-blocking CSS round-trip (the
  // remaining LCP/FCP ceiling once the hero is in the HTML).
  let finalHtml = html;
  try {
    const beasties = new Beasties({
      path: DOCS,
      publicPath: BASE,
      preload: "swap", // full CSS loads async, then applies
      pruneSource: false, // keep the external stylesheet intact for other routes
      reduceInlineStyles: false,
      logLevel: "silent",
    });
    finalHtml = await beasties.process(html);
    console.log("prerender: inlined critical CSS");
  } catch (e) {
    console.log("prerender: critical-CSS inlining skipped —", e.message);
  }

  const outFile = path.join(DOCS, "index.html");
  await writeFile(outFile, finalHtml, "utf8");
  console.log(`prerender: wrote ${outFile} (${(finalHtml.length / 1024).toFixed(1)} KB)`);
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
