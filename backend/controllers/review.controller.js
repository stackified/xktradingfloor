const ReviewModel = require("../models/review.model");
const CompanyModel = require("../models/company.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData } = require("../utils/fn");

// Helper to recalculate and persist company rating aggregates
async function recalculateCompanyRating(companyId) {
    const reviews = await ReviewModel.find({ companyId });
    if (reviews.length === 0) {
        await CompanyModel.findByIdAndUpdate(companyId, {
            ratingsAggregate: 0,
            totalReviews: 0,
        });
        return { ratingsAggregate: 0, totalReviews: 0 };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const ratingsAggregate = totalRating / reviews.length;

    const agg = {
        ratingsAggregate: parseFloat(ratingsAggregate.toFixed(1)),
        totalReviews: reviews.length,
    };

    await CompanyModel.findByIdAndUpdate(companyId, agg);
    return agg;
}

// Get all reviews (with optional filters)
exports.getAllReviews = async (req, res) => {
    try {
        const { companyId, userId, rating, page, size } = req.query;
        const { limit, offset } = getPagination(page, size);

        const query = {};
        if (companyId) query.companyId = companyId;
        if (userId) query.userId = userId;
        if (rating) query.rating = Number(rating);

        const reviews = await ReviewModel.find(query)
            .populate("userId", "fullName email profileImage")
            .populate("companyId", "name")
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);

        const totalItems = await ReviewModel.countDocuments(query);

        return sendSuccessResponse(
            res,
            getPaginationData({ count: totalItems, docs: reviews }, page, limit)
        );
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Get reviews by company ID
exports.getReviewsByCompanyId = async (req, res) => {
    try {
        const { companyId } = req.params;
        req.query.companyId = companyId;
        return exports.getAllReviews(req, res);
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Get reviews by user ID
exports.getReviewsByUserId = async (req, res) => {
    try {
        const { page, size } = req.query;
        const { userId } = req.params;
        const { limit, offset } = getPagination(page, size);

        const reviews = await ReviewModel.find({ userId })
            .populate("companyId", "name")
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit);

        const totalItems = await ReviewModel.countDocuments({ userId });

        return sendSuccessResponse(
            res,
            getPaginationData({ count: totalItems, docs: reviews }, page, limit)
        );
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Get single review by ID
exports.getReviewById = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await ReviewModel.findById(reviewId)
            .populate("userId", "fullName email profileImage")
            .populate("companyId", "name");

        if (!review) {
            return sendErrorResponse(res, "Review not found", 404, true, true);
        }

        const r = review.toObject();
        r.id = r._id.toString();
        if (!r.userName && r.userId) {
            r.userName = r.userId.fullName || r.userId.email;
        }
        if (!r.userAvatar && r.userId) {
            r.userAvatar = r.userId.profileImage || "/assets/users/default-avatar.jpg";
        }

        return sendSuccessResponse(res, { data: r });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Create review (authenticated users only)
exports.createReview = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return sendErrorResponse(
                res,
                "You must be logged in to create a review",
                401,
                true,
                true
            );
        }

        const { companyId, rating, title, body, comment } = req.body;

        // Handle screenshot upload
        let screenshot = null;
        if (req.file) {
            screenshot = `/uploads/reviews/${req.file.filename}`;
        } else if (req.body.screenshot) {
            // Handle case where screenshot might be passed as URL string (rare but possible)
            screenshot = req.body.screenshot;
        }

        if (!companyId || !rating) {
            return sendErrorResponse(
                res,
                "companyId and rating are required",
                400,
                true,
                true
            );
        };

        // rating should be 1 or between 5 not more than 5 
        if (rating && (rating < 1 || rating > 5)) {
            return sendErrorResponse(
                res,
                "You can only rate to the company between 1 and 5 only",
                400,
                true,
                true
            );
        }

        // Prevent duplicate review per user per company
        const existing = await ReviewModel.findOne({
            companyId,
            userId: user._id,
        });
        if (existing) {
            return sendErrorResponse(
                res,
                "You have already reviewed this company. Please edit your existing review instead.",
                400,
                true,
                true
            );
        }

        const review = new ReviewModel({
            companyId,
            userId: user._id,
            rating,
            title,
            body,
            comment: comment,
            screenshot, // Save screenshot
        });

        const saved = await review.save();
        await recalculateCompanyRating(companyId);

        const r = saved.toObject();
        r.id = r._id.toString();
        // Derive display fields from current user for frontend
        r.userName = user.fullName || user.email;
        r.userAvatar = user.profileImage;

        return sendSuccessResponse(
            res,
            { message: "Review created successfully", data: r },
            201
        );
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Update review (users can only update their own)
exports.updateReview = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return sendErrorResponse(res, "You must be logged in to update a review", 401, true, true);
        }

        const { reviewId } = req.params;
        const updates = req.body || {};

        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return sendErrorResponse(res, "Review not found", 404, true, true);
        }

        if (review.userId.toString() !== user._id.toString()) {
            return sendErrorResponse(res, "You can only update your own reviews", 403, true, true);
        }

        if (updates.body && !updates.comment) {
            updates.comment = updates.body;
        }

        // Handle screenshot update if new file is uploaded
        if (req.file) {
            updates.screenshot = `/uploads/reviews/${req.file.filename}`;
        }

        Object.assign(review, updates);
        const updated = await review.save();

        if (updates.rating !== undefined) {
            await recalculateCompanyRating(review.companyId);
        }

        const r = updated.toObject();
        r.id = r._id.toString();

        return sendSuccessResponse(res, {
            message: "Review updated successfully",
            data: r,
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Delete review (users can only delete their own; admins can delete any)
exports.deleteReview = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return sendErrorResponse(res, "You must be logged in to delete a review", 401, true, true);
        }

        const { reviewId } = req.params;
        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return sendErrorResponse(res, "Review not found", 404, true, true);
        }

        if (
            review.userId.toString() !== user._id.toString() &&
            user.role !== "Admin" && user.role !== "admin" // Fix role check
        ) {
            return sendErrorResponse(
                res,
                "You can only delete your own reviews",
                403,
                true,
                true
            );
        }

        const companyId = review.companyId;
        await ReviewModel.findByIdAndDelete(reviewId);
        await recalculateCompanyRating(companyId);

        return sendSuccessResponse(res, { message: "Review deleted successfully" });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Hide/Unhide review (Admin only)
exports.toggleReviewVisibility = async (req, res) => {
    try {
        const user = req.user;
        if (!user || (user.role !== "Admin" && user.role !== "admin")) {
            return sendErrorResponse(res, "Only admins can manage review visibility", 403, true, true);
        }

        const { reviewId } = req.params;
        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return sendErrorResponse(res, "Review not found", 404, true, true);
        }

        review.isHidden = !review.isHidden;
        await review.save();

        return sendSuccessResponse(res, {
            message: `Review ${review.isHidden ? 'hidden' : 'visible'} successfully`,
            data: { isHidden: review.isHidden }
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Pin/Unpin review (Admin only)
exports.toggleReviewPin = async (req, res) => {
    try {
        const user = req.user;
        if (!user || (user.role !== "Admin" && user.role !== "admin")) {
            return sendErrorResponse(res, "Only admins can manage review pins", 403, true, true);
        }

        const { reviewId } = req.params;
        const review = await ReviewModel.findById(reviewId);
        if (!review) {
            return sendErrorResponse(res, "Review not found", 404, true, true);
        }

        review.isPinned = !review.isPinned;
        await review.save();

        return sendSuccessResponse(res, {
            message: `Review ${review.isPinned ? 'pinned' : 'unpinned'} successfully`,
            data: { isPinned: review.isPinned }
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};


