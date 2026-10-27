const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const constants = require("../utils/constants");

const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        fullName: { type: String },
        profileImage: {
            type: String,
            default: ""
        },
        gender: {
            type: String,
        },
        email: {
            type: String,
            // required: true,
            // unique: true,
            trim: true, // Removes any leading/trailing spaces
            lowercase: true // Converts to lowercase
        },
        country: { type: String, default: "IN" },
        countryCode: { type: String, default: "+91" },
        mobileNumber: {
            type: String,
            // required: true,
            // unique: true,
        },
        password: { type: String, select: false },
        role: {
            type: String,
            enum: constants.user.roles,
            default: constants.roles.user,
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        dateOfBirth: {
            type: Date,
        },
        moduleAccessId: {
            type: Schema.Types.ObjectId,
            ref: "module_access",
        },
        age: {
            type: Number
        },
        addedBy: {
            type: Schema.Types.ObjectId,
            ref: "user",
            default: null
        },
        resetPasswordToken: {
            type: String
        },
        resetPasswordExpiry: {
            type: Date
        },
        tokenVersion: {
            type: Number,
            default: 0,
        },
        lastPasswordResetRequestedAt: {
            type: Date,
        },
        bio: { type: String, default: "" },
        tradingStyles: { type: [String], default: [] },
        tradesWith: { type: [String], default: [] },
        // B26: Verified Trader profile fields.
        profileType: { type: String, enum: ["trader", "trader_influencer"], default: "trader" },
        yearsOfExperience: { type: String, enum: ["", "0-1", "1-2", "2-5", "5-10", "10+"], default: "" },
        primaryMarkets: { type: [String], default: [] },
        socialLinks: {
            youtube: { type: String, default: "" },
            twitter: { type: String, default: "" },
            instagram: { type: String, default: "" },
            website: { type: String, default: "" },
            telegram: { type: String, default: "" }, // B26
            tiktok: { type: String, default: "" }, // B26
            myfxbook: { type: String, default: "" }, // B23: public Myfxbook account URL
        },
        // B23: typed by the trader.
        socialFollowers: {
            youtube: { type: Number, default: 0 },
            twitter: { type: Number, default: 0 },
            instagram: { type: Number, default: 0 },
            telegram: { type: Number, default: 0 },
            tiktok: { type: Number, default: 0 },
        },
        platforms: { type: [String], default: [] },
        tradingSetup: {
            riskPerTrade: { type: String, default: "" },
            holdingTime: { type: String, default: "" },
            sessions: { type: [String], default: [] },
            instruments: { type: [String], default: [] },
        },
        verifiedTrader: {
            status: {
                type: String,
                enum: ["none", "invited", "pending", "scheduled", "approved", "rejected", "revoked"],
                default: "none",
            },
            applicationNote: { type: String, default: "" },
            appliedAt: Date,
            scheduledCallAt: Date,
            decidedAt: Date,
            decidedBy: { type: Schema.Types.ObjectId, ref: "user" },
            invitedBy: { type: Schema.Types.ObjectId, ref: "user" },
            invitedAt: Date,
            rejectionReason: { type: String, default: "" },
            revokedReason: { type: String, default: "" }, // B28
            pnl: Number,
            totalWithdrawals: Number,
            youtubeEmbedUrl: { type: String, default: "" },
            // B23: entered by an admin from the trader's Myfxbook page or
            // statements until the MetaApi sync (B29) fills them.
            stats: {
                winRate: Number, // percent
                totalTrades: Number,
                profitFactor: Number,
                avgWin: Number, // USD
                avgLoss: Number, // USD
                maxDrawdownPct: Number,
                lastUpdated: Date,
            },
            // B23 point 4: payouts the trader submits with a private proof;
            // only approved ones are shown publicly (firm, amount, date).
            payouts: [{
                firm: { type: String, maxlength: 120 },
                amount: Number,
                currency: { type: String, default: "USD" },
                date: Date,
                proofKey: String, // private storage key
                proofFileName: String,
                status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
                submittedAt: { type: Date, default: Date.now },
                verifiedAt: Date,
                verifiedBy: { type: Schema.Types.ObjectId, ref: "user" },
            }],
            proofDocuments: [{
                type: {
                    type: String,
                    enum: ["broker_statement", "payout_proof", "other"],
                    required: true,
                },
                storageKey: { type: String, required: true },
                fileName: String,
                uploadedAt: { type: Date, default: Date.now },
            }],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

UserSchema.pre("save", function save(next) {
    const user = this;
    if (!user.isModified("password")) {
        return next();
    }
    bcrypt.genSalt(10, (err, salt) => {
        if (err) {
            return next(err);
        }
        bcrypt.hash(user.password, salt, (err, hash) => {
            if (err) {
                return next(err);
            }
            user.password = hash;
            next();
        });
    });
});

/**
 * Helper method for getting user's gravatar.
 */

UserSchema.methods.gravatar = function gravatar(size) {
    if (!size) {
        size = 200;
    }
    if (!this.email) {
        return `https://gravatar.com/avatar/?s=${size}&d=retro`;
    }
    const md5 = crypto.createHash("md5").update(this.email).digest("hex");
    return `https://gravatar.com/avatar/${md5}?s=${size}&d=retro`;
};

UserSchema.methods.comparePassword = function comparePassword(
    plainPassword,
    next
) {
    bcrypt.compare(plainPassword, this.password, (err, isMatch) => {
        next(err, isMatch);
    });
};

const UserModel = mongoose.model("user", UserSchema);

module.exports = UserModel;