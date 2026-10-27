const marketingService = require("../services/marketing.service");
const xlsx = require("xlsx");
const fs = require("fs");
const EmailDraft = require("../models/EmailDraft.model");
const RecipientList = require("../models/RecipientList.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData, isValidObjectId } = require("../utils/fn");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_RECIPIENTS = 5000;

// Recipients from the first sheet of an Excel or CSV file: an "email" column
// (any case) and an optional "name" / "First Name". Invalid and repeated
// addresses are dropped.
function readRecipients(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    const seen = new Set();
    const recipients = [];
    for (const row of rows) {
        const email = String(row.email || row.Email || row.EMAIL || "").trim().toLowerCase();
        if (!EMAIL_RE.test(email) || seen.has(email)) continue;
        seen.add(email);
        const name = String(row.name || row.Name || row.NAME || row["First Name"] || "").trim().slice(0, 120);
        recipients.push({ email, name });
    }
    return recipients;
}

const removeUpload = (req) => {
    const path = req.files?.file?.[0]?.path;
    if (path && fs.existsSync(path)) fs.unlinkSync(path);
};

/**
 * Controller for Marketing operations
 */
exports.sendBulkEmail = async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ message: "Please upload an Excel file." });
        }

        const { subject, message } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ message: "Subject and Message are required." });
        }

        const recipients = readRecipients(req.files.file[0].path);

        if (recipients.length === 0) {
            return res.status(400).json({ message: "No valid email addresses found." });
        }

        // Call service
        const result = await marketingService.sendBulkEmail(
            recipients,
            subject,
            message,
            req.user ? req.user._id : null
        );

        // Cleanup file
        if (fs.existsSync(req.files.file[0].path)) {
            fs.unlinkSync(req.files.file[0].path);
        }

        res.status(200).json({
            message: "Campaign sent successfully.",
            ...result,
        });
    } catch (error) {
        console.error("MarketingController.sendBulkEmail Error:", error);
        // Cleanup on error
        if (req.files && req.files.file && req.files.file[0] && fs.existsSync(req.files.file[0].path)) {
            fs.unlinkSync(req.files.file[0].path);
        }
        res.status(500).json({ message: "Failed to send campaign.", error: error.message });
    }
};

exports.getCampaignHistory = async (req, res) => {
    try {
        const history = await marketingService.getCampaignHistory();
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch history.", error: error.message });
    }
};

exports.saveDraft = async (req, res) => {
    try {
        const { subject, body } = req.body;
        const draft = await marketingService.saveDraft(subject, body, req.user ? req.user._id : null);
        res.status(201).json({ message: "Draft saved.", draft });
    } catch (error) {
        res.status(500).json({ message: "Failed to save draft.", error: error.message });
    }
};

// ---- Drafts (B12) ----

// GET /api/marketing/drafts
exports.listDrafts = async (req, res) => {
    try {
        const { page, size } = req.query;
        const { limit, offset } = getPagination(page, size || 50);
        const [drafts, totalItems] = await Promise.all([
            EmailDraft.find({}).sort({ updatedAt: -1 }).skip(offset).limit(limit).lean(),
            EmailDraft.countDocuments({}),
        ]);
        return sendSuccessResponse(res, getPaginationData({ count: totalItems, docs: drafts }, page, limit));
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// GET /api/marketing/drafts/:id
exports.getDraft = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return sendErrorResponse(res, "Draft not found", 404, true, true);
        const draft = await EmailDraft.findById(req.params.id).lean();
        if (!draft) return sendErrorResponse(res, "Draft not found", 404, true, true);
        return sendSuccessResponse(res, { data: draft });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// PUT /api/marketing/drafts/:id { subject, body }
exports.updateDraft = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return sendErrorResponse(res, "Draft not found", 404, true, true);
        const draft = await EmailDraft.findById(req.params.id);
        if (!draft) return sendErrorResponse(res, "Draft not found", 404, true, true);
        const { subject, body } = req.body || {};
        if (subject !== undefined) {
            if (!String(subject).trim()) return sendErrorResponse(res, "Subject is required.", 400, true, true);
            draft.subject = String(subject).trim();
        }
        if (body !== undefined) {
            if (!String(body).trim()) return sendErrorResponse(res, "The email body is required.", 400, true, true);
            draft.body = String(body);
        }
        await draft.save();
        return sendSuccessResponse(res, { message: "Draft saved.", data: draft });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// DELETE /api/marketing/drafts/:id
exports.deleteDraft = async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) return sendErrorResponse(res, "Draft not found", 404, true, true);
        const deleted = await EmailDraft.findByIdAndDelete(req.params.id);
        if (!deleted) return sendErrorResponse(res, "Draft not found", 404, true, true);
        return sendSuccessResponse(res, { message: "Draft deleted." });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// ---- Recipient lists (B12) ----

// POST /api/marketing/recipients/upload (multipart: file, optional name)
exports.uploadRecipients = async (req, res) => {
    try {
        if (!req.files?.file?.[0]) return sendErrorResponse(res, "Please upload an Excel or CSV file.", 400, true, true);
        const recipients = readRecipients(req.files.file[0].path);
        if (!recipients.length) return sendErrorResponse(res, "No valid email addresses found in the file.", 400, true, true);
        if (recipients.length > MAX_RECIPIENTS) {
            return sendErrorResponse(res, `A list can have at most ${MAX_RECIPIENTS} recipients.`, 400, true, true);
        }
        const list = await RecipientList.create({
            name: String(req.body?.name || req.files.file[0].originalname || "Recipients").trim().slice(0, 120),
            fileName: req.files.file[0].originalname,
            recipients,
            count: recipients.length,
            createdBy: req.user?._id || null,
        });
        return sendSuccessResponse(res, {
            message: "Recipient list uploaded.",
            data: { batchId: list._id, name: list.name, count: list.count },
        }, 201);
    } catch (error) {
        return sendErrorResponse(res, error);
    } finally {
        removeUpload(req);
    }
};

// GET /api/marketing/recipients?page=&size= (lists), ?batchId= (one list's recipients)
exports.listRecipients = async (req, res) => {
    try {
        const { batchId, page, size } = req.query;
        if (batchId) {
            if (!isValidObjectId(batchId)) return sendErrorResponse(res, "Recipient list not found", 404, true, true);
            const list = await RecipientList.findById(batchId).lean();
            if (!list) return sendErrorResponse(res, "Recipient list not found", 404, true, true);
            return sendSuccessResponse(res, { data: list });
        }
        const { limit, offset } = getPagination(page, size || 25);
        const [lists, totalItems] = await Promise.all([
            RecipientList.find({}).select("-recipients").sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
            RecipientList.countDocuments({}),
        ]);
        return sendSuccessResponse(res, getPaginationData({ count: totalItems, docs: lists }, page, limit));
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// POST /api/marketing/recipients/:batchId/send { subject, message }
exports.sendToRecipients = async (req, res) => {
    try {
        const { batchId } = req.params;
        const { subject, message } = req.body || {};
        if (!isValidObjectId(batchId)) return sendErrorResponse(res, "Recipient list not found", 404, true, true);
        if (!subject || !message) return sendErrorResponse(res, "Subject and Message are required.", 400, true, true);
        const list = await RecipientList.findById(batchId);
        if (!list) return sendErrorResponse(res, "Recipient list not found", 404, true, true);

        const result = await marketingService.sendBulkEmail(list.recipients, subject, message, req.user?._id || null);
        list.lastSentAt = new Date();
        await list.save();
        return sendSuccessResponse(res, { message: "Campaign sent successfully.", data: result });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};
