// Readable event URLs: /events/<title-slug>-<id>, e.g.
// /events/surat-trading-seminar-2026-fundingpips-akash-frx-sahil-shaikh-6ac93428f42efd8eb2faa791
// (Sahil, 10 Oct: the URL should show the event's title).
//
// Events have no stored slug (blog posts do), so the id stays at the end and
// the page looks the event up by it. Old /events/<id> links, and links made
// before a title changed, still work: the page redirects to the current URL.
// Shared by the app, scripts/build-sitemap.js and scripts/prerender-pages.mjs,
// so keep it free of browser-only code.

const ID_AT_END = /([a-f0-9]{24})$/i;
const MAX_SLUG = 70;

export function slugifyTitle(title, max = MAX_SLUG) {
  const slug = String(title || "")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length <= max) return slug;
  // Cut at a word boundary so the URL never ends mid-word.
  const cut = slug.slice(0, max);
  const lastDash = cut.lastIndexOf("-");
  return (lastDash > max / 3 ? cut.slice(0, lastDash) : cut).replace(/-+$/, "");
}

export function eventPath(event) {
  const id = String(event?._id || event?.id || "");
  const slug = slugifyTitle(event?.title);
  return slug ? `/events/${slug}-${id}` : `/events/${id}`;
}

// The :eventId route param is either "<slug>-<id>" or a bare id.
export function eventIdFromParam(param) {
  const value = String(param || "");
  const match = value.match(ID_AT_END);
  return match ? match[1] : value;
}
