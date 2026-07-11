export const V1_PAIRS = [
  { key: "EUR/USD", label: "EUR/USD", baseline: 0.8 },
  { key: "GBP/USD", label: "GBP/USD", baseline: 1.1 },
  { key: "USD/JPY", label: "USD/JPY", baseline: 0.9 },
  { key: "AUD/USD", label: "AUD/USD", baseline: 1.0 },
  { key: "XAU/USD", label: "XAU/USD (Gold)", baseline: 25 },
  { key: "XAG/USD", label: "XAG/USD (Silver)", baseline: 3.2 },
  { key: "BTC/USD", label: "BTC/USD", baseline: 32 },
  { key: "ETH/USD", label: "ETH/USD", baseline: 8 },
  { key: "US30", label: "US30", baseline: 2.5 },
  { key: "SPX500", label: "SPX500", baseline: 0.6 },
];

const BROKER_BIAS = {};
function biasFor(brokerId) {
  if (!BROKER_BIAS[brokerId]) {
    let h = 0;
    const s = String(brokerId || "unknown");
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    BROKER_BIAS[brokerId] = 0.85 + (Math.abs(h) % 40) / 100;
  }
  return BROKER_BIAS[brokerId];
}

export function mockSpreadFor(brokerId, pairKey) {
  const pair = V1_PAIRS.find((p) => p.key === pairKey);
  if (!pair) return null;
  const bias = biasFor(brokerId);
  const jitter = 0.9 + Math.random() * 0.2;
  return +(pair.baseline * bias * jitter).toFixed(pair.baseline < 5 ? 2 : 1);
}

export function mockSpreadRow(brokerId) {
  return V1_PAIRS.reduce((acc, p) => {
    acc[p.key] = mockSpreadFor(brokerId, p.key);
    return acc;
  }, {});
}

export function formatSpread(value, pairKey) {
  if (value == null) return "—";
  const pair = V1_PAIRS.find((p) => p.key === pairKey);
  const isLargeInstrument = pair && pair.baseline >= 5;
  return isLargeInstrument ? value.toFixed(1) : value.toFixed(2);
}
