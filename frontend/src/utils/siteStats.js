// Real listing counts, inlined at build time by vite.config.js
// (__XK_SITE_STATS__). null in dev or when the API was unreachable during the
// build; callers then leave the figures out rather than show a guess.
/* global __XK_SITE_STATS__ */
export const SITE_STATS = typeof __XK_SITE_STATS__ !== "undefined" ? __XK_SITE_STATS__ : null;
