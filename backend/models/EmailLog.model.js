const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["transactional", "marketing"],
            required: true,
        },
        template: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["sent", "failed", "delivered", "opened", "clicked"],
            default: "sent",
        },
        provider: {
            type: String,
            default: "mailchimp",
        },
        providerResponse: {
            type: mongoose.Schema.Types.Mixed,
        },
        errorMessage: {
            type: String,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("EmailLog", emailLogSchema);
