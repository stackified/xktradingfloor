const mongoose = require("mongoose");

const rateLimitSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        count: {
            type: Number,
            default: 0,
        },
        windowStart: {
            type: Date,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("RateLimit", rateLimitSchema);
