const VERIFIED_TRADER_STATUS = {
    NONE: "none",
    INVITED: "invited",
    PENDING: "pending",
    SCHEDULED: "scheduled",
    APPROVED: "approved",
    REJECTED: "rejected",
};

const ACTIVE_APPLICATION_STATUSES = [
    VERIFIED_TRADER_STATUS.INVITED,
    VERIFIED_TRADER_STATUS.PENDING,
    VERIFIED_TRADER_STATUS.SCHEDULED,
];

function toProfile(user, scope = "public") {
    const verified = user.verifiedTrader || {};
    const isVerified = verified.status === VERIFIED_TRADER_STATUS.APPROVED;

    let memberSince = null;
    if (user.createdAt) {
        const date = new Date(user.createdAt);
        if (!Number.isNaN(date.getTime())) {
            memberSince = date.toISOString().slice(0, 7);
        }
    }

    const base = {
        id: user._id?.toString(),
        fullName: user.fullName,
        profileImage: user.profileImage || "",
        country: user.country,
        bio: user.bio || "",
        tradingStyles: user.tradingStyles || [],
        tradesWith: user.tradesWith || [],
        memberSince,
    };

    if (scope === "public") {
        const profile = {
            ...base,
            socialLinks: user.socialLinks || {},
            isVerifiedTrader: isVerified,
            createdAt: user.createdAt,
        };

        if (isVerified) {
            profile.verifiedTrader = {
                status: verified.status,
                pnl: verified.pnl ?? null,
                totalWithdrawals: verified.totalWithdrawals ?? null,
                youtubeEmbedUrl: verified.youtubeEmbedUrl || "",
            };
        }

        return profile;
    }

    const verifiedTrader = {
        status: verified.status || VERIFIED_TRADER_STATUS.NONE,
        applicationNote: verified.applicationNote || "",
        appliedAt: verified.appliedAt || null,
        scheduledCallAt: verified.scheduledCallAt || null,
        decidedAt: verified.decidedAt || null,
        rejectionReason: verified.rejectionReason || "",
        invitedAt: verified.invitedAt || null,
        pnl: verified.pnl ?? null,
        totalWithdrawals: verified.totalWithdrawals ?? null,
        youtubeEmbedUrl: verified.youtubeEmbedUrl || "",
        proofDocuments: scope === "admin"
            ? (verified.proofDocuments || [])
            : (verified.proofDocuments || []).map((doc) => ({
                type: doc.type,
                fileName: doc.fileName,
                uploadedAt: doc.uploadedAt,
            })),
    };

    if (scope === "own") {
        return {
            ...base,
            socialLinks: user.socialLinks || {},
            role: user.role,
            verifiedTrader,
        };
    }

    return {
        ...base,
        email: user.email,
        verifiedTrader,
    };
}

module.exports = {
    VERIFIED_TRADER_STATUS,
    ACTIVE_APPLICATION_STATUSES,
    toProfile,
};
