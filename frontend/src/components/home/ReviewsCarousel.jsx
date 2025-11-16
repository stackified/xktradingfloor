import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllReviews } from '../../controllers/reviewsController.js';
import { Star } from 'lucide-react';

function Stars({ rating }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`} fill={i < rating ? 'currentColor' : 'none'} />
      ))}
    </div>
  );
}

function ReviewsCarousel() {
  const [items, setItems] = React.useState([]);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    (async () => setItems(await getAllReviews()))();
  }, []);

  React.useEffect(() => {
    if (items.length === 0) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 3500);
    return () => clearInterval(t);
  }, [items]);

  const current = items[index] || {};

  return (
    <section id="reviews" className="py-14">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-xl font-semibold mb-6">What Traders Say</h2>
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id || 'empty'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="card"
            >
              <div className="card-body">
                <div className="flex items-center justify-center mb-3">
                  <div className="h-12 w-12 rounded-full bg-muted overflow-hidden">
                    {current.avatar && <img src={current.avatar} alt={current.name} className="h-full w-full object-cover" />}
                  </div>
                </div>
                <Stars rating={current.rating || 0} />
                <p className="text-gray-200 mt-3">{current.text}</p>
                <div className="text-sm text-gray-400 mt-2">{current.name} • {current.role}</div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default ReviewsCarousel;


