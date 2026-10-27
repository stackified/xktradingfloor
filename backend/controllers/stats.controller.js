const CompanyModel = require("../models/company.model");
const ReviewModel = require("../models/review.model");
const BlogModel = require("../models/blog.model");
const EventModel = require("../models/event.model");
const UserModel = require("../models/user.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");

// GET /api/stats (public, B24): site-wide counts, cached for 10 minutes.
const CACHE_MS = 10 * 60 * 1000;
let cache = null;

async function computeStats() {
    const now = new Date();
    const [companies, brokers, propFirms, verifiedTraders, reviews, articles, upcomingEvents] = await Promise.all([
        CompanyModel.countDocuments({ status: "approved" }),
        CompanyModel.countDocuments({ status: "approved", category: "Broker" }),
        CompanyModel.countDocuments({ status: "approved", category: "PropFirm" }),
        UserModel.countDocuments({ isDeleted: false, isActive: true, "verifiedTrader.status": "approved" }),
        ReviewModel.countDocuments({ isHidden: { $ne: true } }),
        BlogModel.countDocuments({ status: "published", isDeleted: false }),
        EventModel.countDocuments({
            $or: [
                { endDateTime: { $gte: now } },
                { endDateTime: { $in: [null] }, dateTime: { $gte: now } },
            ],
        }),
    ]);
    return { companies, brokers, propFirms, verifiedTraders, reviews, articles, upcomingEvents };
}

exports.getStats = async (req, res) => {
    try {
        if (!cache || Date.now() - cache.at > CACHE_MS) {
            cache = { at: Date.now(), data: await computeStats() };
        }
        res.set("Cache-Control", "public, max-age=600");
        return sendSuccessResponse(res, { data: cache.data });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};
