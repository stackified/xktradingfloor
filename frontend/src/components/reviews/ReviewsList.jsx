import React from 'react';
import { getAllReviews } from '../../controllers/reviewsController.js';
import ReviewCard from './ReviewCard.jsx';
import EmptyReviews from './EmptyReviews.jsx';

function ReviewsList({ rating }) {
  const [list, setList] = React.useState([]);

  React.useEffect(() => {
    (async () => setList(await getAllReviews()))();
  }, []);

  const filtered = rating === 'All' ? list : list.filter(r => r.rating === rating);

  if (filtered.length === 0) return <EmptyReviews />;

  return (
    <div id="reviews-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map(r => <ReviewCard key={r.id} review={r} />)}
    </div>
  );
}

export default ReviewsList;


