import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, X, ExternalLink, Loader2 } from "lucide-react";
import StarRating from "../../components/reviews/StarRating.jsx";
import { listTraderReviewsForModeration, moderateTraderReview } from "../../controllers/traderReviewsController.js";

const TABS = [
  { value: "pending", label: "Waiting for review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

// Moderation of reviews of verified traders (B23 point 5): a review is
// public only after an admin approves it. Screenshots are private and open
// through a short-lived link.
export default function AdminTraderReviews() {
  const [status, setStatus] = React.useState("pending");
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [busyId, setBusyId] = React.useState(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await listTraderReviewsForModeration({ status });
      setReviews(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load the reviews.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function decide(review, next) {
    setBusyId(review._id);
    setError("");
    try {
      await moderateTraderReview(review._id, next);
      setReviews((prev) => prev.filter((r) => r._id !== review._id));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update the review.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Admin dashboard
      </Link>
      <h1 className="mb-1 text-2xl font-semibold">Trader reviews</h1>
      <p className="mb-6 text-sm text-gray-400">
        Reviews of verified traders appear on their profile only after approval. Check the proof before approving.
      </p>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={status === t.value}
            onClick={() => setStatus(t.value)}
            className={`rounded-full border px-4 py-1.5 text-sm ${status === t.value ? "border-blue-500 bg-blue-500/15 text-white" : "border-white/10 text-gray-300 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mb-4 text-sm text-red-300">{error}</p>}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-gray-400">Nothing here.</p>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review._id} className="rounded-xl border border-white/10 bg-gray-900/40 p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div className="text-sm">
                  <div className="text-white">
                    <span className="font-medium">{review.userId?.fullName || "Unknown user"}</span>
                    {review.userId?.email && <span className="text-gray-400"> ({review.userId.email})</span>}
                  </div>
                  <div className="text-gray-400">
                    about{" "}
                    {review.traderId?._id ? (
                      <Link to={`/users/${review.traderId._id}`} className="text-blue-400 hover:underline">
                        {review.traderId.fullName}
                      </Link>
                    ) : (
                      "a trader"
                    )}
                    {" · "}
                    {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                </div>
                <StarRating value={review.rating} size={16} />
              </div>
              <p className="whitespace-pre-line text-sm text-gray-200">{review.content}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {review.screenshotUrl ? (
                  <a href={review.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:underline">
                    Open proof <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-gray-500">No proof attached</span>
                )}
                <div className="ml-auto flex gap-2">
                  {status !== "approved" && (
                    <button type="button" disabled={busyId === review._id} onClick={() => decide(review, "approved")} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50">
                      <Check className="h-4 w-4" /> Approve
                    </button>
                  )}
                  {status !== "rejected" && (
                    <button type="button" disabled={busyId === review._id} onClick={() => decide(review, "rejected")} className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50">
                      <X className="h-4 w-4" /> {status === "approved" ? "Unpublish" : "Reject"}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
