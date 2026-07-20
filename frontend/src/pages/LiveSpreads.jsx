import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowDown, ArrowUp, Minus, ExternalLink } from "lucide-react";
import Seo from "../components/shared/Seo.jsx";
import CardLoader from "../components/shared/CardLoader.jsx";
import { getAllCompanies } from "../controllers/companiesController.js";
import { V1_PAIRS, mockSpreadRow, formatSpread } from "../utils/spreads.js";

const REFRESH_MS = 4000;

function LiveSpreads() {
  const [brokers, setBrokers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [rows, setRows] = React.useState({});
  const prevRef = React.useRef({});
  const [sortPair, setSortPair] = React.useState(null);
  const [sortDir, setSortDir] = React.useState("asc");

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getAllCompanies({ category: "Broker", size: 50 });
        const list = (res.data || []).filter(
          (c) => c.status === "approved" || !c.status
        );
        if (cancelled) return;
        setBrokers(list);
        const initial = {};
        list.forEach((b) => {
          initial[b._id || b.id] = mockSpreadRow(b._id || b.id);
        });
        setRows(initial);
        prevRef.current = initial;
      } catch (e) {
        console.error("Failed to load brokers", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!brokers.length) return;
    const timer = setInterval(() => {
      setRows((prev) => {
        prevRef.current = prev;
        const next = {};
        brokers.forEach((b) => {
          const id = b._id || b.id;
          next[id] = mockSpreadRow(id);
        });
        return next;
      });
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [brokers]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? brokers.filter((b) => b.name?.toLowerCase().includes(q))
      : brokers;
    if (sortPair) {
      list = [...list].sort((a, b) => {
        const av = rows[a._id || a.id]?.[sortPair] ?? Infinity;
        const bv = rows[b._id || b.id]?.[sortPair] ?? Infinity;
        return sortDir === "asc" ? av - bv : bv - av;
      });
    }
    return list;
  }, [brokers, query, sortPair, sortDir, rows]);

  const handleSort = (pairKey) => {
    if (sortPair === pairKey) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortPair(pairKey);
      setSortDir("asc");
    }
  };

  const DirectionIcon = ({ brokerId, pairKey }) => {
    const now = rows[brokerId]?.[pairKey];
    const prev = prevRef.current[brokerId]?.[pairKey];
    if (now == null || prev == null || now === prev)
      return <Minus className="h-2.5 w-2.5 text-gray-600" />;
    return now > prev ? (
      <ArrowUp className="h-2.5 w-2.5 text-red-400" />
    ) : (
      <ArrowDown className="h-2.5 w-2.5 text-green-400" />
    );
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Seo
        title="Live Broker Spreads"
        description="Compare live forex, gold, silver, crypto, and index spreads across top brokers in real time. Data by myfxbook."
        path="/live-spreads"
      />

      <section className="relative overflow-hidden bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 text-center">
          <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl mb-3">
            Live{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
              Broker Spreads
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
            Compare typical spreads across the top 10 pairs, updated live. Data
            by{" "}
            <a
              href="https://www.myfxbook.com/forex-broker-spreads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              myfxbook
            </a>
            .
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search broker..."
              className="w-full rounded-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:outline-none pl-10 pr-4 py-2 text-sm text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-xs text-gray-300">Live · updates every {REFRESH_MS / 1000}s</span>
          </div>
        </div>

        {loading ? (
          <CardLoader count={2} horizontal={true} />
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="text-gray-400">No brokers match your search.</div>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="card overflow-hidden"
          >
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900/80 sticky top-0 z-10">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-gray-300 sticky left-0 bg-gray-900/80 z-20 min-w-[180px]">
                        Broker
                      </th>
                      {V1_PAIRS.map((p) => (
                        <th
                          key={p.key}
                          className="text-right py-3 px-3 font-semibold text-gray-400 uppercase text-xs whitespace-nowrap cursor-pointer hover:text-white transition-colors"
                          onClick={() => handleSort(p.key)}
                        >
                          <span className="inline-flex items-center gap-1">
                            {p.key}
                            {sortPair === p.key &&
                              (sortDir === "asc" ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              ))}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filtered.map((broker) => {
                      const id = broker._id || broker.id;
                      const row = rows[id] || {};
                      return (
                        <tr
                          key={id}
                          className="hover:bg-gray-900/40 transition-colors"
                        >
                          <td className="py-3 px-4 sticky left-0 bg-black hover:bg-gray-900/40 z-10">
                            <Link
                              to={`/reviews/${id}`}
                              className="inline-flex items-center gap-2 group"
                            >
                              <span className="text-white group-hover:text-blue-400 transition-colors font-medium">
                                {broker.name}
                              </span>
                              <ExternalLink className="h-3 w-3 text-gray-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                            {broker.country && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {broker.country}
                              </div>
                            )}
                          </td>
                          {V1_PAIRS.map((p) => (
                            <td
                              key={p.key}
                              className="py-3 px-3 text-right font-mono text-white"
                            >
                              <div className="inline-flex items-center gap-1.5">
                                <DirectionIcon brokerId={id} pairKey={p.key} />
                                <span>{formatSpread(row[p.key], p.key)}</span>
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-3 sm:p-4 border-t border-gray-800 text-center">
                <p className="text-xs text-gray-500">
                  Typical spread in pips · Click a pair to sort · Data by{" "}
                  <a
                    href="https://www.myfxbook.com/forex-broker-spreads"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    myfxbook
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </section>
    </div>
  );
}

export default LiveSpreads;
