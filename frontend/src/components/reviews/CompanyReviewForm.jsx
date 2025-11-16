import React from 'react';
import { createReview, updateReview } from '../../controllers/reviewsController.js';
import StarRating from './StarRating.jsx';

function CompanyReviewForm({ companyId, existingReview, onSuccess, onCancel }) {
  const [form, setForm] = React.useState({
    rating: existingReview?.rating || 5,
    title: existingReview?.title || '',
    body: existingReview?.body || ''
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (!form.title.trim() || !form.body.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (existingReview) {
        await updateReview(existingReview.id, form);
      } else {
        await createReview({ companyId, ...form });
      }
      onSuccess?.();
      if (!existingReview) {
        setForm({ rating: 5, title: '', body: '' });
      }
    } catch (err) {
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="font-semibold mb-4">
          {existingReview ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        {error && (
          <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Rating</label>
            <StarRating
              value={form.rating}
              onChange={(rating) => setForm({ ...form, rating })}
              size={24}
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Review title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <textarea
              placeholder="Share your experience..."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="input h-32"
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </button>
            {existingReview && onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={submitting}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyReviewForm;

