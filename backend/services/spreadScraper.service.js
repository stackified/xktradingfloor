const cheerio = require("cheerio");
const CompanyModel = require("../models/company.model");
const spreadStore = require("./spreadStore.service");
const {
    V1_PAIR_KEYS,
    normalizePairKey,
    parseSpreadValue,
} = require("../utils/spreadPairs");

const FOUR_MINUTES_MS = 4 * 60 * 1000;
let cronIntervalId = null;
let scrapeInProgress = false;

const MYFXBOOK_BASE = "https://www.myfxbook.com";
const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function isCloudflareChallenge(html) {
    return /Just a moment|cf-challenge|challenge-platform/i.test(String(html || ""));
}

async function fetchHtml(url) {
    const response = await fetch(url, {
        headers: {
            "User-Agent": USER_AGENT,
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`);
    }

    return response.text();
}

async function fetchHtmlWithPlaywright(url) {
    try {
        const { chromium } = require("playwright");
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({
            userAgent: USER_AGENT,
        });
        await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
        const html = await page.content();
        await browser.close();
        return html;
    } catch (error) {
        console.warn("[spread-scraper] Playwright unavailable or failed:", error.message);
        return null;
    }
}

function parseSpreadsFromHtml(html) {
    const spreads = {};
    if (!html || isCloudflareChallenge(html)) return spreads;

    const $ = cheerio.load(html);

    $("table").each((_, table) => {
        const headers = [];
        $(table)
            .find("thead th, tr:first-child th, tr:first-child td")
            .each((__, cell) => {
                headers.push($(cell).text().trim());
            });

        const headerPairs = headers
            .map((h) => normalizePairKey(h))
            .filter(Boolean);

        if (!headerPairs.length) return;

        $(table)
            .find("tbody tr, tr")
            .each((__, row) => {
                const cells = $(row).find("td");
                if (!cells.length) return;

                cells.each((idx, cell) => {
                    const pair = headerPairs[idx] || normalizePairKey(headers[idx]);
                    if (!pair) return;
                    const value = parseSpreadValue($(cell).text());
                    if (value != null) spreads[pair] = value;
                });
            });
    });

    $("[data-symbol], [data-pair], [data-instrument]").each((_, el) => {
        const symbol =
            $(el).attr("data-symbol") ||
            $(el).attr("data-pair") ||
            $(el).attr("data-instrument");
        const pair = normalizePairKey(symbol);
        if (!pair) return;

        const value =
            parseSpreadValue($(el).attr("data-spread")) ||
            parseSpreadValue($(el).text());
        if (value != null) spreads[pair] = value;
    });

    const jsonMatches = html.match(/\{[^{}]*"(?:spread|Spread)"[^{}]*\}/g) || [];
    jsonMatches.forEach((snippet) => {
        try {
            const obj = JSON.parse(snippet);
            const pair = normalizePairKey(obj.symbol || obj.pair || obj.instrument);
            const value = parseSpreadValue(obj.spread ?? obj.Spread);
            if (pair && value != null) spreads[pair] = value;
        } catch (_) {
            // ignore partial JSON
        }
    });

    return spreads;
}

async function fetchBrokerSpreads(slug) {
    if (!slug) return {};

    const url = `${MYFXBOOK_BASE}/forex-broker-spreads/${slug}/1`;
    let html = await fetchHtml(url).catch((err) => {
        console.warn(`[spread-scraper] fetch failed for ${slug}:`, err.message);
        return "";
    });

    let spreads = parseSpreadsFromHtml(html);

    if (!Object.keys(spreads).length && isCloudflareChallenge(html)) {
        html = await fetchHtmlWithPlaywright(url);
        spreads = parseSpreadsFromHtml(html);
    }

    return spreads;
}

async function fetchComparisonSpreads() {
    const url = `${MYFXBOOK_BASE}/forex-broker-spreads`;
    let html = await fetchHtml(url).catch((err) => {
        console.warn("[spread-scraper] comparison fetch failed:", err.message);
        return "";
    });

    if (isCloudflareChallenge(html)) {
        html = await fetchHtmlWithPlaywright(url);
    }

    return parseComparisonTable(html);
}

function parseComparisonTable(html) {
    const result = {};
    if (!html || isCloudflareChallenge(html)) return result;

    const $ = cheerio.load(html);
    const tables = $("table");

    tables.each((_, table) => {
        const headerCells = $(table).find("thead th, tr").first().find("th, td");
        const headers = [];
        headerCells.each((__, cell) => {
            headers.push($(cell).text().trim());
        });

        const pairColumns = headers
            .map((header, index) => ({ index, pair: normalizePairKey(header) }))
            .filter((col) => col.pair);

        if (!pairColumns.length) return;

        $(table)
            .find("tbody tr, tr")
            .slice(1)
            .each((__, row) => {
                const cells = $(row).find("td, th");
                if (!cells.length) return;

                const brokerCell = $(cells.get(0));
                const brokerLink = brokerCell.find("a").attr("href") || "";
                const slugMatch = brokerLink.match(/forex-broker-spreads\/([^/]+)/i);
                const slug = slugMatch?.[1]?.toLowerCase();
                if (!slug) return;

                const spreads = {};
                pairColumns.forEach(({ index, pair }) => {
                    const value = parseSpreadValue($(cells.get(index)).text());
                    if (value != null) spreads[pair] = value;
                });

                if (Object.keys(spreads).length) {
                    result[slug] = spreads;
                }
            });
    });

    return result;
}

function filterToV1Pairs(spreads = {}) {
    const filtered = {};
    V1_PAIR_KEYS.forEach((pair) => {
        if (spreads[pair] != null) filtered[pair] = spreads[pair];
    });
    return filtered;
}

async function scrapeAndStore() {
    if (scrapeInProgress) {
        return { skipped: true, reason: "Scrape already in progress" };
    }

    scrapeInProgress = true;
    const summary = {
        brokersProcessed: 0,
        pairsUpserted: 0,
        errors: [],
        usedComparison: false,
    };

    try {
        const brokers = await CompanyModel.find({
            category: "Broker",
            status: "approved",
        })
            .select("_id name myfxbookSlug")
            .lean();

        let comparisonBySlug = {};
        try {
            comparisonBySlug = await fetchComparisonSpreads();
            summary.usedComparison = Object.keys(comparisonBySlug).length > 0;
        } catch (error) {
            summary.errors.push(`comparison page: ${error.message}`);
        }

        for (const broker of brokers) {
            try {
                const slug = String(broker.myfxbookSlug || "").trim().toLowerCase();
                let spreads = slug && comparisonBySlug[slug]
                    ? comparisonBySlug[slug]
                    : {};

                if (!Object.keys(spreads).length && slug) {
                    spreads = await fetchBrokerSpreads(slug);
                }

                spreads = filterToV1Pairs(spreads);
                if (!Object.keys(spreads).length) continue;

                summary.brokersProcessed += 1;

                for (const [pair, spread] of Object.entries(spreads)) {
                    await spreadStore.upsertSpread({
                        brokerId: broker._id,
                        pair,
                        spread,
                        source: "myfxbook",
                        manualOverride: false,
                    });
                    summary.pairsUpserted += 1;
                }
            } catch (error) {
                summary.errors.push(`${broker.name}: ${error.message}`);
            }
        }
    } catch (error) {
        summary.errors.push(error.message);
    } finally {
        scrapeInProgress = false;
    }

    return summary;
}

function startSpreadCron() {
    if (process.env.SPREAD_CRON_ENABLED === "false") {
        console.log("[spread-cron] Disabled via SPREAD_CRON_ENABLED=false");
        return;
    }

    const run = async () => {
        try {
            const summary = await scrapeAndStore();
            if (summary.skipped) return;
            console.log(
                `[spread-cron] brokers=${summary.brokersProcessed} pairs=${summary.pairsUpserted} errors=${summary.errors.length}`
            );
        } catch (error) {
            console.error("[spread-cron] failed:", error.message);
        }
    };

    setTimeout(run, 15000);
    cronIntervalId = setInterval(run, FOUR_MINUTES_MS);
    console.log("[spread-cron] Scheduled every 4 minutes");
}

module.exports = {
    scrapeAndStore,
    startSpreadCron,
    fetchBrokerSpreads,
    fetchComparisonSpreads,
    filterToV1Pairs,
};
