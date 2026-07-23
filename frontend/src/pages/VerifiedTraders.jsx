import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import Seo from "../components/shared/Seo.jsx";
import ReviewsTabs from "../components/reviews/ReviewsTabs.jsx";
import CardLoader from "../components/shared/CardLoader.jsx";
import { getVerifiedTraders } from "../controllers/userProfileController.js";

function formatMoney(n) {
  if (n == null) return "—";
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${Math.round(n).toLocaleString()}`;
}

function VerifiedTraders() {
  const [traders, setTraders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await getVerifiedTraders();
        setTraders(data || []);
      } catch (_) {
        setTraders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="bg-black text-white min-h-screen">
      <Seo
        title="Verified Traders"
        description="Browse verified profitable traders on XK Trading Floor. See PNL, trading style, and recent activity."
        path="/reviews/traders"
      />

      <section className="relative overflow-hidden bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 text-center">
          <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl mb-3">
            Meet the{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
              Verified Traders
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
            Traders who applied for the verified badge, submitted proof, and
            passed a call with the XKTF team.
          </p>
        </div>
      </section>

      <ReviewsTabs />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-gray-400">
            {loading ? "Loading..." : `Showing ${traders.length} verified traders`}
          </div>
          <Link
            to="/profile"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Apply for badge</span>
          </Link>
        </div>

        {loading ? (
          <CardLoader count={3} />
        ) : traders.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">
            No verified traders yet. Be the first to apply.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {traders.map((trader, i) => {
              const primaryStyle = trader.tradingStyles?.[0] || "—";
              const verified = trader.verifiedTrader;

              return (
                <motion.div
                  key={trader.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="card p-5 sm:p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-blue-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-blue-500/20 border-2 border-blue-500/50 flex items-center justify-center text-white font-bold text-xl">
                        {trader.fullName?.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-display font-bold text-white text-base sm:text-lg">
                            {trader.fullName}
                          </h3>
                          <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {trader.country}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                    {trader.bio}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-gray-800">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                        PNL
                      </div>
                      <div className="text-green-400 font-bold text-sm">
                        {formatMoney(verified?.pnl)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                        Payouts
                      </div>
                      <div className="text-white font-semibold text-sm">
                        {formatMoney(verified?.totalWithdrawals)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">
                        Style
                      </div>
                      <div className="text-white font-semibold text-sm">
                        {primaryStyle}
                      </div>
                    </div>
                  </div>

                  <Link
                    to={`/users/${trader.id}`}
                    className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                  >
                    View profile →
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default VerifiedTraders;
