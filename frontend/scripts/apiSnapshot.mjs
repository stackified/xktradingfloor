// Records the API responses a page loads while it is prerendered and saves
// them into the snapshot's <head>. src/controllers/api.js answers from them
// when the live call fails. Why: Google's renderer obeys the backend's
// robots.txt (Disallow: /) and Render's free tier can take ~40 s to wake;
// either way event, company and blog pages rendered "not found" for Google
// and were reported as soft 404s.

import { API_SNAPSHOT_ID, apiSnapshotKey } from "../src/utils/apiSnapshot.js";

// Every visitor downloads the saved copy, so big answers are left out.
// shortcut: hub pages (/reviews, /live-spreads) lose their 150 KB+ company
// lists and still render empty for Google; trim those API answers to fix.
const MAX_RESPONSE_CHARS = 64 * 1024;

export function recordApi(page, apiBase) {
  const saved = new Map();
  let pending = [];
  // The app (localStorage) and Chrome (HTTP cache, 304s) both reuse earlier
  // answers; start each page clean so every call is fetched and recorded.
  page.setCacheEnabled(false);
  page.evaluateOnNewDocument(() => {
    try { localStorage.clear(); } catch {}
  });
  page.on("response", (res) => {
    const req = res.request();
    const type = res.headers()["content-type"] || "";
    if (!res.url().startsWith(apiBase) || !res.ok() || req.method() === "OPTIONS" || !type.includes("json")) return;
    pending.push(
      res
        .text()
        .then((text) => {
          if (text.length <= MAX_RESPONSE_CHARS) saved.set(apiSnapshotKey(req.method(), res.url(), req.postData()), JSON.parse(text));
        })
        .catch(() => {})
    );
  });
  return {
    reset() {
      saved.clear();
      pending = [];
    },
    // Call after the page settled and before page.content(). Returns the count.
    async embed() {
      await Promise.all(pending);
      // "<" only occurs inside JSON strings, where < is the same text;
      // it keeps "</script>" in the data from closing the tag.
      const json = JSON.stringify(Object.fromEntries(saved)).replace(/</g, "\\u003c");
      await page.evaluate(
        (id, text) => {
          document.getElementById(id)?.remove();
          const s = document.createElement("script");
          s.type = "application/json";
          s.id = id;
          s.textContent = text;
          document.head.appendChild(s);
        },
        API_SNAPSHOT_ID,
        json
      );
      return saved.size;
    },
  };
}
