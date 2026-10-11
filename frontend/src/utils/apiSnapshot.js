// API responses saved into a prerendered page (scripts/apiSnapshot.mjs) and
// used by src/controllers/api.js when the live call fails. Both sides must
// build the same key.
export const API_SNAPSHOT_ID = "xk-api-snapshot";

export const apiSnapshotKey = (method, url, body) =>
  `${String(method).toUpperCase()} ${url}${body ? ` ${body}` : ""}`;
