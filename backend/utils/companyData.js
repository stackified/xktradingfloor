const { LICENCE_TIERS } = require("./trustScore");

// Structured company data: prop-firm challenges (B21), broker details (B22)
// and the TrustScore inputs (B32). In the admin multipart form, arrays and
// objects arrive as JSON strings.

class CompanyInputError extends Error {}

function parseJson(value, fallback) {
    if (value === undefined) return undefined;
    if (value === null || value === "") return fallback;
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        } catch (_) {
            throw new CompanyInputError("Some structured data could not be read. Check the JSON fields.");
        }
    }
    return value;
}

const text = (value, max = 200) => String(value ?? "").trim().slice(0, max);
const num = (value, label, { min = 0, max = Infinity } = {}) => {
    if (value === undefined || value === null || value === "") return undefined;
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max) {
        throw new CompanyInputError(`${label} must be a number${Number.isFinite(max) ? ` from ${min} to ${max}` : ` of ${min} or more`}.`);
    }
    return n;
};
const date = (value, label) => {
    if (value === undefined || value === null || value === "") return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new CompanyInputError(`${label} must be a date.`);
    return d;
};
const list = (value, max = 50, maxLen = 120) => {
    const parsed = parseJson(value, []);
    if (parsed === undefined) return undefined;
    const arr = Array.isArray(parsed) ? parsed : String(parsed).split(",");
    return arr.map((v) => text(v, maxLen)).filter(Boolean).slice(0, max);
};
const array = (value, label, max) => {
    const parsed = parseJson(value, []);
    if (parsed === undefined) return undefined;
    if (!Array.isArray(parsed)) throw new CompanyInputError(`${label} must be a list.`);
    if (parsed.length > max) throw new CompanyInputError(`${label}: at most ${max} entries.`);
    return parsed;
};

const DRAWDOWN_TYPES = ["static", "trailing", "eod-trailing"];

function readChallenges(value) {
    const items = array(value, "Challenges", 40);
    if (items === undefined) return undefined;
    return items.map((c, i) => {
        const name = text(c?.name, 120);
        if (!name) throw new CompanyInputError(`Challenge ${i + 1} needs a name.`);
        const drawdownType = text(c.drawdownType, 20);
        if (drawdownType && !DRAWDOWN_TYPES.includes(drawdownType)) {
            throw new CompanyInputError(`Drawdown type must be one of: ${DRAWDOWN_TYPES.join(", ")}.`);
        }
        const phases = (Array.isArray(c.phases) ? c.phases : []).slice(0, 5).map((p) => ({
            profitTarget: num(p?.profitTarget, "Profit target", { max: 100 }),
            dailyDrawdown: num(p?.dailyDrawdown, "Daily drawdown", { max: 100 }),
            maxDrawdown: num(p?.maxDrawdown, "Max drawdown", { max: 100 }),
            minTradingDays: num(p?.minTradingDays, "Minimum trading days", { max: 365 }),
        }));
        return {
            name,
            accountSize: num(c.accountSize, "Account size"),
            currency: text(c.currency || "USD", 3).toUpperCase(),
            price: num(c.price, "Price"),
            phases,
            drawdownType: drawdownType || undefined,
            profitSplit: num(c.profitSplit, "Profit split", { max: 100 }),
            payoutFrequency: text(c.payoutFrequency, 60),
            refundableFee: c.refundableFee === true || c.refundableFee === "true",
            platforms: list(c.platforms, 10, 40) || [],
        };
    });
}

function readLicences(value) {
    const items = array(value, "Licences", 20);
    if (items === undefined) return undefined;
    return items.map((l, i) => {
        const regulator = text(l?.regulator, 80);
        if (!regulator) throw new CompanyInputError(`Licence ${i + 1} needs a regulator.`);
        const tier = text(l.tier, 30);
        if (tier && !LICENCE_TIERS.includes(tier)) {
            throw new CompanyInputError(`Licence tier must be one of: ${LICENCE_TIERS.join(", ")}.`);
        }
        const registerUrl = text(l.registerUrl, 500);
        if (registerUrl && !/^https?:\/\//i.test(registerUrl)) {
            throw new CompanyInputError("The register link must start with http:// or https://.");
        }
        return {
            regulator,
            // "FSC" and "FSA" exist in several countries, so the country is
            // always stored with the licence (Sahil, 9 Oct).
            country: text(l.country, 80),
            tier: tier || "unverified",
            licenceNumber: text(l.licenceNumber, 80),
            entity: text(l.entity, 160),
            registerUrl,
            checkedAt: date(l.checkedAt, "Licence checked date"),
        };
    });
}

function readAccountTypes(value) {
    const items = array(value, "Account types", 20);
    if (items === undefined) return undefined;
    return items.map((a, i) => {
        const name = text(a?.name, 80);
        if (!name) throw new CompanyInputError(`Account type ${i + 1} needs a name.`);
        return {
            name,
            minDeposit: num(a.minDeposit, "Minimum deposit"),
            spreadFrom: num(a.spreadFrom, "Spread from"),
            commission: text(a.commission, 80),
        };
    });
}

// Admin-only 1-5 scores (B32); null clears one.
function readScoreInputs(value, current = {}) {
    const parsed = parseJson(value, {});
    if (parsed === undefined) return undefined;
    if (typeof parsed !== "object" || Array.isArray(parsed)) throw new CompanyInputError("Scores must be an object.");
    const out = { ...current };
    for (const key of ["payouts", "tradingConditions", "rules", "background"]) {
        if (!(key in parsed)) continue;
        if (parsed[key] === null || parsed[key] === "") {
            delete out[key];
            continue;
        }
        const n = Number(parsed[key]);
        if (!Number.isFinite(n) || n < 1 || n > 5) throw new CompanyInputError(`The ${key} score must be from 1 to 5.`);
        out[key] = n;
    }
    out.updatedAt = new Date();
    return out;
}

// Reads every structured field present in the body. Returns only those keys.
function readCompanyData(body = {}, existing = {}) {
    const out = {};
    const set = (key, value) => {
        if (value !== undefined) out[key] = value;
    };
    set("challenges", readChallenges(body.challenges));
    set("scalingPlan", body.scalingPlan !== undefined ? text(body.scalingPlan, 1000) : undefined);
    set("restrictedCountries", list(body.restrictedCountries, 250, 80));
    set("payoutMethods", list(body.payoutMethods, 30, 80));
    set("licences", readLicences(body.licences));
    set("maxLeverage", body.maxLeverage !== undefined ? text(body.maxLeverage, 120) : undefined);
    set("accountTypes", readAccountTypes(body.accountTypes));
    set("depositMethods", list(body.depositMethods, 30, 80));
    set("withdrawalMethods", list(body.withdrawalMethods, 30, 80));
    set("pros", list(body.pros, 20, 300));
    set("cons", list(body.cons, 20, 300));
    set("dataCheckedAt", body.dataCheckedAt === "" ? null : date(body.dataCheckedAt, "Details checked date"));
    if (body.trusted !== undefined) out.trusted = body.trusted === true || body.trusted === "true";
    const currentInputs = existing.scoreInputs?.toObject?.() || existing.scoreInputs || {};
    set("scoreInputs", readScoreInputs(body.scoreInputs, currentInputs));
    return out;
}

// Fields only an Admin may set (they move rankings).
const ADMIN_ONLY_FIELDS = ["trusted", "scoreInputs"];

module.exports = { CompanyInputError, readCompanyData, ADMIN_ONLY_FIELDS };
