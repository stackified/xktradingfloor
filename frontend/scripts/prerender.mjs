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

// Backend API calls are left HANGING (never answered) rather than aborted.
//
// This distinction is the whole ballgame for hydration. An aborted request
// makes the fetch *reject*, so a component's catch/finally runs and it leaves
// its loading state — TopCompaniesTables then hit `if (!loading && empty)
// return null` and vanished from the snapshot entirely. The browser's first
// client render still had loading === true and rendered the section, so the
// trees disagreed: React threw #418 (hydration mismatch) then #423, discarded
// the whole prerendered DOM and re-rendered from scratch. That cost every bit
// of the prerender's value and put mobile LCP at 8.3 s.
//
// A request that never settles leaves each component parked in exactly the
// initial state the client starts from, so the snapshot and the first client
// render agree and hydration succeeds.
const HANG = /onrender\.com|\/api\//i;

// Ads/analytics/fonts are aborted outright — nothing renders off them.
// Fonts matter: the font <link> uses media="print" onload="this.media='all'"
// to load non-blocking. If we let it load during prerender, onload fires and
// the captured markup has media="all" (render-blocking). Blocking the request
// keeps media="print" in the snapshot, so it stays non-blocking for real users.
const ABORT = /googlesyndication|googletagmanager|google-analytics|analytics\.google|doubleclick|adtrafficquality|pagead|fonts\.googleapis\.com|fonts\.gstatic\.com/i;

const BLOCK = new RegExp(`${HANG.source}|${ABORT.source}`, "i");

const browser = await puppeteer.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();

  // Freeze requestAnimationFrame for the duration of the snapshot.
  //
  // framer-motion computes each element's initial visual state during
  // React's render phase, so React's own HTML output is deterministic and
  // matches what the browser renders on first paint. What broke hydration
  // was framer's rAF-driven animation loop mutating those inline styles
  // afterwards: the hero's decorative animations (ripple circles, logo
  // pulse) loop forever, so a DOM snapshot always caught them mid-flight
  // with values like `transform: scale(1.00399)` that no fresh client
  // render can reproduce. React logged #418, then #423, and discarded the
  // entire prerendered DOM - costing us the whole prerender.
  //
  // With rAF stubbed the loop never advances past frame 0, so the captured
  // markup is exactly React's render-phase output. React schedules on
  // MessageChannel rather than rAF, so rendering itself is unaffected.
  await page.evaluateOnNewDocument(() => {
    let id = 0;
    window.requestAnimationFrame = () => ++id;
    window.cancelAnimationFrame = () => {};
  });
  await page.setViewport({ width: 1280, height: 900 });
  page.on("console", (m) => console.log("  [page console]", m.type(), m.text()));
  page.on("pageerror", (e) => console.log("  [page error]", e.message));
  page.on("requestfailed", (r) => {
    if (!BLOCK.test(r.url())) console.log("  [req failed]", r.url(), r.failure()?.errorText);
  });
  await page.setRequestInterception(true);
  page.on("request", (r) => {
    const url = r.url();
    // Deliberately neither continue nor abort: the request stays pending for
    // the life of the snapshot, so data promises never settle.
    if (HANG.test(url)) return;
    if (ABORT.test(url)) return void r.abort();
    r.continue();
  });

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

  // The inline GTM snippet runs during the snapshot and inserts its own
  // <script src=".../gtm.js">, which then gets baked into the static HTML.
  // The snippet runs again in the visitor's browser and injects a second
  // one, so production was fetching and initialising GTM twice. Remove the
  // injected tag - the snippet recreates it client-side. Matched on gtm.js
  // specifically so the gtag.js tag authored in index.html is left alone.
  await page.evaluate(() => {
    document
      .querySelectorAll('script[src*="googletagmanager.com/gtm.js"]')
      .forEach((el) => el.remove());
  });

  // Emit the Suspense boundary markers React's own SSR does.
  //
  // Router wraps <Routes> in a single <Suspense>, whose DOM parent is <main>.
  // renderToString brackets a resolved boundary with <!--$--> and <!--/$-->,
  // and the hydrator *requires* them: it claims the boundary by looking for a
  // comment node whose data is "$". A DOM snapshot has no such markers, so
  // React threw at the boundary, its cursor drifted, and <footer> and the
  // toast container threw in turn (#418 x3) before the whole root fell back
  // to client rendering (#423). Every prerender we shipped hit this.
  //
  // <main> contains only the boundary's subtree (PageViewTracker renders
  // null), so the markers go in as its first and last children.
  await page.evaluate(() => {
    const main = document.querySelector("#root main");
    if (!main) throw new Error("prerender: <main> not found; cannot place Suspense markers");
    main.insertBefore(document.createComment("$"), main.firstChild);
    main.appendChild(document.createComment("/$"));
  });

  // Separate adjacent text nodes the way React's own SSR does.
  //
  // JSX such as `Top{" "}<span>` or `© {year} XK` renders two or three
  // sibling text nodes. page.content() serialises them as one run of text,
  // and when the browser parses the snapshot it gets one merged node where
  // hydration expects several. React then throws #418 and discards the whole
  // prerendered tree. renderToString avoids this by emitting <!-- --> between
  // adjacent text nodes, which the hydrator skips; replicate that here so the
  // class of bug is closed for every component, not just the ones found.
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.getElementById("root"), NodeFilter.SHOW_TEXT);
    const texts = [];
    let node;
    while ((node = walker.nextNode())) texts.push(node);
    for (const t of texts) {
      const next = t.nextSibling;
      if (next && next.nodeType === Node.TEXT_NODE) {
        t.parentNode.insertBefore(document.createComment(" "), next);
      }
    }
  });

  const html = await page.content();
  if (!/id="root">\s*<[^>]/.test(html) && !html.includes("A Transparent")) {
    throw new Error("prerender: hero content not found in snapshot");
  }
  // Guard the hydration contract: every API-driven section must appear in the
  // snapshot in its loading state. If one is missing, a data promise settled
  // during the snapshot and the client's first render will not match — which
  // silently costs us the entire prerender (see the HANG comment above).
  for (const marker of ["Rated Companies", "Events &amp; Webinars"]) {
    if (!html.includes(marker)) {
      throw new Error(
        `prerender: "${marker}" missing from snapshot — a data section left its ` +
        `loading state, which will break hydration. Check the HANG pattern.`
      );
    }
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
