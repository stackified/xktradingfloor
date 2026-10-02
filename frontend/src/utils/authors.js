// The admin account's name ("Administrator") was showing as the byline on
// articles. Readers and search engines should see who is behind the content:
// posts by the staff account are credited to the XK Trading Floor Team, and
// structured data names the organisation as author.
export const TEAM_NAME = "XK Trading Floor Team";

const STAFF_NAME = /^(super ?)?admin(istrator)?$/i;

// True for the staff account and for posts already credited to the team.
export function isStaffAccount(name) {
  const n = String(name || "").trim();
  return STAFF_NAME.test(n) || n === TEAM_NAME;
}

// Display name for an author object or string.
export function authorDisplayName(author, fallback = TEAM_NAME) {
  const raw = typeof author === "string" ? author : author?.fullName || author?.name || "";
  if (!raw.trim() || isStaffAccount(raw)) return fallback;
  return raw.trim();
}
