import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Calendar, Trophy, User, Filter } from "lucide-react";
import Seo from "../components/shared/Seo.jsx";
import CardLoader from "../components/shared/CardLoader.jsx";
import { getAllCompanies } from "../controllers/companiesController.js";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function mockPayoutsForFirms(firms) {
  const rows = [];
  const now = Date.now();
  firms.forEach((firm) => {
    let h = 0;
    const s = String(firm._id || firm.id || firm.name || "x");
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    const count = 3 + (Math.abs(h) % 5);
    for (let i = 0; i < count; i++) {
      const seed = Math.abs(h + i * 977) % 1000;
      const amount = 1500 + ((seed * 47) % 45000);
      const daysAgo = i * 4 + (seed % 6);
      rows.push({
        id: `${firm._id || firm.id}-${i}`,
        firmId: firm._id || firm.id,
        firmName: firm.name,
        firmLogo: firm.logo,
        traderName: `Trader ${["A","B","C","D","E","F","G","H","J","K"][seed % 10]}${String(seed % 100).padStart(2, "0")}`,
        amount,
        currency: "USD",
        payoutDate: new Date(now - daysAgo * 24 * 60 * 60 * 1000),
      });
    }
  });
  return rows.sort((a, b) => b.payoutDate.getTime() - a.payoutDate.getTime());
}

function formatMoney(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

function formatDate(d) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Payouts() {
  const [firms, setFirms] = React.useState([]);
  const [payouts, setPayouts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [firmFilter, setFirmFilter] = React.useState("all");
  const [monthFilter, setMonthFilter] = React.useState("all");

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await getAllCompanies({ category: "PropFirm", size: 50 });
        const list = (res.data || []).filter(
          (c) => c.status === "approved" || !c.status
        );
        if (cancelled) return;
        setFirms(list);
        setPayouts(mockPayoutsForFirms(list));
      } catch (e) {
        console.error("Failed to load prop firms", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = React.useMemo(() => {
    return payouts.filter((p) => {
      if (firmFilter !== "all" && p.firmId !== firmFilter) return false;
      if (monthFilter !== "all" && monthKey(p.payoutDate) !== monthFilter)
        return false;
      return true;
    });
  }, [payouts, firmFilter, monthFilter]);

  const thisMonth = currentMonthKey();
  const totalThisMonth = payouts
    .filter((p) => monthKey(p.payoutDate) === thisMonth)
    .reduce((sum, p) => sum + p.amount, 0);
  const totalAllTime = payouts.reduce((sum, p) => sum + p.amount, 0);

  const topFirms = React.useMemo(() => {
    const map = {};
    payouts.forEach((p) => {
      if (!map[p.firmId]) map[p.firmId] = { firmName: p.firmName, firmId: p.firmId, total: 0 };
      map[p.firmId].total += p.amount;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [payouts]);

  const availableMonths = React.useMemo(() => {
    const set = new Set();
    payouts.forEach((p) => set.add(monthKey(p.payoutDate)));
    return Array.from(set).sort().reverse();
  }, [payouts]);

  return (
    <div className="bg-black text-white min-h-screen">
      <Seo
        title="Prop Firm Payout Tracker"
        description="Track recent payouts from prop trading firms. See which firms are paying and how much."
        path="/payouts"
      />

      <section className="relative overflow-hidden bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-6 text-center">
          <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl mb-3">
            Prop Firm{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
              Payout Tracker
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
            Real payouts from prop trading firms, reported by traders and firm
            partners.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="card p-5 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400 mb-2">
              <Calendar className="h-3.5 w-3.5" />
              <span>This month</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {formatMoney(totalThisMonth)}
            </div>
            <div className="text-xs text-gray-500 mt-1">total paid out</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="card p-5 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400 mb-2">
              <DollarSign className="h-3.5 w-3.5" />
              <span>All time</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {formatMoney(totalAllTime)}
            </div>
            <div className="text-xs text-gray-500 mt-1">across {firms.length} firms</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="card p-5 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400 mb-2">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Total payouts logged</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white">
              {payouts.length.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">since launch</div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <h2 className="font-display font-bold text-lg">Recent payouts</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-gray-500" />
                      <select
                        value={firmFilter}
                        onChange={(e) => setFirmFilter(e.target.value)}
                        className="text-xs rounded-full bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none px-3 py-1.5 text-white"
                      >
                        <option value="all">All firms</option>
                        {firms.map((f) => (
                          <option key={f._id || f.id} value={f._id || f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <select
                      value={monthFilter}
                      onChange={(e) => setMonthFilter(e.target.value)}
                      className="text-xs rounded-full bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none px-3 py-1.5 text-white"
                    >
                      <option value="all">All months</option>
                      {availableMonths.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {loading ? (
                  <CardLoader count={2} />
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400">
                      No payouts match your filters.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-900/60 text-gray-400 uppercase text-xs">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold">Trader</th>
                          <th className="text-left py-3 px-4 font-semibold">Firm</th>
                          <th className="text-right py-3 px-4 font-semibold">Amount</th>
                          <th className="text-right py-3 px-4 font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filtered.slice(0, 50).map((p) => (
                          <tr
                            key={p.id}
                            className="hover:bg-gray-900/40 transition-colors"
                          >
                            <td className="py-3 px-4 text-white">
                              <div className="flex items-center gap-2">
                                <div className="h-7 w-7 rounded-full bg-gray-800 flex items-center justify-center">
                                  <User className="h-3 w-3 text-gray-400" />
                                </div>
                                <span>{p.traderName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Link
                                to={`/reviews/${p.firmId}`}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                {p.firmName}
                              </Link>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-green-400">
                              {formatMoney(p.amount)}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-400">
                              {formatDate(p.payoutDate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                  <p className="text-xs text-gray-500">
                    Sample data · Real payouts populate here once firms share
                    data with us.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <div className="card-body">
                <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  Top firms
                </h3>
                {topFirms.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-6">
                    No data yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topFirms.map((f, i) => (
                      <Link
                        key={f.firmId}
                        to={`/reviews/${f.firmId}`}
                        className="flex items-center gap-3 p-3 -mx-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
                      >
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white group-hover:text-blue-400 transition-colors truncate">
                            {f.firmName}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {formatMoney(f.total)} paid
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card border-blue-500/30 bg-blue-500/5">
              <div className="card-body">
                <h3 className="font-display font-bold text-base text-white mb-2">
                  Are you a prop firm?
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  Feature your payouts on this page. Reach out to get listed.
                </p>
                <Link
                  to="/contact"
                  className="btn btn-primary w-full inline-flex items-center justify-center gap-2 text-sm"
                >
                  Get in touch
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Payouts;
