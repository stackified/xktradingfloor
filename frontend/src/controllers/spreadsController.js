import api from "./api.js";

export async function getBrokerSpreads(brokerId) {
  const response = await api.get("/spreads", { params: { brokerId } });
  if (response.data?.success && response.data?.data) {
    return { data: response.data.data };
  }
  return { data: null };
}

export async function getSpreadComparison() {
  const response = await api.get("/spreads/comparison");
  if (response.data?.success && response.data?.data) {
    return { data: response.data.data };
  }
  return { data: { pairs: [], brokers: [], lastFetchedAt: null } };
}

export function spreadsToRow(pairs = {}) {
  const row = {};
  Object.entries(pairs).forEach(([pair, value]) => {
    row[pair] = typeof value === "object" ? value.spread : value;
  });
  return row;
}

// Admin-only: force a fresh scrape run right now. Returns the scraper's
// per-broker summary. Requires an authenticated admin/operator session.
export async function refreshSpreads() {
  const response = await api.post("/admin/spreads/refresh");
  return response.data;
}

// Admin-only: manually set one or more pair spreads for a broker. Body:
// { brokerId, pairs: { "EUR/USD": 0.8, ... } }. Overrides are flagged as
// manual so the auto-scrape doesn't stomp on them.
export async function overrideSpreads(brokerId, pairs) {
  const response = await api.put("/admin/spreads/override", {
    brokerId,
    pairs,
  });
  return response.data;
}
