#!/usr/bin/env node
// Generates public/sitemap-0.xml and sitemap-index.xml before the Vite build.
// Static routes are always emitted. If VITE_API_URL is set and reachable,
// dynamic routes (companies, blogs, events) are fetched and included.

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PUBLIC_DIR = resolve(__dirname, "..", "public");
const SITE_URL = process.env.VITE_SITE_URL || "https://xktradingfloor.com";
// Prefer VITE_API_BASE_URL (matches frontend runtime var); strip trailing "/api" so
// we can append our own path prefixes below without doubling up.
const RAW_API =
  process.env.VITE_API_URL ||
  process.env.VITE_API_BASE_URL ||
  "";
const API_URL = RAW_API.replace(/\/api\/?$/, "").replace(/\/$/, "");

const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/about", priority: "0.6", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
  { path: "/services", priority: "0.7", changefreq: "monthly" },
  { path: "/academy", priority: "0.8", changefreq: "weekly" },
  { path: "/blog", priority: "0.9", changefreq: "daily" },
  { path: "/merch", priority: "0.5", changefreq: "monthly" },
  { path: "/reviews", priority: "0.9", changefreq: "weekly" },
  { path: "/reviews/broker", priority: "0.9", changefreq: "weekly" },
  { path: "/reviews/propfirm", priority: "0.9", changefreq: "weekly" },
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

async function safeFetch(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`[sitemap] Failed to fetch ${url}:`, err.message);
    return null;
  }
}

async function loadDynamic() {
  if (!API_URL) {
    console.log("[sitemap] VITE_API_URL not set — skipping dynamic routes.");
    return [];
  }
  console.log(`[sitemap] Fetching dynamic content from ${API_URL}`);
  const out = [];

  const companies = await safeFetch(`${API_URL}/api/public/companies?size=500`);
  const companyList = companies?.data || companies || [];
  companyList.forEach((c) => {
    if (c && (c._id || c.id)) {
      out.push({
        path: `/reviews/${c._id || c.id}`,
        lastmod: iso(c.updatedAt || c.createdAt),
        priority: "0.8",
        changefreq: "weekly",
      });
    }
  });

  const blogs = await safeFetch(`${API_URL}/api/public/blogs?size=500`);
  const blogList = blogs?.data || blogs || [];
  blogList.forEach((b) => {
    const slug = b.slug || b._id || b.id;
    if (slug) {
      out.push({
        path: `/blog/${slug}`,
        lastmod: iso(b.updatedAt || b.publishedAt || b.createdAt),
        priority: "0.7",
        changefreq: "monthly",
      });
    }
  });

  const events = await safeFetch(`${API_URL}/api/public/events?size=500`);
  const eventList = events?.data || events || [];
  eventList.forEach((e) => {
    if (e && (e._id || e.id)) {
      out.push({
        path: `/events/${e._id || e.id}`,
        lastmod: iso(e.updatedAt || e.createdAt),
        priority: "0.6",
        changefreq: "weekly",
      });
    }
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

async function main() {
  if (!existsSync(PUBLIC_DIR)) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const dynamic = await loadDynamic();
  const all = [...STATIC_ROUTES, ...dynamic];

  const urlset = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...all.map(urlEntry),
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

  console.log(`[sitemap] Wrote ${all.length} URLs to public/sitemap-0.xml`);
}

main().catch((err) => {
  console.error("[sitemap] Failed:", err);
  process.exit(0);
});
