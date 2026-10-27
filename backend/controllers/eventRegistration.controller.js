const EventModel = require("../models/event.model");
const EventRegistrationModel = require("../models/EventRegistration.model");
const UserModel = require("../models/user.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData, escapeRegex, isValidObjectId } = require("../utils/fn");
const emailService = require("../services/email.service");
const environment = require("../utils/environment");

// Event registration leads (B16): anyone can register without an XK account;
// leads are listed and exported by Admins only.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const str = (value, max) => String(value ?? "").trim().slice(0, max);
const toBool = (value) => value === true || value === "true" || value === "1" || value === 1;

// "Sun 1 Nov 2026, 10:00 AM (GMT+5:30)" in the event's own time zone.
function formatEventDate(date, timeZone) {
    if (!date) return "";
    try {
        return new Intl.DateTimeFormat("en-GB", {
            weekday: "short", day: "numeric", month: "short", year: "numeric",
            hour: "numeric", minute: "2-digit", hour12: true,
            timeZone: timeZone || "UTC", timeZoneName: "short",
        }).format(new Date(date));
    } catch (_) {
        return new Date(date).toISOString();
    }
}

function notifyNewLead(event, lead) {
    const rows = [
        { label: "Event", value: event.title },
        { label: "Event date", value: formatEventDate(event.dateTime, event.timeZone) },
        { label: "Name", value: lead.fullName },
        { label: "Email", value: lead.email },
        { label: "Phone", value: lead.phone || "-" },
        { label: "Country", value: lead.country },
        { label: "Company", value: lead.company || "-" },
        { label: "May contact about similar events", value: lead.consent ? "Yes" : "No" },
        { label: "Signed in to XK", value: lead.userId ? "Yes" : "No" },
    ];
    // A failed email must never fail the registration.
    emailService
        .sendAdminNotification(environment.registrationNotifyEmail, {
            subject: `New registration: ${event.title}`,
            heading: "New event registration",
            intro: `${lead.fullName} registered for ${event.title}.`,
            rows,
            linkUrl: `${environment.frontendUrl}/admin/event-registrations`,
            linkLabel: "Open event registrations",
            replyTo: lead.email,
        })
        .catch((error) => console.error("Registration alert email failed:", error.message));
}

// POST /api/events/:eventId/register (public, optional token)
exports.registerLead = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!isValidObjectId(eventId)) {
            return sendErrorResponse(res, "Event not found", 404, true, true);
        }
        const event = await EventModel.findById(eventId).select("title dateTime endDateTime timeZone externalUrl");
        if (!event) {
            return sendErrorResponse(res, "Event not found", 404, true, true);
        }

        const body = req.body || {};
        const externalUrl = event.externalUrl || "";

        // Honeypot: real visitors never fill "website". Answer as if it
        // worked, but keep nothing.
        if (str(body.website, 500)) {
            return sendSuccessResponse(res, { data: { registrationId: null, externalUrl } });
        }

        const fullName = str(body.fullName, 120);
        const email = str(body.email, 254).toLowerCase();
        const country = str(body.country, 80);
        const phone = str(body.phone, 40);
        const company = str(body.company, 160);
        const consent = toBool(body.consent);

        if (!fullName) return sendErrorResponse(res, "Please enter your full name.", 400, true, true);
        if (!EMAIL_RE.test(email)) return sendErrorResponse(res, "Please enter a valid email address.", 400, true, true);
        if (!country) return sendErrorResponse(res, "Please choose your country.", 400, true, true);

        const endsAt = event.endDateTime || event.dateTime;
        if (endsAt && endsAt.getTime() < Date.now() - DAY_MS) {
            return sendErrorResponse(res, "This event has already taken place.", 400, true, true);
        }

        const details = { fullName, phone, country, company, consent };
        if (req.user?._id) details.userId = req.user._id;

        // Same email + same event: no duplicate lead. Only the account that
        // owns that email may change the existing details or consent;
        // anyone else just gets the same success reply, so nobody can
        // overwrite another person's sign-up by typing their email.
        let lead = await EventRegistrationModel.findOne({ eventId, email });
        let isNew = false;
        let ownsEmail = false;
        if (lead && req.user?._id) {
            const account = await UserModel.findById(req.user._id).select("email").lean();
            ownsEmail = String(account?.email || "").toLowerCase() === email;
        }
        if (lead && ownsEmail) {
            if (consent && !lead.consent) lead.consentAt = new Date();
            if (!consent) lead.consentAt = null;
            Object.assign(lead, details);
            await lead.save();
        } else if (lead) {
            // Already registered: leave the stored lead as it is.
        } else {
            try {
                lead = await EventRegistrationModel.create({
                    ...details,
                    eventId,
                    email,
                    eventTitle: event.title,
                    eventDate: event.dateTime,
                    consentAt: consent ? new Date() : null,
                    registeredAt: new Date(),
                });
                isNew = true;
            } catch (error) {
                if (error?.code !== 11000) throw error;
                // Two submissions at once: the other one created it.
                lead = await EventRegistrationModel.findOne({ eventId, email });
            }
        }

        if (isNew) notifyNewLead(event, lead);

        return sendSuccessResponse(res, {
            message: "You're registered.",
            data: { registrationId: lead._id.toString(), externalUrl },
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

function leadQuery({ eventId, search }) {
    const query = {};
    if (eventId && isValidObjectId(eventId)) query.eventId = eventId;
    const term = escapeRegex(search);
    if (term) {
        query.$or = ["fullName", "email", "company", "country", "eventTitle"].map((field) => ({
            [field]: { $regex: term, $options: "i" },
        }));
    }
    return query;
}

const toRow = (lead) => ({
    _id: lead._id,
    registeredAt: lead.registeredAt,
    eventId: lead.eventId,
    eventTitle: lead.eventTitle,
    eventDate: lead.eventDate,
    fullName: lead.fullName,
    email: lead.email,
    phone: lead.phone,
    country: lead.country,
    company: lead.company,
    consent: lead.consent,
    userId: lead.userId,
});

// GET /api/admin/event-registrations?eventId=&search=&page=&size= (Admin only)
exports.listLeads = async (req, res) => {
    try {
        const { page, size } = req.query;
        const { limit, offset } = getPagination(page, size || 25);
        const query = leadQuery(req.query);
        const [leads, totalItems] = await Promise.all([
            EventRegistrationModel.find(query).sort({ registeredAt: -1 }).skip(offset).limit(limit).lean(),
            EventRegistrationModel.countDocuments(query),
        ]);
        return sendSuccessResponse(res, getPaginationData({ count: totalItems, docs: leads.map(toRow) }, page, limit));
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// A CSV cell: quoted, and a leading = + - @ is neutralised so a spreadsheet
// never runs it as a formula.
function csvCell(value) {
    let text = value === null || value === undefined ? "" : String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
}

// GET /api/admin/event-registrations/export.csv?eventId= (Admin only)
exports.exportLeadsCsv = async (req, res) => {
    try {
        const leads = await EventRegistrationModel.find(leadQuery(req.query)).sort({ registeredAt: -1 }).lean();
        const header = ["Registered at", "Event", "Event date", "Full name", "Email", "Phone", "Country", "Company", "Consent", "Logged-in user"];
        const lines = [header.map(csvCell).join(",")];
        for (const lead of leads) {
            lines.push([
                lead.registeredAt ? new Date(lead.registeredAt).toISOString() : "",
                lead.eventTitle,
                lead.eventDate ? new Date(lead.eventDate).toISOString() : "",
                lead.fullName,
                lead.email,
                lead.phone,
                lead.country,
                lead.company,
                lead.consent ? "yes" : "no",
                lead.userId ? "yes" : "no",
            ].map(csvCell).join(","));
        }
        const date = new Date().toISOString().slice(0, 10);
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="event-registrations-${date}.csv"`);
        // BOM so Excel opens names with accents correctly.
        return res.status(200).send(`﻿${lines.join("\r\n")}\r\n`);
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};
