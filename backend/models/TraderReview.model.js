const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Reviews of verified traders (B23 point 5). Same rules as company reviews:
// signed-in users, one per user per trader, a private screenshot as proof,
// and Admin approval before it is public.
const TraderReviewSchema = new Schema(
    {
        traderId: { type: Schema.Types.ObjectId, ref: "user", required: true },
        userId: { type: Schema.Types.ObjectId, ref: "user", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        content: { type: String, required: true, maxlength: 5000 },
        screenshotKey: { type: String, default: "" }, // private storage key
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        moderatedAt: Date,
        moderatedBy: { type: Schema.Types.ObjectId, ref: "user" },
    },
    { timestamps: true, versionKey: false }
);

TraderReviewSchema.index({ traderId: 1, userId: 1 }, { unique: true });
TraderReviewSchema.index({ traderId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("TraderReview", TraderReviewSchema);
