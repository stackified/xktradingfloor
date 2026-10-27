const CompanyModel = require("../models/company.model");
const ReviewModel = require("../models/review.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData, escapeRegex, isValidObjectId } = require("../utils/fn");
const constants = require("../utils/constants");
const r2 = require("../helpers/r2.helper");
const { PUBLIC_USER_FIELDS, publicUser, plainExcerpt } = require("../utils/publicData");
const { sanitizeHtml } = require("../utils/sanitizeHtml");

// Average rating and count per company in one aggregation, instead of loading
// every review (and its user) just to average them (B4).
async function ratingsFor(companyIds) {
    if (!companyIds.length) return {};
    const rows = await ReviewModel.aggregate([
        { $match: { companyId: { $in: companyIds } } },
        { $group: { _id: "$companyId", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);
    return rows.reduce((acc, row) => {
        acc[String(row._id)] = {
            ratingsAggregate: parseFloat(row.avg.toFixed(1)),
            totalReviews: row.count,
        };
        return acc;
    }, {});
}

// Reviews as the public sees them: the reviewer reduced to id, name (never an
// email) and photo.
function publicReviews(reviews) {
    return reviews.map((review) => ({ ...review, userId: publicUser(review.userId) }));
}

// Helper function to recalculate company rating
async function recalculateCompanyRating(companyId) {
    const reviews = await ReviewModel.find({ companyId });
    if (reviews.length === 0) {
        return { ratingsAggregate: 0, totalReviews: 0 };
    }
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const ratingsAggregate = totalRating / reviews.length;
    return { ratingsAggregate: parseFloat(ratingsAggregate.toFixed(1)), totalReviews: reviews.length };
}

exports.getAllApprovedCompanies = async (req, res) => {
    try {
        const { search, page, size } = req.query;
        const { limit, offset } = getPagination(page, size);
        const searchTerm = escapeRegex(search);
        const { category = "" } = req.body;

        const query = {};

        if (category != "") query.category = category;
        query.status = 'approved';

        // Search the name and short details, not the designed HTML review.
        if (searchTerm) {
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { details: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        // Lists carry no full description (designed reviews are 25-30 KB
        // each) and no people: a short plain-text excerpt is enough for cards.
        const companies = await CompanyModel.find(query)
            .select('-addedBy -adminId')
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean();

        const totalItems = await CompanyModel.countDocuments(query);
        const ratings = await ratingsFor(companies.map(c => c._id));

        const companiesWithRatings = companies.map(company => {
            const { description, ...rest } = company;
            return {
                ...rest,
                excerpt: plainExcerpt(description),
                ratingsAggregate: ratings[String(company._id)]?.ratingsAggregate || 0,
                totalReviews: ratings[String(company._id)]?.totalReviews || 0,
            };
        })

        return sendSuccessResponse(res, getPaginationData(
            { count: totalItems, docs: companiesWithRatings },
            page,
            limit
        ));
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Get all companies (with optional filters)
exports.getAllCompanies = async (req, res) => {
    try {
        const { search, page, size } = req.query;
        const { category, status, minRating } = req.body;
        const { limit, offset } = getPagination(page, size);
        const searchTerm = escapeRegex(search);

        const query = {};

        if (category) query.category = category;
        if (status) query.status = status;
        if (searchTerm) {
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { description: { $regex: searchTerm, $options: 'i' } },
                { details: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        const companies = await CompanyModel.find(query)
            .populate('addedBy', 'fullName email profileImage')
            .populate('adminId', 'fullName email profileImage')
            .sort({ createdAt: -1 })
            .skip(offset)
            .limit(limit)
            .lean();

        const totalItems = await CompanyModel.countDocuments(query);

        const ratings = await ratingsFor(companies.map(c => c._id));

        const companiesWithRatings = companies.map(company => ({
            ...company,
            ratingsAggregate: ratings[String(company._id)]?.ratingsAggregate || 0,
            totalReviews: ratings[String(company._id)]?.totalReviews || 0,
        }));

        return sendSuccessResponse(res, getPaginationData(
            { count: totalItems, docs: companiesWithRatings },
            page,
            limit
        ));
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Get company by ID
exports.getCompanyById = async (req, res) => {
    try {
        const { companyId } = req.params;
        // Reached by any signed-in user (protected route) as well as admins,
        // so people are reduced to their public fields.
        const company = await CompanyModel.findById(companyId)
            .populate('addedBy', PUBLIC_USER_FIELDS)
            .populate('adminId', PUBLIC_USER_FIELDS)
            .lean();

        if (!company) {
            return sendErrorResponse(res, "Company not found", 404, true, true);
        }

        const reviews = publicReviews(
            await ReviewModel.find({ companyId: company._id }).populate("userId", PUBLIC_USER_FIELDS).lean()
        );
        const reviewers = reviews.map(r => r.userId);
        const totalReviews = reviews.length;
        const ratingsAggregate = totalReviews > 0
            ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
            : 0;

        reviews.ratingsAggregate = ratingsAggregate;
        reviews.totalReviews = totalReviews;

        company.reviewsDetails = reviews;
        company.ratingsAggregate = ratingsAggregate;
        company.totalReviews = totalReviews;
        company.reviewers = reviewers;

        return sendSuccessResponse(res, { data: company });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Public: get approved company by ID (no auth required)
exports.getApprovedCompanyById = async (req, res) => {
    try {
        const { companyId } = req.params;
        if (!isValidObjectId(companyId)) {
            return sendErrorResponse(res, "Company not found", 404, true, true);
        }

        const company = await CompanyModel.findOne({ _id: companyId, status: 'approved' }).lean();

        if (!company) {
            return sendErrorResponse(res, "Company not found", 404, true, true);
        }

        const reviews = publicReviews(
            await ReviewModel.find({ companyId: company._id }).populate("userId", PUBLIC_USER_FIELDS).lean()
        );
        const totalReviews = reviews.length;
        const ratingsAggregate = totalReviews > 0
            ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
            : 0;

        company.reviewsDetails = reviews;
        company.ratingsAggregate = ratingsAggregate;
        company.totalReviews = totalReviews;

        return sendSuccessResponse(res, { data: company });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Create company (permission checked in middleware)
exports.createCompany = async (req, res) => {
    try {
        const { _id: userId, role } = req.user;

        let logo = "";
        if (req.files && req.files.logo) {
            logo = req.files.logo[0];
            const pathN = logo.path.replace(/\\/g, "/");
            logo.path = pathN;

            const url = await r2.uploadPublic(logo.path, `${logo.filename}`, "Companies");
            logo = url;
        };

        const companyData = {
            ...req.body,
            description: sanitizeHtml(req.body.description),
            addedBy: userId,
            adminId: role === constants.roles.admin ? userId : undefined,
            status: role === constants.roles.admin ? 'approved' : 'pending',
            ratingsAggregate: 0,
            totalReviews: 0,
            logo: logo,
            promoCodes: req.body.promoCodes || []
        };

        const company = new CompanyModel(companyData);
        const savedCompany = await company.save();

        // Populate user references
        await savedCompany.populate('addedBy', 'fullName email profileImage');
        if (savedCompany.adminId) {
            await savedCompany.populate('adminId', 'fullName email profileImage');
        }

        const companyObj = savedCompany.toObject();
        companyObj.id = companyObj._id.toString();
        return sendSuccessResponse(res, {
            message: "Company created successfully",
            data: companyObj
        }, 201);
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Update company (permission checked in middleware, operators can only update their own)
exports.updateCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { _id: userId, role } = req.user;

        const company = await CompanyModel.findById(companyId);
        if (!company) {
            return sendErrorResponse(res, "Company not found", 404, true, true);
        }

        // Operators can only update their own companies (ownership check)
        if (role === constants.roles.operator && company.adminId.toString() !== userId.toString()) {
            return sendErrorResponse(res, "You can only update your own companies", 403, true, true);
        }

        const updates = { ...req.body };
        // Ownership and ids never change through an edit.
        delete updates._id;
        delete updates.addedBy;
        delete updates.adminId;

        // If rating fields are being updated, recalculate
        if (updates.ratingsAggregate !== undefined || updates.totalReviews !== undefined) {
            const ratingData = await recalculateCompanyRating(companyId);
            updates.ratingsAggregate = ratingData.ratingsAggregate;
            updates.totalReviews = ratingData.totalReviews;
        }

        // A new logo file replaces the logo (B27: the file used to be dropped
        // and the old logo stayed). Without a file, an empty value never
        // wipes the current logo.
        if (req.files?.logo?.[0]) {
            const logo = req.files.logo[0];
            updates.logo = await r2.uploadPublic(logo.path.replace(/\\/g, "/"), `${logo.filename}`, "Companies");
        } else if (!updates.logo) {
            delete updates.logo;
        }

        if (updates.description !== undefined) updates.description = sanitizeHtml(updates.description);

        Object.assign(company, updates);
        const updatedCompany = await company.save();

        // Populate user references
        await updatedCompany.populate('addedBy', 'fullName email profileImage');
        if (updatedCompany.adminId) {
            await updatedCompany.populate('adminId', 'fullName email profileImage');
        }

        return sendSuccessResponse(res, {
            message: "Company updated successfully",
            data: updatedCompany
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Delete company (permission checked in middleware, operators can only delete their own)
exports.deleteCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { _id: userId, role } = req.user;

        const company = await CompanyModel.findById(companyId);
        if (!company) {
            return sendErrorResponse(res, "Company not found", 404, true, true);
        }

        // Operators can only delete their own companies (ownership check)
        if (role === constants.roles.operator && company.adminId.toString() !== userId.toString()) {
            return sendErrorResponse(res, "You can only delete your own companies", 403, true, true);
        }

        await CompanyModel.findByIdAndDelete(companyId);
        return sendSuccessResponse(res, {
            message: "Company deleted successfully"
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Add promo code to company (permission checked in middleware, operators can only add to their own)
exports.addPromoCode = async (req, res) => {
    try {
        const { companyId } = req.params;
        const { _id: userId, role } = req.user;

        const company = await CompanyModel.findById(companyId);
        if (!company) {
            return sendErrorResponse(res, "Company not found", 404, true, true);
        }

        // Operators can only add promo codes to their own companies (ownership check)
        if (role === constants.roles.operator && company.adminId.toString() !== userId.toString()) {
            return sendErrorResponse(res, "You can only add promo codes to your own companies", 403, true, true);
        }

        const newPromo = {
            id: `promo-${Date.now()}`,
            ...req.body,
            createdAt: new Date()
        };

        if (!company.promoCodes) {
            company.promoCodes = [];
        }
        company.promoCodes.push(newPromo);
        await company.save();

        return sendSuccessResponse(res, {
            message: "Promo code added successfully",
            data: newPromo
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Update promo code (permission checked in middleware, operators can only update their own)
exports.updatePromoCode = async (req, res) => {
    try {
        const { companyId, promoId } = req.params;
        const { _id: userId, role } = req.user;

        const company = await CompanyModel.findById(companyId);
        if (!company) {
            return sendErrorResponse(res, "Company not found", 404, true, true);
        }

        // Operators can only update promo codes for their own companies (ownership check)
        if (role === constants.roles.operator && company.adminId.toString() !== userId.toString()) {
            return sendErrorResponse(res, "You can only update promo codes for your own companies", 403, true, true);
        }

        const promoIndex = company.promoCodes.findIndex(p => p.id === promoId || p._id?.toString() === promoId);
        if (promoIndex === -1) {
            return sendErrorResponse(res, "Promo code not found", 404, true, true);
        }

        company.promoCodes[promoIndex] = {
            ...company.promoCodes[promoIndex].toObject(),
            ...req.body
        };
        await company.save();

        return sendSuccessResponse(res, {
            message: "Promo code updated successfully",
            data: company.promoCodes[promoIndex]
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Delete promo code (permission checked in middleware, operators can only delete their own)
exports.deletePromoCode = async (req, res) => {
    try {
        const { companyId, promoId } = req.params;
        const { _id: userId, role } = req.user;

        const company = await CompanyModel.findById(companyId);
        if (!company) {
            return sendErrorResponse(res, "Company not found", 404, true, true);
        }

        // Operators can only delete promo codes from their own companies (ownership check)
        if (role === constants.roles.operator && company.adminId.toString() !== userId.toString()) {
            return sendErrorResponse(res, "You can only delete promo codes from your own companies", 403, true, true);
        }

        company.promoCodes = company.promoCodes.filter(
            p => p.id !== promoId && p._id?.toString() !== promoId
        );
        await company.save();

        return sendSuccessResponse(res, {
            message: "Promo code deleted successfully"
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Request company addition (user must be logged in, authentication required)
exports.requestCompanyAddition = async (req, res) => {
    try {
        const { _id: userId } = req.user;

        let logo = "";
        if (req.files && req.files.logo) {
            logo = req.files.logo[0];
            const pathN = logo.path.replace(/\\/g, "/");
            logo.path = pathN;

            const url = await r2.uploadPublic(logo.path, `${logo.filename}`, "CompanyRequests");
            logo = url;
        }

        const companyData = {
            ...req.body,
            description: sanitizeHtml(req.body.description),
            addedBy: userId,
            status: 'pending',
            ratingsAggregate: 0,
            totalReviews: 0,
            logo: logo,
            promoCodes: req.body.promoCodes || []
        };

        const company = new CompanyModel(companyData);
        const savedCompany = await company.save();

        await savedCompany.populate('addedBy', 'fullName email profileImage');

        const companyObj = savedCompany.toObject();
        companyObj.id = companyObj._id.toString();
        return sendSuccessResponse(res, {
            message: "Company addition request submitted successfully. It will be reviewed by an admin or operator.",
            data: companyObj
        }, 201);
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};