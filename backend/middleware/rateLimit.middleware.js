const { sendErrorResponse } = require("../utils/response");
const RateLimitModel = require("../models/RateLimit.model");

// The visitor's IP for rate limits. Render sits behind Cloudflare, which sets
// CF-Connecting-IP itself and overwrites any value a client sends. The first
// X-Forwarded-For entry is client-controlled, so it is never used; without
// Cloudflare the last entry (added by the nearest proxy) is.
function getClientIp(req) {
    const cf = req.headers["cf-connecting-ip"] || req.headers["true-client-ip"];
    if (cf) return String(cf).trim();
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) {
        const hops = String(forwarded).split(",").map((s) => s.trim()).filter(Boolean);
        if (hops.length) return hops[hops.length - 1];
    }
    return req.clientIp || req.ip || "unknown";
}

async function consumeRateLimit(key, maxAttempts, windowMs) {
    const now = Date.now();
    let record = await RateLimitModel.findOne({ key });

    if (!record || record.windowStart.getTime() + windowMs <= now) {
        await RateLimitModel.findOneAndUpdate(
            { key },
            { key, count: 1, windowStart: new Date(now), expiresAt: new Date(now + windowMs) },
            { upsert: true, new: true }
        );
        return { allowed: true };
    }

    if (record.count >= maxAttempts) {
        return { allowed: false, retryAfterMs: Math.max(0, record.expiresAt.getTime() - now) };
    }

    record.count += 1;
    record.expiresAt = new Date(now + windowMs);
    await record.save();
    return { allowed: true };
}

function rateLimit(keyPrefix, maxAttempts, windowMs, getKey) {
    return async (req, res, next) => {
        const result = await consumeRateLimit(
            `${keyPrefix}:${getKey(req)}`,
            maxAttempts,
            windowMs
        );

        if (!result.allowed) {
            res.setHeader("Retry-After", String(Math.ceil(result.retryAfterMs / 1000)));
            return sendErrorResponse(
                res,
                "Too many attempts. Please wait and try again later.",
                429,
                true,
                true
            );
        }

        next();
    };
}

module.exports = {
    getClientIp,
    rateLimit,
    // Public forms: 5 per IP per 10 minutes (B16 event sign-up, B20 contact).
    eventRegistrationLimiter: rateLimit(
        "event-register-ip",
        5,
        10 * 60 * 1000,
        getClientIp
    ),
    contactLimiter: rateLimit(
        "contact-ip",
        5,
        10 * 60 * 1000,
        getClientIp
    ),
    // Blog comments: per signed-in user, 6 per 10 minutes.
    commentLimiter: rateLimit(
        "blog-comment",
        6,
        10 * 60 * 1000,
        (req) => String(req.user?._id || getClientIp(req))
    ),
    forgotPasswordLimiter: rateLimit(
        "forgot-ip",
        10,
        60 * 60 * 1000,
        getClientIp
    ),
    resetPasswordLimiter: rateLimit(
        "reset-ip",
        8,
        15 * 60 * 1000,
        getClientIp
    ),
};
