import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Search, SquarePen, FolderOpen } from "lucide-react";
import { getUserCookie } from "../../utils/cookies.js";
import { getAssetPath } from "../../utils/assets.js";
import { BLOG_CONTAINER, BLOG_COLORS } from "./blogLayout.js";

function blogPath(user, type) {
  if (!user) return "/login";
  const role = user.role?.toLowerCase();
  if (type === "write") {
    if (role === "admin") return "/admin/blogs/create";
    if (role === "operator" || role === "subadmin") return "/operator/blogs/create";
    return "/blogs/create";
  }
  if (role === "admin") return "/admin/blogs";
  if (role === "operator" || role === "subadmin") return "/operator/blogs";
  return "/blogs/my-blogs";
}

function BlogHero({ searchValue = "", onSearchChange }) {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user) || getUserCookie();

  return (
    <section
      className="relative overflow-hidden flex items-center"
      style={{ backgroundColor: BLOG_COLORS.bg, height: "480px" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 100% at 50% 50%, transparent 0%, #05070D 72%)",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[42%] max-w-[500px] pointer-events-none hidden md:block"
      >
        <img
          src={getAssetPath("/assets/blog-hero-bull.png")}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-left opacity-55"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, transparent 0%, rgba(5,7,13,0.5) 50%, #05070D 100%)",
          }}
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-[42%] max-w-[500px] pointer-events-none hidden md:block"
      >
        <img
          src={getAssetPath("/assets/blog-hero-globe.jpg")}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-right opacity-55"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to left, transparent 0%, rgba(5,7,13,0.5) 50%, #05070D 100%)",
          }}
        />
      </div>

      <div className={`relative z-10 w-full ${BLOG_CONTAINER}`}>
        <div className="text-center max-w-[860px] mx-auto">
          <h1 className="font-display uppercase text-[28px] sm:text-[34px] md:text-[42px] lg:text-[48px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white md:whitespace-nowrap">
            Insights for{" "}
            <span className="bg-gradient-to-r from-[#60A5FA] via-[#3B82F6] to-[#2563EB] bg-clip-text text-transparent">
              Every Trader
            </span>
          </h1>

          <p className="mt-4 mx-auto max-w-[700px] text-[15px] sm:text-[16px] leading-[1.6] text-white/[0.82]">
            Find the insights that matter to your trading journey.
            <br className="hidden sm:block" />
            Stories, analysis, reviews, trader interviews and industry updates - all in one place.
          </p>

          <div className="relative max-w-[580px] mx-auto mt-6">
            <Search className="absolute left-[18px] top-1/2 -translate-y-1/2 h-4 w-4 text-white/35 pointer-events-none" />
            <input
              type="search"
              placeholder="Search articles, brokers, traders, topics..."
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full h-14 pl-11 pr-5 rounded-full text-[14px] text-white placeholder:text-white/30 bg-[#111827] border border-white/[0.08] focus:outline-none focus:border-[#3B82F6]/45 transition-all duration-300 shadow-[0_2px_16px_rgba(0,0,0,0.22)]"
            />
          </div>

          <div
            className="mt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-6"
            role="toolbar"
            aria-label="Blog actions"
          >
            <button
              type="button"
              onClick={() => navigate(blogPath(user, "write"))}
              className="group inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold tracking-[-0.01em] text-white bg-gradient-to-br from-[#3B82F6] to-[#2563EB] shadow-[0_4px_20px_rgba(59,130,246,0.28)] transition-all duration-[250ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(59,130,246,0.38)] active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070D] cursor-pointer sm:min-w-[160px]"
            >
              <SquarePen className="h-[18px] w-[18px] shrink-0 transition-colors duration-[250ms] ease-out group-hover:text-white" />
              Write Blog
            </button>

            <span
              aria-hidden="true"
              className="hidden sm:block h-5 w-px bg-white/[0.12]"
            />

            <button
              type="button"
              onClick={() => navigate(blogPath(user, "manage"))}
              className="group inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 text-[15px] font-semibold tracking-[-0.01em] text-white backdrop-blur-sm transition-all duration-[250ms] ease-out hover:-translate-y-0.5 hover:border-[#3B82F6] hover:bg-white/[0.07] hover:text-white hover:shadow-[0_6px_24px_rgba(59,130,246,0.14)] active:translate-y-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070D] cursor-pointer sm:min-w-[180px]"
            >
              <FolderOpen className="h-[18px] w-[18px] shrink-0 text-white/75 transition-colors duration-[250ms] ease-out group-hover:text-[#3B82F6]" />
              Manage Blogs
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BlogHero;
