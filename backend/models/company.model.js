const mongoose = require('mongoose');
const { addFormatFlag } = require('../utils/contentFormat');
const Schema = mongoose.Schema;

const CompanySchema = new Schema(
    {
        name: { type: String, required: true },
        description: String,
        details: String,
        category: { type: String, enum: ['Broker', 'PropFirm', 'Crypto'] },
        website: String,
        logo: String,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        ratingsAggregate: { type: Number, default: 0 },
        totalReviews: { type: Number, default: 0 },
        country: String,
        yearsActive: String,
        regulation: [String],
        minDeposit: String,
        assets: [String],
        platforms: [String],
        maxAllocation: String,
        myfxbookSlug: String,
        addedBy: { type: Schema.Types.ObjectId, ref: 'user' },
        adminId: { type: Schema.Types.ObjectId, ref: 'user' },
        promoCodes: [{
            id: String,
            code: { type: String, required: true },
            discount: { type: Number, required: true },
            discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
            validFrom: Date,
            validTo: Date,
            terms: String,
            featured: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        }],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// B14: "html" when description is a designed page.
addFormatFlag(CompanySchema, "description", "descriptionFormat");

// Public lists filter on status and category, newest first (B4).
CompanySchema.index({ status: 1, category: 1, createdAt: -1 });

const CompanyModel = mongoose.model('company', CompanySchema);
module.exports = CompanyModel;