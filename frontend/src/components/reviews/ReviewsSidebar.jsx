import React from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  DollarSign,
  BadgeCheck,
  CalendarDays,
  Star,
  ChevronRight,
} from "lucide-react";
import StarRating from "./StarRating.jsx";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";
import { computeTrustScore } from "../../utils/trustScore.js";

const whyChooseItems = [
  {
    title: "Real Unbiased Review",
    subtitle: "Every review is checked by our team.",
    icon: ShieldCheck,
  },
  {
    title: "Real Payout & Verified",
    subtitle: "We verify payouts, not just talk.",
    icon: DollarSign,
  },
  {
    title: "Trader with Verified Data",
    subtitle: "Spreads & conditions updated live.",
    icon: BadgeCheck,
  },
  {
    title: "Events",
    subtitle: "Join trader events & community.",
    icon: CalendarDays,
  },
];

function SidebarSection({ title, viewAllLink, children }) {
  return (
    <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/60">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition-colors"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function CompanyListItem({ company, rank, showMetric }) {
  const { score } = computeTrustScore(company.ratingsAggregate, company.totalReviews);

  const rankColors = [
    "bg-blue-500/20 text-blue-400",
    "bg-purple-500/20 text-purple-400",
    "bg-orange-500/20 text-orange-400",
    "bg-green-500/20 text-green-400",
    "bg-cyan-500/20 text-cyan-400",
  ];

  return (
    <Link
      to={`/reviews/${company.id || company._id}`}
      className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-gray-800/40 transition-colors group"
    >
      {rank && (
        <span
          className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${rankColors[(rank - 1) % rankColors.length]}`}
        >
          {String(rank).padStart(2, "0")}
        </span>
      )}
      <div className="h-8 w-8 rounded-lg bg-muted overflow-hidden flex-shrink-0">
        <ImageWithFallback
          src={company.logo}
          fallback="/assets/placeholder.jpg"
          alt={company.name}
          useDynamicFallback
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors truncate">
          {company.name}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <StarRating value={company.ratingsAggregate} size={12} />
          <span className="text-xs text-gray-400">
            {company.ratingsAggregate?.toFixed(1)}
          </span>
        </div>
      </div>
      {showMetric && (
        <span className="text-xs text-gray-400 flex-shrink-0">
          {showMetric === "score" ? `${score}` : showMetric}
        </span>
      )}
    </Link>
  );
}

function LatestReviewItem({ review }) {
  const companyName =
    review.companyName ||
    review.company?.name ||
    review.companyId?.name ||
    "Company Review";

  return (
    <Link
      to={review.companyId ? `/reviews/${review.companyId}` : "#"}
      className="flex items-start gap-3 py-2.5 px-2 -mx-2 rounded-lg hover:bg-gray-800/40 transition-colors group"
    >
      <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0">
        <Star className="h-4 w-4 text-yellow-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-1">
          {review.title || companyName}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {review.userName || "Trader"} •{" "}
          {review.createdAt
            ? new Date(review.createdAt).toLocaleDateString()
            : "Recently"}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
        <span className="text-xs text-gray-400">{review.rating?.toFixed?.(1) || review.rating}</span>
      </div>
    </Link>
  );
}

function ReviewsSidebar({ brokers = [], propFirms = [], latestReviews = [] }) {
  return (
    <div className="space-y-4">
      {/* Why Traders Choose XK */}
      <SidebarSection title="Why Traders Choose XK?">
        <div className="space-y-3">
          {whyChooseItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{item.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{item.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>
      </SidebarSection>

      {/* Brokers */}
      <SidebarSection title="Brokers" viewAllLink="/reviews/broker">
        <div className="space-y-0.5">
          {brokers.length > 0 ? (
            brokers.slice(0, 5).map((company, idx) => (
              <CompanyListItem
                key={company.id || company._id}
                company={company}
                rank={idx + 1}
                showMetric="score"
              />
            ))
          ) : (
            <p className="text-xs text-gray-500 py-2">No brokers available yet.</p>
          )}
        </div>
      </SidebarSection>

      {/* Prop Firms */}
      <SidebarSection title="Prop Firms" viewAllLink="/reviews/propfirm">
        <div className="space-y-0.5">
          {propFirms.length > 0 ? (
            propFirms.slice(0, 5).map((company, idx) => (
              <CompanyListItem
                key={company.id || company._id}
                company={company}
                rank={idx + 1}
                showMetric="Prop Firm"
              />
            ))
          ) : (
            <p className="text-xs text-gray-500 py-2">No prop firms available yet.</p>
          )}
        </div>
      </SidebarSection>

      {/* Latest Reviews */}
      <SidebarSection title="Latest Reviews — Broker & Prop Firm">
        <div className="space-y-0.5">
          {latestReviews.length > 0 ? (
            latestReviews.slice(0, 4).map((review) => (
              <LatestReviewItem key={review.id || review._id} review={review} />
            ))
          ) : (
            <p className="text-xs text-gray-500 py-2">No reviews yet.</p>
          )}
        </div>
      </SidebarSection>
    </div>
  );
}

export default ReviewsSidebar;
