import React from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { getCompanyById } from "../controllers/companiesController.js";
import ImageWithFallback from "../components/shared/ImageWithFallback.jsx";
import CardLoader from "../components/shared/CardLoader.jsx";
import { getReviewsByCompanyId, deleteReview } from "../controllers/reviewsController.js";
import StarRating from "../components/reviews/StarRating.jsx";
import CompanyReviewCard from "../components/reviews/CompanyReviewCard.jsx";
import CompanyReviewForm from "../components/reviews/CompanyReviewForm.jsx";
import ConfirmModal from "../components/shared/ConfirmModal.jsx";
import { getUserCookie } from "../utils/cookies.js";
import { useToast } from "../contexts/ToastContext.jsx";

function CompanyDetails() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { success: toastSuccess } = useToast();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();
  const userRole =
    typeof user?.role === "string" ? user.role.toLowerCase() : null;
  const userId = user?.id;
  const canSubmitReview = userRole === "user";
  const [company, setCompany] = React.useState(null);
  const [reviews, setReviews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [showReviewForm, setShowReviewForm] = React.useState(false);
  const [editingReview, setEditingReview] = React.useState(null);
  const [userReview, setUserReview] = React.useState(null);

  React.useEffect(() => {
    loadData();
  }, [companyId]);

  // ... (useEffects remain same)

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const companyRes = await getCompanyById(companyId);
      const companyData = companyRes.data;
      setCompany(companyData);

      if (
        companyData?.reviewsDetails &&
        Array.isArray(companyData.reviewsDetails)
      ) {
        const details = companyData.reviewsDetails.map((review) => ({
          ...review,
          id: review._id || review.id,
        }));
        setReviews(details);
        if (userId) {
          setUserReview(details.find(r => {
            const rUserId = typeof r.userId === 'object' ? r.userId?._id || r.userId?.id : r.userId;
            return rUserId?.toString() === userId?.toString();
          }));
        }
      } else {
        const reviewsRes = await getReviewsByCompanyId(companyId);
        const fetchedReviews = reviewsRes.data || [];
        setReviews(fetchedReviews);
        if (userId) {
          setUserReview(fetchedReviews.find(r => {
            const rUserId = typeof r.userId === 'object' ? r.userId?._id || r.userId?.id : r.userId;
            return rUserId?.toString() === userId?.toString();
          }));
        }
      }
    } catch (err) {
      console.error("Error loading company details:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  // ... (handlers remain same)

  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const [reviewToDelete, setReviewToDelete] = React.useState(null);

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDeleteReview = (reviewId) => {
    setReviewToDelete(reviewId);
    setShowConfirmModal(true);
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      await deleteReview(reviewToDelete);
      toastSuccess("Review deleted successfully");
      loadData();
    } catch (err) {
      console.error("Error deleting review:", err);
      // toastError(err.message || "Failed to delete review");
    } finally {
      setShowConfirmModal(false);
      setReviewToDelete(null);
    }
  };

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    setEditingReview(null);
    toastSuccess("Review submitted successfully");
    loadData();
    // Re-check for user review after reload
    // loadData handles this but we can ensure it runs
  };

  const handleCancelEdit = () => {
    setShowReviewForm(false);
    setEditingReview(null);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <CardLoader count={1} />
      </div>
    );
  }

  // Handle 401 Unauthorized
  if (error?.response?.status === 401 || (error?.message === "Authentication required")) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="card border-2 border-dashed border-gray-700 bg-gray-900/50">
          <div className="card-body text-center py-16">
            <div className="mx-auto w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Login Required</h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              You must be logged in to view company details and reviews.
            </p>
            <button
              onClick={() => navigate(`/login?next=${encodeURIComponent(location.pathname)}`)}
              className="btn btn-primary px-8"
            >
              Login to View
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!company || error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="card">
          <div className="card-body text-center">
            <h2 className="text-xl font-semibold mb-2">Company not found</h2>
            <p className="text-gray-400 mb-4">
              The company you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link to="/reviews" className="btn btn-primary">
              Back to Reviews
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const validPromoCodes =
    company.promoCodes?.filter((p) => new Date(p.validTo) > new Date()) || [];
  const featuredPromos = validPromoCodes.filter((p) => p.featured);
  const regularPromos = validPromoCodes.filter((p) => !p.featured);

  return (
    <div className="bg-black text-white min-h-screen">
      <Helmet>
        <title>{company.name} | XK Trading Floor</title>
        <meta
          name="description"
          content={`${company.details || "Read reviews and details about"} ${company.name
            } on XK Trading Floor.`}
        />
      </Helmet>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Back Button */}
        <Link
          to="/reviews"
          className="text-accent hover:text-accent/80 text-sm inline-flex items-center gap-1"
        >
          ← Back to Companies
        </Link>

        {/* Company Header */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                <ImageWithFallback
                  src={company.logo}
                  fallback="/assets/placeholder.jpg"
                  alt={company.name}
                  className="h-full w-full object-cover"
                  useDynamicFallback={true}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl mb-2">
                      <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
                        {company.name}
                      </span>
                    </h1>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm px-3 py-1 rounded bg-blue-500/20 text-blue-400">
                        {company.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <StarRating
                          value={company.ratingsAggregate}
                          size={20}
                        />
                        <span className="text-lg font-semibold">
                          {company.ratingsAggregate.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-400">
                          ({company.totalReviews || 0}{" "}
                          {company.totalReviews === 1 ? "review" : "reviews"})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {company.description ? (
                  <div
                    className="rich-text-content text-sm sm:text-base mb-4"
                    dangerouslySetInnerHTML={{ __html: company.description }}
                  />
                ) : (
                  <p className="text-sm sm:text-base text-gray-300 mb-4 leading-relaxed">
                    {company.details}
                  </p>
                )}
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  Visit Website →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Codes */}
        {validPromoCodes.length > 0 && (
          <div className="card">
            <div className="card-body">
              <h2 className="font-display font-bold text-lg sm:text-xl mb-4">
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
                  Promo Codes
                </span>{" "}
                & Offers
              </h2>
              <div className="space-y-4">
                {featuredPromos.map((promo) => (
                  <div
                    key={promo.id}
                    className="relative p-4 rounded-lg bg-gray-900 border-2 border-gray-700 overflow-hidden"
                  >
                    {!user ? (
                      <>
                        {/* Blurred promo code */}
                        <div className="blur-[3px] select-none pointer-events-none">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs px-2 py-0.5 rounded bg-green-500/30 text-green-300 font-semibold">
                                  FEATURED
                                </span>
                                <span className="text-lg font-mono font-bold text-green-400">
                                  {promo.code}
                                </span>
                              </div>
                              <div className="text-2xl font-bold text-green-400 mb-1">
                                {promo.discount}% OFF
                              </div>
                              {promo.terms && (
                                <p className="text-sm text-gray-300 mt-2">
                                  {promo.terms}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs text-gray-400 mb-1">
                                Valid until
                              </div>
                              <div className="text-sm font-semibold">
                                {new Date(promo.validTo).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                        {/* Clean overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] rounded-lg">
                          <Link
                            to="/login"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900/90 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/90 hover:border-gray-600/50 transition-all cursor-pointer"
                          >
                            <Lock className="h-4 w-4 text-blue-400 flex-shrink-0" />
                            <span className="text-sm text-gray-300 font-medium">
                              Login to access promo code
                            </span>
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded bg-green-500/30 text-green-300 font-semibold">
                              FEATURED
                            </span>
                            <span className="text-lg font-mono font-bold text-green-400">
                              {promo.code}
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-green-400 mb-1">
                            {promo.discount}% OFF
                          </div>
                          {promo.terms && (
                            <p className="text-sm text-gray-300 mt-2">
                              {promo.terms}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-400 mb-1">
                            Valid until
                          </div>
                          <div className="text-sm font-semibold">
                            {new Date(promo.validTo).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {regularPromos.map((promo) => (
                  <div
                    key={promo.id}
                    className="relative p-3 rounded-lg bg-gray-800/50 border border-gray-700 overflow-hidden"
                  >
                    {!user ? (
                      <>
                        {/* Blurred promo code */}
                        <div className="blur-[3px] select-none pointer-events-none">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-semibold text-green-400">
                                  {promo.code}
                                </span>
                                <span className="text-sm font-bold text-green-400">
                                  {promo.discount}% OFF
                                </span>
                              </div>
                              {promo.terms && (
                                <p className="text-xs text-gray-400 mt-1">
                                  {promo.terms}
                                </p>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 flex-shrink-0">
                              Expires{" "}
                              {new Date(promo.validTo).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                        {/* Clean overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] rounded-lg">
                          <Link
                            to="/login"
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/90 border border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/90 hover:border-gray-600/50 transition-all cursor-pointer"
                          >
                            <Lock className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                            <span className="text-xs text-gray-300 font-medium">
                              Login to access promo code
                            </span>
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-semibold text-green-400">
                              {promo.code}
                            </span>
                            <span className="text-sm font-bold text-green-400">
                              {promo.discount}% OFF
                            </span>
                          </div>
                          {promo.terms && (
                            <p className="text-xs text-gray-400 mt-1">
                              {promo.terms}
                            </p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 flex-shrink-0">
                          Expires{" "}
                          {new Date(promo.validTo).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-lg sm:text-xl">
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
                  User
                </span>{" "}
                Reviews
              </h2>
              {!user && (
                <Link to="/login" className="btn btn-secondary">
                  Login to Review
                </Link>
              )}
              {user &&
                canSubmitReview &&
                (!userReview ? (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="btn btn-primary"
                  >
                    Write a Review
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditReview(userReview)}
                      className="btn btn-primary"
                    >
                      Edit Your Review
                    </button>
                    <button
                      onClick={() => confirmDeleteReview(userReview.id || userReview._id)}
                      className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Review"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                    </button>
                  </div>
                ))}
              {user && !canSubmitReview && (
                <div className="text-sm text-gray-400">
                  Only trader accounts can publish reviews.
                </div>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && user && canSubmitReview && (
              <div className="mb-6">
                <CompanyReviewForm
                  companyId={companyId}
                  existingReview={editingReview}
                  onSuccess={handleReviewSuccess}
                  onCancel={handleCancelEdit}
                />
              </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">No reviews yet.</div>
                <div className="text-sm text-gray-500">
                  Be the first to review this company!
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <CompanyReviewCard
                    key={review.id}
                    review={review}
                    currentUserId={userId}
                    onUpdate={handleEditReview}
                    onDelete={confirmDeleteReview}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleDeleteReview}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}

export default CompanyDetails;
