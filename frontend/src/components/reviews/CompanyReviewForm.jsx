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
  const [screenshotPreview, setScreenshotPreview] = React.useState('');
  const [imageLoadError, setImageLoadError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  // Helper to resolve image URL (R2 URLs are already full URLs)
  const getImageUrl = (path) => {
    if (!path) {
      console.log('getImageUrl: No path provided');
      return '';
    }

    // R2 URLs and blob URLs are already full URLs, return as-is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('blob:') || path.startsWith('data:')) {
      console.log('getImageUrl: Using path as-is:', path);
      return path;
    }

    // Fallback for any relative paths (shouldn't happen with R2, but handle legacy data)
    const hostname = window.location.hostname;
    const port = import.meta.env.VITE_BACKEND_PORT || 8000;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `http://${hostname}:${port}${normalizedPath}`;
    console.log('getImageUrl: Constructed URL:', fullUrl, 'from path:', path);
    return fullUrl;
  };

  // Initialize screenshot preview for existing reviews
  React.useEffect(() => {
    if (existingReview?.screenshot) {
      const imageUrl = getImageUrl(existingReview.screenshot);
      if (imageUrl) {
        setImageLoading(true);
        setScreenshotPreview(imageUrl);
      }
    }
  }, [existingReview?.screenshot]);

  function handleScreenshotChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setImageLoadError(false);
    setImageLoading(true);
    const blobUrl = URL.createObjectURL(file);
    setScreenshotPreview(blobUrl);
  }

  function handleRemoveScreenshot() {
    setScreenshotFile(null);
    setScreenshotPreview('');
    setImageLoadError(false);
    setImageLoading(false);
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
                {imageLoadError ? (
                  <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-red-500/30 bg-red-500/5 p-6 text-center">
                    <div className="rounded-full bg-red-500/10 p-3">
                      <XCircle className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-red-400">Failed to load image</p>
                      <p className="text-xs text-gray-500">The image could not be displayed. Please upload a new one.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      className="btn btn-secondary text-sm"
                    >
                      Remove and upload new image
                    </button>
                  </div>
                ) : (
                  <>
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-900/80 backdrop-blur-sm">
                        <div className="text-center">
                          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent"></div>
                          <p className="mt-2 text-xs text-gray-400">Loading image...</p>
                        </div>
                      </div>
                    )}
                    <img
                      src={screenshotPreview}
                      alt="Screenshot preview"
                      className="max-h-48 w-auto rounded-lg border border-gray-700"
                      onLoad={() => {
                        console.log('Image loaded successfully:', screenshotPreview);
                        setImageLoading(false);
                        setImageLoadError(false);
                      }}
                      onError={(e) => {
                        console.error('Image preview failed to load:', screenshotPreview);
                        setImageLoading(false);
                        setImageLoadError(true);
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-red-500/80 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </>
                )}
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-white/20 bg-gray-900/50 p-4 text-center text-gray-400 hover:border-indigo-400/40 transition-colors">
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

