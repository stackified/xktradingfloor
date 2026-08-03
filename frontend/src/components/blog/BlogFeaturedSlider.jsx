import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";
import { getAssetPath } from "../../utils/assets.js";
import { BLOG_CONTAINER, BLOG_COLORS, BLOG_NAV_BTN } from "./blogLayout.js";

const FALLBACK_IMAGE = "/assets/blog-hero-globe.jpg";

function BlogFeaturedSlider({ posts = [] }) {
  const navigate = useNavigate();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  const slides = posts.slice(0, 5);

  React.useEffect(() => {
    setIndex(0);
  }, [posts.length]);

  React.useEffect(() => {
    if (slides.length <= 1 || paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;

  const goTo = (next) => setIndex((next + slides.length) % slides.length);

  return (
    <section
      className={`${BLOG_CONTAINER} pt-16 pb-0`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured stories"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Star className="h-3.5 w-3.5 text-[#3B82F6] fill-[#3B82F6]" />
          <span className="text-[13px] font-semibold text-white uppercase tracking-[0.1em]">
            Featured Story
          </span>
        </div>

        {slides.length > 1 && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className={BLOG_NAV_BTN}
              aria-label="Previous featured story"
            >
              <ChevronLeft className="h-5 w-5 text-[#94A3B8] group-hover:text-white transition-colors duration-300" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className={BLOG_NAV_BTN}
              aria-label="Next featured story"
            >
              <ChevronRight className="h-5 w-5 text-[#94A3B8] group-hover:text-white transition-colors duration-300" />
            </button>
          </div>
        )}
      </div>

      <div className="rounded-[20px] border border-white/[0.08] bg-[#0B1120] p-5 lg:p-6 shadow-[0_6px_32px_rgba(0,0,0,0.28)]">
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-6 lg:gap-10 items-center">
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#05070D]">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                className="absolute inset-0 transition-opacity duration-300 ease-in-out"
                style={{ opacity: i === index ? 1 : 0, zIndex: i === index ? 1 : 0 }}
                aria-hidden={i !== index}
              >
                <ImageWithFallback
                  src={slide.image || FALLBACK_IMAGE}
                  fallback={getAssetPath(FALLBACK_IMAGE)}
                  alt={slide.title}
                  useDynamicFallback
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              </div>
            ))}
            <span className="absolute top-3.5 left-3.5 z-10 rounded-full bg-[#3B82F6] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
              Featured
            </span>
          </div>

          <div className="relative min-h-[280px] lg:min-h-[300px] flex items-center">
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                className="w-full transition-opacity duration-300 ease-in-out"
                style={{
                  opacity: i === index ? 1 : 0,
                  position: i === index ? "relative" : "absolute",
                  inset: i === index ? undefined : 0,
                  pointerEvents: i === index ? "auto" : "none",
                }}
                aria-hidden={i !== index}
              >
                <span className="mb-3 block text-[11px] font-bold uppercase tracking-[0.12em] text-[#3B82F6]">
                  {(slide.category || "Featured").toUpperCase()}
                </span>

                <h2 className="mb-4 max-w-[650px] text-[26px] sm:text-[34px] lg:text-[48px] font-extrabold leading-[1.1] text-white">
                  {slide.title}
                </h2>

                <p className="mb-5 max-w-[580px] line-clamp-3 text-[15px] lg:text-[16px] leading-[1.75] text-[#A1A1AA]">
                  {slide.excerpt || "Read the latest insights from our trading community."}
                </p>

                <div className="mb-6 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-[#1E293B] text-[11px] font-bold text-white">
                    {(slide.author || "A").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[13px] leading-none text-[#94A3B8]">
                    {slide.author} - {slide.date} - {slide.readTime}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/blog/${slide.id}`)}
                  className="inline-flex h-[46px] items-center gap-2 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] px-6 text-[14px] font-semibold text-white shadow-[0_4px_18px_rgba(59,130,246,0.3)] transition-all duration-300 hover:brightness-110"
                >
                  Read Article -
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="mt-5 flex justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 22 : 6,
                backgroundColor: i === index ? BLOG_COLORS.blue : "rgba(255,255,255,0.12)",
              }}
              aria-label={`Featured story ${i + 1} of ${slides.length}`}
              aria-current={i === index ? "true" : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default BlogFeaturedSlider;
