const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReviewSchema = new Schema(
    {
        companyId: { type: Schema.Types.ObjectId, ref: 'company', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'user', required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        title: String,
        body: String,
        comment: String,
<<<<<<< HEAD
        screenshot: { type: String, default: null },
        isVerified: { type: Boolean, default: false },
        isHidden: { type: Boolean, default: false },
        isPinned: { type: Boolean, default: false },
        flags: [{ type: String }],
        reports: [
            {
                userId: { type: Schema.Types.ObjectId, ref: 'user' },
                reason: String,
                createdAt: { type: Date, default: Date.now }
            }
        ],
=======
        screenshot: {
            type: String, default: null
        },
>>>>>>> 13dc31adec0b33360974b835ddf23c4460c8512e
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const ReviewModel = mongoose.model('review', ReviewSchema);
module.exports = ReviewModel;