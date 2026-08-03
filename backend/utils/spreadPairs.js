const V1_PAIRS = [
    { key: "EUR/USD", label: "EUR/USD", aliases: ["EURUSD", "EUR/USD"] },
    { key: "GBP/USD", label: "GBP/USD", aliases: ["GBPUSD", "GBP/USD"] },
    { key: "USD/JPY", label: "USD/JPY", aliases: ["USDJPY", "USD/JPY"] },
    { key: "AUD/USD", label: "AUD/USD", aliases: ["AUDUSD", "AUD/USD"] },
    { key: "XAU/USD", label: "XAU/USD (Gold)", aliases: ["XAUUSD", "XAU/USD", "GOLD"] },
    { key: "XAG/USD", label: "XAG/USD (Silver)", aliases: ["XAGUSD", "XAG/USD", "SILVER"] },
    { key: "BTC/USD", label: "BTC/USD", aliases: ["BTCUSD", "BTC/USD"] },
    { key: "ETH/USD", label: "ETH/USD", aliases: ["ETHUSD", "ETH/USD"] },
    { key: "US30", label: "US30", aliases: ["US30", "DJ30", "DOW30"] },
    { key: "SPX500", label: "SPX500", aliases: ["SPX500", "SP500", "US500"] },
];

const ALIAS_TO_PAIR = V1_PAIRS.reduce((acc, pair) => {
    pair.aliases.forEach((alias) => {
        acc[String(alias).toUpperCase().replace(/[^A-Z0-9]/g, "")] = pair.key;
    });
    acc[pair.key.toUpperCase().replace(/[^A-Z0-9]/g, "")] = pair.key;
    return acc;
}, {});

function normalizePairKey(value) {
    if (!value) return null;
    const normalized = String(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
    return ALIAS_TO_PAIR[normalized] || null;
}

function parseSpreadValue(value) {
    if (value == null || value === "") return null;
    const cleaned = String(value).replace(/[^\d.-]/g, "");
    const num = Number(cleaned);
    if (Number.isNaN(num) || num < 0) return null;
    return num;
}

module.exports = {
    V1_PAIRS,
    V1_PAIR_KEYS: V1_PAIRS.map((p) => p.key),
    normalizePairKey,
    parseSpreadValue,
    MAX_SPREAD_HISTORY: 100,
};
