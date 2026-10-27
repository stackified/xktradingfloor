const mongoose = require("mongoose");

// An uploaded recipient list for email campaigns (B12), kept so a campaign
// can be sent to it later without uploading the file again.
const RecipientListSchema = new mongoose.Schema(
    {
        name: { type: String, trim: true, maxlength: 120 },
        fileName: { type: String, default: "" },
        recipients: [{ _id: false, email: { type: String, lowercase: true, trim: true }, name: String }],
        count: { type: Number, default: 0 },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        lastSentAt: Date,
    },
    { timestamps: true, versionKey: false }
);

RecipientListSchema.index({ createdAt: -1 });

module.exports = mongoose.model("RecipientList", RecipientListSchema);
