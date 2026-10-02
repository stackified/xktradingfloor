import React from "react";
import { Link } from "react-router-dom";
import {
  User,
  BarChart3,
  Building2,
  Globe,
  CalendarDays,
  ChevronRight,
  ArrowRight,
  Newspaper,
  GraduationCap,
  BadgePercent,
  Wrench,
} from "lucide-react";
import {
  BLOG_CONTAINER,
  BLOG_SECTION_HEADING,
  BLOG_LINK,
} from "./blogLayout.js";
import { BLOG_CATEGORIES } from "../../utils/blogCategories.js";

// Icon and colour per category; names, slugs and descriptions come from
// utils/blogCategories.js.
const STYLE = {
  markets: { icon: BarChart3, iconBg: "bg-blue-500/15", iconColor: "text-blue-400" },
  companies: { icon: Building2, iconBg: "bg-green-500/15", iconColor: "text-green-400" },
  "traders-influencers": { icon: User, iconBg: "bg-purple-500/15", iconColor: "text-purple-400" },
  "breaking-industry-news": { icon: Newspaper, iconBg: "bg-red-500/15", iconColor: "text-red-400" },
  "learn-trading": { icon: GraduationCap, iconBg: "bg-cyan-500/15", iconColor: "text-cyan-400" },
  "promotions-deals": { icon: BadgePercent, iconBg: "bg-pink-500/15", iconColor: "text-pink-400" },
  "countries-regions": { icon: Globe, iconBg: "bg-yellow-500/15", iconColor: "text-yellow-400" },
  events: { icon: CalendarDays, iconBg: "bg-orange-500/15", iconColor: "text-orange-400" },
  "tools-guides": { icon: Wrench, iconBg: "bg-teal-500/15", iconColor: "text-teal-400" },
};

const interests = BLOG_CATEGORIES.map((c) => ({ ...c, ...STYLE[c.slug] }));

function BlogInterestCategories({ active }) {
  return (
    <section
      className={`${BLOG_CONTAINER} pt-[60px] pb-0`}
      aria-labelledby="blog-interests-heading"
    >
      <div className="flex items-center justify-between gap-6 mb-6">
        <h2 id="blog-interests-heading" className={BLOG_SECTION_HEADING}>
          What are you interested in?
        </h2>
        <Link
          to="/blog"
          className={`${BLOG_LINK} group inline-flex items-center gap-1.5`}
        >
          All articles
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 list-none p-0 m-0">
        {interests.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.name;

          return (
            <li key={item.slug}>
              <Link
                to={isActive ? "/blog" : `/blog/category/${item.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex flex-row items-center gap-4 sm:flex-col sm:items-start sm:gap-0 w-full sm:h-[210px] p-4 sm:p-6 rounded-[18px] border text-left bg-[#0B1120] transition-all duration-300 ease-out hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
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

                <div className="min-w-0 sm:contents">
                  <h3 className="sm:mt-4 text-[17px] sm:text-[20px] font-bold text-white leading-[1.2] pr-2">
                    {item.name}
                  </h3>

                  <p className="mt-1 sm:mt-2 text-[13.5px] sm:text-[15px] leading-[1.5] sm:leading-[1.6] line-clamp-2 sm:pr-10 text-[#94A3B8]">
                    {item.description}
                  </p>
                </div>

                <span
                  className="absolute bottom-5 right-5 hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#0B1120] transition-all duration-300 group-hover:border-[#3B82F6] group-hover:bg-[#3B82F6]"
                  aria-hidden="true"
                >
                  <ChevronRight className="h-4 w-4 text-[#94A3B8] transition-colors duration-300 group-hover:text-white" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default BlogInterestCategories;
