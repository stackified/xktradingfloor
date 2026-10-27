// TrustScore (B32): Sahil's factors and weights (9 Oct 2026). All the numbers
// live here so they're easy to change. The breakdown is never shown on the
// site, only the 0-100 total.

const WEIGHTS = {
    Broker: { licence: 35, reviews: 25, payouts: 20, tradingConditions: 15, platforms: 5 },
    PropFirm: { reviews: 30, payouts: 30, rules: 20, background: 15, platforms: 5 },
};

// Share of the licence weight for the best licence tier a broker holds.
const LICENCE_TIER_VALUE = {
    strong: 1,
    established: 0.75,
    offshore: 0.4,
    limited_or_unverified: 0.15,
    unverified: 0,
};
const LICENCE_TIERS = Object.keys(LICENCE_TIER_VALUE);

// Platform families: MetaTrader (MT4 or MT5 count once), cTrader,
// TradeLocker, and the company's own web or app platform. Three or more
// families earn the full platforms weight.
const PLATFORM_FAMILIES_FOR_FULL = 3;
function platformFamilies(platforms = [], companyName = "") {
    const families = new Set();
    const name = String(companyName || "").trim().toLowerCase();
    for (const raw of platforms) {
        const p = String(raw || "").trim().toLowerCase();
        if (!p) continue;
        if (/\bmt[45]\b|metatrader/.test(p)) families.add("metatrader");
        else if (/ctrader/.test(p)) families.add("ctrader");
        else if (/tradelocker/.test(p)) families.add("tradelocker");
        else if (/web\s*trader|webtrader|own|proprietary|\bapp\b|mobile/.test(p) || (name && p.includes(name))) families.add("own");
    }
    return families.size;
}

const part = (weight, fraction) => weight * Math.max(0, Math.min(1, fraction));
const adminPart = (weight, score) => (Number.isFinite(score) && score >= 1 ? part(weight, score / 5) : 0);

// 0-100, or null until the XK team has checked the company: a licence for a
// broker, at least one 1-5 score for a prop firm. Missing factors count as
// zero, so a score from reviews and platforms alone read "3/100, Poor"; until
// then the site shows the review score (rating x 20) instead (Lavesh, 27 Oct).
function computeTrustScore(company) {
    const category = company.category;
    const rating = Number(company.ratingsAggregate) || 0;
    const reviews = Number(company.totalReviews) || 0;
    const inputs = company.scoreInputs || {};

    // Crypto: reviews only for now (Sahil, 9 Oct): rating x 20.
    if (category === "Crypto" || !WEIGHTS[category]) {
        return reviews > 0 ? Math.round(rating * 20) : null;
    }

    const w = WEIGHTS[category];
    const familyCount = platformFamilies(company.platforms, company.name);
    let score = 0;
    let checked = false;

    if (reviews > 0) score += part(w.reviews, rating / 5);
    if (familyCount > 0) score += part(w.platforms, familyCount / PLATFORM_FAMILIES_FOR_FULL);

    if (category === "Broker") {
        const tiers = (company.licences || []).map((l) => LICENCE_TIER_VALUE[l?.tier]).filter((v) => v !== undefined);
        if (tiers.length) {
            score += part(w.licence, Math.max(...tiers));
            checked = true;
        }
        for (const key of ["payouts", "tradingConditions"]) {
            score += adminPart(w[key], inputs[key]);
        }
    } else {
        for (const key of ["payouts", "rules", "background"]) {
            if (Number.isFinite(inputs[key])) checked = true;
            score += adminPart(w[key], inputs[key]);
        }
    }

    return checked ? Math.round(score) : null;
}

module.exports = { WEIGHTS, LICENCE_TIER_VALUE, LICENCE_TIERS, computeTrustScore, platformFamilies };
