import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, CheckCircle2 } from "lucide-react";
import StarRating from "./StarRating.jsx";
import TrustScoreGauge from "./TrustScoreGauge.jsx";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";

function CompanyCard({ company, user }) {
  const categoryColors = {
    Broker: "bg-green-500/15 text-green-400 border-green-500/30",
    PropFirm: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    Crypto: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  };

  const categoryLabels = {
    Broker: "Trusted Broker",
    PropFirm: "Top Prop Firm",
    Crypto: "Crypto Exchange",
  };

  const featuredPromo =
    company.promoCodes?.find((p) => p.featured) || company.promoCodes?.[0];
  const isPromoValid =
    featuredPromo && new Date(featuredPromo.validTo) > new Date();

  const isBroker = company.category === "Broker";
  const isPropFirm = company.category === "PropFirm";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-gray-900/50 border border-gray-800/60 hover:border-gray-700/60 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 rounded-2xl backdrop-blur-sm overflow-hidden"
    >
      <div className="p-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          {/* Left: Logo + Info */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-gray-700/50">
              <ImageWithFallback
                src={company.logo}
                fallback="/assets/placeholder.jpg"
                alt={company.name}
                useDynamicFallback
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/reviews/${company.id || company._id}`}
                    className="text-lg font-semibold text-white hover:text-blue-400 transition-colors"
                  >
                    {company.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full border ${categoryColors[company.category] ||
                        "bg-gray-500/15 text-gray-400 border-gray-500/30"
                        }`}
                    >
                      {categoryLabels[company.category] || company.category}
                    </span>
                    {company.status === "pending" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <StarRating value={company.ratingsAggregate} size={14} />
                <span className="text-sm font-medium text-white">
                  {company.ratingsAggregate?.toFixed(1) || "0.0"}
                </span>
                <span className="text-xs text-gray-500">
                  ({company.totalReviews || 0}{" "}
                  {company.totalReviews === 1 ? "review" : "reviews"})
                </span>
              </div>

              <p className="text-sm text-gray-400 line-clamp-2 mt-2">
                {company.details || company.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {company.platforms?.slice(0, 3).map((platform) => (
                  <span
                    key={platform}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800/80 text-gray-400 border border-gray-700/50"
                  >
                    {platform}
                  </span>
                ))}
                {company.minDeposit && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800/80 text-gray-400 border border-gray-700/50">
                    Min ${company.minDeposit}
                  </span>
                )}
                {company.regulation?.slice(0, 2).map((reg) => (
                  <span
                    key={reg}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-gray-800/80 text-gray-400 border border-gray-700/50"
                  >
                    {reg}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Trust Score */}
          <div className="flex-shrink-0 flex justify-center lg:px-4">
            <TrustScoreGauge
              ratingsAggregate={company.ratingsAggregate}
              totalReviews={company.totalReviews}
              size="md"
            />
          </div>

          {/* Metrics columns */}
          <div className="flex-shrink-0 grid grid-cols-3 gap-4 lg:gap-6 min-w-[240px]">
            {isBroker && (
              <>
                <MetricColumn
                  label="Min Deposit"
                  value={company.minDeposit ? `$${company.minDeposit}` : "—"}
                />
                <MetricColumn
                  label="Regulation"
                  value={
                    company.regulation?.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {company.regulation.slice(0, 2).map((r) => (
                          <span key={r} className="flex items-center gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3 text-green-400" />
                            {r}
                          </span>
                        ))}
                      </div>
                    ) : (
                      "—"
                    )
                  }
                />
                <MetricColumn
                  label="Platforms"
                  value={company.platforms?.slice(0, 2).join(", ") || "—"}
                />
              </>
            )}
            {isPropFirm && (
              <>
                <MetricColumn
                  label="Max Allocation"
                  value={company.maxAllocation || "—"}
                />
                <MetricColumn label="Assets" value={company.assets?.length ? `${company.assets.length}+` : "—"} />
                <MetricColumn
                  label="Reviews"
                  value={`${company.totalReviews || 0}`}
                />
              </>
            )}
            {!isBroker && !isPropFirm && (
              <>
                <MetricColumn label="Country" value={company.country || "—"} />
                <MetricColumn label="Years Active" value={company.yearsActive || "—"} />
                <MetricColumn label="Reviews" value={`${company.totalReviews || 0}`} />
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex flex-col items-stretch gap-2 min-w-[140px]">
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium text-center transition-colors"
            >
              Visit Website
            </a>
            <Link
              to={`/reviews/${company.id || company._id}`}
              className="px-4 py-2.5 rounded-lg bg-gray-800/80 border border-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-white text-sm font-medium text-center transition-colors"
            >
              View Review
            </Link>
          </div>
        </div>

        {/* Promo code */}
        {isPromoValid && (
          <div className="mt-4 pt-4 border-t border-gray-800/60">
            {!user ? (
              <div className="relative p-3 rounded-lg bg-green-500/10 border border-green-500/20 overflow-hidden">
                <div className="blur-[3px] select-none pointer-events-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-green-400 font-semibold">Featured Promo</div>
                      <div className="text-sm font-mono text-green-300">{featuredPromo.code}</div>
                    </div>
                    <div className="text-sm font-bold text-green-400">
                      {featuredPromo.discount}% OFF
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] rounded-lg">
                  <Link
                    to="/login"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/90 border border-gray-700/50 text-xs text-gray-300"
                  >
                    <Lock className="h-3.5 w-3.5 text-blue-400" />
                    Login to access promo code
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs text-green-400 font-semibold">Featured Promo</div>
                  <div className="text-sm font-mono text-green-300">{featuredPromo.code}</div>
                </div>
                <div className="text-sm font-bold text-green-400">
                  {featuredPromo.discount}% OFF
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MetricColumn({ label, value }) {
  return (
    <div className="text-center">
      <div className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

export default CompanyCard;
