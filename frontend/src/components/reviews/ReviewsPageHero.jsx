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
              {/* Pulsing rings */}
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-8 border-2 border-blue-400/30 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute inset-0 border border-blue-400/20 rounded-full"
              />

              {/* Center XK text */}
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <motion.span
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="font-display font-extrabold text-7xl sm:text-8xl bg-gradient-to-b from-white via-blue-100 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl select-none"
                >
                  XK
                </motion.span>
              </div>

              {/* Logo on right side of center */}
              <motion.div
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src={getAssetPath("/assets/logo.webp")}
                  alt="XK Trading Floor"
                  className="h-20 w-16 sm:h-24 sm:w-20 object-contain drop-shadow-2xl opacity-90"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
              </motion.div>

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
