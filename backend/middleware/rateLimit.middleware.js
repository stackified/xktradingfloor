const { sendErrorResponse } = require("../utils/response");
const RateLimitModel = require("../models/RateLimit.model");

function getClientIp(req) {
    const forwarded = req.headers["x-forwarded-for"];
    if (forwarded) return String(forwarded).split(",")[0].trim();
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
