const ContactMessageModel = require("../models/ContactMessage.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData } = require("../utils/fn");
const emailService = require("../services/email.service");
const environment = require("../utils/environment");

// Contact page form (B20).
const CONTACT_TYPES = [
    "General Inquiry",
    "Podcast Guest Request",
    "YouTube Sponsorship",
    "Partnership Opportunity",
    "Technical Support",
    "Media/Press Inquiry",
    "Other",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (value) => String(value ?? "").trim();

// POST /api/contact (public)
exports.sendContactMessage = async (req, res) => {
    try {
        const body = req.body || {};

        // Honeypot: real visitors never fill "website".
        if (str(body.website)) return sendSuccessResponse(res, { data: { id: null } });

        const name = str(body.name);
        const email = str(body.email).toLowerCase();
        const type = str(body.type) || "General Inquiry";
        const message = str(body.message);

        if (!name || name.length > 120) return sendErrorResponse(res, "Please enter your name (up to 120 characters).", 400, true, true);
        if (!EMAIL_RE.test(email) || email.length > 254) return sendErrorResponse(res, "Please enter a valid email address.", 400, true, true);
        if (!CONTACT_TYPES.includes(type)) return sendErrorResponse(res, "Please choose what your message is about.", 400, true, true);
        if (!message) return sendErrorResponse(res, "Please write a message.", 400, true, true);
        if (message.length > 5000) return sendErrorResponse(res, "Your message is too long (5,000 characters at most).", 400, true, true);

        const saved = await ContactMessageModel.create({ name, email, type, message, userId: req.user?._id || null });

        // A failed email never loses the message: it is already stored.
        emailService
            .sendAdminNotification(environment.contactNotifyEmail, {
                subject: `Contact form: ${type} from ${name}`,
                heading: "New message from the contact form",
                intro: "Reply to this email to answer the sender directly.",
                rows: [
                    { label: "Name", value: name },
                    { label: "Email", value: email },
                    { label: "Topic", value: type },
                ],
                message,
                replyTo: email,
            })
            .catch((error) => console.error("Contact alert email failed:", error.message));

        return sendSuccessResponse(res, { message: "Thanks, your message has been sent.", data: { id: saved._id.toString() } });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// GET /api/admin/contact-messages?page=&size= (Admin only)
exports.listContactMessages = async (req, res) => {
    try {
        const { page, size } = req.query;
        const { limit, offset } = getPagination(page, size || 25);
        const [messages, totalItems] = await Promise.all([
            ContactMessageModel.find({}).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
            ContactMessageModel.countDocuments({}),
        ]);
        return sendSuccessResponse(res, getPaginationData({ count: totalItems, docs: messages }, page, limit));
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

exports.CONTACT_TYPES = CONTACT_TYPES;
