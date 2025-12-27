import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getAllEvents } from "../../controllers/eventsController.js";
import { Calendar, User, MapPin, Clock, Globe, Building2 } from "lucide-react";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";

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
      <div className="h-40 w-full bg-muted">
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
          {evt.instructor && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{evt.instructor}</span>
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

function EventsGrid({ onOpenRegister }) {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const itemsPerPage = 6;

  const loadEvents = React.useCallback(async (pageToLoad) => {
    setLoading(true);
    try {
      const response = await getAllEvents({ page: pageToLoad, size: itemsPerPage });
      const newEvents = response.data || [];
      const pagination = response.pagination || {};

      setEvents(prev => pageToLoad === 1 ? newEvents : [...prev, ...newEvents]);

      // key is strictly keeping track of if we have more pages
      // If we are on page 1 and total pages is 1, hasMore is false.
      // If we are on page 1 and total pages is 2, hasMore is true.
      if (pagination.totalPages) {
        setHasMore(pageToLoad < pagination.totalPages);
      } else {
        setHasMore(newEvents.length >= itemsPerPage); // Fallback assumption
      }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadEvents(1);
  }, [loadEvents]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadEvents(nextPage); // loadEvents is optimized to append
  };

  return (
    <section
      id="academy-events"
      className="py-20 bg-black relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className="text-xl font-semibold mb-4">Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((evt) => (
            <EventCard key={evt.id} evt={evt} onRegister={onOpenRegister} />
          ))}
        </div>

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
