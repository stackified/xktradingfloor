const BlogModel = require("../models/blog.model");

// URL slug from a title: lower case, words joined by "-".
const slugify = (text) =>
    String(text || "")
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");

// A slug no other post uses ("title", then "title-1", "title-2", ...).
const ensureUniqueSlug = async (title, slug, blogId) => {
    let base = slugify(slug || title);
    if (!base) base = `blog-${Date.now()}`;

    let uniqueSlug = base;
    let counter = 1;
    const slugQuery = { slug: uniqueSlug };
    if (blogId) slugQuery._id = { $ne: blogId };

    while (await BlogModel.exists(slugQuery)) {
        uniqueSlug = `${base}-${counter++}`;
        slugQuery.slug = uniqueSlug;
    }

    return uniqueSlug;
};

module.exports = { slugify, ensureUniqueSlug };
