// The blog's nine categories (agreed with the client on 2 Oct 2026, B18). The
// display name is stored on the post; the slug is used in URLs
// (/blog/category/<slug>) and in ?category= filters.
const BLOG_CATEGORIES = [
    { name: "Markets", slug: "markets" },
    { name: "Companies", slug: "companies" },
    { name: "Traders & Influencers", slug: "traders-influencers" },
    { name: "Breaking & Industry News", slug: "breaking-industry-news" },
    { name: "Learn Trading", slug: "learn-trading" },
    { name: "Promotions & Deals", slug: "promotions-deals" },
    { name: "Countries & Regions", slug: "countries-regions" },
    { name: "Events", slug: "events" },
    { name: "Tools & Guides", slug: "tools-guides" },
];

const BY_KEY = new Map();
for (const category of BLOG_CATEGORIES) {
    BY_KEY.set(category.slug, category);
    BY_KEY.set(category.name.toLowerCase(), category);
}

// A category from its name or slug (any case), or null.
const findBlogCategory = (value) => BY_KEY.get(String(value || "").trim().toLowerCase()) || null;

module.exports = { BLOG_CATEGORIES, findBlogCategory };
