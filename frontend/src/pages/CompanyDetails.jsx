import React from "react";
import Seo from "../components/shared/Seo.jsx";
import { brokerJsonLd, breadcrumbJsonLd } from "../utils/structuredData.js";
import { extractFaqs, faqJsonLd } from "../utils/faq.js";
import { companyFaqs, companySeoDescription } from "../utils/companyFaqs.js";
import { trackEvent } from "../utils/analytics.js";
import FaqSection from "../components/shared/FaqSection.jsx";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { m as motion } from "framer-motion";
import { Lock, PenLine } from "lucide-react";
import { getCompanyById } from "../controllers/companiesController.js";
import ImageWithFallback from "../components/shared/ImageWithFallback.jsx";
import DesignedHtml from "../components/shared/DesignedHtml.jsx";
import { isDesignedHtml, designedMeta } from "../utils/designedHtml.js";

// "Is Pipze Legit? Pipze Broker Review 2026" (Seo appends "| XK Trading Floor").
function seoTitle(company) {
  const name = (company.name || "").trim();
  if (!name) return "Company Review";
  const kind = company.category === "PropFirm" ? "Prop Firm" : company.category === "Crypto" ? "Crypto Exchange" : "Broker";
  return `Is ${name} Legit? ${name} ${kind} Review ${new Date().getFullYear()}`;
}
import CardLoader from "../components/shared/CardLoader.jsx";
import { getReviewsByCompanyId, deleteReview } from "../controllers/reviewsController.js";
import StarRating from "../components/reviews/StarRating.jsx";
import CompanyReviewCard from "../components/reviews/CompanyReviewCard.jsx";
import CompanyReviewForm from "../components/reviews/CompanyReviewForm.jsx";
import CompanyProfileHeader from "../components/reviews/CompanyProfileHeader.jsx";
import PayoutSummary from "../components/reviews/PayoutSummary.jsx";
import LiveSpreadTable from "../components/spreads/LiveSpreadTable.jsx";
import ConfirmModal from "../components/shared/ConfirmModal.jsx";
import { getUserCookie } from "../utils/cookies.js";
import { useToast } from "../contexts/ToastContext.jsx";

// Outlined so it stands out on the dark header card (btn-secondary is nearly
// the same colour as the card).
const WRITE_REVIEW_CLASS =
  "btn w-fit gap-2 border border-blue-500/40 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 hover:text-white";

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

  // The form sits in the reviews section near the bottom, so both the top
  // button and "Edit Your Review" scroll there (this used to scroll to the
  // top of the page, away from the form).
  const reviewsRef = React.useRef(null);
  const scrollToReviews = (behavior = "smooth") =>
    setTimeout(() =>
      reviewsRef.current?.scrollIntoView({ behavior, block: "start" })
    );

  const handleEditReview = (review) => {
    setEditingReview(review);
    setShowReviewForm(true);
    scrollToReviews();
  };

  const openReviewForm = (behavior) => {
    if (canSubmitReview) {
      setEditingReview(userReview || null);
      setShowReviewForm(true);
    }
    scrollToReviews(behavior);
  };

  // Signed-out visitors log in and come back to /reviews/:id#write-review,
  // which opens the form straight away.
  const loginToReview = `/login?redirect=${encodeURIComponent(`/reviews/${companyId}#write-review`)}`;
  React.useEffect(() => {
    if (loading || !company || location.hash !== "#write-review") return;
    // Jump straight there on arrival, and again once the designed review's
    // images above have loaded and pushed the section down.
    openReviewForm("auto");
    setTimeout(() => reviewsRef.current?.scrollIntoView({ block: "start" }), 1200);
    // Drop the hash so a later data reload (after submitting) doesn't reopen it.
    navigate({ pathname: location.pathname, search: location.search }, { replace: true });
  }, [loading, company, location.hash]);

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
      <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
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
              onClick={() => navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)}
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
        <Seo title="Company not found" path={`/reviews/${companyId}`} noindex />
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

  // Direct answers built from the company's own data (utils/companyFaqs.js),
  // shown on the page and merged with any FAQ written into the review.
  const dataFaqs = companyFaqs(company);
  const reviewFaqs = extractFaqs(company.description);
  const seenQuestions = new Set(reviewFaqs.map((f) => f.question.toLowerCase()));
  const allFaqs = [...reviewFaqs, ...dataFaqs.filter((f) => !seenQuestions.has(f.question.toLowerCase()))];

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Built-in SEO title from the broker's name, aimed at what traders
          search for ("is <broker> legit"). The pasted review's own
          <meta description> is used when there is one. */}
      <Seo
        title={seoTitle(company)}
        description={
          designedMeta(company.description).description || companySeoDescription(company)
        }
        path={`/reviews/${company._id}`}
        image={company.logo}
        jsonLd={[
          brokerJsonLd(company),
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Reviews", url: "/reviews" },
            { name: company.name, url: `/reviews/${company._id}` },
          ]),
          faqJsonLd(allFaqs),
        ].filter(Boolean)}
      />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Back Button */}
        <Link
          to="/reviews"
          className="text-accent hover:text-accent/80 text-sm inline-flex items-center gap-1"
        >
          ← Back to Companies
        </Link>

        {/* Company Header (with country, regulation, assets, platforms, etc.) */}
        <CompanyProfileHeader
          company={company}
          reviewAction={
            !user ? (
              <Link
                to={loginToReview}
                onClick={() => trackEvent("write_review_click", { company: company.name, location: "company_top", signed_in: false })}
                className={WRITE_REVIEW_CLASS}
              >
                <PenLine className="h-4 w-4" />
                Write a Review
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  trackEvent("write_review_click", { company: company.name, location: "company_top", signed_in: true });
                  openReviewForm();
                }}
                className={WRITE_REVIEW_CLASS}
              >
                <PenLine className="h-4 w-4" />
                {userReview ? "Edit Your Review" : "Write a Review"}
              </button>
            )
          }
        />

        {/* Designed review (a full styled HTML page pasted by the admin),
            shown exactly as designed. */}
        {isDesignedHtml(company.description) && (
          <DesignedHtml content={company.description} className="rounded-2xl overflow-hidden" />
        )}

        {/* Category-specific data section */}
        {company.category === "Broker" && (
          <LiveSpreadTable brokerId={company._id} brokerName={company.name} />
        )}
        {company.category === "PropFirm" && (
          <PayoutSummary firmId={company._id} firmName={company.name} />
        )}

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
                            onClick={() => trackEvent("promo_login_click", { company: company.name, location: "company_page" })}
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
                            onClick={() => trackEvent("promo_login_click", { company: company.name, location: "company_page" })}
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
        <div id="reviews" ref={reviewsRef} className="card scroll-mt-24">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <h2 className="font-display font-bold text-lg sm:text-xl">
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
                  User
                </span>{" "}
                Reviews
              </h2>
              {!user && (
                <Link to={loginToReview} className="btn btn-secondary">
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
                <div className="text-sm text-gray-400">
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

      <FaqSection
        id="company-faq"
        title={`${String(company.name).trim()}: frequently asked questions`}
        faqs={dataFaqs}
      />

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
