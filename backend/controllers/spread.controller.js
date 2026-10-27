const CompanyModel = require("../models/company.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { isValidObjectId } = require("../utils/fn");
const { V1_PAIR_KEYS, normalizePairKey } = require("../utils/spreadPairs");
const spreadStore = require("../services/spreadStore.service");
const spreadScraper = require("../services/spreadScraper.service");

function buildBrokerSpreadResponse(broker, spreadData) {
    return {
        brokerId: String(broker._id),
        brokerName: broker.name,
        myfxbookSlug: broker.myfxbookSlug || "",
        pairs: spreadData.pairs,
        lastFetchedAt: spreadData.lastFetchedAt,
    };
}

exports.getSpreads = async (req, res) => {
    try {
        const { brokerId } = req.query;

        if (!brokerId) {
            return sendErrorResponse(res, "brokerId is required", 400, true, true);
        }
        if (!isValidObjectId(brokerId)) {
            return sendErrorResponse(res, "Broker not found", 404, true, true);
        }

        const broker = await CompanyModel.findOne({
            _id: brokerId,
            category: "Broker",
            status: "approved",
        }).lean();

        if (!broker) {
            return sendErrorResponse(res, "Broker not found", 404, true, true);
        }

        const spreadData = await spreadStore.getBrokerSpreadMap(brokerId);

        return sendSuccessResponse(res, {
            data: buildBrokerSpreadResponse(broker, spreadData),
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.getSpreadComparison = async (req, res) => {
    try {
        const brokers = await CompanyModel.find({
            category: "Broker",
            status: "approved",
        })
            .sort({ name: 1 })
            .lean();

        const brokerIds = brokers.map((b) => b._id);
        const comparisonMap = await spreadStore.getComparisonData(brokerIds);

        const data = brokers.map((broker) => {
            const id = String(broker._id);
            const spreadData = comparisonMap[id] || { pairs: {}, lastFetchedAt: null };
            return buildBrokerSpreadResponse(broker, spreadData);
        });

        return sendSuccessResponse(res, {
            data: {
                pairs: V1_PAIR_KEYS,
                brokers: data,
                lastFetchedAt: data.reduce((latest, row) => {
                    if (!row.lastFetchedAt) return latest;
                    if (!latest || new Date(row.lastFetchedAt) > new Date(latest)) {
                        return row.lastFetchedAt;
                    }
                    return latest;
                }, null),
            },
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.refreshSpreads = async (req, res) => {
    try {
        const summary = await spreadScraper.scrapeAndStore();
        return sendSuccessResponse(res, {
            message: "Spread refresh completed",
            data: summary,
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.overrideSpreads = async (req, res) => {
    try {
        const { brokerId, pairs } = req.body;

        if (!brokerId || !pairs || typeof pairs !== "object") {
            return sendErrorResponse(
                res,
                "brokerId and pairs object are required",
                400,
                true,
                true
            );
        }
        if (!isValidObjectId(brokerId)) {
            return sendErrorResponse(res, "Broker not found", 404, true, true);
        }

        const broker = await CompanyModel.findOne({
            _id: brokerId,
            category: "Broker",
        });

        if (!broker) {
            return sendErrorResponse(res, "Broker not found", 404, true, true);
        }

        const updatedPairs = {};
        for (const [pair, value] of Object.entries(pairs)) {
            if (!V1_PAIR_KEYS.includes(pair)) continue;
            const spread = Number(value);
            if (Number.isNaN(spread) || spread < 0) {
                return sendErrorResponse(res, `Invalid spread for ${pair}`, 400, true, true);
            }

            await spreadStore.upsertSpread({
                brokerId,
                pair,
                spread,
                source: "manual",
                manualOverride: true,
            });
            updatedPairs[pair] = spread;
        }

        const spreadData = await spreadStore.getBrokerSpreadMap(brokerId);

        return sendSuccessResponse(res, {
            message: "Spread overrides saved",
            data: {
                ...buildBrokerSpreadResponse(broker, spreadData),
                updatedPairs,
            },
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// PUT /api/admin/spreads/:brokerId/typical (Admin/Operator, B31)
// Body: { pairs: { "EUR/USD": { min: 0.1, max: 0.3 }, ... } } in pips.
// An empty object for a pair removes that pair.
exports.setTypicalSpreads = async (req, res) => {
    try {
        const { brokerId } = req.params;
        const pairs = req.body?.pairs;
        if (!isValidObjectId(brokerId)) return sendErrorResponse(res, "Broker not found", 404, true, true);
        if (!pairs || typeof pairs !== "object" || Array.isArray(pairs)) {
            return sendErrorResponse(res, "pairs must be an object like { \"EUR/USD\": { \"min\": 0.1, \"max\": 0.3 } }", 400, true, true);
        }
        const broker = await CompanyModel.findOne({ _id: brokerId, category: "Broker" }).select("_id").lean();
        if (!broker) return sendErrorResponse(res, "Broker not found", 404, true, true);

        // Validate everything before writing anything.
        const changes = [];
        for (const [rawPair, range] of Object.entries(pairs)) {
            const pair = normalizePairKey(rawPair);
            if (!pair) return sendErrorResponse(res, `Unknown pair ${rawPair}. Use one of: ${V1_PAIR_KEYS.join(", ")}.`, 400, true, true);
            if (!range || typeof range !== "object" || Object.keys(range).length === 0) {
                changes.push({ pair, remove: true });
                continue;
            }
            const min = Number(range.min);
            const max = Number(range.max);
            if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < min) {
                return sendErrorResponse(res, `${pair}: min and max must be numbers of 0 or more, with max at least min.`, 400, true, true);
            }
            changes.push({ pair, min, max });
        }

        for (const change of changes) {
            if (change.remove) await spreadStore.removeSpread({ brokerId, pair: change.pair });
            else await spreadStore.setTypicalRange({ brokerId, ...change });
        }

        const spreadData = await spreadStore.getBrokerSpreadMap(brokerId);
        return sendSuccessResponse(res, { message: "Typical spreads saved", data: spreadData });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};
