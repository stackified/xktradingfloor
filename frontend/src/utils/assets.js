/**
 * Utility function to get asset paths that work with GitHub Pages base path
 * @param {string} path - Asset path (e.g., "/assets/logo.png")
 * @returns {string} - Path with base URL prepended if needed
 */
export const getAssetPath = (path) => {
  if (!path) return path;
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
 * @param {string} companyName - Company name (e.g., "Alpha Brokers")
 * @returns {string} - Logo path with base URL prepended (e.g., "/xktrading/assets/companies/alpha-brokers.png" or "/assets/companies/alpha-brokers.png")
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
