import React from 'react';
import { m as motion } from 'framer-motion';
import { getAllEvents } from '../../controllers/eventsController.js';
import { Link, useNavigate } from 'react-router-dom';
import EventImage from '../shared/EventImage.jsx';
import EventBadges from '../shared/EventBadges.jsx';
import { formatEventDate } from '../../utils/eventTime.js';
import { eventSummary } from '../../utils/eventDescription.js';

function eventTime(evt) {
  const t = new Date(evt?.dateTime || evt?.date || 0).getTime();
  return Number.isNaN(t) ? 0 : t;
}

// Upcoming events, soonest first. If nothing is upcoming, the most recent past
// events instead (and the heading says so), so the section never shows an
// event that is already over as if it were still to come.
export function pickHomeEvents(events, now = Date.now(), limit = 4) {
  const list = Array.isArray(events) ? events : [];
  const upcoming = list
    .filter((e) => eventTime(e) >= now)
    .sort((a, b) => eventTime(a) - eventTime(b));
  if (upcoming.length) return { mode: 'upcoming', items: upcoming.slice(0, limit) };
  const past = list.filter((e) => eventTime(e) > 0).sort((a, b) => eventTime(b) - eventTime(a));
  return { mode: 'recent', items: past.slice(0, limit) };
}

function EventCard({ evt, onClick }) {
  // Normalize image src - convert empty strings to null for proper text-based fallback
  const imageSrc = ((evt.featuredImage || evt.image || '').trim() || null);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <motion.div whileHover={{ y: -4 }} className="card overflow-hidden cursor-pointer" onClick={onClick}>
      <EventImage src={imageSrc} alt={evt.title} />
      <div className="card-body">
        <EventBadges evt={evt} showRegion={false} className="mb-2" />
        <div className="text-xs sm:text-sm text-gray-400 mb-2">{evt.dateTime ? formatEventDate(evt) : formatDate(evt.date)}</div>
        <h3 className="font-display font-semibold text-base sm:text-lg tracking-tight mb-2">{evt.title}</h3>
        <div className="text-sm sm:text-base text-gray-300 line-clamp-2">{eventSummary(evt)}</div>
      </div>
    </motion.div>
  );
}

// Same box model as EventCard (16:9 image + card-body), so the grid holds its
// final height from the first paint instead of growing from nothing when the
// events request lands.
function EventCardSkeleton() {
  return (
    <div className="card overflow-hidden" aria-hidden="true">
      <div className="aspect-[16/9] w-full bg-muted" />
      <div className="card-body">
        <div className="h-3 w-24 rounded bg-gray-800/70 mb-2" />
        <div className="h-5 w-3/4 rounded bg-gray-800/70 mb-2" />
        <div className="h-4 w-full rounded bg-gray-800/50" />
      </div>
    </div>
  );
}

function FeaturedEvents() {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getAllEvents({ size: 50 });
        if (!cancelled) setEvents(response.data || []);
      } catch (err) {
        // Homepage must still render if the backend is cold or down.
        console.warn("FeaturedEvents load failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Chosen once data is in. While loading (and in the prerendered snapshot)
  // the heading reads "Upcoming", matching the first client render.
  const { mode, items } = React.useMemo(() => pickHomeEvents(events), [events]);
  const recent = !loading && mode === 'recent';

  return (
    <section className="py-20 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-6 leading-tight"
          >
            {recent ? 'Recent' : 'Upcoming'} <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">Events & Webinars</span>
          </motion.h2>
        </motion.div>
        <div className="flex items-center justify-between mb-4">
          {recent && (
            <p className="text-sm text-gray-400">No upcoming events are listed right now.</p>
          )}
          <Link to="/events" className="text-sm text-blue-400 hover:text-blue-300 hover:underline ml-auto">View all events</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <EventCardSkeleton key={i} />)
            : items.map((evt) => (
              <EventCard
                key={evt.id}
                evt={evt}
                onClick={() => navigate(`/events/${evt.id}`, { state: { event: evt } })}
              />
            ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedEvents;
