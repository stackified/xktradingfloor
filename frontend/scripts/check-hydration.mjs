// Build-time guard: does the prerendered homepage actually hydrate?
//
// Runs after scripts/prerender.mjs. Serves docs/ under the build's base path,
// loads it in headless Chrome with the API hanging (same conditions as the
// snapshot) and fails the build if React reports a hydration error.
//
// Why this exists: a failed hydration is silent in production. React logs
// #418/#423, throws the prerendered DOM away and re-renders from scratch —
// the page still works, so nobody notices, but the prerender's entire point
// (fast FCP/LCP, no double render) is lost. That is exactly what shipped for
// weeks: first mid-animation inline styles, then merged adjacent text nodes,
// then the missing Suspense boundary markers. Each was invisible without a
// check like this one.
//
// Skips (exit 0) when Chrome is unavailable or the snapshot was not
// prerendered, so it never blocks a build that prerender itself skipped.

import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(__dirname, "../docs");
const rawBase = process.env.VITE_BASE_PATH || "/";
const BASE = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
const PORT = Number(process.env.HYDRATION_CHECK_PORT || 5198);

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
  console.log("check-hydration: no Chrome found, skipping");
  process.exit(0);
}

const indexHtml = await readFile(path.join(DOCS, "index.html"), "utf8");
if (!/id="root">\s*<[a-z]/i.test(indexHtml)) {
  console.log("check-hydration: index.html is not prerendered, skipping");
  process.exit(0);
}

const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".webp": "image/webp",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".woff": "font/woff", ".ico": "image/x-icon",
};

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
await new Promise((r) => server.listen(PORT, r));

// Production React throws "Minified React error #418" — the word "hydration"
// never appears, so match the error numbers as well as the dev-mode text.
const HYDRATION_ERROR = /hydrat|#418|#423|#425|invariant=4(?:18|23|25)/i;
const HANG = /onrender\.com|\/api\//i;
const ABORT = /googlesyndication|googletagmanager|google-analytics|doubleclick|adtrafficquality|pagead|clarity\.ms|fonts\.googleapis\.com|fonts\.gstatic\.com/i;

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

let failures = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => {
    if (HYDRATION_ERROR.test(e.message)) failures.push(e.message.split("\n")[0].slice(0, 140));
  });
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" && /Hydration failed|error while hydrating|did not match/i.test(t)) {
      failures.push("[console] " + t.slice(0, 140));
    }
  });
  await page.setViewport({ width: 1280, height: 900 });
  await page.setRequestInterception(true);
  page.on("request", (r) => {
    const url = r.url();
    if (HANG.test(url)) return;
    if (ABORT.test(url)) return void r.abort();
    r.continue();
  });
  await page.goto(`http://localhost:${PORT}${BASE}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector("#root h1", { timeout: 20000 });
  await new Promise((r) => setTimeout(r, 2500));
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}

if (failures.length) {
  console.error(`check-hydration: FAILED — ${failures.length} hydration error(s) at base ${BASE}`);
  failures.slice(0, 6).forEach((f) => console.error("  " + f));
  console.error("The prerendered HTML does not match React's first render; the whole snapshot would be discarded in the browser.");
  process.exit(1);
}
console.log(`check-hydration: OK — prerendered homepage hydrates cleanly at base ${BASE}`);
