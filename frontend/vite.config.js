import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Read base path from environment variable, default to "/" for localhost
  // VITE_BASE_PATH should be set via environment variable (e.g., /xktradingfloor/ for GitHub Pages)
  // Ensure base path ends with "/" for GitHub Pages compatibility
  const basePath = process.env.VITE_BASE_PATH || "/";
  const normalizedBasePath = basePath.endsWith("/") ? basePath : `${basePath}/`;

  return {
    plugins: [react(), rocketLoaderOptOut()],
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
