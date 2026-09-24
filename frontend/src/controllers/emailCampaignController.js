import api from "./api.js";

/**
 * Email Campaign API Controller
 *
 * Talks to the backend's marketing router (backend/routes/api/marketing.routes.js).
 * That router exposes exactly three endpoints today:
 *
 *   POST /marketing/send-bulk-email   multipart { file, subject, message }
 *   POST /marketing/drafts            { subject, body }  -> { message, draft }
 *   GET  /marketing/campaign-history  -> EmailCampaign[]  (newest first)
 *
 * This file used to call a /admin/email-campaigns/* API that was never built,
 * so every draft/history action 404'd. The functions below are mapped onto
 * what exists; the ones the backend cannot serve yet fail fast with a message
 * the UI can show, instead of a bare 404. See `unsupported()`.
 *
 * Field names differ between the two sides, so responses are normalised into
 * the shapes the components already render (EmailComposer, DraftManager,
 * CampaignHistory) rather than touching every component.
 */

/**
 * Throw a consistent, user-readable error for a capability the backend has
 * not implemented. Components surface `error.message` in a toast or banner.
 */
function unsupported(action) {
  return new Error(
    `${action} isn't available yet — the backend endpoint is still pending.`
  );
}

// EmailDraft document -> shape EmailComposer/DraftManager expect.
function normalizeDraft(d) {
  if (!d) return null;
  return {
    id: d._id || d.id,
    _id: d._id || d.id,
    subject: d.subject || "",
    content: d.body || d.content || "",
    recipientCount: 0,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

// EmailCampaign document -> shape CampaignHistory expects. The backend does
// not track per-recipient failures, so those default to zero/empty.
function normalizeCampaign(c) {
  if (!c) return null;
  const recipients = c.recipientsCount ?? c.recipientCount ?? 0;
  return {
    id: c._id || c.id,
    _id: c._id || c.id,
    subject: c.subject || "",
    status: c.status || "sent",
    recipientCount: recipients,
    sentCount: c.status === "sent" ? recipients : c.sentCount ?? 0,
    failedCount: c.failedCount ?? 0,
    sentAt: c.sentAt || c.createdAt,
    completedAt: c.sentAt || c.createdAt,
    content: c.content ?? null,
    errors: c.errors ?? [],
    segmentName: c.segmentName,
    createdBy: c.createdBy,
  };
}

/**
 * Upload CSV file and parse user data.
 * No standalone upload endpoint exists — the recipient list is sent together
 * with the email in sendBulkEmail(). CSVUploader is not mounted anywhere.
 */
export async function uploadCSV() {
  throw unsupported("Uploading a recipient list on its own");
}

/**
 * Get uploaded users with pagination.
 */
export async function getUploadedUsers() {
  throw unsupported("Browsing uploaded recipients");
}

/**
 * Send email to an uploaded batch. Superseded by sendBulkEmail(), which is
 * what the composer uses.
 */
export async function sendEmail() {
  throw unsupported("Sending to a previously uploaded batch");
}

/**
 * Save a new draft.
 * @param {Object} draftData
 * @param {string} draftData.subject
 * @param {string} draftData.content - HTML body from the composer
 * @returns {Promise<{data: Object}>} normalised draft
 */
export async function saveDraft(draftData) {
  try {
    const response = await api.post("/marketing/drafts", {
      subject: draftData.subject,
      body: draftData.content ?? draftData.body ?? draftData.message ?? "",
    });
    return { data: normalizeDraft(response.data?.draft) };
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to save draft"
    );
  }
}

/**
 * Update an existing draft. The backend can only create drafts.
 */
export async function updateDraft() {
  throw unsupported("Updating a saved draft");
}

/**
 * List drafts. The backend can only create drafts.
 */
export async function getDrafts() {
  throw unsupported("Listing saved drafts");
}

/**
 * Load one draft by id. The backend can only create drafts.
 */
export async function getDraftById() {
  throw unsupported("Loading a saved draft");
}

/**
 * Delete a draft. The backend can only create drafts.
 */
export async function deleteDraft() {
  throw unsupported("Deleting a saved draft");
}

// campaign-history returns the full list; cache it briefly so the history
// tab and the detail view don't each re-download it.
let historyCache = { at: 0, items: [] };
const HISTORY_TTL_MS = 30_000;

async function fetchHistory() {
  if (Date.now() - historyCache.at < HISTORY_TTL_MS) return historyCache.items;
  const response = await api.get("/marketing/campaign-history");
  const raw = Array.isArray(response.data)
    ? response.data
    : response.data?.data || response.data?.history || [];
  historyCache = { at: Date.now(), items: raw.map(normalizeCampaign) };
  return historyCache.items;
}

/**
 * Get campaign history, paginated client-side (the endpoint returns all rows).
 * @param {Object} params
 * @param {number} params.page  - 1-based (default 1)
 * @param {number} params.limit - page size (default 20)
 * @returns {Promise<{data: {campaigns: Array, pagination: Object}}>}
 */
export async function getCampaigns(params = {}) {
  try {
    const items = await fetchHistory();
    const limit = Math.max(1, Number(params.limit) || 20);
    const totalPages = Math.max(1, Math.ceil(items.length / limit));
    const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
    const start = (page - 1) * limit;
    return {
      data: {
        campaigns: items.slice(start, start + limit),
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: items.length,
          itemsPerPage: limit,
        },
      },
    };
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to fetch campaigns"
    );
  }
}

/**
 * Get one campaign by id. No detail endpoint exists, so it is looked up in
 * the history list.
 * @returns {Promise<{data: Object}>}
 */
export async function getCampaignById(campaignId) {
  try {
    const items = await fetchHistory();
    const found = items.find((c) => c.id === campaignId);
    if (!found) throw new Error("Campaign not found");
    return { data: found };
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to fetch campaign"
    );
  }
}

/**
 * Send a bulk email. FormData carries the recipient sheet plus `subject` and
 * `message` — see EmailComposer.
 * @param {FormData} formData
 * @returns {Promise<Object>} backend response ({ message, ... })
 */
export async function sendBulkEmail(formData) {
  try {
    const response = await api.post("/marketing/send-bulk-email", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    // A new campaign row exists now; drop the cached history.
    historyCache = { at: 0, items: [] };
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to send bulk email"
    );
  }
}
