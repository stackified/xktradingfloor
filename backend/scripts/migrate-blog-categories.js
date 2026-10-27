#!/usr/bin/env node
/**
 * One-off: move the published posts to the nine final categories (B18).
 *
 * The mapping is the one Sahil approved on 2 Oct 2026. Posts are matched by
 * the start of their title (case-insensitive). Any other post whose stored
 * category is already one of the nine just gets its slug filled in.
 *
 * Usage (from backend/, with .env present):
 *   node scripts/migrate-blog-categories.js           # dry run: report only
 *   node scripts/migrate-blog-categories.js --apply   # write the changes
 */

const mongoose = require("mongoose");
const environment = require("../utils/environment");
const BlogModel = require("../models/blog.model");
const { findBlogCategory } = require("../utils/blogCategories");

const APPROVED = [
    ["How Interest Rates Are Moving Gold & Forex Markets in 2026", "Markets"],
    ["Gold and Silver Trading Explained", "Markets"],
    ["Xellion Review", "Companies"],
    ["My Forex Funds Return in 2026?", "Breaking & Industry News"],
    ["FTMO Is Returning to India", "Breaking & Industry News"],
    ["Why 90% of Forex Traders Lose Money", "Learn Trading"],
    ["Prop Firm Consistency Rule Explained", "Learn Trading"],
    ["Best Prop Firms for Indian Traders in 2025", "Countries & Regions"],
];

const apply = process.argv.includes("--apply");

(async () => {
    await mongoose.connect(environment.database.uri);
    const posts = await BlogModel.find({ isDeleted: false }).select("title status category categories categorySlug").lean();

    let changes = 0;
    const unmatched = [];
    for (const post of posts) {
        const title = String(post.title || "").trim().toLowerCase();
        const approved = APPROVED.find(([prefix]) => title.startsWith(prefix.toLowerCase()));
        const target = approved ? findBlogCategory(approved[1]) : findBlogCategory(post.category || post.categories?.[0]);
        if (!target) {
            unmatched.push(`${post.status.padEnd(9)} ${post.title} (category: ${post.category || post.categories?.[0] || "none"})`);
            continue;
        }
        if (post.category === target.name && post.categorySlug === target.slug) continue;
        changes++;
        console.log(`${apply ? "set " : "would set"} "${post.title}": ${post.category || "none"} -> ${target.name}`);
        if (apply) {
            await BlogModel.updateOne(
                { _id: post._id },
                { $set: { category: target.name, categorySlug: target.slug, categories: [target.name] } }
            );
        }
    }

    if (unmatched.length) {
        console.log("\nNot in the approved list and not one of the nine (left as they are):");
        unmatched.forEach((line) => console.log(`  ${line}`));
    }
    console.log(apply ? `\nDone: ${changes} posts updated.` : `\nDry run: ${changes} posts would change. Run with --apply to write.`);
    await mongoose.disconnect();
})().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
