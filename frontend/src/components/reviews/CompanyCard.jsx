import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, ExternalLink } from "lucide-react";
import StarRating from "./StarRating.jsx";
import TrustScoreGauge from "./TrustScoreGauge.jsx";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";

// Backend has stored min deposit either as a bare number ("50") or with a
// leading currency symbol ("$50", "$10–$200"). Normalise so the display never
// double-prefixes (the old code produced "$$50").
function formatMinDeposit(raw) {
  if (raw === undefined || raw === null || raw === "") return "";
  const s = String(raw).trim();
  if (/^[$€£¥₹]/.test(s)) return s;
  return `$${s}`;
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-gray-800/70 text-gray-300 border border-gray-700/60 whitespace-nowrap">
      {children}
    </span>
  );
}

const CATEGORY_COLORS = {
  Broker: "bg-green-500/15 text-green-400 border-green-500/30",
  PropFirm: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Crypto: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
};
const CATEGORY_LABELS = {
  Broker: "Trusted Broker",
  PropFirm: "Top Prop Firm",
  Crypto: "Crypto Exchange",
};

function CompanyCard({ company, user }) {
  const featuredPromo =
    company.promoCodes?.find((p) => p.featured) || company.promoCodes?.[0];
  const isPromoValid =
    featuredPromo && new Date(featuredPromo.validTo) > new Date();

  const id = company.id || company._id;
  const rating = company.ratingsAggregate || 0;
  const reviewCount = company.totalReviews || 0;
  const isPropFirm = company.category === "PropFirm";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="bg-gray-900/50 border border-gray-800/60 hover:border-gray-700/60 hover:shadow-xl hover:shadow-black/20 transition-all duration-300 rounded-2xl backdrop-blur-sm"
    >
      <div className="p-5">
        {/* Row 1: identity on the left, trust gauge anchored top-right. This
            keeps the gauge from ever floating over the description text like
            the previous flex-row layout did. */}
        <div className="flex items-start gap-4">
          <Link
            to={`/reviews/${id}`}
            className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex-shrink-0 border border-gray-700/50"
          >
            <ImageWithFallback
              src={company.logo}
              fallback="/assets/placeholder.jpg"
              alt={company.name}
              useDynamicFallback
              className="h-full w-full object-cover"
            />
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  to={`/reviews/${id}`}
                  className="block text-lg font-semibold text-white hover:text-blue-400 transition-colors truncate"
                >
                  {company.name}
                </Link>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${
                      CATEGORY_COLORS[company.category] ||
                      "bg-gray-500/15 text-gray-400 border-gray-500/30"
                    }`}
                  >
                    {CATEGORY_LABELS[company.category] || company.category}
                  </span>
                  {company.status === "pending" && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                      Pending
                    </span>
                  )}
                  {company.country && (
                    <span className="text-[11px] text-gray-500">
                      · {company.country}
                    </span>
                  )}
                  {company.yearsActive && (
                    <span className="text-[11px] text-gray-500">
                      · {company.yearsActive}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <StarRating value={rating} size={14} />
                  <span className="text-sm font-medium text-white">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    ({reviewCount}{" "}
                    {reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>

              {/* Trust gauge — top-right corner, small size to avoid dominating */}
              <div className="hidden sm:block flex-shrink-0">
                <TrustScoreGauge
                  ratingsAggregate={rating}
                  totalReviews={reviewCount}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: description */}
        {(company.details || company.description) && (
          <p className="text-sm text-gray-400 line-clamp-2 mt-3">
            {company.details || company.description}
          </p>
        )}

        {/* Row 3: single wrapping chip row — regulation / min-deposit /
            max-allocation / platforms. Keeps all the "facts about the company"
            in one horizontal reading line with no double-representation. */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          {isPropFirm && company.maxAllocation && (
            <Chip>
              <ShieldCheck className="h-3 w-3 mr-1 text-blue-400" />
              Max ${String(company.maxAllocation).replace(/^\$/, "")}
            </Chip>
          )}
          {!isPropFirm && company.minDeposit && (
            <Chip>Min {formatMinDeposit(company.minDeposit)}</Chip>
          )}
          {company.regulation?.slice(0, 3).map((r) => (
            <Chip key={`reg-${r}`}>
              <ShieldCheck className="h-3 w-3 mr-1 text-green-400" />
              {r}
            </Chip>
          ))}
          {company.platforms?.slice(0, 4).map((p) => (
            <Chip key={`plat-${p}`}>{p}</Chip>
          ))}
          {company.assets?.length > 0 && (
            <Chip>{company.assets.length}+ assets</Chip>
          )}
        </div>

        {/* Row 4: actions — full-width on mobile, right-aligned on sm+ */}
        <div className="mt-4 pt-4 border-t border-gray-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Mobile-only trust score (hidden on sm+ because it lives top-right there) */}
          <div className="sm:hidden">
            <TrustScoreGauge
              ratingsAggregate={rating}
              totalReviews={reviewCount}
              size="sm"
            />
          </div>
          <div className="hidden sm:block text-xs text-gray-500">
            {reviewCount > 0
              ? `Based on ${reviewCount} verified ${
                  reviewCount === 1 ? "review" : "reviews"
                }`
              : "No reviews yet — be the first"}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Link
              to={`/reviews/${id}`}
              className="px-4 py-2 rounded-lg bg-gray-800/80 border border-gray-700/50 hover:border-gray-600 text-gray-300 hover:text-white text-sm font-medium text-center transition-colors"
            >
              View Review
            </Link>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
              >
                Visit Website
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Featured promo — locked for logged-out users */}
        {isPromoValid && (
          <div className="mt-4">
            {!user ? (
              <div className="relative p-3 rounded-lg bg-green-500/10 border border-green-500/20 overflow-hidden">
                <div className="blur-[3px] select-none pointer-events-none">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-green-400 font-semibold">
                        Featured Promo
                      </div>
                      <div className="text-sm font-mono text-green-300">
                        {featuredPromo.code}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-green-400">
                      {featuredPromo.discount}
                      {featuredPromo.discountType === "percentage" ? "%" : ""}{" "}
                      OFF
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
                  <div className="text-xs text-green-400 font-semibold">
                    Featured Promo
                  </div>
                  <div className="text-sm font-mono text-green-300">
                    {featuredPromo.code}
                  </div>
                </div>
                <div className="text-sm font-bold text-green-400">
                  {featuredPromo.discount}
                  {featuredPromo.discountType === "percentage" ? "%" : ""} OFF
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default CompanyCard;
