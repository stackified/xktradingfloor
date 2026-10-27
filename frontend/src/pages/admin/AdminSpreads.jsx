import React from "react";
import { m as motion } from "framer-motion";
import { RefreshCw, Save, AlertCircle, CheckCircle2, X } from "lucide-react";
import { getAllCompanies } from "../../controllers/companiesController.js";
import {
  getSpreadComparison,
  refreshSpreads,
  overrideSpreads,
  setTypicalSpreads,
  spreadsToRow,
  spreadsToRanges,
} from "../../controllers/spreadsController.js";
import { V1_PAIRS, formatSpread } from "../../utils/spreads.js";
import CardLoader from "../../components/shared/CardLoader.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";

// A cell holds one number (an exact override) or a typical range "0.1-0.3"
// (B31). An empty cell that had a range removes it.
const RANGE_RE = /^\s*(\d*\.?\d+)\s*[-–]\s*(\d*\.?\d+)\s*$/;

// Rows for editing: ranges shown as "min-max", other pairs as the number.
function spreadsToEditRow(pairs = {}) {
  const row = spreadsToRow(pairs);
  Object.entries(spreadsToRanges(pairs)).forEach(([pair, r]) => {
    row[pair] = `${r.min}-${r.max}`;
  });
  return row;
}

// Row state helper — we track edits per-broker per-pair and only send fields
// the admin actually changed.
function buildInitialEdits(brokers, rows) {
  const map = {};
  brokers.forEach((b) => {
    const id = b._id || b.id;
    map[id] = { ...(rows[id] || {}) };
  });
  return map;
}

export default function AdminSpreads() {
  const toast = useToast();
  const [brokers, setBrokers] = React.useState([]);
  const [rows, setRows] = React.useState({});
  const [edits, setEdits] = React.useState({});
  const [dirty, setDirty] = React.useState({}); // { brokerId: Set(pair) }
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState({}); // { brokerId: bool }
  const [lastFetchedAt, setLastFetchedAt] = React.useState(null);
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [brokersRes, spreadsRes] = await Promise.all([
        getAllCompanies({ category: "Broker", size: 200 }),
        getSpreadComparison(),
      ]);
      const brokerList = (brokersRes.data || []).filter(
        (b) => b.status === "approved" || !b.status
      );
      setBrokers(brokerList);

      const spreadMap = {};
      (spreadsRes.data?.brokers || []).forEach((entry) => {
        spreadMap[entry.brokerId] = spreadsToEditRow(entry.pairs || {});
      });
      setRows(spreadMap);
      setEdits(buildInitialEdits(brokerList, spreadMap));
      setDirty({});
      setLastFetchedAt(spreadsRes.data?.lastFetchedAt || null);
    } catch (err) {
      console.error("Failed to load spreads admin:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load spreads");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError("");
    try {
      const result = await refreshSpreads();
      toast?.success?.(result?.message || "Spread refresh completed");
      await load();
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Refresh failed";
      setError(msg);
      toast?.error?.(msg);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditChange = (brokerId, pair, value) => {
    setEdits((prev) => ({
      ...prev,
      [brokerId]: { ...(prev[brokerId] || {}), [pair]: value },
    }));
    setDirty((prev) => {
      const next = { ...prev };
      next[brokerId] = new Set(next[brokerId] || []);
      next[brokerId].add(pair);
      return next;
    });
  };

  const handleSaveRow = async (brokerId) => {
    const dirtyPairs = Array.from(dirty[brokerId] || []);
    if (dirtyPairs.length === 0) return;

    // Split changed pairs into exact overrides and typical ranges.
    const pairsPayload = {};
    const rangesPayload = {};
    const savedRow = {};
    for (const pair of dirtyPairs) {
      const raw = String(edits[brokerId]?.[pair] ?? "").trim();
      const hadRange = RANGE_RE.test(String(rows[brokerId]?.[pair] ?? ""));
      const range = raw.match(RANGE_RE);
      if (range) {
        const min = Number(range[1]);
        const max = Number(range[2]);
        if (max < min) {
          toast?.error?.(`${pair}: the second number of a range must be the larger one.`);
          return;
        }
        rangesPayload[pair] = { min, max };
        savedRow[pair] = `${min}-${max}`;
        continue;
      }
      if (raw === "" && hadRange) {
        rangesPayload[pair] = {};
        savedRow[pair] = undefined;
        continue;
      }
      const num = Number(raw);
      if (raw === "" || Number.isNaN(num) || num < 0) {
        toast?.error?.(`Invalid value for ${pair}. Enter a number, or a range like 0.1-0.3.`);
        return;
      }
      pairsPayload[pair] = num;
      savedRow[pair] = num;
    }

    setSaving((prev) => ({ ...prev, [brokerId]: true }));
    try {
      if (Object.keys(pairsPayload).length) await overrideSpreads(brokerId, pairsPayload);
      if (Object.keys(rangesPayload).length) await setTypicalSpreads(brokerId, rangesPayload);
      toast?.success?.("Spreads saved");
      // Merge saved values back into the visible row + clear dirty state.
      setRows((prev) => ({
        ...prev,
        [brokerId]: { ...(prev[brokerId] || {}), ...savedRow },
      }));
      setDirty((prev) => {
        const next = { ...prev };
        delete next[brokerId];
        return next;
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Save failed";
      toast?.error?.(msg);
    } finally {
      setSaving((prev) => ({ ...prev, [brokerId]: false }));
    }
  };

  const handleDiscardRow = (brokerId) => {
    setEdits((prev) => ({ ...prev, [brokerId]: { ...(rows[brokerId] || {}) } }));
    setDirty((prev) => {
      const next = { ...prev };
      delete next[brokerId];
      return next;
    });
  };

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Live Spreads</h1>
            <p className="text-sm text-gray-400 mt-1">
              Trigger a manual scrape, or override specific pair spreads for any
              broker. Enter one number for an exact spread, or a typical range
              such as 0.1-0.3 (shown on the site as &ldquo;0.10–0.30&rdquo;; clear the
              cell to remove a range). Neither is replaced by the auto-scraper.
            </p>
            {lastFetchedAt && (
              <p className="text-xs text-gray-500 mt-2">
                Last scrape: {new Date(lastFetchedAt).toLocaleString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing…" : "Refresh Now"}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {loading ? (
          <CardLoader count={4} />
        ) : brokers.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12 text-gray-400">
              No brokers found. Add a broker in Companies first.
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/80 sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-300 min-w-[180px]">
                        Broker
                      </th>
                      {V1_PAIRS.map((p) => (
                        <th
                          key={p.key}
                          className="text-right py-3 px-2 font-semibold text-gray-400 uppercase text-xs whitespace-nowrap"
                        >
                          {p.key}
                        </th>
                      ))}
                      <th className="text-right py-3 px-4 font-semibold text-gray-400 text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {brokers.map((broker) => {
                      const id = broker._id || broker.id;
                      const isDirty = Boolean(dirty[id]?.size);
                      const isSaving = Boolean(saving[id]);
                      const missingSlug = !broker.myfxbookSlug;
                      return (
                        <tr key={id} className="hover:bg-gray-900/40">
                          <td className="py-3 px-4">
                            <div className="text-white font-medium">
                              {broker.name}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {broker.myfxbookSlug ? (
                                <span>slug: {broker.myfxbookSlug}</span>
                              ) : (
                                <span className="text-yellow-400 inline-flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  No myfxbookSlug — scraper will skip
                                </span>
                              )}
                            </div>
                          </td>
                          {V1_PAIRS.map((p) => {
                            const editVal = edits[id]?.[p.key];
                            const savedVal = rows[id]?.[p.key];
                            const cellDirty = dirty[id]?.has(p.key);
                            return (
                              <td key={p.key} className="py-2 px-2 text-right">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  aria-label={`${broker.name} ${p.key} spread`}
                                  value={editVal == null ? "" : editVal}
                                  placeholder={
                                    typeof savedVal === "number"
                                      ? formatSpread(savedVal, p.key)
                                      : savedVal || "—"
                                  }
                                  onChange={(e) =>
                                    handleEditChange(id, p.key, e.target.value)
                                  }
                                  className={`w-24 text-right rounded-md bg-gray-900/70 border px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-500 ${
                                    cellDirty
                                      ? "border-yellow-500/50 text-yellow-200"
                                      : "border-gray-700"
                                  }`}
                                />
                              </td>
                            );
                          })}
                          <td className="py-2 px-4 text-right whitespace-nowrap">
                            {isDirty ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveRow(id)}
                                  disabled={isSaving}
                                  className="inline-flex items-center gap-1 rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-50 px-2.5 py-1.5 text-xs font-medium"
                                  aria-label={`Save overrides for ${broker.name}`}
                                >
                                  <Save className="h-3 w-3" />
                                  {isSaving ? "Saving…" : "Save"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDiscardRow(id)}
                                  disabled={isSaving}
                                  className="inline-flex items-center rounded-md border border-gray-700 hover:border-gray-500 px-2 py-1.5 text-xs text-gray-300"
                                  aria-label={`Discard changes for ${broker.name}`}
                                  title="Discard changes"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : missingSlug ? (
                              <span className="text-[11px] text-yellow-400/70 italic">
                                override only
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                                <CheckCircle2 className="h-3 w-3 text-gray-600" />
                                synced
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t border-gray-800 text-center">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-gray-500"
                >
                  Overrides are flagged as <code>manualOverride: true</code> so
                  the 4-min auto-scrape won't overwrite them.
                </motion.p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
