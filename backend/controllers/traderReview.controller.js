const mongoose = require("mongoose");
const TraderReviewModel = require("../models/TraderReview.model");
const UserModel = require("../models/user.model");
const r2 = require("../helpers/r2.helper");
const constants = require("../utils/constants");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData, isValidObjectId } = require("../utils/fn");
const { PUBLIC_USER_FIELDS, publicUser } = require("../utils/publicData");

// Reviews of verified traders (B23 point 5).
const SCREENSHOT_FOLDER = "TraderReviewProofs";

const isStaff = (user) =>
    Boolean(user) && [constants.roles.admin, constants.roles.operator].includes(user.role);

function readReviewInput(body = {}, { partial = false } = {}) {
    const out = {};
    if (body.rating !== undefined || !partial) {
        const rating = Number(body.rating);
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Choose a rating from 1 to 5 stars." };
        out.rating = rating;
    }
    if (body.content !== undefined || !partial) {
        const content = String(body.content || "").trim();
        if (!content) return { error: "Write a few words about this trader." };
        if (content.length > 5000) return { error: "Your review is too long (5,000 characters at most)." };
        out.content = content;
    }
    return { data: out };
}

const uploadScreenshot = async (req) => {
    const file = req.files?.screenshot?.[0];
    if (!file) return "";
    return r2.uploadPrivate(file.path.replace(/\\/g, "/"), file.filename, SCREENSHOT_FOLDER);
};

// Public shape: reviewer's id/name/photo only, never the screenshot.
const toPublicReview = (review) => ({
    _id: review._id,
    traderId: review.traderId,
    rating: review.rating,
    content: review.content,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: publicUser(review.userId),
});

// POST /api/traders/:userId/reviews (signed in)
exports.createTraderReview = async (req, res) => {
    try {
        if (req.fileValidationError) return sendErrorResponse(res, req.fileValidationError, 400, true, true);
        const { userId: traderId } = req.params;
        if (!isValidObjectId(traderId)) return sendErrorResponse(res, "Trader not found", 404, true, true);
        if (String(traderId) === String(req.user._id)) {
            return sendErrorResponse(res, "You can't review yourself.", 400, true, true);
        }

        const trader = await UserModel.findOne({
            _id: traderId,
            isDeleted: false,
            isActive: true,
            "verifiedTrader.status": "approved",
        }).select("_id").lean();
        if (!trader) return sendErrorResponse(res, "Only verified traders can be reviewed.", 404, true, true);

        const exists = await TraderReviewModel.exists({ traderId, userId: req.user._id });
        if (exists) return sendErrorResponse(res, "You have already reviewed this trader.", 409, true, true);

        const { data, error } = readReviewInput(req.body);
        if (error) return sendErrorResponse(res, error, 400, true, true);

        const screenshotKey = await uploadScreenshot(req);
        try {
            const review = await TraderReviewModel.create({
                ...data,
                traderId,
                userId: req.user._id,
                screenshotKey,
                status: "pending",
            });
            return sendSuccessResponse(res, {
                message: "Thanks! Your review will appear once it has been checked.",
                data: { _id: review._id, status: review.status },
            }, 201);
        } catch (createError) {
            if (createError?.code === 11000) {
                return sendErrorResponse(res, "You have already reviewed this trader.", 409, true, true);
            }
            throw createError;
        }
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// GET /api/traders/:userId/reviews?page=&size= (public): approved only
exports.listTraderReviews = async (req, res) => {
    try {
        const { userId: traderId } = req.params;
        if (!isValidObjectId(traderId)) return sendErrorResponse(res, "Trader not found", 404, true, true);
        const { page, size } = req.query;
        const { limit, offset } = getPagination(page, size);
        const query = { traderId, status: "approved" };

        const [reviews, totalItems, [summary]] = await Promise.all([
            TraderReviewModel.find(query)
                .populate("userId", PUBLIC_USER_FIELDS)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            TraderReviewModel.countDocuments(query),
            TraderReviewModel.aggregate([
                { $match: { traderId: new mongoose.Types.ObjectId(traderId), status: "approved" } },
                { $group: { _id: null, average: { $avg: "$rating" } } },
            ]),
        ]);

        const result = getPaginationData({ count: totalItems, docs: reviews.map(toPublicReview) }, page, limit);
        return sendSuccessResponse(res, {
            ...result,
            totalItems,
            ratingAverage: summary ? Math.round(summary.average * 10) / 10 : 0,
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// PATCH /api/traders/reviews/:reviewId (author or Admin). An author's edit
// goes back to pending.
exports.updateTraderReview = async (req, res) => {
    try {
        if (req.fileValidationError) return sendErrorResponse(res, req.fileValidationError, 400, true, true);
        const { reviewId } = req.params;
        if (!isValidObjectId(reviewId)) return sendErrorResponse(res, "Review not found", 404, true, true);
        const review = await TraderReviewModel.findById(reviewId);
        if (!review) return sendErrorResponse(res, "Review not found", 404, true, true);

        const isAuthor = String(review.userId) === String(req.user._id);
        const isAdmin = req.user.role === constants.roles.admin;
        if (!isAuthor && !isAdmin) return sendErrorResponse(res, "You can only edit your own review.", 403, true, true);

        const { data, error } = readReviewInput(req.body, { partial: true });
        if (error) return sendErrorResponse(res, error, 400, true, true);
        Object.assign(review, data);
        const screenshotKey = await uploadScreenshot(req);
        if (screenshotKey) review.screenshotKey = screenshotKey;
        if (isAuthor) {
            review.status = "pending";
            review.moderatedAt = null;
            review.moderatedBy = null;
        }
        await review.save();

        return sendSuccessResponse(res, {
            message: isAuthor ? "Review updated. It will appear again once it has been checked." : "Review updated",
            data: { _id: review._id, status: review.status },
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// DELETE /api/traders/reviews/:reviewId (author or Admin)
exports.deleteTraderReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        if (!isValidObjectId(reviewId)) return sendErrorResponse(res, "Review not found", 404, true, true);
        const review = await TraderReviewModel.findById(reviewId);
        if (!review) return sendErrorResponse(res, "Review not found", 404, true, true);

        const isAuthor = String(review.userId) === String(req.user._id);
        if (!isAuthor && req.user.role !== constants.roles.admin) {
            return sendErrorResponse(res, "You can only delete your own review.", 403, true, true);
        }
        await review.deleteOne();
        return sendSuccessResponse(res, { message: "Review deleted" });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// GET /api/admin/trader-reviews?status=&page=&size= (Admin/Operator)
exports.listTraderReviewsForModeration = async (req, res) => {
    try {
        const { status, page, size } = req.query;
        if (status && !["pending", "approved", "rejected"].includes(status)) {
            return sendErrorResponse(res, "status must be pending, approved or rejected", 400, true, true);
        }
        const { limit, offset } = getPagination(page, size || 25);
        const query = status ? { status } : {};
        const [reviews, totalItems] = await Promise.all([
            TraderReviewModel.find(query)
                .populate("userId", "fullName email profileImage")
                .populate("traderId", "fullName profileImage")
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            TraderReviewModel.countDocuments(query),
        ]);
        const docs = await Promise.all(reviews.map(async ({ screenshotKey, ...review }) => ({
            ...review,
            screenshotUrl: screenshotKey ? await r2.signedPrivateUrl(screenshotKey, 3600).catch(() => null) : null,
        })));
        return sendSuccessResponse(res, getPaginationData({ count: totalItems, docs }, page, limit));
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// PATCH /api/admin/trader-reviews/:reviewId { status } (Admin/Operator)
exports.moderateTraderReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { status } = req.body || {};
        if (!isValidObjectId(reviewId)) return sendErrorResponse(res, "Review not found", 404, true, true);
        if (!["approved", "rejected", "pending"].includes(status)) {
            return sendErrorResponse(res, "status must be approved, rejected or pending", 400, true, true);
        }
        const review = await TraderReviewModel.findByIdAndUpdate(
            reviewId,
            { $set: { status, moderatedAt: new Date(), moderatedBy: req.user._id } },
            { new: true }
        );
        if (!review) return sendErrorResponse(res, "Review not found", 404, true, true);
        return sendSuccessResponse(res, { message: `Review ${status}`, data: { _id: review._id, status: review.status } });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.isStaff = isStaff;
