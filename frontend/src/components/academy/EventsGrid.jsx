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

  React.useEffect(() => {
    (async () => setEvents(await getAllEvents()))();
  }, []);

  return (
    <section
      id="academy-events"
      className="py-20 bg-black relative overflow-hidden"
    >
      {/* Background decoration */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div> */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <h2 className="text-xl font-semibold mb-4">Events</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((evt) => (
            <EventCard key={evt.id} evt={evt} onRegister={onOpenRegister} />
          ))}
        </div>
        {/* View Past Events button - functionality not implemented yet */}
        {/* <div className="text-center mt-6">
          <button className="btn btn-secondary rounded-full opacity-100 visible" style={{ visibility: 'visible', opacity: 1 }}>
            View Past Events
          </button>
        </div> */}
      </div>
    </section>
  );
}

export default EventsGrid;
