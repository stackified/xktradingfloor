import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Loader2 } from "lucide-react";
import StarRating from "../reviews/StarRating.jsx";
import { getTraderReviews, createTraderReview } from "../../controllers/traderReviewsController.js";
import { getUserCookie } from "../../utils/cookies.js";
import { reviewerName } from "../../utils/reviewerName.js";

const PAGE_SIZE = 5;

// Reviews tab on a verified trader's public profile (B23 point 5): approved
// reviews, and a form for signed-in visitors. New reviews appear once XK has
// checked them.
function TraderReviews({ traderId, traderName, summary }) {
  const user = getUserCookie();
  const userId = String(user?._id || user?.id || "");
  const isSelf = userId && userId === String(traderId);

  const [reviews, setReviews] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [average, setAverage] = React.useState(summary?.average || 0);
  const [total, setTotal] = React.useState(summary?.count || 0);
  const [loading, setLoading] = React.useState(true);

  const [rating, setRating] = React.useState(0);
  const [content, setContent] = React.useState("");
  const [screenshot, setScreenshot] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const [sent, setSent] = React.useState(false);

  const load = React.useCallback(async (nextPage) => {
    setLoading(true);
    try {
      const res = await getTraderReviews(traderId, { page: nextPage, size: PAGE_SIZE });
      setReviews((prev) => (nextPage === 1 ? res.data : [...prev, ...res.data]));
      setTotalPages(res.totalPages || 1);
      setAverage(res.ratingAverage || 0);
      setTotal(res.totalItems || 0);
    } catch {
      // A failure here never breaks the profile; the section just stays empty.
    } finally {
      setLoading(false);
    }
  }, [traderId]);

  React.useEffect(() => {
    setPage(1);
    load(1);
  }, [load]);

  async function submit(e) {
    e.preventDefault();
    setFormError("");
    if (!rating) return setFormError("Choose a rating from 1 to 5 stars.");
    if (!content.trim()) return setFormError("Write a few words about this trader.");
    setSending(true);
    try {
      await createTraderReview(traderId, { rating, content: content.trim(), screenshot });
      setSent(true);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-gray-900/40 p-5 sm:p-6" aria-labelledby="trader-reviews-title">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="trader-reviews-title" className="flex items-center gap-2 text-lg font-semibold text-white">
          <MessageSquare className="h-5 w-5 text-blue-400" aria-hidden="true" />
          Reviews ({total})
        </h2>
        {total > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <StarRating value={average} size={16} />
            <span>{Number(average).toFixed(1)} out of 5</span>
          </div>
        )}
      </div>

      {reviews.length === 0 && !loading && (
        <p className="text-sm text-gray-400">No reviews yet. Traded with {traderName}? Share how it went.</p>
      )}

      <ul className="space-y-4">
        {reviews.map((review) => (
          <li key={review._id} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-white">{reviewerName({ userId: review.user, userName: review.user?.fullName })}</span>
              <span className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </span>
            </div>
            <StarRating value={review.rating} size={14} />
            <p className="mt-2 whitespace-pre-line text-sm text-gray-300">{review.content}</p>
          </li>
        ))}
      </ul>

      {page < totalPages && (
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            const next = page + 1;
            setPage(next);
            load(next);
          }}
          className="mt-4 text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
        >
          {loading ? "Loading…" : "Show more reviews"}
        </button>
      )}

      <div className="mt-6 border-t border-white/10 pt-5">
        {isSelf ? null : !userId ? (
          <p className="text-sm text-gray-300">
            <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} className="text-blue-400 underline">
              Sign in
            </Link>{" "}
            to write a review of {traderName}.
          </p>
        ) : sent ? (
          <p role="status" className="text-sm text-green-300">
            Thanks! Your review will appear once the XK team has checked it.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Write a review of {traderName}</h3>
            <div>
              <span className="mb-1 block text-xs text-gray-400">Your rating</span>
              <StarRating value={rating} onChange={setRating} size={22} />
            </div>
            <label className="block">
              <span className="mb-1 block text-xs text-gray-400">Your review</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={5000}
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-gray-900/70 p-3 text-sm text-white focus:border-blue-500/50 focus:outline-none"
                placeholder="What was it like following or learning from this trader?"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-gray-400">
                Proof (optional screenshot, seen only by the XK team)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                className="text-sm text-gray-300"
              />
            </label>
            {formError && <p role="alert" className="text-sm text-red-300">{formError}</p>}
            <button type="submit" disabled={sending} className="btn btn-primary inline-flex items-center gap-2 disabled:opacity-60">
              {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {sending ? "Sending…" : "Submit review"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

export default TraderReviews;
