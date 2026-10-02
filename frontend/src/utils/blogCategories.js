// The blog's nine categories (agreed with the client on 2 Oct 2026). Used by
// the blog page, the category pages (/blog/category/<slug>), article badges and
// the admin blog form, so the names and URLs stay the same everywhere.
export const BLOG_CATEGORIES = [
  {
    name: "Markets",
    slug: "markets",
    description: "Gold, silver, forex, crypto, stocks, commodities and what moves them",
  },
  {
    name: "Companies",
    slug: "companies",
    description: "Broker and prop firm reviews, comparisons, platforms and tools",
  },
  {
    name: "Traders & Influencers",
    slug: "traders-influencers",
    description: "Interviews, trading journeys and the people behind the trades",
  },
  {
    name: "Breaking & Industry News",
    slug: "breaking-industry-news",
    description: "Prop firm and broker news, regulation and industry changes",
  },
  {
    name: "Learn Trading",
    slug: "learn-trading",
    description: "Guides, rules explained and lessons for every level",
  },
  {
    name: "Promotions & Deals",
    slug: "promotions-deals",
    description: "Discounts, challenge offers and broker promotions",
  },
  {
    name: "Countries & Regions",
    slug: "countries-regions",
    description: "Trading by country: brokers, prop firms, rules and outlooks",
  },
  {
    name: "Events",
    slug: "events",
    description: "Expos, conferences, webinars and meetups worldwide",
  },
  {
    name: "Tools & Guides",
    slug: "tools-guides",
    description: "Calculators, checklists and how-to guides",
  },
];

const BY_NAME = new Map(BLOG_CATEGORIES.map((c) => [c.name.toLowerCase(), c]));
const BY_SLUG = new Map(BLOG_CATEGORIES.map((c) => [c.slug, c]));

export const categoryBySlug = (slug) => BY_SLUG.get(String(slug || "").toLowerCase()) || null;
export const categoryByName = (name) => BY_NAME.get(String(name || "").trim().toLowerCase()) || null;
export const categoryPath = (name) => {
  const c = categoryByName(name);
  return c ? `/blog/category/${c.slug}` : "/blog";
};

// Until the backend stores the new categories (backend task B18), the eight
// published posts still carry the old ones ("Forex", "Trading", "Market
// News"). Map them here: first the per-post moves the client approved, then a
// general fallback for old values. Remove once B18 has migrated the data.
const POST_CATEGORY = {
  "69ef9bb2613d00c029a29725": "Markets", // Interest rates, gold and forex 2026
  "6963834cfdeafa09c8e238ed": "Markets", // Gold and silver trading explained
  "698b3a7728de6aa75848eb11": "Companies", // Xellion review
  "69887ae212df70d81ef74597": "Breaking & Industry News", // My Forex Funds return
  "6938293ff3a1f5a840a23abb": "Breaking & Industry News", // FTMO returning to India
  "6987463c5ce5e7bee63c45af": "Learn Trading", // Why 90% of forex traders lose
  "69563760cad1afd481f1e7ff": "Learn Trading", // Consistency rule explained
  "69389119e154bbf817bc1836": "Countries & Regions", // Best prop firms for Indian traders
};

const LEGACY_CATEGORY = {
  forex: "Markets",
  stocks: "Markets",
  crypto: "Markets",
  trading: "Learn Trading",
  "market news": "Breaking & Industry News",
  news: "Breaking & Industry News",
  countries: "Countries & Regions",
  companies: "Companies",
  events: "Events",
};

// The category name to show and filter by for a blog document from the API.
export function blogCategoryOf(blog) {
  if (!blog) return "";
  const raw = Array.isArray(blog.categories)
    ? blog.categories[0]
    : blog.categories || blog.category || "";
  const current = categoryByName(raw);
  if (current) return current.name;
  const id = String(blog._id || blog.id || "");
  if (POST_CATEGORY[id]) return POST_CATEGORY[id];
  return LEGACY_CATEGORY[String(raw).trim().toLowerCase()] || "";
}
