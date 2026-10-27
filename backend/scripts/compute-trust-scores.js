#!/usr/bin/env node
/**
 * One-off: work out the TrustScore of every company (B32).
 *
 * Refreshes each company's stored rating from its visible reviews, then saves
 * it so the model computes trustScore from the licences, Sahil's scores,
 * platforms and rating. Safe to re-run.
 *
 * Usage (from backend/, with .env present):
 *   node scripts/compute-trust-scores.js           # dry run: show old -> new
 *   node scripts/compute-trust-scores.js --apply   # save the scores
 */

const mongoose = require("mongoose");
const environment = require("../utils/environment");
const CompanyModel = require("../models/company.model");
const ReviewModel = require("../models/review.model");
const { computeTrustScore } = require("../utils/trustScore");

const apply = process.argv.includes("--apply");

(async () => {
    await mongoose.connect(environment.database.uri);
    const companies = await CompanyModel.find({});
    let changed = 0;

    for (const company of companies) {
        const reviews = await ReviewModel.find({ companyId: company._id, isHidden: { $ne: true } }).select("rating").lean();
        company.totalReviews = reviews.length;
        company.ratingsAggregate = reviews.length
            ? parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
            : 0;
        const before = company.trustScore ?? null;
        const after = computeTrustScore(company);
        if (before !== after) changed++;
        console.log(`${String(company.name).padEnd(28)} ${String(company.category).padEnd(9)} ${String(before).padStart(4)} -> ${String(after).padStart(4)}`);
        if (apply) await company.save();
    }

    console.log(apply
        ? `\nDone: ${companies.length} companies saved (${changed} scores changed).`
        : `\nDry run: ${changed} of ${companies.length} scores would change. Run with --apply to save.`);
    await mongoose.disconnect();
})().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
