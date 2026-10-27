const mongoose = require('mongoose');
const { addFormatFlag } = require('../utils/contentFormat');
const { computeTrustScore, LICENCE_TIERS } = require('../utils/trustScore');
const Schema = mongoose.Schema;

const CompanySchema = new Schema(
    {
        name: { type: String, required: true },
        description: String,
        details: String,
        category: { type: String, enum: ['Broker', 'PropFirm', 'Crypto'] },
        website: String,
        logo: String,
        logoThumb: String, // B8: 128 px thumbnail for cards and lists
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
        // B21: prop-firm challenge data.
        challenges: [{
            _id: false,
            name: String,
            accountSize: Number,
            currency: { type: String, default: 'USD' },
            price: Number,
            phases: [{ _id: false, profitTarget: Number, dailyDrawdown: Number, maxDrawdown: Number, minTradingDays: Number }],
            drawdownType: { type: String, enum: ['static', 'trailing', 'eod-trailing'] },
            profitSplit: Number,
            payoutFrequency: String,
            refundableFee: Boolean,
            platforms: [String],
        }],
        scalingPlan: String,
        restrictedCountries: [String],
        payoutMethods: [String],
        // B22: broker detail data (`regulation` stays for older records).
        // B32 adds country, tier and checkedAt to each licence.
        licences: [{
            _id: false,
            regulator: String,
            country: String,
            tier: { type: String, enum: LICENCE_TIERS, default: 'unverified' },
            licenceNumber: String,
            entity: String,
            registerUrl: String,
            checkedAt: Date,
        }],
        maxLeverage: String,
        accountTypes: [{ _id: false, name: String, minDeposit: Number, spreadFrom: Number, commission: String }],
        depositMethods: [String],
        withdrawalMethods: [String],
        pros: [String],
        cons: [String],
        dataCheckedAt: Date, // shown as "Details checked on ..."
        // B32: Sahil's manual pick, his 1-5 scores, and the computed score.
        trusted: { type: Boolean, default: false },
        scoreInputs: {
            payouts: Number,
            tradingConditions: Number,
            rules: Number,
            background: Number,
            updatedAt: Date,
        },
        trustScore: { type: Number, default: null }, // 0-100, null with no data
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

// B32: the score follows every change to the company, its licences, its
// scores, platforms or (via the stored rating) its reviews.
CompanySchema.pre('save', function syncTrustScore(next) {
    this.trustScore = computeTrustScore(this);
    next();
});

// Public lists filter on status and category, newest first (B4).
CompanySchema.index({ status: 1, category: 1, createdAt: -1 });
CompanySchema.index({ status: 1, trustScore: -1 });
CompanySchema.index({ 'challenges.accountSize': 1, 'challenges.price': 1 });

const CompanyModel = mongoose.model('company', CompanySchema);
module.exports = CompanyModel;