import api from "./api.js";

/**
 * Email Campaign API Controller
 *
 * Talks to the backend's marketing router (backend/routes/api/marketing.routes.js):
 *
 *   POST /marketing/send-bulk-email   multipart { file, subject, message }
 *   GET  /marketing/campaign-history  -> EmailCampaign[]  (newest first)
 *   POST /marketing/drafts            { subject, body }  -> { message, draft }
 *   GET|PUT|DELETE /marketing/drafts[/:id]          (B12, backend PR #151)
 *   POST /marketing/recipients/upload multipart { file, name } -> { batchId, name, count }
 *   GET  /marketing/recipients[?batchId=]           lists, or one list's recipients
 *   POST /marketing/recipients/:batchId/send { subject, message }
 *
 * Field names differ between the two sides, so responses are normalised into
 * the shapes the components already render (EmailComposer, DraftManager,
 * CampaignHistory) rather than touching every component.
 */

// The backend's message when it has one, so the UI's toast says why.
function apiError(error, fallback) {
  return new Error(error.response?.data?.message || error.message || fallback);
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
 * Upload an Excel/CSV recipient list to send to later.
 * @returns {Promise<{data: {batchId, name, count}}>}
 */
export async function uploadCSV(file, name) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (name) formData.append("name", name);
    const response = await api.post("/marketing/recipients/upload", formData);
    return { data: response.data?.data };
  } catch (error) {
    throw apiError(error, "Failed to upload the recipient list");
  }
}

/**
 * Saved recipient lists (newest first), or with `batchId` one list including
 * its recipients.
 */
export async function getUploadedUsers({ batchId, page = 1, size = 25 } = {}) {
  try {
    const response = await api.get("/marketing/recipients", {
      params: batchId ? { batchId } : { page, size },
    });
    return { data: response.data?.data, pagination: response.data?.pagination };
  } catch (error) {
    throw apiError(error, "Failed to load recipient lists");
  }
}

/**
 * Send an email to a previously uploaded list.
 */
export async function sendEmail(batchId, { subject, message }) {
  try {
    const response = await api.post(`/marketing/recipients/${batchId}/send`, { subject, message });
    return { data: response.data?.data, message: response.data?.message };
  } catch (error) {
    throw apiError(error, "Failed to send the campaign");
  }
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
 * Update a saved draft.
 */
export async function updateDraft(draftId, draftData) {
  try {
    const response = await api.put(`/marketing/drafts/${draftId}`, {
      subject: draftData.subject,
      body: draftData.content ?? draftData.body ?? draftData.message ?? "",
    });
    return { data: normalizeDraft(response.data?.data) };
  } catch (error) {
    throw apiError(error, "Failed to update draft");
  }
}

/**
 * Saved drafts, newest first.
 */
export async function getDrafts({ page = 1, size = 50 } = {}) {
  try {
    const response = await api.get("/marketing/drafts", { params: { page, size } });
    return { data: (response.data?.data || []).map(normalizeDraft), pagination: response.data?.pagination };
  } catch (error) {
    throw apiError(error, "Failed to load drafts");
  }
}

/**
 * Load one draft by id.
 */
export async function getDraftById(draftId) {
  try {
    const response = await api.get(`/marketing/drafts/${draftId}`);
    return { data: normalizeDraft(response.data?.data) };
  } catch (error) {
    throw apiError(error, "Failed to load draft");
  }
}

/**
 * Delete a draft.
 */
export async function deleteDraft(draftId) {
  try {
    await api.delete(`/marketing/drafts/${draftId}`);
    return { success: true };
  } catch (error) {
    throw apiError(error, "Failed to delete draft");
  }
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
