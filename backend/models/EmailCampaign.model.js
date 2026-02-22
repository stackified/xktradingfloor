const mongoose = require("mongoose");

const emailCampaignSchema = new mongoose.Schema(
    {
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        segmentName: {
            type: String,
            // required: true,
        },
        mailchimpCampaignId: {
            type: String,
        },
        status: {
            type: String,
            enum: ["draft", "sent", "scheduled", "failed"],
            default: "draft",
        },
        recipientsCount: {
            type: Number,
            default: 0,
        },
        sentAt: {
            type: Date,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("EmailCampaign", emailCampaignSchema);
