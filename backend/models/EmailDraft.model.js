const mongoose = require("mongoose");

const emailDraftSchema = new mongoose.Schema(
    {
        subject: {
            type: String,
            required: true,
            trim: true,
        },
        body: {
            type: String,
            required: true,
        },
        template: {
            type: String,
            default: "bulkTemplate.ejs",
        },
        type: {
            type: String,
            enum: ["marketing", "transactional"],
            default: "marketing",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("EmailDraft", emailDraftSchema);
