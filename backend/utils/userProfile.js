const VERIFIED_TRADER_STATUS = {
    NONE: "none",
    INVITED: "invited",
    PENDING: "pending",
    SCHEDULED: "scheduled",
    APPROVED: "approved",
    REJECTED: "rejected",
    REVOKED: "revoked",
};

const ACTIVE_APPLICATION_STATUSES = [
    VERIFIED_TRADER_STATUS.INVITED,
    VERIFIED_TRADER_STATUS.PENDING,
    VERIFIED_TRADER_STATUS.SCHEDULED,
];

const SOCIAL_LINK_KEYS = ["youtube", "twitter", "instagram", "website", "telegram", "tiktok", "myfxbook"];
const SOCIAL_FOLLOWER_KEYS = ["youtube", "twitter", "instagram", "telegram", "tiktok"];
const STAT_KEYS = ["winRate", "totalTrades", "profitFactor", "avgWin", "avgLoss", "maxDrawdownPct", "lastUpdated"];

// Every key always present (an empty string / 0 when unset): the frontend
// shows each group of profile inputs once GET /api/user/me returns its key.
const socialLinksOf = (user) =>
    Object.fromEntries(SOCIAL_LINK_KEYS.map((key) => [key, user.socialLinks?.[key] || ""]));

const socialFollowersOf = (user) =>
    Object.fromEntries(SOCIAL_FOLLOWER_KEYS.map((key) => [key, Number(user.socialFollowers?.[key]) || 0]));

const tradingSetupOf = (user) => ({
    riskPerTrade: user.tradingSetup?.riskPerTrade || "",
    holdingTime: user.tradingSetup?.holdingTime || "",
    sessions: user.tradingSetup?.sessions || [],
    instruments: user.tradingSetup?.instruments || [],
});

// Only the stats that are set (at least {}).
const statsOf = (verified) => {
    const stats = {};
    for (const key of STAT_KEYS) {
        const value = verified.stats?.[key];
        if (value !== undefined && value !== null) stats[key] = value;
    }
    return stats;
};

// Counts of the documents on an approved application (the files stay private).
const proofCountsOf = (verified) => {
    const docs = verified.proofDocuments || [];
    return {
        brokerStatements: docs.filter((d) => d.type === "broker_statement").length,
        payoutProofs: docs.filter((d) => d.type === "payout_proof").length,
    };
};

// The public summary of approved payouts: firm, amount, currency, date.
const publicPayoutsOf = (verified) =>
    (verified.payouts || [])
        .filter((p) => p.status === "approved")
        .map((p) => ({ firm: p.firm, amount: p.amount, currency: p.currency || "USD", date: p.date, verified: true }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

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
        // B26
        profileType: user.profileType || "trader",
        yearsOfExperience: user.yearsOfExperience || "",
        primaryMarkets: user.primaryMarkets || [],
        socialLinks: socialLinksOf(user),
        // B23
        socialFollowers: socialFollowersOf(user),
        platforms: user.platforms || [],
        tradingSetup: tradingSetupOf(user),
    };

    if (scope === "public") {
        const profile = {
            ...base,
            isVerifiedTrader: isVerified,
            createdAt: user.createdAt,
        };

        if (isVerified) {
            profile.verifiedTrader = {
                status: verified.status,
                pnl: verified.pnl ?? null,
                totalWithdrawals: verified.totalWithdrawals ?? null,
                youtubeEmbedUrl: verified.youtubeEmbedUrl || "",
                stats: statsOf(verified),
                proofCounts: proofCountsOf(verified),
                payouts: publicPayoutsOf(verified),
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
        revokedReason: verified.revokedReason || "",
        invitedAt: verified.invitedAt || null,
        pnl: verified.pnl ?? null,
        totalWithdrawals: verified.totalWithdrawals ?? null,
        youtubeEmbedUrl: verified.youtubeEmbedUrl || "",
        stats: statsOf(verified),
        proofCounts: proofCountsOf(verified),
        proofDocuments: scope === "admin"
            ? (verified.proofDocuments || [])
            : (verified.proofDocuments || []).map((doc) => ({
                type: doc.type,
                fileName: doc.fileName,
                uploadedAt: doc.uploadedAt,
            })),
        payouts: (verified.payouts || []).map((p) => ({
            _id: p._id,
            firm: p.firm,
            amount: p.amount,
            currency: p.currency || "USD",
            date: p.date,
            status: p.status,
            proofFileName: p.proofFileName || "",
            submittedAt: p.submittedAt,
            verifiedAt: p.verifiedAt || null,
            ...(scope === "admin" ? { proofKey: p.proofKey || "" } : {}),
        })),
    };

    if (scope === "own") {
        return {
            ...base,
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
    SOCIAL_LINK_KEYS,
    SOCIAL_FOLLOWER_KEYS,
    toProfile,
};
