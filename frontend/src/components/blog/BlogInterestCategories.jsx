import React from "react";
import {
  User,
  BarChart3,
  Building2,
  Globe,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import {
  BLOG_CONTAINER,
  BLOG_SECTION_HEADING,
  BLOG_LINK,
} from "./blogLayout.js";

const interests = [
  {
    title: "Traders & Influencers",
    description: "Interviews, trading journeys, lifestyle & more",
    filter: "Trading",
    icon: User,
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
  },
  {
    title: "Markets",
    description: "Gold, Silver, Forex, Crypto, Stocks, Commodities & more",
    filter: "Forex",
    icon: BarChart3,
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
  },
  {
    title: "Companies",
    description: "Broker & Prop Firm reviews, comparisons, platforms & tools",
    filter: "Companies",
    icon: Building2,
    iconBg: "bg-green-500/15",
    iconColor: "text-green-400",
  },
  {
    title: "Countries",
    description: "Market outlooks, economic updates & country guides",
    filter: "Countries",
    icon: Globe,
    iconBg: "bg-yellow-500/15",
    iconColor: "text-yellow-400",
  },
  {
    title: "Events",
    description: "Expos, webinars, meetups & trading events worldwide",
    filter: "Events",
    icon: CalendarDays,
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
  },
];

function BlogInterestCategories({ active, onSelect }) {
  return (
    <section
      className={`${BLOG_CONTAINER} pt-[60px] pb-0`}
      aria-labelledby="blog-interests-heading"
    >
      <div className="flex items-center justify-between gap-6 mb-6">
        <h2 id="blog-interests-heading" className={BLOG_SECTION_HEADING}>
          What are you interested in?
        </h2>
        <button
          type="button"
          onClick={() => onSelect("All")}
          className={BLOG_LINK}
        >
          View all categories -
        </button>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 list-none p-0 m-0">
        {interests.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.filter;

          return (
            <li key={item.title}>
              <button
                type="button"
                onClick={() => onSelect(isActive ? "All" : item.filter)}
                aria-pressed={isActive}
                aria-label={`Filter by ${item.title}`}
                className={`group relative flex flex-col w-full h-[220px] p-6 rounded-[18px] border text-left bg-[#0B1120] transition-all duration-300 ease-out hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                  isActive
                    ? "border-[#3B82F6] shadow-[0_8px_32px_rgba(59,130,246,0.15)]"
                    : "border-white/[0.08] hover:border-[#3B82F6]/55 shadow-[0_4px_16px_rgba(0,0,0,0.18)] hover:shadow-[0_10px_36px_rgba(59,130,246,0.1)]"
                }`}
              >
                <div
                  className={`h-11 w-11 rounded-[10px] ${item.iconBg} flex items-center justify-center shrink-0`}
                  aria-hidden="true"
                >
                  <Icon className={`h-5 w-5 ${item.iconColor}`} />
                </div>

                <h3 className="mt-4 text-[22px] font-bold text-white leading-[1.2] pr-2">
                  {item.title}
                </h3>

                <p className="mt-2 text-[15px] leading-[1.6] line-clamp-2 pr-10 text-[#94A3B8]">
                  {item.description}
                </p>

                <span
                  className="absolute bottom-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#0B1120] transition-all duration-300 group-hover:border-[#3B82F6] group-hover:bg-[#3B82F6]"
                  aria-hidden="true"
                >
                  <ChevronRight className="h-4 w-4 text-[#94A3B8] transition-colors duration-300 group-hover:text-white" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default BlogInterestCategories;
