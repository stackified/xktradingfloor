#!/usr/bin/env node
// Generates public/sitemap-0.xml, sitemap.xml, and sitemap-index.xml before
// the Vite build. Static routes are always emitted. If VITE_API_URL (or
// VITE_API_BASE_URL) is set and reachable, dynamic routes (companies, blogs,
// events) are fetched and included.
//
// Failure policy: on any error, we still emit the static-only sitemap and
// exit 0 so the deploy keeps going — the site just misses the dynamic URLs
// until the next build. Errors are logged clearly for CI diagnosis.

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = resolve(__dirname, "..", "public");
const SITE_URL = process.env.VITE_SITE_URL || "https://xktradingfloor.com";
// Prefer VITE_API_BASE_URL (matches frontend runtime var); strip trailing "/api"
// so we can append our own path prefixes below without doubling up.
const RAW_API =
  process.env.VITE_API_URL || process.env.VITE_API_BASE_URL || "";
const API_URL = RAW_API.replace(/\/api\/?$/, "").replace(/\/$/, "");

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
  { path: "/services", priority: "0.7", changefreq: "monthly" },
  { path: "/events", priority: "0.8", changefreq: "weekly" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/merch", priority: "0.5", changefreq: "monthly" },
  { path: "/reviews", priority: "0.9", changefreq: "weekly" },
  { path: "/reviews/broker", priority: "0.9", changefreq: "weekly" },
  { path: "/reviews/propfirm", priority: "0.9", changefreq: "weekly" },
  { path: "/reviews/crypto", priority: "0.8", changefreq: "weekly" },
  { path: "/reviews/traders", priority: "0.7", changefreq: "weekly" },
  { path: "/live-spreads", priority: "0.8", changefreq: "hourly" },
  { path: "/payouts", priority: "0.8", changefreq: "daily" },
  { path: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
];

const today = new Date().toISOString().split("T")[0];

function iso(date) {
  if (!date) return today;
  try {
    return new Date(date).toISOString().split("T")[0];
  } catch {
    return today;
  }
}

// Extract the docs array from the backend's { success, data: { docs: [...] } }
// envelope. Falls back through a couple of alternate shapes for safety.
function extractDocs(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  const data = payload.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.docs)) return data.docs;
  return [];
}

async function safeFetch(url, { method = "GET", body } = {}) {
  try {
    const init = {
      method,
      signal: AbortSignal.timeout(8000),
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    };
    const res = await fetch(url, init);
    if (!res.ok) {
      console.warn(`[sitemap] ${method} ${url} → HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[sitemap] ${method} ${url} failed:`, err.message);
    return null;
  }
}

async function loadDynamic() {
  if (!API_URL) {
    console.log(
      "[sitemap] VITE_API_URL / VITE_API_BASE_URL not set — skipping dynamic routes."
    );
    return [];
  }
  console.log(`[sitemap] Fetching dynamic content from ${API_URL}`);
  const out = [];

  // Companies — POST /api/companies/getallcompanies (public: approved only)
  const companies = await safeFetch(
    `${API_URL}/api/companies/getallcompanies?size=500`,
    { method: "POST", body: {} }
  );
  const companyList = extractDocs(companies);
  companyList.forEach((c) => {
    const id = c?._id || c?.id;
    if (!id) return;
    out.push({
      path: `/reviews/${id}`,
      lastmod: iso(c.updatedAt || c.createdAt),
      priority: "0.8",
      changefreq: "weekly",
    });
  });

  // Blogs — GET /api/blogs/getpublishedblogs. URLs are slug-based; the
  // component handles legacy ObjectId URLs itself, so we only emit slugs.
  const blogs = await safeFetch(
    `${API_URL}/api/blogs/getpublishedblogs?size=500`
  );
  const blogList = extractDocs(blogs);
  blogList.forEach((b) => {
    const key = b?.slug || b?._id || b?.id;
    if (!key) return;
    out.push({
      path: `/blog/${key}`,
      lastmod: iso(b.updatedAt || b.publishedAt || b.createdAt),
      priority: "0.7",
      changefreq: "monthly",
    });
  });

  // Events — GET /api/events/getallevents
  const events = await safeFetch(
    `${API_URL}/api/events/getallevents?size=500`
  );
  const eventList = extractDocs(events);
  eventList.forEach((e) => {
    const id = e?._id || e?.id;
    if (!id) return;
    out.push({
      path: `/events/${id}`,
      lastmod: iso(e.updatedAt || e.createdAt),
      priority: "0.6",
      changefreq: "weekly",
    });
  });

  console.log(
    `[sitemap] Added ${out.length} dynamic routes (${companyList.length} companies, ${blogList.length} blogs, ${eventList.length} events).`
  );
  return out;
}

function xmlEscape(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  }[c]));
}

function urlEntry(route) {
  return [
    "  <url>",
    `    <loc>${xmlEscape(SITE_URL + route.path)}</loc>`,
    `    <lastmod>${route.lastmod || today}</lastmod>`,
    `    <changefreq>${route.changefreq || "weekly"}</changefreq>`,
    `    <priority>${route.priority || "0.5"}</priority>`,
    "  </url>",
  ].join("\n");
}

function writeSitemap(routes) {
  if (!existsSync(PUBLIC_DIR)) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
  }
  const urlset = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map(urlEntry),
    "</urlset>",
    "",
  ].join("\n");

  const indexXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <sitemap>",
    `    <loc>${SITE_URL}/sitemap-0.xml</loc>`,
    `    <lastmod>${today}</lastmod>`,
    "  </sitemap>",
    "</sitemapindex>",
    "",
  ].join("\n");

  writeFileSync(join(PUBLIC_DIR, "sitemap-0.xml"), urlset, "utf8");
  writeFileSync(join(PUBLIC_DIR, "sitemap.xml"), urlset, "utf8");
  writeFileSync(join(PUBLIC_DIR, "sitemap-index.xml"), indexXml, "utf8");
  console.log(`[sitemap] Wrote ${routes.length} URLs to public/sitemap-0.xml`);
}

async function main() {
  let dynamic = [];
  try {
    dynamic = await loadDynamic();
  } catch (err) {
    // Never let a fetch surprise stop the deploy — emit static-only sitemap.
    console.error("[sitemap] loadDynamic failed, continuing with static routes only:", err);
  }
  writeSitemap([...STATIC_ROUTES, ...dynamic]);
}

main().catch((err) => {
  // Last-resort: sitemap-writing itself blew up. Log and still exit clean so
  // the deploy pipeline isn't held up by a sitemap corner case.
  console.error("[sitemap] Fatal:", err);
  process.exit(0);
});
