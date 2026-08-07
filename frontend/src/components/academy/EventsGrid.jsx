import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAllEvents } from "../../controllers/eventsController.js";
import { Calendar, User, MapPin, Clock, Globe, Building2, Search, Filter, ChevronLeft, ChevronRight, X } from "lucide-react";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";
import EventWorldMap from "./EventWorldMap.jsx";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Compact month picker — trigger looks like the other filter chips; clicking
// opens a small popover with a year switcher and a 3×4 month grid. `value` is
// "YYYY-MM" (matches the API); "" means no filter.
function MonthPicker({ value, onChange }) {
  const today = new Date();
  const [open, setOpen] = React.useState(false);
  // Which year the grid is currently showing. Defaults to the selected year,
  // or the current year when nothing is selected.
  const [viewYear, setViewYear] = React.useState(() => {
    if (value) return Number(value.slice(0, 4));
    return today.getFullYear();
  });
  const rootRef = React.useRef(null);

  // Sync viewYear when the parent flips value externally (e.g. Clear button).
  React.useEffect(() => {
    if (value) setViewYear(Number(value.slice(0, 4)));
  }, [value]);

  // Close on outside click.
  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const selectedYear = value ? Number(value.slice(0, 4)) : null;
  const selectedMonth = value ? Number(value.slice(5, 7)) - 1 : null;

  const label = value
    ? `${MONTH_LONG[selectedMonth]} ${selectedYear}`
    : "Month, Year";

  const pick = (monthIdx) => {
    const v = `${viewYear}-${String(monthIdx + 1).padStart(2, "0")}`;
    onChange(v);
    setOpen(false);
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange("");
    setViewYear(today.getFullYear());
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 rounded-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:outline-none px-4 py-2 text-sm min-w-[160px] transition-colors ${
          value ? "text-white" : "text-gray-400"
        }`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Calendar className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {value && (
          <span
            onClick={clear}
            role="button"
            aria-label="Clear month filter"
            className="p-0.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute z-30 mt-2 right-0 sm:right-auto sm:left-0 w-64 rounded-xl border border-white/10 bg-gray-950/95 backdrop-blur-md shadow-2xl p-3"
        >
          {/* Year switcher */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="h-7 w-7 rounded-md hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center"
              aria-label="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-white select-none">
              {viewYear}
            </div>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="h-7 w-7 rounded-md hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center"
              aria-label="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* 3×4 month grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_NAMES.map((name, i) => {
              const isSelected =
                selectedYear === viewYear && selectedMonth === i;
              const isCurrent =
                today.getFullYear() === viewYear && today.getMonth() === i;
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => pick(i)}
                  className={`px-2 py-2 rounded-md text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-blue-500 text-white"
                      : isCurrent
                        ? "border border-blue-500/40 text-blue-200 hover:bg-blue-500/10"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {name}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={clear}
              className="mt-3 w-full text-xs text-gray-400 hover:text-white text-center py-1.5 rounded-md hover:bg-white/5"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({ evt, onRegister }) {
  const navigate = useNavigate();

  // Normalize image src - convert empty strings to null for proper text-based fallback
  const imageSrc = (evt.featuredImage || evt.image || "").trim() || null;

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const handleCardClick = (e) => {
    // Don't navigate if clicking on the register button
    if (e.target.closest("button")) {
      return;
    }
    navigate(`/events/${evt.id}`);
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="card overflow-hidden cursor-pointer hover:bg-gray-800/70 transition-colors"
      onClick={handleCardClick}
    >
      <div className="aspect-[16/9] w-full bg-muted overflow-hidden">
        <ImageWithFallback
          src={imageSrc}
          fallback="/assets/placeholder.jpg"
          alt={evt.title}
          className="h-full w-full object-cover"
          useDynamicFallback={true}
        />
      </div>
      <div className="card-body">
        <div className="flex items-center gap-2 mb-2">
          {evt.type === "online" ? (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Globe className="h-3 w-3" /> Online
            </span>
          ) : evt.type === "campus" ? (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
              <Building2 className="h-3 w-3" /> Campus
            </span>
          ) : null}
          {evt.category && (
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              {evt.category}
            </span>
          )}
          {evt.region && (
            <span className="inline-flex items-center text-xs px-2 py-0.5 rounded bg-gray-700/40 text-gray-300 border border-gray-600/40">
              {evt.region}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-base mb-2 line-clamp-2">
          {evt.title}
        </h3>
        <div className="text-xs text-gray-400 space-y-1.5 mb-2">
          {evt.dateTime && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>{formatDate(evt.dateTime)}</span>
              {formatTime(evt.dateTime) && (
                <span className="text-gray-500">
                  • {formatTime(evt.dateTime)}
                </span>
              )}
            </div>
          )}
          {evt.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{evt.location}</span>
            </div>
          )}
          {(evt.instructor || evt.organizerName) && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">
                {evt.instructor || `Organized by ${evt.organizerName}`}
              </span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-300 mt-2 line-clamp-2 mb-3">
          {evt.excerpt || evt.description || ""}
        </p>
        <button
          className="btn btn-primary rounded-full w-full opacity-100 visible"
          style={{ visibility: "visible", opacity: 1 }}
          onClick={(e) => {
            e.stopPropagation();
            onRegister(evt);
          }}
        >
          Register
        </button>
      </div>
    </motion.div>
  );
}

const EVENT_REGIONS = ["UAE", "India", "UK", "USA", "Europe", "Asia", "Global"];
const EVENT_CATEGORIES = [
  "Expo",
  "Conference",
  "Webinar",
  "Meetup",
  "Workshop",
  "Competition",
  "Seminar",
];

function EventsGrid({ onOpenRegister }) {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [timeFilter, setTimeFilter] = React.useState("upcoming");
  const [query, setQuery] = React.useState("");
  const [regionFilter, setRegionFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [monthFilter, setMonthFilter] = React.useState("");
  const itemsPerPage = 6;

  // Server-supported filters. These reach the API so search/type/region/
  // category/month apply across ALL events, not just the loaded page.
  const serverFilters = React.useMemo(
    () => ({
      search: query.trim() || undefined,
      type: typeFilter !== "all" ? typeFilter : undefined,
      region: regionFilter || undefined,
      category: categoryFilter || undefined,
      month: monthFilter || undefined,
    }),
    [query, typeFilter, regionFilter, categoryFilter, monthFilter]
  );

  const loadEvents = React.useCallback(async (pageToLoad, filters = {}) => {
    setLoading(true);
    try {
      const response = await getAllEvents({
        page: pageToLoad,
        size: itemsPerPage,
        ...filters,
      });
      const newEvents = response.data || [];
      const pagination = response.pagination || {};

      setEvents((prev) =>
        pageToLoad === 1 ? newEvents : [...prev, ...newEvents]
      );

      if (pagination.totalPages) {
        setHasMore(pageToLoad < pagination.totalPages);
      } else {
        setHasMore(newEvents.length >= itemsPerPage);
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch page 1 whenever a server filter changes. Debounced so typing in
  // the search box does not fire a request per keystroke.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadEvents(1, serverFilters);
    }, 300);
    return () => clearTimeout(timer);
  }, [serverFilters, loadEvents]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadEvents(nextPage, serverFilters);
  };

  const clearAllFilters = () => {
    setTypeFilter("all");
    setTimeFilter("all");
    setQuery("");
    setRegionFilter("");
    setCategoryFilter("");
    setMonthFilter("");
  };

  // Upcoming/past is not a server param yet, so it stays a client refinement
  // on the server-filtered results. (Flagged to backend for a date-range param.)
  const now = Date.now();
  const filtered = React.useMemo(() => {
    if (timeFilter === "all") return events;
    return events.filter((evt) => {
      if (!evt.dateTime) return true;
      const ts = new Date(evt.dateTime).getTime();
      if (timeFilter === "upcoming" && ts < now) return false;
      if (timeFilter === "past" && ts >= now) return false;
      return true;
    });
  }, [events, timeFilter, now]);

  return (
    <section
      id="events"
      className="py-20 bg-black relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <h2 className="text-xl font-semibold">Events</h2>
          <div className="text-xs text-gray-500">
            {filtered.length} {filtered.length === 1 ? "event" : "events"}
          </div>
        </div>

        <div className="mb-6">
          <EventWorldMap
            events={events}
            activeRegion={regionFilter}
            onSelectRegion={(region) => {
              setRegionFilter(region);
              setPage(1);
            }}
          />
        </div>

        <div className="mb-6 flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full rounded-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:outline-none pl-10 pr-4 py-2 text-sm text-white"
            />
          </div>

          <div className="inline-flex rounded-full bg-gray-900 border border-gray-700 p-1">
            {["upcoming", "past", "all"].map((v) => (
              <button
                key={v}
                onClick={() => setTimeFilter(v)}
                className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                  timeFilter === v
                    ? "bg-blue-500 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          <div className="inline-flex rounded-full bg-gray-900 border border-gray-700 p-1">
            {[
              { key: "all", label: "All" },
              { key: "online", label: "Online", icon: Globe },
              { key: "campus", label: "Campus", icon: Building2 },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <button
                  key={v.key}
                  onClick={() => setTypeFilter(v.key)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-full transition-all ${
                    typeFilter === v.key
                      ? "bg-blue-500 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>

          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="rounded-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:outline-none px-4 py-2 text-sm text-white"
            aria-label="Filter by region"
          >
            <option value="">All Regions</option>
            {EVENT_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-full bg-gray-900 border border-gray-700 focus:border-blue-500 focus:outline-none px-4 py-2 text-sm text-white"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {EVENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Month filter — compact popover with year switcher + 3×4 grid. */}
          <MonthPicker
            value={monthFilter}
            onChange={(v) => setMonthFilter(v)}
          />
        </div>

        {filtered.length === 0 && !loading ? (
          <div className="text-center py-12 card">
            <div className="card-body">
              <div className="text-gray-400 mb-2">
                No events match your filters.
              </div>
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((evt) => (
              <EventCard key={evt.id} evt={evt} onRegister={onOpenRegister} />
            ))}
          </div>
        )}

        {loading && events.length === 0 && (
          <div className="text-center py-12 text-gray-500">Loading events...</div>
        )}

        <div className="text-center mt-8">
          {loading && events.length > 0 && (
            <div className="mb-4 text-sm text-gray-400">Loading more...</div>
          )}

          {!loading && hasMore && (
            <button
              onClick={handleLoadMore}
              className="btn btn-secondary rounded-full opacity-100 visible"
              style={{ visibility: 'visible', opacity: 1 }}
            >
              View More Events
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default EventsGrid;
