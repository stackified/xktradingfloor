import React from "react";
import { Flag } from "lucide-react";
import StarRating from "./StarRating.jsx";
import { deleteReview, reportReview } from "../../controllers/reviewsController.js";
import { getAssetPath } from "../../utils/assets.js";
import { useSelector } from "react-redux";
import { getUserCookie } from "../../utils/cookies.js";

function CompanyReviewCard({ review, currentUserId, onUpdate, onDelete }) {
  const [deleting, setDeleting] = React.useState(false);
  const [reporting, setReporting] = React.useState(false);
  const isOwner = review.userId === currentUserId;
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();
  const userRole = user?.role?.toLowerCase();
  // Only operator and admin can report reviews
  const canReport = userRole === "operator" || userRole === "admin";

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this review?")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteReview(review.id);
      onDelete?.();
    } catch (error) {
      alert(error.message || "Failed to delete review");
    } finally {
      setDeleting(false);
    }
  }

  async function handleReport() {
    const reason = window.prompt(
      "Please provide a reason for reporting this review:",
      "suspicious content"
    );
    if (!reason?.trim()) return;

    setReporting(true);
    try {
      await reportReview(review.id, reason.trim());
      alert("Review reported successfully. Our team will review it.");
    } catch (error) {
      alert(error.message || "Failed to report review");
    } finally {
      setReporting(false);
    }
  }

  return (
    <div className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/30 transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
          <img
            src={getAssetPath(review.userAvatar)}
            alt={review.userName}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.target.src = getAssetPath("/assets/users/default-avatar.jpg");
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{review.userName}</div>
              <div className="text-xs text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {review.updatedAt !== review.createdAt && (
                  <span className="ml-2 text-gray-500">(edited)</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {isOwner && (
                <>
                  <button
                    onClick={() => onUpdate?.(review)}
                    className="text-xs text-accent hover:text-accent/80"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </>
              )}
              {!isOwner && canReport && (
                <button
                  onClick={handleReport}
                  disabled={reporting}
                  className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50 flex items-center gap-1"
                  title="Report suspicious content"
                >
                  <Flag className="h-3 w-3" />
                  {reporting ? "Reporting..." : "Report"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="mb-2">
        <StarRating value={review.rating} size={16} />
      </div>
      {review.title && <h4 className="font-semibold mb-2">{review.title}</h4>}
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
      <p className="text-gray-300 text-sm leading-relaxed">
        {review.description || review.body}
      </p>
      {review.screenshot && (
        <img
          src={review.screenshot}
          alt="Review screenshot"
          className="mt-3 max-w-xs rounded-lg"
        />
      )}
    </div>
  );
}

export default CompanyReviewCard;
