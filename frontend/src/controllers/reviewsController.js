import api from './api.js';

// Helper to get current user from session
function getCurrentUser() {
  const s = sessionStorage.getItem('xktf_user');
  return s ? JSON.parse(s) : null;
}

// Helper to load reviews from JSON
async function loadReviews() {
  const { default: reviews } = await import('../models/reviews.json');
  return reviews;
}

// Helper to save reviews to JSON (mock - in real app this would be API call)
async function saveReviews(reviews) {
  // In a real app, this would be: return api.put('/reviews', reviews);
  // For now, we'll use localStorage as a mock persistence layer
  localStorage.setItem('xktf_reviews', JSON.stringify(reviews));
  return { data: reviews };
}

// Helper to recalculate aggregated rating for a company
async function recalculateCompanyRating(companyId) {
  const { getAllCompanies } = await import('./companiesController.js');
  const reviews = await loadReviews();
  const stored = localStorage.getItem('xktf_reviews');
  const allReviews = stored ? JSON.parse(stored) : reviews;
  
  const companyReviews = allReviews.filter(r => r.companyId === companyId);
  if (companyReviews.length === 0) {
    return { ratingsAggregate: 0, totalReviews: 0 };
  }

  const totalRating = companyReviews.reduce((sum, r) => sum + r.rating, 0);
  const ratingsAggregate = totalRating / companyReviews.length;
  
  return { ratingsAggregate, totalReviews: companyReviews.length };
}

// Get all reviews (with optional filters)
export async function getAllReviews(filters = {}) {
  // return api.get('/reviews', { params: filters });
  let reviews = await loadReviews();
  
  // Check localStorage for any updates
  const stored = localStorage.getItem('xktf_reviews');
  if (stored) {
    try {
      reviews = JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored reviews:', e);
    }
  }

  // Apply filters
  if (filters.companyId) {
    reviews = reviews.filter(r => r.companyId === filters.companyId);
  }
  if (filters.userId) {
    reviews = reviews.filter(r => r.userId === filters.userId);
  }
  if (filters.rating) {
    reviews = reviews.filter(r => r.rating === filters.rating);
  }

  return { data: reviews };
}

// Get reviews by company ID
export async function getReviewsByCompanyId(companyId) {
  // return api.get(`/companies/${companyId}/reviews`);
  const { data } = await getAllReviews({ companyId });
  return { data };
}

// Get reviews by user ID
export async function getReviewsByUserId(userId) {
  // return api.get(`/users/${userId}/reviews`);
  const { data } = await getAllReviews({ userId });
  return { data };
}

// Get review by ID
export async function getReviewById(reviewId) {
  // return api.get(`/reviews/${reviewId}`);
  const reviews = await loadReviews();
  const stored = localStorage.getItem('xktf_reviews');
  const allReviews = stored ? JSON.parse(stored) : reviews;

  const review = allReviews.find(r => r.id === reviewId);
  if (!review) {
    throw new Error('Review not found');
  }
  return { data: review };
}

// Create review (authenticated users only)
export async function createReview(reviewData) {
  // return api.post('/reviews', reviewData);
  const user = getCurrentUser();
  if (!user) {
    throw new Error('You must be logged in to create a review');
  }

  const reviews = await loadReviews();
  const stored = localStorage.getItem('xktf_reviews');
  let allReviews = stored ? JSON.parse(stored) : reviews;

  // Check if user already reviewed this company
  const existingReview = allReviews.find(
    r => r.companyId === reviewData.companyId && r.userId === user.id
  );
  if (existingReview) {
    throw new Error('You have already reviewed this company. Please edit your existing review instead.');
  }

  const newReview = {
    id: `rvw-${Date.now()}`,
    companyId: reviewData.companyId,
    userId: user.id,
    userName: user.name || user.email.split('@')[0],
    userAvatar: user.avatar || '/assets/users/default-avatar.jpg',
    rating: reviewData.rating,
    title: reviewData.title,
    body: reviewData.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  allReviews.push(newReview);
  await saveReviews(allReviews);

  // Recalculate company rating
  const { updateCompany } = await import('./companiesController.js');
  const ratingData = await recalculateCompanyRating(reviewData.companyId);
  try {
    await updateCompany(reviewData.companyId, ratingData);
  } catch (e) {
    console.error('Error updating company rating:', e);
  }

  return { data: newReview };
}

// Update review (users can only update their own reviews)
export async function updateReview(reviewId, updates) {
  // return api.put(`/reviews/${reviewId}`, updates);
  const user = getCurrentUser();
  if (!user) {
    throw new Error('You must be logged in to update a review');
  }

  const reviews = await loadReviews();
  const stored = localStorage.getItem('xktf_reviews');
  let allReviews = stored ? JSON.parse(stored) : reviews;

  const reviewIndex = allReviews.findIndex(r => r.id === reviewId);
  if (reviewIndex === -1) {
    throw new Error('Review not found');
  }

  const review = allReviews[reviewIndex];
  
  // Users can only update their own reviews
  if (review.userId !== user.id) {
    throw new Error('You can only update your own reviews');
  }

  allReviews[reviewIndex] = {
    ...review,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await saveReviews(allReviews);

  // Recalculate company rating if rating changed
  if (updates.rating !== undefined) {
    const { updateCompany } = await import('./companiesController.js');
    const ratingData = await recalculateCompanyRating(review.companyId);
    try {
      await updateCompany(review.companyId, ratingData);
    } catch (e) {
      console.error('Error updating company rating:', e);
    }
  }

  return { data: allReviews[reviewIndex] };
}

// Delete review (users can only delete their own reviews)
export async function deleteReview(reviewId) {
  // return api.delete(`/reviews/${reviewId}`);
  const user = getCurrentUser();
  if (!user) {
    throw new Error('You must be logged in to delete a review');
  }

  const reviews = await loadReviews();
  const stored = localStorage.getItem('xktf_reviews');
  let allReviews = stored ? JSON.parse(stored) : reviews;

  const reviewIndex = allReviews.findIndex(r => r.id === reviewId);
  if (reviewIndex === -1) {
    throw new Error('Review not found');
  }

  const review = allReviews[reviewIndex];
  
  // Users can only delete their own reviews (admins can delete any)
  if (review.userId !== user.id && user.role !== 'admin') {
    throw new Error('You can only delete your own reviews');
  }

  const companyId = review.companyId;
  allReviews.splice(reviewIndex, 1);
  await saveReviews(allReviews);

  // Recalculate company rating
  const { updateCompany } = await import('./companiesController.js');
  const ratingData = await recalculateCompanyRating(companyId);
  try {
    await updateCompany(companyId, ratingData);
  } catch (e) {
    console.error('Error updating company rating:', e);
  }

  return { data: { success: true } };
}

// Legacy function for backward compatibility
export async function getReviewsByRating(rating) {
  const { data } = await getAllReviews({ rating: parseInt(rating) });
  return data;
}



