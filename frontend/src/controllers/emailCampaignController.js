import api from "./api.js";

/**
 * Email Campaign API Controller
 * Handles all API calls for email campaign management
 */

/**
 * Upload CSV file and parse user data
 * @param {File} file - CSV file to upload
 * @returns {Promise<{users: Array, totalImported: number, batchId: string}>}
 */
export async function uploadCSV(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post("/admin/email-campaigns/upload-csv", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to upload CSV file"
    );
  }
}

/**
 * Get uploaded users with pagination and filters
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @param {string} params.search - Search query (name/email)
 * @param {string} params.status - Filter by subscription status
 * @param {string} params.plan - Filter by plan
 * @param {string} params.sortBy - Sort field (default: "joinedAt")
 * @param {string} params.sortOrder - Sort order "asc" | "desc" (default: "desc")
 * @returns {Promise<{users: Array, pagination: Object}>}
 */
export async function getUploadedUsers(params = {}) {
  try {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.status) queryParams.append("status", params.status);
    if (params.plan) queryParams.append("plan", params.plan);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const response = await api.get(
      `/admin/email-campaigns/users?${queryParams.toString()}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to fetch users"
    );
  }
}

/**
 * Send email campaign
 * @param {Object} emailData - Email data
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.content - Email HTML content
 * @param {string[]} emailData.recipientIds - Array of user IDs
 * @param {string[]} emailData.recipientEmails - Array of email addresses (optional)
 * @param {string} emailData.templateId - Template ID (optional)
 * @returns {Promise<{campaignId: string, status: string, recipientCount: number}>}
 */
export async function sendEmail(emailData) {
  try {
    const response = await api.post("/admin/email-campaigns/send", emailData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to send email"
    );
  }
}

/**
 * Save email draft
 * @param {Object} draftData - Draft data
 * @param {string} draftData.subject - Email subject
 * @param {string} draftData.content - Email HTML content
 * @param {string[]} draftData.recipientIds - Array of user IDs
 * @param {string[]} draftData.recipientEmails - Array of email addresses (optional)
 * @param {string} draftData.templateId - Template ID (optional)
 * @returns {Promise<{draftId: string, createdAt: string}>}
 */
export async function saveDraft(draftData) {
  try {
    const response = await api.post("/admin/email-campaigns/drafts", draftData);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to save draft"
    );
  }
}

/**
 * Update existing draft
 * @param {string} draftId - Draft ID
 * @param {Object} draftData - Draft data
 * @returns {Promise<{draftId: string, updatedAt: string}>}
 */
export async function updateDraft(draftId, draftData) {
  try {
    const response = await api.put(
      `/admin/email-campaigns/drafts/${draftId}`,
      draftData
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to update draft"
    );
  }
}

/**
 * Get all drafts for current user
 * @returns {Promise<Array>}
 */
export async function getDrafts() {
  try {
    const response = await api.get("/admin/email-campaigns/drafts");
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to fetch drafts"
    );
  }
}

/**
 * Get draft by ID
 * @param {string} draftId - Draft ID
 * @returns {Promise<Object>}
 */
export async function getDraftById(draftId) {
  try {
    const response = await api.get(`/admin/email-campaigns/drafts/${draftId}`);
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to fetch draft"
    );
  }
}

/**
 * Delete draft
 * @param {string} draftId - Draft ID
 * @returns {Promise<void>}
 */
export async function deleteDraft(draftId) {
  try {
    await api.delete(`/admin/email-campaigns/drafts/${draftId}`);
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to delete draft"
    );
  }
}

/**
 * Get campaign history with pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 20)
 * @returns {Promise<{campaigns: Array, pagination: Object}>}
 */
export async function getCampaigns(params = {}) {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const response = await api.get(
      `/admin/email-campaigns/campaigns?${queryParams.toString()}`
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to fetch campaigns"
    );
  }
}

/**
 * Get campaign by ID
 * @param {string} campaignId - Campaign ID
 * @returns {Promise<Object>}
 */
export async function getCampaignById(campaignId) {
  try {
    const response = await api.get(
      `/admin/email-campaigns/campaigns/${campaignId}`
    );
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || error.message || "Failed to fetch campaign"
    );
  }
}

/**
 * Send bulk email using the new marketing endpoint
 * @param {FormData} formData - Form data containing file, subject, and message
 * @returns {Promise<Object>}
 */
export async function sendBulkEmail(formData) {
  try {
    const response = await api.post("/marketing/send-bulk-email", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || error.message || "Failed to send bulk email"
    );
  }
}
