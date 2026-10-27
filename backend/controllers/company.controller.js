const CompanyModel = require("../models/company.model");
const ReviewModel = require("../models/review.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData, escapeRegex, isValidObjectId } = require("../utils/fn");
const constants = require("../utils/constants");
const r2 = require("../helpers/r2.helper");
const { PUBLIC_USER_FIELDS, publicUser, plainExcerpt } = require("../utils/publicData");
const { sanitizeHtml } = require("../utils/sanitizeHtml");
const { CompanyInputError, readCompanyData, ADMIN_ONLY_FIELDS } = require("../utils/companyData");
const { uploadOptionalPublic } = require("../utils/uploads");
const { requestSiteRebuild } = require("../services/siteRebuild.service");

// Sahil's 1-5 scores stay private: only the total TrustScore is public (B32).
const withoutPrivateScores = (company) => {
    if (!company) return company;
    const { scoreInputs, ...rest } = company;
    return rest;
};

const companyInputError = (res, error) =>
    error instanceof CompanyInputError
        ? sendErrorResponse(res, error.message, error.status || 400, true, true)
        : sendErrorResponse(res, error);

// Structured data from the body; `trusted` and `scoreInputs` only for Admins.
function structuredInput(req, existing) {
    const data = readCompanyData(req.body, existing || {});
    const sentAdminOnly = ADMIN_ONLY_FIELDS.filter((key) => req.body?.[key] !== undefined);
    if (sentAdminOnly.length && req.user?.role !== constants.roles.admin) {
        const error = new CompanyInputError("Only an Admin can change the Trusted flag and the TrustScore scores.");
        error.status = 403;
        throw error;
    }
    return data;
}

// Average rating and count per company in one aggregation, instead of loading
// every review (and its user) just to average them (B4).
async function ratingsFor(companyIds) {
    if (!companyIds.length) return {};
    const rows = await ReviewModel.aggregate([
        { $match: { companyId: { $in: companyIds }, isHidden: { $ne: true } } },
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

const isStaffUser = (user) =>
    Boolean(user) && [constants.roles.admin, constants.roles.operator].includes(user.role);

// Reviews as a viewer may see them. Everyone: the reviewer reduced to id,
// name (never an email) and photo; pinned reviews first, then newest (B11).
// Non-staff: no hidden reviews (B11), no moderation fields, and no proof
// screenshot except on their own review (B19).
function publicReviews(reviews, viewer = null) {
    const staff = isStaffUser(viewer);
    return reviews
        .filter((review) => staff || !review.isHidden)
        .map((review) => {
            const out = { ...review, userId: publicUser(review.userId) };
            if (!staff) {
                const own = viewer && String(review.userId?._id || review.userId) === String(viewer._id);
                if (!own) delete out.screenshot;
                delete out.reports;
                delete out.flags;
                delete out.verifiedBy;
            }
            return out;
        })
        .sort((a, b) => (Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)))
            || (new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
}

// Average of the reviews that count (hidden ones don't).
function ratingOf(reviews) {
    const counted = reviews.filter((r) => !r.isHidden);
    const totalReviews = counted.length;
    const ratingsAggregate = totalReviews > 0
        ? parseFloat((counted.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 0;
    return { ratingsAggregate, totalReviews };
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
        const sort = req.query.sort || req.body.sort;
        const accountSize = req.query.accountSize ?? req.body.accountSize;
        const maxPrice = req.query.maxPrice ?? req.body.maxPrice;

        const query = {};

        if (category != "") query.category = category;
        query.status = 'approved';

        // B21: prop firms with a challenge of this size, optionally at or under
        // a price, for the comparison table.
        if (accountSize !== undefined || maxPrice !== undefined) {
            const match = {};
            if (accountSize !== undefined && accountSize !== "") match.accountSize = Number(accountSize);
            if (maxPrice !== undefined && maxPrice !== "") match.price = { $lte: Number(maxPrice) };
            if (Object.keys(match).length) query.challenges = { $elemMatch: match };
        }

        // Search the name and short details, not the designed HTML review.
        if (searchTerm) {
            query.$or = [
                { name: { $regex: searchTerm, $options: 'i' } },
                { details: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        // Lists carry no full description (designed reviews are 25-30 KB
        // each) and no people: a short plain-text excerpt is enough for cards.
        // B32: ?sort=trustScore orders across pages (no score last).
        const order = sort === "trustScore" ? { trustScore: -1, createdAt: -1 } : { createdAt: -1 };
        const companies = await CompanyModel.find(query)
            .select('-addedBy -adminId -scoreInputs')
            .sort(order)
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
            await ReviewModel.find({ companyId: company._id }).populate("userId", PUBLIC_USER_FIELDS).lean(),
            req.user
        );
        const reviewers = reviews.map(r => r.userId);
        const { ratingsAggregate, totalReviews } = ratingOf(reviews);

        reviews.ratingsAggregate = ratingsAggregate;
        reviews.totalReviews = totalReviews;

        company.reviewsDetails = reviews;
        company.ratingsAggregate = ratingsAggregate;
        company.totalReviews = totalReviews;
        company.reviewers = reviewers;

        return sendSuccessResponse(res, { data: isStaffUser(req.user) ? company : withoutPrivateScores(company) });
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

        const company = await CompanyModel.findOne({ _id: companyId, status: 'approved' }).select('-scoreInputs').lean();

        if (!company) {
            return sendErrorResponse(res, "Company not found", 404, true, true);
        }

        const reviews = publicReviews(
            await ReviewModel.find({ companyId: company._id }).populate("userId", PUBLIC_USER_FIELDS).lean()
        );
        const { ratingsAggregate, totalReviews } = ratingOf(reviews);

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

        const logoThumb = logo ? await uploadOptionalPublic(req, "logoThumb", "Companies") : "";
        const companyData = {
            ...req.body,
            ...structuredInput(req),
            logoThumb,
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
        if (savedCompany.status === 'approved') requestSiteRebuild("company added");

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
        return companyInputError(res, error);
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
        if (role === constants.roles.operator && String(company.adminId || company.addedBy || "") !== String(userId)) {
            return sendErrorResponse(res, "You can only update your own companies", 403, true, true);
        }

        const updates = { ...req.body };
        // Ownership and ids never change through an edit.
        delete updates._id;
        delete updates.addedBy;
        delete updates.adminId;

        // Approving, rejecting or un-publishing is an Admin decision. An
        // Operator can edit their own company but not its status, so they
        // can't approve a company they added themselves.
        if (updates.status !== undefined && role !== constants.roles.admin) {
            if (updates.status !== company.status) {
                return sendErrorResponse(res, "Only an Admin can change a company's status.", 403, true, true);
            }
            delete updates.status;
        }
        if (updates.status !== undefined && !["pending", "approved", "rejected"].includes(updates.status)) {
            return sendErrorResponse(res, "Status must be pending, approved or rejected.", 400, true, true);
        }

        // The stored rating always comes from the reviews, never the request.
        delete updates.ratingsAggregate;
        delete updates.totalReviews;
        if (req.body.ratingsAggregate !== undefined || req.body.totalReviews !== undefined) {
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
            // A thumbnail of the old logo would be wrong, so it is replaced or cleared.
            updates.logoThumb = await uploadOptionalPublic(req, "logoThumb", "Companies");
        } else if (!updates.logo) {
            delete updates.logo;
        }
        if (!req.files?.logo?.[0]) delete updates.logoThumb;

        if (updates.description !== undefined) updates.description = sanitizeHtml(updates.description);
        // Computed by the server; never taken from the request.
        delete updates.trustScore;
        Object.assign(updates, structuredInput(req, company));

        const previousStatus = company.status;
        Object.assign(company, updates);
        const wasApproved = previousStatus === 'approved';
        const updatedCompany = await company.save();
        // An approved company changed, or one was approved or taken down (B25).
        if (updatedCompany.status === 'approved' || wasApproved) requestSiteRebuild("company updated");

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
        return companyInputError(res, error);
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
        if (role === constants.roles.operator && String(company.adminId || company.addedBy || "") !== String(userId)) {
            return sendErrorResponse(res, "You can only delete your own companies", 403, true, true);
        }

        await CompanyModel.findByIdAndDelete(companyId);
        if (company.status === 'approved') requestSiteRebuild("company deleted");
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
        if (role === constants.roles.operator && String(company.adminId || company.addedBy || "") !== String(userId)) {
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
        if (role === constants.roles.operator && String(company.adminId || company.addedBy || "") !== String(userId)) {
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
        if (role === constants.roles.operator && String(company.adminId || company.addedBy || "") !== String(userId)) {
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

        const { trusted, scoreInputs, trustScore, ...requestBody } = req.body || {};
        const logoThumb = logo ? await uploadOptionalPublic(req, "logoThumb", "CompanyRequests") : "";
        const companyData = {
            ...requestBody,
            logoThumb,
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