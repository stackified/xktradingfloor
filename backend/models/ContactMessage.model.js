const mongoose = require("mongoose");

// Messages from the Contact page form (B20).
const ContactMessageSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
        type: { type: String, required: true },
        message: { type: String, required: true, maxlength: 5000 },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    },
    { timestamps: true, versionKey: false }
);

ContactMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model("ContactMessage", ContactMessageSchema);
