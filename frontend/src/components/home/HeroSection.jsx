import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { TrendingUp, ShieldCheck, Star } from "lucide-react";
import { getAssetPath } from "../../utils/assets.js";

const trustPoints = [
  "Trusted reviews",
  "Verified traders",
  "Live spreads",
  "Real payouts",
];

// Floating trust badges positioned around the hero logo. Content and stats
// mirror the marketing figures shown in StatsSection so the two never disagree.
const heroBadges = [
  {
    id: "spreads",
    icon: TrendingUp,
    iconTint: "text-blue-400",
    iconBg: "bg-blue-500/15",
    label: "Live Spreads",
    value: "EUR/USD 0.1",
    // Top-right of the logo
    position: "top-2 right-0 md:-right-6 lg:-right-10",
    delay: 0,
    withPulse: true,
  },
  {
    id: "payouts",
    icon: ShieldCheck,
    iconTint: "text-green-400",
    iconBg: "bg-green-500/15",
    label: "Verified Payouts",
    value: "$23.7M+",
    sub: "This month",
    // Bottom-right of the logo
    position: "bottom-8 right-0 md:-right-8 lg:-right-14",
    delay: 0.4,
  },
  {
    id: "reviews",
    icon: Star,
    iconTint: "text-yellow-400",
    iconBg: "bg-yellow-500/15",
    label: "Trusted Reviews",
    value: "24,369+",
    sub: "From verified traders",
    // Top-left of the logo
    position: "top-4 left-0 md:-left-6 lg:-left-10",
    delay: 0.8,
  },
];

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <div className="text-center lg:text-left">
          <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight mb-6 leading-tight">
            <span className="text-white">Discover Trusted</span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
              Brokers, Prop Firms &amp;
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
              Verified Traders.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 mb-8 leading-relaxed max-w-2xl">
            Compare brokers and prop firms, explore verified trader profiles,
            track live spreads and payouts, and make confident trading
            decisions-all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link
              to="/reviews"
              className="btn rounded-full bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-500 hover:border-blue-600 hover:scale-105 transition-all shadow-lg shadow-blue-500/20 px-6 py-3"
            >
              Explore Companies
            </Link>
            <Link
              to="/reviews/traders"
              className="btn rounded-full bg-white text-gray-900 hover:bg-gray-100 border-2 border-white hover:scale-105 transition-all shadow-lg px-6 py-3"
            >
              Find Verified Traders
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-400 flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1">
            {trustPoints.map((point, index) => (
              <React.Fragment key={point}>
                {index > 0 && (
                  <span className="text-gray-600 hidden sm:inline" aria-hidden="true">
                    •
                  </span>
                )}
                <span>{point}</span>
              </React.Fragment>
            ))}
          </p>
        </div>

        <div className="flex items-center justify-center relative">
          <div className="relative h-96 w-96 flex items-center justify-center">
            <motion.div className="absolute z-30 flex items-center justify-center">
              <motion.img
                src={getAssetPath("/assets/logo.webp")}
                alt="XK Trading Floor Logo"
                width="561"
                height="445"
                className="h-64 w-48 md:h-80 md:w-60 lg:h-96 lg:w-72 object-contain drop-shadow-2xl"
                style={{ filter: "brightness(0) invert(1)" }}
                animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute h-64 w-64 border-2 border-blue-400/50 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute h-96 w-96 border-2 border-blue-400/40 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 2.2, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute h-[500px] w-[500px] border border-blue-400/30 rounded-full"
            />

            {/* Floating trust badges */}
            {heroBadges.map((badge) => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: [0, -6, 0] }}
                  transition={{
                    opacity: { duration: 0.5, delay: badge.delay },
                    y: {
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: badge.delay,
                    },
                  }}
                  className={`absolute ${badge.position} z-40 flex items-center gap-2 rounded-xl border border-white/10 bg-gray-900/80 backdrop-blur-md px-3 py-2 shadow-xl shadow-black/40`}
                >
                  <div className={`h-8 w-8 rounded-lg ${badge.iconBg} flex items-center justify-center flex-shrink-0 relative`}>
                    <Icon className={`h-4 w-4 ${badge.iconTint}`} />
                    {badge.withPulse && (
                      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 ring-2 ring-gray-900 animate-pulse" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] uppercase tracking-wide text-gray-400 leading-none">
                      {badge.label}
                    </div>
                    <div className="text-sm font-semibold text-white leading-tight">
                      {badge.value}
                    </div>
                    {badge.sub && (
                      <div className="text-[10px] text-gray-500 leading-none mt-0.5">
                        {badge.sub}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
