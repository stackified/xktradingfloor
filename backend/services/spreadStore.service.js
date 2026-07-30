const SpreadModel = require("../models/spread.model");
const { MAX_SPREAD_HISTORY } = require("../utils/spreadPairs");

function capHistory(history = []) {
    if (history.length <= MAX_SPREAD_HISTORY) return history;
    return history.slice(history.length - MAX_SPREAD_HISTORY);
}

function mapSpreadRow(row) {
    const prev = row.spreadHistory?.length > 1
        ? row.spreadHistory[row.spreadHistory.length - 2]?.spread
        : null;
    return {
        spread: row.spread,
        previousSpread: prev,
        source: row.source,
        manualOverride: row.manualOverride,
    };
}

async function upsertSpread({ brokerId, pair, spread, source = "myfxbook", manualOverride = false }) {
    const existing = await SpreadModel.findOne({ brokerId, pair });
    const now = new Date();
    const historyEntry = { spread, fetchedAt: now };

    if (!existing) {
        return SpreadModel.create({
            brokerId,
            pair,
            spread,
            spreadHistory: [historyEntry],
            source,
            manualOverride,
            lastFetchedAt: now,
        });
    }

    if (existing.manualOverride && !manualOverride && source === "myfxbook") {
        return existing;
    }

    const previousSpread = existing.spread;
    existing.spread = spread;
    existing.source = source;
    existing.manualOverride = manualOverride;
    existing.lastFetchedAt = now;
    existing.spreadHistory = capHistory([...(existing.spreadHistory || []), historyEntry]);
    await existing.save();

    return { doc: existing, previousSpread };
}

async function getBrokerSpreadMap(brokerId) {
    const rows = await SpreadModel.find({ brokerId }).lean();
    const pairs = {};
    let lastFetchedAt = null;

    rows.forEach((row) => {
        pairs[row.pair] = mapSpreadRow(row);
        if (!lastFetchedAt || new Date(row.lastFetchedAt) > new Date(lastFetchedAt)) {
            lastFetchedAt = row.lastFetchedAt;
        }
    });

    return { pairs, lastFetchedAt };
}

async function getComparisonData(brokerIds = null) {
    const query = brokerIds?.length ? { brokerId: { $in: brokerIds } } : {};
    const rows = await SpreadModel.find(query).lean();

    const byBroker = {};
    rows.forEach((row) => {
        const id = String(row.brokerId);
        if (!byBroker[id]) {
            byBroker[id] = { pairs: {}, lastFetchedAt: null };
        }
        byBroker[id].pairs[row.pair] = mapSpreadRow(row);
        if (!byBroker[id].lastFetchedAt || new Date(row.lastFetchedAt) > new Date(byBroker[id].lastFetchedAt)) {
            byBroker[id].lastFetchedAt = row.lastFetchedAt;
        }
    });

    return byBroker;
}

module.exports = {
    upsertSpread,
    getBrokerSpreadMap,
    getComparisonData,
};
