const UserModel = require("../models/user.model");
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
]);

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
                    const pseudoUrl = `https://r2.local/${environment.r2.bucketName}/${doc.storageKey}`;
                    downloadUrl = await r2.generatePresignedDownloadUrl(pseudoUrl, 3600);
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

function sanitizeSocialLinks(links = {}) {
    const safe = {};
    ["youtube", "twitter", "instagram", "website"].forEach((key) => {
        if (links[key] !== undefined && links[key] !== null) {
            safe[key] = String(links[key]).trim().slice(0, 500);
        }
    });
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

        return sendSuccessResponse(res, { data: toProfile(user, "public") });
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

        const { bio, tradingStyles, tradesWith, socialLinks, profileImage, fullName, country } = req.body;

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
        return sendErrorResponse(res, error);
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
        const { decision, rejectionReason, pnl, totalWithdrawals, youtubeEmbedUrl } = req.body;

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
            const parsedPnl = pnl !== undefined ? Number(pnl) : verifiedTrader.pnl;
            const parsedWithdrawals = totalWithdrawals !== undefined
                ? Number(totalWithdrawals)
                : verifiedTrader.totalWithdrawals;

            if (parsedPnl !== undefined && Number.isNaN(parsedPnl)) {
                return sendErrorResponse(res, "pnl must be a valid number", 400, true, true);
            }
            if (parsedWithdrawals !== undefined && Number.isNaN(parsedWithdrawals)) {
                return sendErrorResponse(res, "totalWithdrawals must be a valid number", 400, true, true);
            }

            verifiedTrader.status = VERIFIED_TRADER_STATUS.APPROVED;
            verifiedTrader.rejectionReason = "";
            verifiedTrader.pnl = parsedPnl;
            verifiedTrader.totalWithdrawals = parsedWithdrawals;
            verifiedTrader.youtubeEmbedUrl = youtubeEmbedUrl || verifiedTrader.youtubeEmbedUrl || "";
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
