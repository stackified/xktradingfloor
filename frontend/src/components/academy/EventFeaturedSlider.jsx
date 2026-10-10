import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Star, ArrowRight, CalendarDays } from "lucide-react";
import { getAllEvents } from "../../controllers/eventsController.js";
import EventImage from "../shared/EventImage.jsx";
import EventBadges from "../shared/EventBadges.jsx";
import { formatEventDate, formatEventPlace } from "../../utils/eventTime.js";
import { eventSummary } from "../../utils/eventDescription.js";
import { eventPath } from "../../utils/eventUrl.js";

const SLIDES = 3;
const AUTO_ADVANCE_MS = 7000;

function eventTime(evt) {
  const t = new Date(evt?.dateTime || evt?.date || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// Which events the slider shows (the client's rule: "I will pick myself; if
// nothing is selected, let it be anything").
//   1. Events the admin marked as featured (`isFeatured`), soonest first.
//   2. Topped up with upcoming events, soonest first.
//   3. Then the most recent past events.
// Narrowed to the chosen category when one is selected.
export function pickFeaturedEvents(events, category = "", now = Date.now(), limit = SLIDES) {
  const pool = (Array.isArray(events) ? events : []).filter(
    (e) => !category || e.category === category
  );
  const featured = pool.filter((e) => e.isFeatured).sort((a, b) => eventTime(a) - eventTime(b));
  const upcoming = pool
    .filter((e) => !e.isFeatured && eventTime(e) >= now)
    .sort((a, b) => eventTime(a) - eventTime(b));
  const past = pool
    .filter((e) => !e.isFeatured && eventTime(e) > 0 && eventTime(e) < now)
    .sort((a, b) => eventTime(b) - eventTime(a));
  return [...featured, ...upcoming, ...past].slice(0, limit);
}

// In the event's own time zone when it has one (utils/eventTime.js).
function formatDate(evt) {
  if (!eventTime(evt)) return "";
  if (evt.dateTime) return formatEventDate(evt, { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  return new Date(eventTime(evt)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Three featured events, styled like the blog's featured slider. `category`
// comes from the "Browse by Category" cards on the Events page.
function EventFeaturedSlider({ category = "" }) {
  const [events, setEvents] = React.useState([]);
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    getAllEvents({ size: 50 })
      .then((res) => { if (!cancelled) setEvents(res?.data || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const slides = React.useMemo(() => pickFeaturedEvents(events, category), [events, category]);

  React.useEffect(() => { setIndex(0); }, [category, slides.length]);

  React.useEffect(() => {
    if (slides.length <= 1 || paused) return undefined;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [slides.length, paused]);

  if (slides.length === 0) return null;

  const go = (next) => setIndex((next + slides.length) % slides.length);
  const current = slides[Math.min(index, slides.length - 1)];
  const imageSrc = ((current.featuredImage || current.image || "").trim() || null);

  return (
    <section
      className="mb-10"
      aria-roledescription="carousel"
      aria-label={category ? `Featured ${category} events` : "Featured events"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-white">
          <Star className="h-3.5 w-3.5 fill-[#3B82F6] text-[#3B82F6]" aria-hidden="true" />
          {category ? `Featured ${category} events` : "Featured events"}
        </h3>
        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => go(index - 1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-gray-300 transition-colors hover:border-[#3B82F6] hover:text-white"
              aria-label="Previous featured event"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-gray-300 transition-colors hover:border-[#3B82F6] hover:text-white"
              aria-label="Next featured event"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div
        className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-white/[0.08] bg-[#0B1120] p-4 sm:p-5 lg:grid-cols-[55fr_45fr] lg:gap-10 lg:p-6"
        aria-live="polite"
      >
        <Link to={eventPath(current)} className="block overflow-hidden rounded-xl" aria-label={current.title}>
          <EventImage src={imageSrc} alt={current.title} />
        </Link>
        <div className="min-w-0">
          <EventBadges evt={current} className="mb-3" />
          <p className="mb-2 flex items-center gap-1.5 text-sm text-gray-400">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {formatDate(current)}
            {formatEventPlace(current) ? ` · ${formatEventPlace(current)}` : ""}
          </p>
          <h4 className="mb-3 font-display text-xl font-bold leading-tight text-white sm:text-2xl lg:text-3xl">
            <Link to={eventPath(current)} className="hover:text-[#93C5FD]">
              {current.title}
            </Link>
          </h4>
          {eventSummary(current) && (
            <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-gray-300 sm:text-base">
              {eventSummary(current)}
            </p>
          )}
          <Link
            to={eventPath(current)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] px-5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            View event
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              className="flex h-6 items-center px-1"
              aria-label={`Featured event ${i + 1} of ${slides.length}`}
              aria-current={i === index ? "true" : undefined}
            >
              <span
                className="block h-1.5 rounded-full transition-all"
                style={{ width: i === index ? 22 : 6, backgroundColor: i === index ? "#3B82F6" : "rgba(255,255,255,0.18)" }}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default EventFeaturedSlider;
