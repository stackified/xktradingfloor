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
