import React from "react";
import { motion } from "framer-motion";
import { ExternalLink, ShieldCheck, Wallet, Clock, Globe, Layers, Server, TrendingUp } from "lucide-react";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";
import StarRating from "./StarRating.jsx";

function csvOrArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function MetaTile({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="p-3 sm:p-4 rounded-lg bg-gray-900/60 border border-gray-800">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400 mb-1">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <div className="text-white text-sm sm:text-base font-medium truncate">
        {value}
      </div>
    </div>
  );
}

function ChipList({ items }) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CompanyProfileHeader({ company }) {
  const isPropFirm = company.category === "PropFirm";
  const assets = csvOrArray(company.assets);
  const platforms = csvOrArray(company.platforms);
  const regulation = csvOrArray(company.regulation);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card overflow-hidden"
    >
      <div className="card-body space-y-6">
        <div className="flex items-start gap-4 sm:gap-5">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-white/95 overflow-hidden flex-shrink-0 border border-gray-700 shadow-lg p-2 flex items-center justify-center">
            <ImageWithFallback
              src={company.logo}
              fallback="/assets/placeholder.jpg"
              alt={company.name}
              className="h-full w-full object-contain"
              useDynamicFallback={true}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                {isPropFirm ? "Prop Firm" : company.category || "Broker"}
              </span>
              {company.country && (
                <span className="text-xs sm:text-sm text-gray-300">
                  {company.country}
                </span>
              )}
              {company.yearsActive && (
                <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">
                  · {company.yearsActive}
                </span>
              )}
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl mb-3 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
                {company.name}
              </span>
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <StarRating value={company.ratingsAggregate || 0} size={18} />
              <span className="text-base sm:text-lg font-semibold text-white">
                {(company.ratingsAggregate || 0).toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">
                ({company.totalReviews || 0}{" "}
                {company.totalReviews === 1 ? "review" : "reviews"})
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetaTile icon={Globe} label="Country" value={company.country} />
          <MetaTile icon={Clock} label="Years Active" value={company.yearsActive} />
          {isPropFirm ? (
            <MetaTile icon={TrendingUp} label="Max Allocation" value={company.maxAllocation} />
          ) : (
            <MetaTile icon={Wallet} label="Min Deposit" value={company.minDeposit} />
          )}
          {!isPropFirm && regulation.length > 0 && (
            <MetaTile
              icon={ShieldCheck}
              label="Regulation"
              value={regulation.slice(0, 3).join(", ") + (regulation.length > 3 ? "…" : "")}
            />
          )}
        </div>

        {(assets.length > 0 || platforms.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400 mb-2">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Assets</span>
                </div>
                <ChipList items={assets} />
              </div>
            )}
            {platforms.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-400 mb-2">
                  <Server className="h-3.5 w-3.5" />
                  <span>Platforms</span>
                </div>
                <ChipList items={platforms} />
              </div>
            )}
          </div>
        )}

        {(company.description || company.details) && (
          company.description ? (
            <div
              className="rich-text-content text-sm sm:text-base text-gray-300"
              dangerouslySetInnerHTML={{ __html: company.description }}
            />
          ) : (
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              {company.details}
            </p>
          )
        )}

        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary inline-flex items-center gap-2 w-fit"
          >
            <span>Visit {company.name}</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </motion.div>
  );
}

export default CompanyProfileHeader;
