// What public endpoints may say about people and long content (B4).

// The only user fields a public response may carry.
const PUBLIC_USER_FIELDS = "_id fullName profileImage";

// Some accounts' names are their email address. Never show that publicly:
// keep the part before "@", or "Anonymous" when nothing is left.
function safeDisplayName(name) {
    const value = String(name || "").trim();
    if (!value.includes("@")) return value;
    return value.split("@")[0].trim() || "Anonymous";
}

// A populated user reduced to the public fields, with a safe name.
function publicUser(user) {
    if (!user || typeof user !== "object") return user;
    return {
        _id: user._id,
        fullName: safeDisplayName(user.fullName),
        profileImage: user.profileImage || null,
    };
}

// Plain-text preview of (possibly designed) HTML for list cards: <style> and
// <script> blocks are dropped before the tags, so CSS never shows as text.
function plainExcerpt(html, max = 220) {
    const text = String(html || "")
        .replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&quot;/gi, '"')
        .replace(/\s+/g, " ")
        .trim();
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

module.exports = { PUBLIC_USER_FIELDS, safeDisplayName, publicUser, plainExcerpt };
