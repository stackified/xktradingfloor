import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Cloudflare's Rocket Loader rewrites every <script> it sees — including
// <script type="module"> — into a placeholder type, then downloads and
// evaluates the bundle itself in a single serial main-thread task. On the live
// site that measured 1,980 ms Total Blocking Time on desktop (Performance 48)
// and pushed mobile LCP to 8.3 s, because hydration could not start until
// Rocket Loader got around to running the bundle.
//
// data-cfasync="false" is Cloudflare's documented opt-out: Rocket Loader skips
// any script carrying it. Stamping it on everything we emit means the site
// keeps native module semantics even if the dashboard toggle stays on.
const rocketLoaderOptOut = () => ({
  name: "rocket-loader-opt-out",
  transformIndexHtml: {
    // "post" so this also covers the module/preload tags Vite injects itself.
    order: "post",
    handler: (html) =>
      html.replace(/<script(?![^>]*\bdata-cfasync=)/g, '<script data-cfasync="false"'),
  },
});

// Start the bundle after the first paint, not before it.
//
// The homepage (and every prerendered page) ships its content in the HTML, so
// the first paint needs no JavaScript. But Vite's entry is a deferred
// <script type="module">, and Chrome runs deferred scripts as soon as parsing
// ends, before it has painted anything: evaluating the 465 KiB bundle took
// ~500 ms on a laptop and ~2 s on the mobile Lighthouse profile, and First
// Contentful Paint waited for all of it. Replacing the tag with a modulepreload
// (so the download still starts immediately) plus a tiny loader that waits for
// one animation frame lets the browser paint the prerendered page first and
// then hydrate it. The prerender sets window.__xkPrerender because it freezes
// requestAnimationFrame; a timer covers background tabs, where rAF is paused.
const deferEntryUntilFirstPaint = () => ({
  name: "defer-entry-until-first-paint",
  transformIndexHtml: {
    order: "post",
    handler: (html) =>
      html.replace(
        /<script type="module" crossorigin src="([^"]+)"><\/script>/,
        (_, src) =>
          `<link rel="modulepreload" crossorigin href="${src}">` +
          `<script>(function(){var s=${JSON.stringify(src)},d=false;` +
          `function start(){if(d)return;d=true;var e=document.createElement("script");` +
          `e.type="module";e.crossOrigin="anonymous";e.src=s;document.head.appendChild(e);}` +
          `if(window.__xkPrerender){start();return;}` +
          `requestAnimationFrame(function(){setTimeout(start,0);});setTimeout(start,1500);})();</script>`
      ),
  },
});

// Staging (GitHub Pages, base /xktradingfloor/) must never compete with the
// real site in search results: Google had indexed the staging copy. Every
// page there gets a noindex tag; production (base /) is untouched. GitHub
// Pages has no robots.txt at the domain root, so the tag is the only lever.
const noindexOffProduction = (base) => ({
  name: "noindex-off-production",
  transformIndexHtml: (html) =>
    base === "/"
      ? html
      : html.replace("<head>", '<head><meta name="robots" content="noindex, nofollow" />'),
});

// Real listing counts for the homepage (Sahil, 2 Oct 2026: "let's stick to
// real count"). Read once per production build and inlined as
// __XK_SITE_STATS__, so the prerendered HTML and the hydrating bundle show the
// same numbers. Each deploy refreshes them. null (dev, or API unreachable)
// hides the figures instead of guessing.
async function fetchSiteStats() {
  let api = process.env.VITE_API_BASE_URL || "";
  if (!api) {
    try {
      const env = readFileSync(resolve(__dirname, ".env.production"), "utf8");
      api = (env.match(/^VITE_API_BASE_URL=(.+)$/m) || [])[1]?.trim() || "";
    } catch {
      api = "";
    }
  }
  if (!/^https?:\/\//.test(api)) return null;
  api = api.replace(/\/$/, "");
  const total = async (path, init) => {
    const res = await fetch(`${api}${path}`, { ...init, signal: AbortSignal.timeout(90000) });
    const body = await res.json();
    const n = body?.pagination?.totalItems;
    if (!body?.success || !Number.isFinite(n)) throw new Error(`no total from ${path}`);
    return n;
  };
  try {
    const [companies, events, articles] = await Promise.all([
      total("/companies/getallcompanies?size=1", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
      total("/events/getallevents?size=1"),
      total("/blogs/getpublishedblogs?size=1"),
    ]);
    console.log(`[site-stats] companies=${companies} events=${events} articles=${articles}`);
    return { companies, events, articles };
  } catch (err) {
    console.warn(`[site-stats] skipped: ${err.message}`);
    return null;
  }
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode, command }) => {
  // Read base path from environment variable, default to "/" for localhost
  // VITE_BASE_PATH should be set via environment variable (e.g., /xktradingfloor/ for GitHub Pages)
  // Ensure base path ends with "/" for GitHub Pages compatibility
  const basePath = process.env.VITE_BASE_PATH || "/";
  const normalizedBasePath = basePath.endsWith("/") ? basePath : `${basePath}/`;

  const siteStats = command === "build" ? await fetchSiteStats() : null;

  return {
    define: {
      __XK_SITE_STATS__: JSON.stringify(siteStats),
    },
    // deferEntryUntilFirstPaint runs before rocketLoaderOptOut so the loader
    // it writes gets the data-cfasync opt-out too.
    plugins: [react(), noindexOffProduction(normalizedBasePath), deferEntryUntilFirstPaint(), rocketLoaderOptOut()],
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
        '/images': {
          target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
        '/uploads': {
          target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
    base: normalizedBasePath,
    build: {
      outDir: "docs", // Output to docs folder for GitHub Pages
      assetsDir: "assets",
      // Modern baseline: skip transpiling ES2020 features (classes, spread,
      // optional chaining, Array.prototype.find, String.startsWith/endsWith).
      // Removes the legacy polyfills/transforms PSI flagged. All evergreen
      // browsers from 2020+ support this natively.
      target: "es2020",
      rollupOptions: {
        input: {
          main: "./index.html",
        },
        // NOTE: intentionally no manualChunks. Prior configs split React into
        // its own chunk while leaving transitive deps (@remix-run/router,
        // use-sync-external-store) in the generic vendor chunk, causing a
        // load-order race that threw "Cannot set properties of undefined
        // (setting 'Children')" and produced a blank page. Rollup's default
        // chunking is safe.
      },
    },
    publicDir: "public", // Ensure public folder is copied
    // Ensure proper asset handling
    assetsInclude: [
      "**/*.png",
      "**/*.jpg",
      "**/*.jpeg",
      "**/*.gif",
      "**/*.svg",
      "**/*.webp",
    ],
  };
});
