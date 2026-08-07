import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, ArrowRight, Landmark, TrendingUp } from "lucide-react";
import { getAllCompanies } from "../../controllers/companiesController.js";
import { computeTrustScore } from "../../utils/trustScore.js";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";

// Same 5-star rendering as the reviews list, kept tiny for a table row.
function Stars({ rating = 0 }) {
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i < Math.round(rating) ? "text-yellow-400" : "text-gray-700"}`}
          fill={i < Math.round(rating) ? "currentColor" : "none"}
        />
      ))}
    </div>
  );
}

function TrustPill({ ratingsAggregate, totalReviews }) {
  const { score, label } = computeTrustScore(ratingsAggregate, totalReviews);
  if (label === "No Reviews") {
    return (
      <span className="text-xs text-gray-500 whitespace-nowrap">No reviews yet</span>
    );
  }
  const tint =
    score >= 90
      ? "text-green-300 bg-green-500/10 border-green-500/30"
      : score >= 80
        ? "text-blue-300 bg-blue-500/10 border-blue-500/30"
        : score >= 70
          ? "text-yellow-300 bg-yellow-500/10 border-yellow-500/30"
          : "text-gray-300 bg-gray-500/10 border-gray-500/30";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tint}`}
      title={`${label} · ${score}/100`}
    >
      {score}
      <span className="hidden sm:inline text-[10px] uppercase tracking-wide opacity-80">
        {label}
      </span>
    </span>
  );
}

function CompanyRow({ company, index }) {
  const id = company._id || company.id;
  return (
    <Link
      to={`/reviews/${id}`}
      className="grid grid-cols-[auto,1fr,auto,auto] items-center gap-3 px-3 sm:px-4 py-3 rounded-lg hover:bg-gray-800/60 transition-colors group"
    >
      <span className="text-xs font-mono w-5 text-gray-500 group-hover:text-gray-300">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-8 w-8 rounded-md bg-gray-800/70 overflow-hidden flex-shrink-0 border border-white/5">
          <ImageWithFallback
            src={company.logo}
            fallback="/assets/placeholder.jpg"
            alt={company.name}
            className="h-full w-full object-contain"
          />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate group-hover:text-blue-300 transition-colors">
            {company.name}
          </div>
          <div className="text-[11px] text-gray-500 truncate">
            {company.country || company.category || ""}
          </div>
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-0.5">
        <Stars rating={company.ratingsAggregate || 0} />
        <span className="text-[10px] text-gray-500">
          {company.totalReviews || 0} reviews
        </span>
      </div>
      <TrustPill
        ratingsAggregate={company.ratingsAggregate}
        totalReviews={company.totalReviews}
      />
    </Link>
  );
}

function TableCard({ title, icon: Icon, iconTint, companies, viewAllHref, viewAllLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5 }}
      className="card overflow-hidden"
    >
      <div className="card-body p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center ${iconTint}`}>
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <Link
            to={viewAllHref}
            className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
          >
            {viewAllLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="space-y-1">
          {companies.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              No companies to show yet.
            </div>
          ) : (
            companies.map((c, i) => (
              <CompanyRow key={c._id || c.id} company={c} index={i} />
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Sort by trust score computed the same way TrustScoreGauge does, then by
// review volume as a tiebreaker so "1 five-star review" doesn't outrank a
// firm with thousands of ratings averaging just under.
function rankCompanies(list) {
  return [...list].sort((a, b) => {
    const aScore = computeTrustScore(a.ratingsAggregate, a.totalReviews).score;
    const bScore = computeTrustScore(b.ratingsAggregate, b.totalReviews).score;
    if (bScore !== aScore) return bScore - aScore;
    return (b.totalReviews || 0) - (a.totalReviews || 0);
  });
}

function TopCompaniesTables() {
  const [brokers, setBrokers] = React.useState([]);
  const [propFirms, setPropFirms] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [brokerRes, propRes] = await Promise.all([
          getAllCompanies({ category: "Broker", size: 20 }),
          getAllCompanies({ category: "PropFirm", size: 20 }),
        ]);
        if (cancelled) return;
        setBrokers(rankCompanies(brokerRes.data || []).slice(0, 5));
        setPropFirms(rankCompanies(propRes.data || []).slice(0, 5));
      } catch (err) {
        console.warn("TopCompaniesTables load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide the whole section on the first paint if we have nothing to show —
  // avoids two empty cards flashing before data arrives.
  if (!loading && brokers.length === 0 && propFirms.length === 0) return null;

  return (
    <section className="py-14 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl mb-2">
            Top{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">
              Rated Companies
            </span>
          </h2>
          <p className="text-sm text-gray-400 max-w-2xl mx-auto">
            The highest-rated brokers and prop firms on XK, ranked by verified
            reviews.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TableCard
            title="Top Brokers"
            icon={Landmark}
            iconTint="text-blue-300"
            companies={brokers}
            viewAllHref="/reviews/broker"
            viewAllLabel="View all"
          />
          <TableCard
            title="Top Prop Firms"
            icon={TrendingUp}
            iconTint="text-emerald-300"
            companies={propFirms}
            viewAllHref="/reviews/propfirm"
            viewAllLabel="View all"
          />
        </div>
      </div>
    </section>
  );
}

export default TopCompaniesTables;
