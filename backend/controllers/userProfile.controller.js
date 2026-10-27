const UserModel = require("../models/user.model");
const TraderReviewModel = require("../models/TraderReview.model");
const r2 = require("../helpers/r2.helper");
const environment = require("../utils/environment");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const {
    getPagination,
    getPaginationData,
    isValidObjectId,
    isReservedUserSlug,
} = require("../utils/fn");
const {
    VERIFIED_TRADER_STATUS,
    ACTIVE_APPLICATION_STATUSES,
    toProfile,
} = require("../utils/userProfile");

const PROOF_FOLDER = "VerifiedTraderProofs";
const PROFILE_IMAGE_FOLDER = "Users";
const MAX_PROFILE_IMAGE_LENGTH = 750000;
const ALLOWED_APPLICATION_STATUSES = new Set([
    ...ACTIVE_APPLICATION_STATUSES,
    VERIFIED_TRADER_STATUS.REJECTED,
    VERIFIED_TRADER_STATUS.APPROVED,
    VERIFIED_TRADER_STATUS.REVOKED,
]);

// B26 / B23 profile field rules.
const PROFILE_TYPES = ["trader", "trader_influencer"];
const EXPERIENCE_VALUES = ["", "0-1", "1-2", "2-5", "5-10", "10+"];
const MARKETS = ["Forex", "Gold & Metals", "Indices", "Crypto", "Stocks", "Commodities"];
const PLATFORMS = ["MT4", "MT5", "cTrader", "TradingView", "DXtrade", "Match-Trader", "NinjaTrader"];
const SESSIONS = ["Asian", "London", "New York", "Sydney"];
const MYFXBOOK_HOSTS = new Set(["myfxbook.com", "www.myfxbook.com"]);
const MYFXBOOK_PATH_RE = /^\/members\/[^/]+\/[^/]+\/\d+\/?$/;
const MAX_FOLLOWERS = 1000000000;
const PAYOUT_FOLDER = "VerifiedTraderPayouts";

class ProfileInputError extends Error {}

// Multipart sends objects as JSON strings; JSON bodies send real objects.
function parseObject(value) {
    if (value === undefined || value === null || value === "") return {};
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
        } catch (_) {
            return {};
        }
    }
    return typeof value === "object" && !Array.isArray(value) ? value : {};
}

// Keep only allowed values, in the allowed spelling, without duplicates.
const pickAllowed = (values, allowed, max) => {
    const byLower = new Map(allowed.map((a) => [a.toLowerCase(), a]));
    const out = [];
    for (const value of values) {
        const match = byLower.get(String(value).trim().toLowerCase());
        if (match && !out.includes(match)) out.push(match);
    }
    return out.slice(0, max);
};

// Admin-entered trader stats (B23): numbers 0 or more, percentages 0 to 100;
// null clears a stat. Returns the merged stats object.
function readStats(input, current = {}) {
    const stats = { ...current };
    const body = parseObject(input);
    const rules = {
        winRate: { pct: true },
        totalTrades: { int: true },
        profitFactor: {},
        avgWin: {},
        avgLoss: {},
        maxDrawdownPct: { pct: true },
    };
    for (const [key, rule] of Object.entries(rules)) {
        if (!(key in body)) continue;
        if (body[key] === null || body[key] === "") {
            delete stats[key];
            continue;
        }
        const n = Number(body[key]);
        if (!Number.isFinite(n) || n < 0 || (rule.pct && n > 100)) {
            throw new ProfileInputError(`${key} must be ${rule.pct ? "between 0 and 100" : "0 or more"}.`);
        }
        stats[key] = rule.int ? Math.round(n) : n;
    }
    if ("lastUpdated" in body) {
        if (body.lastUpdated === null || body.lastUpdated === "") {
            delete stats.lastUpdated;
        } else {
            const date = new Date(body.lastUpdated);
            if (Number.isNaN(date.getTime())) throw new ProfileInputError("lastUpdated must be a date.");
            stats.lastUpdated = date;
        }
    }
    return stats;
}

// pnl / totalWithdrawals / youtubeEmbedUrl / stats from an admin request.
function applyAdminTraderNumbers(verifiedTrader, body) {
    for (const key of ["pnl", "totalWithdrawals"]) {
        if (body[key] === undefined) continue;
        if (body[key] === null || body[key] === "") {
            verifiedTrader[key] = undefined;
            continue;
        }
        const n = Number(body[key]);
        if (!Number.isFinite(n)) throw new ProfileInputError(`${key} must be a valid number`);
        verifiedTrader[key] = n;
    }
    if (body.youtubeEmbedUrl !== undefined) {
        verifiedTrader.youtubeEmbedUrl = normaliseLink(body.youtubeEmbedUrl, "YouTube");
    }
    if (body.stats !== undefined) {
        const current = verifiedTrader.stats?.toObject?.() || verifiedTrader.stats || {};
        verifiedTrader.stats = readStats(body.stats, current);
    }
}

const profileError = (res, error) =>
    error instanceof ProfileInputError
        ? sendErrorResponse(res, error.message, 400, true, true)
        : sendErrorResponse(res, error);

function ensureVerifiedTrader(user) {
    if (!user.verifiedTrader) {
        user.verifiedTrader = { status: VERIFIED_TRADER_STATUS.NONE };
    }
    return user.verifiedTrader;
}

async function uploadProofFiles(files, type) {
    if (!files?.length) return [];

    const documents = [];
    for (const file of files) {
        const localPath = file.path.replace(/\\/g, "/");
        await r2.uploadPrivate(localPath, file.filename, PROOF_FOLDER);
        documents.push({
            type,
            storageKey: `${PROOF_FOLDER}/${file.filename}`,
            fileName: file.originalname,
            uploadedAt: new Date(),
        });
    }
    return documents;
}

async function attachProofDownloadUrls(proofDocuments = []) {
    return Promise.all(
        proofDocuments.map(async (doc) => {
            let downloadUrl = null;
            if (doc.storageKey) {
                try {
                    downloadUrl = await r2.signedPrivateUrl(doc.storageKey, 3600);
                } catch (_) {
                    downloadUrl = null;
                }
            }
            return {
                type: doc.type,
                fileName: doc.fileName,
                uploadedAt: doc.uploadedAt,
                storageKey: doc.storageKey,
                downloadUrl,
            };
        })
    );
}

function canApplyForVerification(status) {
    return [
        VERIFIED_TRADER_STATUS.NONE,
        VERIFIED_TRADER_STATUS.INVITED,
        VERIFIED_TRADER_STATUS.REJECTED,
        VERIFIED_TRADER_STATUS.REVOKED,
    ].includes(status || VERIFIED_TRADER_STATUS.NONE);
}

function parseStringList(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item).trim()).filter(Boolean);
            }
        } catch (_) {
            // fall through to comma-separated parsing
        }
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return [];
}

// A profile link is stored only as an http(s) URL, so it can never become a
// javascript: or data: link on the public profile. A link typed without a
// scheme ("youtube.com/@tara") gets https:// added; any other scheme is a 400.
function normaliseLink(value, label) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
    let url;
    try {
        url = new URL(withScheme);
    } catch (_) {
        throw new ProfileInputError(`The ${label} link isn't a valid web address.`);
    }
    if (!["http:", "https:"].includes(url.protocol)) {
        throw new ProfileInputError(`The ${label} link must start with https://.`);
    }
    const out = url.toString();
    if (out.length > 500) throw new ProfileInputError(`The ${label} link is too long.`);
    return out;
}

function sanitizeSocialLinks(links = {}) {
    const safe = {};
    ["youtube", "twitter", "instagram", "website", "telegram", "tiktok"].forEach((key) => {
        if (links[key] !== undefined && links[key] !== null) {
            safe[key] = normaliseLink(links[key], key);
        }
    });
    // B23: only a public Myfxbook account link; an empty string clears it.
    if (links.myfxbook !== undefined && links.myfxbook !== null) {
        const value = String(links.myfxbook).trim();
        if (value) {
            let url = null;
            try {
                url = new URL(value);
            } catch (_) {
                url = null;
            }
            if (!url || url.protocol !== "https:" || !MYFXBOOK_HOSTS.has(url.hostname) || !MYFXBOOK_PATH_RE.test(url.pathname) || value.length > 500) {
                throw new ProfileInputError(
                    "The Myfxbook link must be a public account link, like https://www.myfxbook.com/members/name/account/1234567."
                );
            }
            safe.myfxbook = `https://${url.hostname}${url.pathname}`;
        } else {
            safe.myfxbook = "";
        }
    }
    return safe;
}

exports.getPublicProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        if (isReservedUserSlug(userId) || !isValidObjectId(userId)) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }

        const user = await UserModel.findOne({
            _id: userId,
            isDeleted: false,
            isActive: true,
        }).lean();

        if (!user) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }

        const profile = toProfile(user, "public");
        // B23 point 5: approved reviews of this trader, for the header and tab.
        const [summary] = await TraderReviewModel.aggregate([
            { $match: { traderId: user._id, status: "approved" } },
            { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" } } },
        ]);
        profile.reviewsSummary = {
            count: summary?.count || 0,
            average: summary ? Math.round(summary.average * 10) / 10 : 0,
        };

        return sendSuccessResponse(res, { data: profile });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.listVerifiedTraders = async (req, res) => {
    try {
        const { page, size } = req.query;
        const { limit, offset } = getPagination(page, size);

        const query = {
            isDeleted: false,
            isActive: true,
            "verifiedTrader.status": VERIFIED_TRADER_STATUS.APPROVED,
        };

        const [users, totalItems] = await Promise.all([
            UserModel.find(query)
                .sort({ "verifiedTrader.decidedAt": -1, createdAt: -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            UserModel.countDocuments(query),
        ]);

        return sendSuccessResponse(
            res,
            getPaginationData(
                { count: totalItems, docs: users.map((user) => toProfile(user, "public")) },
                page,
                limit
            )
        );
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const user = await UserModel.findOne({
            _id: req.user._id,
            isDeleted: false,
        }).lean();

        if (!user) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }

        return sendSuccessResponse(res, { data: toProfile(user, "own") });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.updateMyProfile = async (req, res) => {
    try {
        if (req.fileValidationError) {
            return sendErrorResponse(res, req.fileValidationError, 400, true, true);
        }

        const user = await UserModel.findOne({
            _id: req.user._id,
            isDeleted: false,
        });

        if (!user) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }

        const {
            bio, tradingStyles, tradesWith, socialLinks, profileImage, fullName, country,
            profileType, yearsOfExperience, primaryMarkets, socialFollowers, platforms, tradingSetup,
        } = req.body;

        if (bio !== undefined) user.bio = String(bio).slice(0, 1000);
        if (fullName !== undefined) user.fullName = String(fullName).trim();
        if (country !== undefined) user.country = String(country).trim();

        if (req?.files?.profileImage?.[0]) {
            const file = req.files.profileImage[0];
            const pathN = file.path.replaceAll("\\", "/");
            file.path = pathN;
            user.profileImage = await r2.uploadPublic(file.path, file.filename, PROFILE_IMAGE_FOLDER);
        } else if (profileImage !== undefined) {
            const imageValue = String(profileImage).trim();
            if (!imageValue) {
                user.profileImage = "";
            } else if (/^https?:\/\//i.test(imageValue)) {
                user.profileImage = imageValue;
            } else if (imageValue.startsWith("data:")) {
                if (imageValue.length > MAX_PROFILE_IMAGE_LENGTH) {
                    return sendErrorResponse(res, "Profile image is too large. Upload the file directly instead.", 400, true, true);
                }
                user.profileImage = imageValue;
            } else {
                return sendErrorResponse(res, "Invalid profile image", 400, true, true);
            }
        }
        if (tradingStyles !== undefined) user.tradingStyles = parseStringList(tradingStyles).slice(0, 10);
        if (tradesWith !== undefined) user.tradesWith = parseStringList(tradesWith).slice(0, 20);

        // B26: unknown values are ignored rather than rejected.
        if (profileType !== undefined && PROFILE_TYPES.includes(profileType)) user.profileType = profileType;
        if (yearsOfExperience !== undefined && EXPERIENCE_VALUES.includes(yearsOfExperience)) {
            user.yearsOfExperience = yearsOfExperience;
        }
        if (primaryMarkets !== undefined) user.primaryMarkets = pickAllowed(parseStringList(primaryMarkets), MARKETS, 6);

        // B23: follower counts, platforms, trading setup.
        if (socialFollowers !== undefined) {
            const counts = parseObject(socialFollowers);
            const current = user.socialFollowers?.toObject?.() || user.socialFollowers || {};
            const next = { ...current };
            for (const key of ["youtube", "twitter", "instagram", "telegram", "tiktok"]) {
                if (counts[key] === undefined) continue;
                const n = Math.round(Number(counts[key]) || 0);
                if (n < 0 || n > MAX_FOLLOWERS) {
                    throw new ProfileInputError("Follower counts must be between 0 and 1,000,000,000.");
                }
                next[key] = n;
            }
            user.socialFollowers = next;
        }
        if (platforms !== undefined) user.platforms = pickAllowed(parseStringList(platforms), PLATFORMS, 10);
        if (tradingSetup !== undefined) {
            const setup = parseObject(tradingSetup);
            const current = user.tradingSetup?.toObject?.() || user.tradingSetup || {};
            const short = (value) => String(value || "").trim().slice(0, 100);
            const list = (value, max = 10) =>
                parseStringList(value).map((v) => v.slice(0, 50)).slice(0, max);
            user.tradingSetup = {
                riskPerTrade: setup.riskPerTrade !== undefined ? short(setup.riskPerTrade) : current.riskPerTrade || "",
                holdingTime: setup.holdingTime !== undefined ? short(setup.holdingTime) : current.holdingTime || "",
                sessions: setup.sessions !== undefined ? pickAllowed(list(setup.sessions), SESSIONS, 10) : current.sessions || [],
                instruments: setup.instruments !== undefined ? list(setup.instruments) : current.instruments || [],
            };
        }

        if (socialLinks !== undefined) {
            let links = socialLinks;
            if (typeof socialLinks === "string") {
                try {
                    links = JSON.parse(socialLinks);
                } catch (_) {
                    links = {};
                }
            }
            user.socialLinks = {
                ...user.socialLinks?.toObject?.() || user.socialLinks || {},
                ...sanitizeSocialLinks(links),
            };
        }

        await user.save();
        return sendSuccessResponse(res, {
            message: "Profile updated",
            data: toProfile(user.toObject(), "own"),
        });
    } catch (error) {
        return profileError(res, error);
    }
};

exports.applyForVerifiedTrader = async (req, res) => {
    try {
        if (req.fileValidationError) {
            return sendErrorResponse(res, req.fileValidationError, 400, true, true);
        }

        const user = await UserModel.findOne({
            _id: req.user._id,
            isDeleted: false,
            isActive: true,
        });

        if (!user) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }

        const currentStatus = user.verifiedTrader?.status || VERIFIED_TRADER_STATUS.NONE;
        if (!canApplyForVerification(currentStatus)) {
            return sendErrorResponse(
                res,
                "You already have an active verified-trader application",
                400,
                true,
                true
            );
        }

        let brokerStatements = [];
        let payoutProofs = [];
        try {
            brokerStatements = await uploadProofFiles(
                req.files?.brokerStatements,
                "broker_statement"
            );
            payoutProofs = await uploadProofFiles(
                req.files?.payoutProofs,
                "payout_proof"
            );
        } catch (uploadError) {
            return sendErrorResponse(res, "Failed to upload proof documents", 500, true, true);
        }

        const proofDocuments = [...brokerStatements, ...payoutProofs];

        if (!proofDocuments.length) {
            return sendErrorResponse(
                res,
                "Upload at least one broker statement or payout proof",
                400,
                true,
                true
            );
        }

        const verifiedTrader = ensureVerifiedTrader(user);
        Object.assign(verifiedTrader, {
            ...(user.verifiedTrader?.toObject?.() || user.verifiedTrader || {}),
            status: VERIFIED_TRADER_STATUS.PENDING,
            applicationNote: String(req.body.applicationNote || "").slice(0, 2000),
            appliedAt: new Date(),
            scheduledCallAt: null,
            decidedAt: null,
            decidedBy: null,
            rejectionReason: "",
            proofDocuments,
        });
        user.verifiedTrader = verifiedTrader;
        user.markModified("verifiedTrader");

        await user.save();

        return sendSuccessResponse(res, {
            message: "Verified trader application submitted",
            data: toProfile(user.toObject(), "own"),
        }, 201);
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.listVerifiedTraderApplications = async (req, res) => {
    try {
        const { page, size, status } = req.query;
        const { limit, offset } = getPagination(page, size);

        if (status && !ALLOWED_APPLICATION_STATUSES.has(status)) {
            return sendErrorResponse(res, "Invalid status filter", 400, true, true);
        }

        const query = {
            isDeleted: false,
            "verifiedTrader.status": status
                ? status
                : { $in: ACTIVE_APPLICATION_STATUSES },
        };

        const [users, totalItems] = await Promise.all([
            UserModel.find(query)
                .sort({ "verifiedTrader.appliedAt": -1, "verifiedTrader.invitedAt": -1 })
                .skip(offset)
                .limit(limit)
                .lean(),
            UserModel.countDocuments(query),
        ]);

        const data = await Promise.all(
            users.map(async (user) => {
                const application = toProfile(user, "admin");
                application.verifiedTrader.proofDocuments = await attachProofDownloadUrls(
                    application.verifiedTrader.proofDocuments
                );
                application.verifiedTrader.payouts = await Promise.all(
                    application.verifiedTrader.payouts.map(async ({ proofKey, ...payout }) => ({
                        ...payout,
                        proofDownloadUrl: proofKey ? await r2.signedPrivateUrl(proofKey, 3600).catch(() => null) : null,
                    }))
                );
                return application;
            })
        );

        return sendSuccessResponse(
            res,
            getPaginationData({ count: totalItems, docs: data }, page, limit)
        );
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.scheduleVerifiedTraderCall = async (req, res) => {
    try {
        const { userId } = req.params;
        const { scheduledCallAt } = req.body;

        if (!isValidObjectId(userId)) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }
        if (!scheduledCallAt) {
            return sendErrorResponse(res, "scheduledCallAt is required", 400, true, true);
        }

        const callDate = new Date(scheduledCallAt);
        if (Number.isNaN(callDate.getTime())) {
            return sendErrorResponse(res, "Invalid scheduledCallAt", 400, true, true);
        }

        const user = await UserModel.findOne({
            _id: userId,
            isDeleted: false,
            "verifiedTrader.status": VERIFIED_TRADER_STATUS.PENDING,
        });

        if (!user) {
            return sendErrorResponse(res, "Pending application not found", 404, true, true);
        }

        const verifiedTrader = ensureVerifiedTrader(user);
        verifiedTrader.status = VERIFIED_TRADER_STATUS.SCHEDULED;
        verifiedTrader.scheduledCallAt = callDate;
        user.markModified("verifiedTrader");
        await user.save();

        return sendSuccessResponse(res, {
            message: "Verification call scheduled",
            data: toProfile(user.toObject(), "admin"),
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.decideVerifiedTraderApplication = async (req, res) => {
    try {
        const { userId } = req.params;
        const { decision, rejectionReason } = req.body;

        if (!isValidObjectId(userId)) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }
        if (!["approved", "rejected"].includes(decision)) {
            return sendErrorResponse(res, "decision must be approved or rejected", 400, true, true);
        }

        const user = await UserModel.findOne({
            _id: userId,
            isDeleted: false,
            "verifiedTrader.status": {
                $in: [VERIFIED_TRADER_STATUS.PENDING, VERIFIED_TRADER_STATUS.SCHEDULED],
            },
        });

        if (!user) {
            return sendErrorResponse(res, "Active application not found", 404, true, true);
        }

        const verifiedTrader = ensureVerifiedTrader(user);
        verifiedTrader.decidedAt = new Date();
        verifiedTrader.decidedBy = req.user._id;

        if (decision === "approved") {
            // pnl, totalWithdrawals, youtubeEmbedUrl and (B23) stats.
            applyAdminTraderNumbers(verifiedTrader, req.body);
            verifiedTrader.status = VERIFIED_TRADER_STATUS.APPROVED;
            verifiedTrader.rejectionReason = "";
            verifiedTrader.revokedReason = "";
        } else {
            verifiedTrader.status = VERIFIED_TRADER_STATUS.REJECTED;
            verifiedTrader.rejectionReason = String(rejectionReason || "Application rejected").slice(0, 1000);
        }

        user.markModified("verifiedTrader");
        await user.save();

        return sendSuccessResponse(res, {
            message: `Application ${decision}`,
            data: toProfile(user.toObject(), "admin"),
        });
    } catch (error) {
        return profileError(res, error);
    }
};

// PATCH /api/admin/users/verified-trader/:userId/stats (Admin/Operator, B23)
// Body: { pnl, totalWithdrawals, youtubeEmbedUrl, stats: {...} }; null clears.
exports.updateVerifiedTraderStats = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isValidObjectId(userId)) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }
        const user = await UserModel.findOne({
            _id: userId,
            isDeleted: false,
            "verifiedTrader.status": VERIFIED_TRADER_STATUS.APPROVED,
        });
        if (!user) {
            return sendErrorResponse(res, "Approved verified trader not found", 404, true, true);
        }

        const verifiedTrader = ensureVerifiedTrader(user);
        applyAdminTraderNumbers(verifiedTrader, req.body || {});
        user.markModified("verifiedTrader");
        await user.save();

        return sendSuccessResponse(res, {
            message: "Trader stats updated",
            data: toProfile(user.toObject(), "admin"),
        });
    } catch (error) {
        return profileError(res, error);
    }
};

// POST /api/admin/users/verified-trader/:userId/revoke (Admin only, B28)
// Takes the Verified Trader badge away; the account itself is untouched and
// its proof documents stay private.
exports.revokeVerifiedTrader = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!isValidObjectId(userId)) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }
        const user = await UserModel.findOne({
            _id: userId,
            isDeleted: false,
            "verifiedTrader.status": VERIFIED_TRADER_STATUS.APPROVED,
        });
        if (!user) {
            return sendErrorResponse(res, "Approved verified trader not found", 404, true, true);
        }

        const verifiedTrader = ensureVerifiedTrader(user);
        verifiedTrader.status = VERIFIED_TRADER_STATUS.REVOKED;
        verifiedTrader.decidedAt = new Date();
        verifiedTrader.decidedBy = req.user._id;
        verifiedTrader.revokedReason = String(req.body?.reason || "").trim().slice(0, 1000);
        user.markModified("verifiedTrader");
        await user.save();

        return sendSuccessResponse(res, {
            message: "Verified Trader badge removed",
            data: toProfile(user.toObject(), "admin"),
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

const PAYOUT_CURRENCIES = new Set(["USD", "EUR", "GBP", "INR", "AED", "AUD", "CAD", "SGD", "USDT"]);

// POST /api/user/verified-trader/payouts (signed-in verified trader, B23)
// Multipart: firm, amount, currency, date, proof (file). The proof is private.
exports.submitPayout = async (req, res) => {
    try {
        if (req.fileValidationError) {
            return sendErrorResponse(res, req.fileValidationError, 400, true, true);
        }
        const user = await UserModel.findOne({
            _id: req.user._id,
            isDeleted: false,
            "verifiedTrader.status": VERIFIED_TRADER_STATUS.APPROVED,
        });
        if (!user) {
            return sendErrorResponse(res, "Only verified traders can add payouts.", 403, true, true);
        }

        const firm = String(req.body.firm || "").trim().slice(0, 120);
        const amount = Number(req.body.amount);
        const currency = String(req.body.currency || "USD").trim().toUpperCase();
        const date = new Date(req.body.date);
        if (!firm) return sendErrorResponse(res, "Enter the firm that paid out.", 400, true, true);
        if (!Number.isFinite(amount) || amount <= 0) return sendErrorResponse(res, "Enter the payout amount.", 400, true, true);
        if (!PAYOUT_CURRENCIES.has(currency)) return sendErrorResponse(res, `Currency ${currency} is not supported.`, 400, true, true);
        if (Number.isNaN(date.getTime()) || date > new Date()) return sendErrorResponse(res, "Enter the payout date.", 400, true, true);

        const file = req.files?.proof?.[0];
        if (!file) return sendErrorResponse(res, "Attach the payout proof.", 400, true, true);
        const proofKey = await r2.uploadPrivate(file.path.replace(/\\/g, "/"), file.filename, PAYOUT_FOLDER);

        const verifiedTrader = ensureVerifiedTrader(user);
        verifiedTrader.payouts = [
            ...(verifiedTrader.payouts || []),
            { firm, amount, currency, date, proofKey, proofFileName: file.originalname, status: "pending", submittedAt: new Date() },
        ];
        user.markModified("verifiedTrader");
        await user.save();

        return sendSuccessResponse(res, {
            message: "Payout submitted for review",
            data: toProfile(user.toObject(), "own"),
        }, 201);
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// PATCH /api/admin/users/verified-trader/:userId/payouts/:payoutId (Admin/Operator)
// Body: { status: "approved" | "rejected" }
exports.decidePayout = async (req, res) => {
    try {
        const { userId, payoutId } = req.params;
        const { status } = req.body || {};
        if (!isValidObjectId(userId) || !isValidObjectId(payoutId)) {
            return sendErrorResponse(res, "Payout not found", 404, true, true);
        }
        if (!["approved", "rejected"].includes(status)) {
            return sendErrorResponse(res, "status must be approved or rejected", 400, true, true);
        }
        const user = await UserModel.findOne({ _id: userId, isDeleted: false, "verifiedTrader.payouts._id": payoutId });
        if (!user) return sendErrorResponse(res, "Payout not found", 404, true, true);

        const payout = user.verifiedTrader.payouts.id(payoutId);
        payout.status = status;
        payout.verifiedAt = status === "approved" ? new Date() : null;
        payout.verifiedBy = req.user._id;
        user.markModified("verifiedTrader");
        await user.save();

        return sendSuccessResponse(res, {
            message: `Payout ${status}`,
            data: toProfile(user.toObject(), "admin"),
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.inviteVerifiedTrader = async (req, res) => {
    try {
        const { email, userId } = req.body;
        if (!email && !userId) {
            return sendErrorResponse(res, "email or userId is required", 400, true, true);
        }

        const filter = { isDeleted: false, isActive: true };
        if (userId) {
            if (!isValidObjectId(userId)) {
                return sendErrorResponse(res, "User not found", 404, true, true);
            }
            filter._id = userId;
        } else {
            filter.email = String(email).trim().toLowerCase();
        }

        const user = await UserModel.findOne(filter);
        if (!user) {
            return sendErrorResponse(res, "User not found", 404, true, true);
        }

        const currentStatus = user.verifiedTrader?.status || VERIFIED_TRADER_STATUS.NONE;
        if (currentStatus === VERIFIED_TRADER_STATUS.APPROVED) {
            return sendErrorResponse(res, "User is already a verified trader", 400, true, true);
        }
        if ([VERIFIED_TRADER_STATUS.PENDING, VERIFIED_TRADER_STATUS.SCHEDULED].includes(currentStatus)) {
            return sendErrorResponse(res, "User already has an active application", 400, true, true);
        }

        const verifiedTrader = ensureVerifiedTrader(user);
        Object.assign(verifiedTrader, {
            ...(user.verifiedTrader?.toObject?.() || user.verifiedTrader || {}),
            status: VERIFIED_TRADER_STATUS.INVITED,
            invitedBy: req.user._id,
            invitedAt: new Date(),
            rejectionReason: "",
        });
        user.verifiedTrader = verifiedTrader;
        user.markModified("verifiedTrader");

        await user.save();

        return sendSuccessResponse(res, {
            message: "Verified trader invitation sent",
            data: toProfile(user.toObject(), "admin"),
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};
