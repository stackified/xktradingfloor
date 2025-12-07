import { getCdnAssetUrl, getCdnBaseUrl } from "./cdn.js";

/**
 * Utility function to get asset paths
 * Now uses Cloudflare CDN if configured, otherwise falls back to local paths
 * @param {string} path - Asset path (e.g., "/assets/logo.png")
 * @returns {string} - CDN URL or local path with base URL prepended if needed
 */
export const getAssetPath = (path) => {
  if (!path) return path;

  // If CDN is configured, use CDN URL
  const cdnBaseUrl = getCdnBaseUrl();
  if (cdnBaseUrl) {
    return getCdnAssetUrl(path);
  }

  // Fallback to local path handling (for development)
  // If path already starts with base URL, return as is
  if (path.startsWith(import.meta.env.BASE_URL)) return path;
  // If path starts with /, prepend base URL
  if (path.startsWith("/")) {
    return `${import.meta.env.BASE_URL}${path.slice(1)}`;
  }
  // Otherwise, return path as is (relative paths)
  return path;
};

/**
 * Generate company logo path from company name
 * Converts company name to slug format (e.g., "Alpha Brokers" -> "alpha-brokers.png")
 * Now uses CDN if configured
 * @param {string} companyName - Company name (e.g., "Alpha Brokers")
 * @returns {string} - Logo path with CDN URL or base URL prepended
 */
export const getCompanyLogoPath = (companyName) => {
  if (!companyName) return getAssetPath("/assets/placeholder.jpg");
  // Convert to lowercase, replace spaces with hyphens, remove special characters
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
  return getAssetPath(`/assets/companies/${slug}.png`);
};
