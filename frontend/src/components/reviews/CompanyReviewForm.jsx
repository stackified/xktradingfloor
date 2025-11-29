import React from 'react';
import { Upload, XCircle } from 'lucide-react';
import { createReview, updateReview } from '../../controllers/reviewsController.js';
import StarRating from './StarRating.jsx';

function CompanyReviewForm({ companyId, existingReview, onSuccess, onCancel }) {
  const [form, setForm] = React.useState({
    rating: existingReview?.rating || 5,
    title: existingReview?.title || '',
    description: existingReview?.description || existingReview?.body || '',
    pros: existingReview?.pros || '',
    cons: existingReview?.cons || '',
  });
  const [screenshotFile, setScreenshotFile] = React.useState(null);
  const [screenshotPreview, setScreenshotPreview] = React.useState(existingReview?.screenshot || '');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  function handleScreenshotChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  }

  function handleRemoveScreenshot() {
    setScreenshotFile(null);
    setScreenshotPreview('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    
    if (!form.description.trim()) {
      setError('Please provide a description.');
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        ...form,
        body: form.description, // For backward compatibility
        screenshot: screenshotFile,
      };
      
      if (existingReview) {
        await updateReview(existingReview.id, reviewData);
      } else {
        await createReview({ companyId, ...reviewData });
      }
      onSuccess?.();
      if (!existingReview) {
        setForm({ rating: 5, title: '', description: '', pros: '', cons: '' });
        setScreenshotFile(null);
        setScreenshotPreview('');
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
              placeholder="Review title (optional)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Description *</label>
            <textarea
              placeholder="Share your experience..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input h-32"
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Pros (optional)</label>
            <textarea
              placeholder="What did you like?"
              value={form.pros}
              onChange={(e) => setForm({ ...form, pros: e.target.value })}
              className="input h-24"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Cons (optional)</label>
            <textarea
              placeholder="What could be improved?"
              value={form.cons}
              onChange={(e) => setForm({ ...form, cons: e.target.value })}
              className="input h-24"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Screenshot (optional)</label>
            {screenshotPreview ? (
              <div className="relative">
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="max-h-48 w-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveScreenshot}
                  className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-red-500/80 px-3 py-1 text-xs font-semibold text-white"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-white/20 bg-gray-900/50 p-4 text-center text-gray-400 hover:border-indigo-400/40">
                <Upload className="h-5 w-5" />
                <span className="text-sm">Upload screenshot</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleScreenshotChange}
                />
              </label>
            )}
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

