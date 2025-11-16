import React from 'react';
import { motion } from 'framer-motion';
import { getAllEvents } from '../../controllers/eventsController.js';
import { Link, useNavigate } from 'react-router-dom';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

function EventCard({ evt, onClick }) {
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
      <div className="h-40 w-full bg-muted">
        <ImageWithFallback src={evt.image || '/assets/placeholder.jpg'} fallback="/assets/placeholder.jpg" alt={evt.title} className="h-full w-full object-cover" />
      </div>
      <div className="card-body">
        <div className="text-xs text-gray-400">{formatDate(evt.dateTime || evt.date)}</div>
        <div className="font-semibold mt-1">{evt.title}</div>
        <div className="text-sm text-gray-400 mt-1 line-clamp-2">{evt.excerpt || evt.description || ''}</div>
      </div>
    </motion.div>
  );
}

function FeaturedEvents() {
  const [events, setEvents] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    (async () => setEvents(await getAllEvents()))();
  }, []);

  return (
    <section className="py-20 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Upcoming Events & Webinars</h2>
          <Link to="/academy" className="text-sm text-accent hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.slice(0,4).map((evt) => (
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


