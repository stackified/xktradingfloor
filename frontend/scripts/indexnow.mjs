// Tell Bing (and the other IndexNow engines: Yandex, Seznam, Naver) about every
// URL in the sitemap, right after a production deploy. Bing found almost none
// of the site on its own, and ChatGPT search and Copilot answer from Bing's
// index. https://www.indexnow.org/documentation
//
// The key is the one already published at /<key>.txt (public/). Run after the
// build, from frontend/:  node scripts/indexnow.mjs
// Never fails the deploy: a rejected or unreachable ping is only logged.

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = "xktradingfloor.com";
const KEY = "224cee59c270467d8d135c1838ca6b7c";
const SITEMAP = path.resolve(__dirname, "../docs/sitemap-0.xml");

const log = (...a) => console.log("indexnow:", ...a);

if (!existsSync(SITEMAP)) {
  log("no docs/sitemap-0.xml, skipped");
  process.exit(0);
}

const urls = [...readFileSync(SITEMAP, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1].trim())
  .filter((u) => u.startsWith(`https://${HOST}/`));

if (!urls.length) {
  log("sitemap has no URLs, skipped");
  process.exit(0);
}

try {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `https://${HOST}/${KEY}.txt`,
      urlList: urls,
    }),
  });
  // 200/202 = accepted. 403 = key not found at keyLocation, 422 = URLs don't
  // match the host, 429 = too many submissions.
  log(`submitted ${urls.length} URLs: HTTP ${res.status}`);
} catch (err) {
  log("request failed:", err.message);
}
