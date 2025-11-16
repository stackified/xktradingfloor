import React from 'react';
import { motion } from 'framer-motion';
import StarRating from './StarRating.jsx';

function ReviewCard({ review }) {
  return (
    <motion.div whileHover={{ y: -3 }} className="card hover:bg-gray-800/70">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
            {review.avatar && <img src={review.avatar} alt={review.name} className="h-full w-full object-cover" />}
          </div>
          <div>
            <div className="font-semibold">{review.name}</div>
            <div className="text-xs text-gray-400">{review.role}</div>
          </div>
        </div>
        <StarRating value={review.rating} size={16} />
        <p className="text-gray-200 mt-2">{review.text}</p>
        <div className="text-xs text-gray-500 mt-2">{new Date(review.date).toLocaleDateString()}</div>
      </div>
    </motion.div>
  );
}

export default ReviewCard;


