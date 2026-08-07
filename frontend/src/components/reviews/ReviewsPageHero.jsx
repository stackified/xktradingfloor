import React from "react";
import { motion } from "framer-motion";
import { Search, ShieldCheck, DollarSign, Star, BadgeCheck } from "lucide-react";
import { getAssetPath } from "../../utils/assets.js";

const badges = [
  {
    label: "Verified Trader Badge",
    icon: BadgeCheck,
    position: "top-4 -left-4 lg:-left-8",
    delay: 0,
  },
  {
    label: "Real Payout",
    icon: DollarSign,
    position: "top-4 -right-4 lg:-right-8",
    delay: 0.2,
  },
  {
    label: "Unbiased Reviews",
    icon: Star,
    position: "bottom-8 -left-4 lg:-left-12",
    delay: 0.4,
  },
  {
    label: "Verified Data",
    icon: ShieldCheck,
    position: "bottom-8 -right-4 lg:-right-12",
    delay: 0.6,
  },
];

const trendingSearches = [
  "IC Markets",
  "FTMO",
  "FundingPips",
  "Exness",
  "Vantage",
  "E8 Markets",
];

function ReviewsPageHero({ searchValue, onSearchChange, onSearchSubmit }) {
  function handleSubmit(e) {
    e.preventDefault();
    onSearchSubmit?.();
  }

  return (
    <section className="relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Headline + Search */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight mb-4 leading-tight">
              <span className="text-white">Discover Trusted</span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">
                Trading Companies
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-400 mb-6 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Compare brokers, prop firms and verified traders. Read real reviews,
              track live spreads and verified payouts before choosing where to trade.
            </p>

            <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto lg:mx-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search broker, prop firm or trader..."
                value={searchValue || ""}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full pl-12 pr-28 py-3.5 rounded-xl bg-gray-900/80 border border-gray-700/60 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              >
                Search
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <span className="text-xs text-gray-500 mr-1">Trending:</span>
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => onSearchChange?.(term)}
                  className="text-xs px-3 py-1 rounded-full bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-white hover:border-blue-500/40 transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Right: XK Center + Logo + Badges */}
          <div className="flex items-center justify-center order-1 lg:order-2">
            <div className="relative h-80 w-80 sm:h-96 sm:w-96">
              {/* Logo + rings live in one shared, flex-centered subgroup so
                  the rings can never drift from the logo, even when the logo
                  has its own float/scale animation. Rings sit BEHIND (z-0)
                  and the logo above (z-10). Badges are siblings of this
                  group and stay pinned to the outer container's corners. */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="relative flex items-center justify-center">
                  {/* Pulsing rings — same pattern/timings as Home's hero.
                      The OUTER div owns the centering translate; the INNER
                      motion.div owns the scale animation. Framer Motion sets
                      `transform: scale(...)` inline which would otherwise
                      overwrite the Tailwind translate and shove each ring
                      to the bottom-right of the wrapper. Splitting them
                      keeps translate and scale on separate elements. */}
                  {[
                    { size: "h-44 w-44 sm:h-52 sm:w-52", border: "border-2 border-blue-400/50", scale: 1.5, opacity: 0.7, duration: 3, delay: 0 },
                    { size: "h-60 w-60 sm:h-72 sm:w-72", border: "border-2 border-blue-400/40", scale: 1.8, opacity: 0.5, duration: 3.5, delay: 0.5 },
                    { size: "h-72 w-72 sm:h-80 sm:w-80", border: "border border-blue-400/30", scale: 2.2, opacity: 0.3, duration: 4, delay: 1 },
                  ].map((ring, i) => (
                    <div
                      key={i}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                      <motion.div
                        animate={{ scale: [1, ring.scale, 1], opacity: [ring.opacity, 0, ring.opacity] }}
                        transition={{ duration: ring.duration, repeat: Infinity, ease: "easeInOut", delay: ring.delay }}
                        className={`${ring.size} ${ring.border} rounded-full`}
                      />
                    </div>
                  ))}

                  {/* Logo — the shared centre. Scale-only animation (no y
                      drift) so it stays pixel-locked to the ring centres. */}
                  <motion.img
                    src={getAssetPath("/assets/logo.webp")}
                    alt="XK Trading Floor"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative h-32 w-32 sm:h-40 sm:w-40 object-contain drop-shadow-2xl z-10"
                    style={{ filter: "brightness(0) invert(1)" }}
                  />
                </div>
              </div>

              {/* Floating badges */}
              {badges.map((badge) => {
                const Icon = badge.icon;
                return (
                  <motion.div
                    key={badge.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
                    transition={{
                      opacity: { duration: 0.5, delay: badge.delay },
                      scale: { duration: 0.5, delay: badge.delay },
                      y: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: badge.delay },
                    }}
                    className={`absolute ${badge.position} z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900/90 border border-gray-700/60 backdrop-blur-sm shadow-lg shadow-black/30`}
                  >
                    <div className="h-7 w-7 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-3.5 w-3.5 text-green-400" />
                    </div>
                    <span className="text-xs font-medium text-white whitespace-nowrap">
                      {badge.label}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ReviewsPageHero;
