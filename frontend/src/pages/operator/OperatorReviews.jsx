import React from "react";
import { Helmet } from "react-helmet-async";
import { Flag, Loader2, AlertTriangle } from "lucide-react";
import { getOperatorReviews, flagReview } from "../../controllers/reviewsController.js";
import ProtectedRoute from "../../components/dashboard/ProtectedRoute.jsx";
import { useSelector } from "react-redux";
import { getUserCookie } from "../../utils/cookies.js";
import StarRating from "../../components/reviews/StarRating.jsx";

function OperatorReviewsContent() {
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();

  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("all"); // all, flagged, hidden

  React.useEffect(() => {
    loadReviews();
  }, [filter]);

  async function loadReviews() {
    setLoading(true);
    try {
      const { data } = await getOperatorReviews({});
      // Filter based on selected filter
      let filtered = data || [];
      if (filter === "flagged") {
        filtered = filtered.filter((r) => r.flags && r.flags.length > 0);
      } else if (filter === "hidden") {
        filtered = filtered.filter((r) => r.isHidden);
      }
      setReviews(filtered);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFlag(reviewId) {
    const flagType = window.prompt(
      "Enter flag type (suspicious, inappropriate, fake, spam):",
      "suspicious"
    );
    if (!flagType?.trim()) return;

    try {
      await flagReview(reviewId, flagType.trim());
      await loadReviews();
    } catch (error) {
      alert("Failed to flag review: " + error.message);
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <Helmet>
        <title>Review Moderation | XK Trading Floor Operator</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Review Moderation</h1>
          <p className="text-sm text-gray-400">
            Manage and moderate reviews for companies you operate
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`btn btn-sm ${
                  filter === "all"
                    ? "btn-primary"
                    : "btn-outline border-white/20 text-white"
                }`}
              >
                All Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setFilter("flagged")}
                className={`btn btn-sm ${
                  filter === "flagged"
                    ? "btn-primary"
                    : "btn-outline border-white/20 text-white"
                }`}
              >
                Flagged
              </button>
              <button
                onClick={() => setFilter("hidden")}
                className={`btn btn-sm ${
                  filter === "hidden"
                    ? "btn-primary"
                    : "btn-outline border-white/20 text-white"
                }`}
              >
                Hidden
              </button>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="rounded-2xl border border-white/10 bg-gray-900/70 backdrop-blur">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading reviews...
            </div>
          )}

          {!loading && reviews.length === 0 && (
            <div className="py-16 text-center text-gray-400">
              <div className="text-lg font-medium mb-2">No reviews found</div>
              <p className="text-sm text-gray-500">
                {filter === "all"
                  ? "No reviews available for moderation."
                  : `No ${filter} reviews found.`}
              </p>
            </div>
          )}

          {!loading && reviews.length > 0 && (
            <div className="divide-y divide-white/5">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">
                            {review.userName || "Anonymous"}
                          </span>
                          {review.isVerified && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">
                              Verified
                            </span>
                          )}
                          {review.isPinned && (
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
                              Pinned
                            </span>
                          )}
                          {review.isHidden && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <StarRating value={review.rating} size={16} />
                          <span className="text-sm text-gray-400">
                            Company ID: {review.companyId}
                          </span>
                        </div>
                      </div>
                    </div>

                    {review.pros && (
                      <div className="text-sm mb-2">
                        <span className="text-green-400 font-semibold">Pros:</span>{" "}
                        <span className="text-gray-300">{review.pros}</span>
                      </div>
                    )}

                    {review.cons && (
                      <div className="text-sm mb-2">
                        <span className="text-red-400 font-semibold">Cons:</span>{" "}
                        <span className="text-gray-300">{review.cons}</span>
                      </div>
                    )}

                    {review.description && (
                      <p className="text-sm text-gray-300 mb-2">{review.description}</p>
                    )}

                    {review.screenshot && (
                      <img
                        src={review.screenshot}
                        alt="Review screenshot"
                        className="mt-2 max-w-xs rounded-lg"
                      />
                    )}

                    {review.flags && review.flags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {review.flags.map((flag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40"
                          >
                            <AlertTriangle className="h-3 w-3 inline mr-1" />
                            {flag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-2">
                      {formatDate(review.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-48">
                    {review.flags && review.flags.length === 0 && (
                      <button
                        type="button"
                        onClick={() => handleFlag(review.id)}
                        className="btn btn-sm btn-outline border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
                      >
                        <Flag className="h-4 w-4" />
                        Flag
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OperatorReviews() {
  return (
    <ProtectedRoute role="operator">
      <OperatorReviewsContent />
    </ProtectedRoute>
  );
}

