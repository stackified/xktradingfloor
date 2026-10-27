#!/usr/bin/env node
/**
 * One-off: give every blog post without a slug one (B10).
 *
 * Six older posts predate slugs, so their public URLs use the Mongo id. This
 * fills `slug` from the title with the same rules as new posts. Old /blog/<id>
 * links keep working: the frontend redirects them to /blog/<slug>.
 *
 * Usage (from backend/, with .env present):
 *   node scripts/backfill-blog-slugs.js           # dry run: list the posts
 *   node scripts/backfill-blog-slugs.js --apply   # write the slugs
 */

const mongoose = require("mongoose");
const environment = require("../utils/environment");
const BlogModel = require("../models/blog.model");
const { ensureUniqueSlug } = require("../utils/blogSlug");

const apply = process.argv.includes("--apply");

(async () => {
    await mongoose.connect(environment.database.uri);
    const posts = await BlogModel.find({
        isDeleted: false,
        $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
    }).select("_id title status");

    for (const post of posts) {
        const slug = await ensureUniqueSlug(post.title, "", post._id);
        console.log(`${apply ? "set " : "would set"} ${post._id} (${post.status}) -> ${slug}`);
        if (apply) await BlogModel.updateOne({ _id: post._id }, { $set: { slug } });
    }

    console.log(apply
        ? `Done: ${posts.length} posts now have a slug.`
        : `Dry run: ${posts.length} posts without a slug. Run with --apply to write.`);
    await mongoose.disconnect();
})().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
