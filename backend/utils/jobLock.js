const crypto = require("crypto");
const os = require("os");
const JobLockModel = require("../models/JobLock.model");

// Identifies this server process, so a running instance can renew its own
// lock while every other instance is refused.
const OWNER = `${os.hostname()}:${process.pid}:${crypto.randomBytes(4).toString("hex")}`;

// Try to take (or renew) the lock `name` for `ttlMs`. Returns true when this
// process holds it. The upsert only matches a free or expired lock, or one we
// already own; a lock held by another instance makes the upsert collide on
// _id, which means "not ours".
async function acquireLock(name, ttlMs) {
    const now = new Date();
    try {
        await JobLockModel.findOneAndUpdate(
            { _id: name, $or: [{ lockedUntil: { $lte: now } }, { owner: OWNER }] },
            { $set: { owner: OWNER, lockedUntil: new Date(now.getTime() + ttlMs) } },
            { upsert: true, new: true }
        );
        return true;
    } catch (error) {
        if (error && error.code === 11000) return false;
        throw error;
    }
}

async function releaseLock(name) {
    await JobLockModel.updateOne(
        { _id: name, owner: OWNER },
        { $set: { lockedUntil: new Date(0) } }
    );
}

module.exports = { acquireLock, releaseLock, OWNER };
