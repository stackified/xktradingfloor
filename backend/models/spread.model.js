const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SpreadHistorySchema = new Schema(
    {
        spread: { type: Number, required: true },
        fetchedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const SpreadSchema = new Schema(
    {
        brokerId: { type: Schema.Types.ObjectId, ref: "company", required: true },
        pair: { type: String, required: true },
        spread: { type: Number, required: true }, // midpoint for a typical range
        // B31: "typical spread from X to Y" in pips, entered by an admin.
        spreadMin: { type: Number, default: null },
        spreadMax: { type: Number, default: null },
        spreadHistory: { type: [SpreadHistorySchema], default: [] },
        source: {
            type: String,
            // "feed" is reserved for live broker feeds later (F9).
            enum: ["myfxbook", "manual", "typical", "feed"],
            default: "myfxbook",
        },
        manualOverride: { type: Boolean, default: false },
        lastFetchedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

SpreadSchema.index({ brokerId: 1, pair: 1 }, { unique: true });
SpreadSchema.index({ brokerId: 1 });
SpreadSchema.index({ lastFetchedAt: -1 });

const SpreadModel = mongoose.model("spread", SpreadSchema);

module.exports = SpreadModel;