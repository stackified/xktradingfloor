const SITE_URL = "https://xktradingfloor.com";
const SITE_NAME = "XK Trading Floor";

export const organizationJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/assets/logo.png`,
  sameAs: [
    "https://www.youtube.com/@xk_trading_floor",
    "https://www.instagram.com/xktradingfloor/",
    "https://www.linkedin.com/company/xk-trading-floor",
    "https://x.com/XK_Capital",
  ],
});

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/reviews?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

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
    ...(company.description ? { description: company.description } : {}),
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
    description: event.description || event.excerpt,
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
    offers: event.price
      ? {
          "@type": "Offer",
          price: event.price,
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: `${SITE_URL}/events/${event._id}`,
        }
      : undefined,
    organizer: {
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
