import siteJsonLd from "./siteJsonLd.json";

const SITE_URL = "https://xktradingfloor.com";
const SITE_NAME = "XK Trading Floor";

// Plain text for JSON-LD "description" fields. Company descriptions can be a
// whole designed HTML page (with <style>); structured data wants a short,
// readable summary, never markup or CSS.
export function plainText(html, max = 300) {
  const text = String(html || "")
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// Site-wide Organization and WebSite data live in one JSON file, because the
// build-time homepage prerender (scripts/prerender.mjs) writes the same data
// straight into the homepage snapshot.
export const organizationJsonLd = () => siteJsonLd.organization;
export const websiteJsonLd = () => siteJsonLd.website;

export const breadcrumbJsonLd = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: item.url?.startsWith("http") ? item.url : `${SITE_URL}${item.url}`,
  })),
});

export const brokerJsonLd = (company) => {
  if (!company) return null;
  const base = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.name,
    url: company.website || `${SITE_URL}/reviews/${company._id}`,
    ...(company.logo ? { logo: company.logo } : {}),
    ...(company.details || company.description
      ? { description: plainText(company.details || company.description) }
      : {}),
  };
  if (company.ratingsAggregate && company.totalReviews) {
    base.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(company.ratingsAggregate).toFixed(2),
      reviewCount: company.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return base;
};

export const reviewJsonLd = (review, company) => {
  if (!review || !company) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Organization",
      name: company.name,
    },
    author: {
      "@type": "Person",
      name: review.userName || review.userId?.fullName || "Anonymous",
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.body || review.comment || "",
    datePublished: review.createdAt,
  };
};

export const articleJsonLd = (blog) => {
  if (!blog) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title,
    description: blog.excerpt || blog.metaDescription,
    image: blog.coverImage || blog.image,
    datePublished: blog.publishedAt || blog.createdAt,
    dateModified: blog.updatedAt,
    author: {
      "@type": "Person",
      name: blog.author?.fullName || blog.author || SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/logo.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${blog.slug || blog._id}`,
    },
  };
};

export const eventJsonLd = (event) => {
  if (!event) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    // Descriptions can be designed HTML; structured data wants plain text.
    description: plainText(event.description, 300) || event.excerpt,
    startDate: event.dateTime,
    eventAttendanceMode:
      event.type === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location:
      event.type === "online"
        ? {
            "@type": "VirtualLocation",
            url: `${SITE_URL}/events/${event._id}`,
          }
        : {
            "@type": "Place",
            name: event.location || "TBA",
            address: event.location || "TBA",
          },
    image: event.featuredImage,
    // Only emit an Offer when there's an actual price OR an external URL to
    // register at. Free events without a URL don't need an offers block.
    offers:
      event.price || event.externalUrl
        ? {
            "@type": "Offer",
            price: event.price ? Number(event.price) : 0,
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url:
              event.externalUrl?.trim() || `${SITE_URL}/events/${event._id}`,
          }
        : undefined,
    // Use the real organizer name if we have one, else fall back to XK.
    organizer: event.organizerName
      ? {
          "@type": "Organization",
          name: event.organizerName,
        }
      : {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
        },
  };
};

export const personJsonLd = (user) => {
  if (!user) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.fullName,
    ...(user.profileImage ? { image: user.profileImage } : {}),
    ...(user.bio ? { description: user.bio } : {}),
    ...(user.socialLinks?.youtube ? { sameAs: [user.socialLinks.youtube] } : {}),
  };
};
