// Public name for a review's author. Some accounts have their email address
// as their name; publishing it exposes the reviewer's address, and on the
// live site Cloudflare rewrites any address in the HTML and injects a script
// that delays the page. Show only the part before the @ instead.
export function reviewerName(review, fallback = "Anonymous") {
  const name =
    review?.userName || review?.userId?.fullName || review?.userId?.email || "";
  const trimmed = String(name).trim();
  if (!trimmed) return fallback;
  return trimmed.includes("@") ? trimmed.split("@")[0] || fallback : trimmed;
}
