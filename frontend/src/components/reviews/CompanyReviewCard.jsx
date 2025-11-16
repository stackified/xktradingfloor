import React from "react";
import StarRating from "./StarRating.jsx";
import { deleteReview } from "../../controllers/reviewsController.js";
import { getAssetPath } from "../../utils/assets.js";

function CompanyReviewCard({ review, currentUserId, onUpdate, onDelete }) {
  const [deleting, setDeleting] = React.useState(false);
  const isOwner = review.userId === currentUserId;

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
            {isOwner && (
              <div className="flex items-center gap-2 flex-shrink-0">
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
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mb-2">
        <StarRating value={review.rating} size={16} />
      </div>
      <h4 className="font-semibold mb-2">{review.title}</h4>
      <p className="text-gray-300 text-sm leading-relaxed">{review.body}</p>
    </div>
  );
}

export default CompanyReviewCard;
