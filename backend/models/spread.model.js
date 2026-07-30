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
        spread: { type: Number, required: true },
        spreadHistory: { type: [SpreadHistorySchema], default: [] },
        source: {
            type: String,
            enum: ["myfxbook", "manual"],
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