import api from "./api.js";

// Reviews of verified traders (backend B23 point 5, live with PR #150).
// Same rules as company reviews: signed-in users, one review per trader, a
// private screenshot as proof, and an admin check before it is public.

// GET /api/traders/:userId/reviews: approved reviews, newest first.
export async function getTraderReviews(traderId, { page = 1, size = 5 } = {}) {
  const response = await api.get(`/traders/${traderId}/reviews`, { params: { page, size } });
  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],
    totalItems: response.data?.totalItems ?? response.data?.pagination?.totalItems ?? 0,
    ratingAverage: response.data?.ratingAverage ?? 0,
    totalPages: response.data?.pagination?.totalPages ?? 1,
  };
}

// POST /api/traders/:userId/reviews (multipart: rating, content, screenshot?)
export async function createTraderReview(traderId, { rating, content, screenshot }) {
  const form = new FormData();
  form.append("rating", String(rating));
  form.append("content", content);
  if (screenshot) form.append("screenshot", screenshot);
  try {
    const response = await api.post(`/traders/${traderId}/reviews`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) throw new Error("You have already reviewed this trader.");
    throw new Error(error.response?.data?.message || "Your review couldn't be sent. Please try again.");
  }
}

// Admin moderation: GET /api/admin/trader-reviews?status= and
// PATCH /api/admin/trader-reviews/:reviewId { status }.
export async function listTraderReviewsForModeration({ status = "pending", page = 1, size = 25 } = {}) {
  const response = await api.get("/admin/trader-reviews", { params: { status: status || undefined, page, size } });
  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],
    pagination: response.data?.pagination || { totalItems: 0, totalPages: 1, currentPage: page },
  };
}

export async function moderateTraderReview(reviewId, status) {
  const response = await api.patch(`/admin/trader-reviews/${reviewId}`, { status });
  return response.data;
}
