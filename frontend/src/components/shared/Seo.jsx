import React from "react";
import { Helmet } from "react-helmet-async";

const SITE_URL = "https://xktradingfloor.com";
const SITE_NAME = "XK Trading Floor";
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/logo_og.jpeg`;
const DEFAULT_DESCRIPTION =
  "Learn trading, compare brokers, discover prop firms, and read unbiased reviews from real traders.";
const TWITTER_HANDLE = "@XK_Capital";

function absolute(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function Seo({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
  jsonLd = null,
  keywords,
  author,
  publishedTime,
  modifiedTime,
}) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | Trusted Forex, Prop Firm & Crypto Reviews`;
  const canonical = absolute(path || "/");
  const ogImage = absolute(image);

  const jsonLdArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {author && <meta name="author" content={author} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLdArray.map((data, i) => (
        <script type="application/ld+json" key={`jsonld-${i}`}>
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}

export default Seo;
export { SITE_URL, SITE_NAME };
