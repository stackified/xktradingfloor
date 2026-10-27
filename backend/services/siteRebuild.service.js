// Rebuild the public site after content changes (B25).
//
// Every public page, the sitemap and llms.txt are pre-built from the API when
// the frontend deploys. Without this, a newly published post only reaches
// Google and AI crawlers at the next release. Here a content change asks
// GitHub to run the deploy workflow (repository_dispatch "content-published",
// already wired in deploy.yml), which rebuilds, uploads, pings IndexNow and
// purges Cloudflare.
//
// A burst of edits sends one request: the first change starts a short wait,
// and requests are at least 10 minutes apart. A failure never affects the
// save that triggered it. Without GITHUB_DISPATCH_TOKEN it does nothing.

const DISPATCH_URL = "https://api.github.com/repos/stackified/xktradingfloor/dispatches";
const MIN_GAP_MS = 10 * 60 * 1000;
const SETTLE_MS = 60 * 1000;

let lastSentAt = 0;
let timer = null;
const reasons = new Set();

async function send() {
    timer = null;
    const token = process.env.GITHUB_DISPATCH_TOKEN;
    const why = [...reasons].join(", ");
    reasons.clear();
    if (!token) return;
    lastSentAt = Date.now();
    try {
        const res = await fetch(DISPATCH_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ event_type: "content-published", client_payload: { reason: why } }),
        });
        if (!res.ok) console.error(`[site-rebuild] GitHub answered ${res.status}`);
        else console.log(`[site-rebuild] requested (${why})`);
    } catch (error) {
        console.error("[site-rebuild] request failed:", error.message);
    }
}

// Ask for a rebuild; `reason` is a short label like "blog published".
function requestSiteRebuild(reason = "content changed") {
    if (!process.env.GITHUB_DISPATCH_TOKEN) return;
    reasons.add(reason);
    if (timer) return;
    const wait = Math.max(SETTLE_MS, lastSentAt + MIN_GAP_MS - Date.now());
    timer = setTimeout(send, wait);
    if (timer.unref) timer.unref();
}

module.exports = { requestSiteRebuild, _send: send };
