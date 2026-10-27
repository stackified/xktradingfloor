const mongoose = require("mongoose");

// One document per background job. Whoever holds an unexpired lock runs the
// job; other server instances skip that round (see utils/jobLock.js).
const jobLockSchema = new mongoose.Schema(
    {
        _id: { type: String },
        owner: { type: String, required: true },
        lockedUntil: { type: Date, required: true },
    },
    { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("JobLock", jobLockSchema);
