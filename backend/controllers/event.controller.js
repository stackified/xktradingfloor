const EventModel = require("../models/event.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData, escapeRegex, isValidObjectId } = require("../utils/fn");
const emailService = require("../services/email.service");
const UserModel = require("../models/user.model");
const environment = require("../utils/environment");
const r2 = require("../helpers/r2.helper");
const { sanitizeHtml } = require("../utils/sanitizeHtml");

// ISO 4217 codes accepted for event prices (B30).
const CURRENCIES = new Set([
    "USD", "EUR", "GBP", "INR", "AED", "SAR", "QAR", "KWD", "BHD", "OMR", "SGD", "HKD", "AUD", "NZD",
    "CAD", "JPY", "CNY", "KRW", "TWD", "MYR", "THB", "IDR", "PHP", "VND", "LAK", "UZS", "KZT", "PKR",
    "BDT", "LKR", "NPR", "ZAR", "NGN", "KES", "EGP", "TRY", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK",
    "HUF", "RON", "BRL", "MXN", "ARS", "CLP", "COP",
]);
const MAX_TICKET_TIERS = 10;

const isValidTimeZone = (tz) => {
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return true;
    } catch (_) {
        return false;
    }
};

// Multipart sends everything as strings; JSON may send real values.
const toBool = (value) => value === true || value === "true" || value === "1" || value === 1;

const toList = (value) => {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return [];
        if (trimmed.startsWith("[")) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) return parsed;
            } catch (_) {
                // fall through to a single value
            }
        }
        return [value];
    }
    return [value];
};

class EventInputError extends Error {}

// ticketTiers arrive as a JSON string in multipart, like socialLinks (B30).
function parseTicketTiers(raw) {
    let tiers = raw;
    if (typeof raw === "string") {
        if (!raw.trim()) return [];
        try {
            tiers = JSON.parse(raw);
        } catch (_) {
            throw new EventInputError("Ticket types could not be read.");
        }
    }
    if (!Array.isArray(tiers)) throw new EventInputError("Ticket types must be a list.");
    if (tiers.length > MAX_TICKET_TIERS) {
        throw new EventInputError(`An event can have at most ${MAX_TICKET_TIERS} ticket types.`);
    }
    return tiers.map((tier, index) => {
        const name = String(tier?.name || "").trim();
        if (!name || name.length > 60) {
            throw new EventInputError(`Ticket type ${index + 1} needs a name of up to 60 characters.`);
        }
        const price = Number(tier.price);
        if (!Number.isFinite(price) || price < 0) {
            throw new EventInputError(`The price of "${name}" must be 0 or more.`);
        }
        const out = { name, price };
        if (tier.fullPrice !== undefined && tier.fullPrice !== null && tier.fullPrice !== "") {
            const fullPrice = Number(tier.fullPrice);
            if (!Number.isFinite(fullPrice) || fullPrice < 0) {
                throw new EventInputError(`The full price of "${name}" must be 0 or more.`);
            }
            out.fullPrice = fullPrice;
        }
        const notes = String(tier.notes || "").trim();
        if (notes) out.notes = notes.slice(0, 200);
        return out;
    });
}

// Pick and validate the editable event fields from a create/update request.
// Unknown fields (registrations, adminId, ids) are ignored.
function readEventInput(body = {}, existing = null) {
    const out = {};
    const text = ["title", "excerpt", "location", "region", "organizerName", "externalUrl", "category", "city", "country"];
    for (const key of text) {
        if (body[key] !== undefined) out[key] = String(body[key]).trim();
    }
    if (out.title !== undefined && !out.title) throw new EventInputError("Title is required.");

    if (body.description !== undefined) out.description = sanitizeHtml(String(body.description));

    if (body.type !== undefined) {
        if (!["campus", "online"].includes(body.type)) throw new EventInputError("Type must be campus or online.");
        out.type = body.type;
    }

    if (body.dateTime !== undefined && body.dateTime !== "") {
        const start = new Date(body.dateTime);
        if (Number.isNaN(start.getTime())) throw new EventInputError("Date and time is not valid.");
        out.dateTime = start;
    }
    // B17: an empty endDateTime means "no end time" and clears it.
    if (body.endDateTime !== undefined) {
        if (body.endDateTime === "" || body.endDateTime === null) {
            out.endDateTime = null;
        } else {
            const end = new Date(body.endDateTime);
            if (Number.isNaN(end.getTime())) throw new EventInputError("End date and time is not valid.");
            out.endDateTime = end;
        }
    }
    if (body.timeZone !== undefined) {
        const tz = String(body.timeZone || "").trim();
        if (tz && !isValidTimeZone(tz)) throw new EventInputError("Time zone must be an IANA name such as Asia/Dubai.");
        out.timeZone = tz || null;
    }

    for (const key of ["price", "seats"]) {
        if (body[key] !== undefined && body[key] !== "") {
            const n = Number(body[key]);
            if (!Number.isFinite(n) || n < 0) throw new EventInputError(`${key === "price" ? "Price" : "Seats"} must be 0 or more.`);
            out[key] = n;
        }
    }

    if (body.currency !== undefined && body.currency !== "") {
        const currency = String(body.currency).trim().toUpperCase();
        if (!CURRENCIES.has(currency)) throw new EventInputError(`Currency ${currency} is not supported.`);
        out.currency = currency;
    }
    if (body.ticketTiers !== undefined) {
        out.ticketTiers = parseTicketTiers(body.ticketTiers);
        // Lists sort and filter on price, so it follows the cheapest ticket.
        if (out.ticketTiers.length) out.price = Math.min(...out.ticketTiers.map((t) => t.price));
    }

    if (body.isFeatured !== undefined) out.isFeatured = toBool(body.isFeatured);

    const freebies = toList(body.freebiesIncluded);
    if (freebies !== undefined) out.freebiesIncluded = freebies.map((f) => String(f).trim()).filter(Boolean);

    // Checks on the event as it will be saved.
    const start = out.dateTime || existing?.dateTime;
    const end = out.endDateTime !== undefined ? out.endDateTime : existing?.endDateTime;
    if (start && end && end <= start) throw new EventInputError("The end must be after the start.");

    const type = out.type || existing?.type || "online";
    const timeZone = out.timeZone !== undefined ? out.timeZone : existing?.timeZone;
    const touchesPlace = !existing || body.type !== undefined || body.timeZone !== undefined;
    if (type === "campus" && !timeZone && touchesPlace) {
        throw new EventInputError("Choose the time zone for an in-person event, so times show in the event's local time.");
    }

    return out;
}

// Public event lists: search/type/region/category/month as before, plus
// B15's when=upcoming|past and featured=true.
const buildEventListQuery = ({ type, region, category, month, search, when, featured }) => {
    const and = [];
    const searchTerm = escapeRegex(search);

    if (type) and.push({ type });
    if (region) and.push({ region });
    if (category) and.push({ category });
    if (featured === "true") and.push({ isFeatured: true });

    if (month) {
        const [year, monthValue] = month.split("-").map(Number);
        if (year && monthValue >= 1 && monthValue <= 12) {
            const start = new Date(year, monthValue - 1, 1);
            const end = new Date(year, monthValue, 0, 23, 59, 59, 999);
            and.push({ dateTime: { $gte: start, $lte: end } });
        }
    }

    // "Upcoming" lasts until the event ends, so a 3-day expo stays upcoming
    // until its last day is over.
    const now = new Date();
    if (when === "upcoming") {
        and.push({
            $or: [
                { endDateTime: { $gte: now } },
                { endDateTime: { $in: [null] }, dateTime: { $gte: now } },
            ],
        });
    } else if (when === "past") {
        and.push({
            $or: [
                { endDateTime: { $lt: now } },
                { endDateTime: { $in: [null] }, dateTime: { $lt: now } },
            ],
        });
    }

    if (searchTerm) {
        and.push({
            $or: [
                { title: { $regex: searchTerm, $options: "i" } },
                { description: { $regex: searchTerm, $options: "i" } },
                { location: { $regex: searchTerm, $options: "i" } },
                { city: { $regex: searchTerm, $options: "i" } },
                { country: { $regex: searchTerm, $options: "i" } },
                { organizerName: { $regex: searchTerm, $options: "i" } },
            ],
        });
    }

    return and.length ? { $and: and } : {};
};

const transformEvents = (events) =>
    events.map((event) => {
        const e = event.toObject();
        e.id = e._id.toString();
        return e;
    });

const withoutRegistrations = (doc) => {
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    delete obj.registrations;
    return obj;
};

const uploadFeaturedImage = async (req) => {
    if (!req?.files?.featuredImage) return "";
    const file = req.files.featuredImage[0];
    file.path = file.path.replaceAll("\\", "/");
    // Upload to Cloudflare R2
    return r2.uploadPublic(file.path, `${file.filename}`, `Events`);
};

const inputError = (res, error) =>
    error instanceof EventInputError
        ? sendErrorResponse(res, error.message, 400, true, true)
        : sendErrorResponse(res, error);

// Create event
exports.createEvent = async (req, res) => {
    try {
        const { _id: adminId } = req.user;

        const eventData = readEventInput(req.body);
        if (!eventData.title) throw new EventInputError("Title is required.");

        const featuredImage = await uploadFeaturedImage(req);
        if (featuredImage) eventData.featuredImage = featuredImage;
        eventData.adminId = adminId;

        const event = new EventModel(eventData);
        const saved = await event.save();

        // Send Notification to all active users
        (async () => {
            try {
                const users = await UserModel.find({ isActive: true, isDeleted: false }, 'email');
                for (const user of users) {
                    emailService.sendEventNotification(user.email, {
                        eventUrl: `${environment.frontendUrl}/events/${saved._id}`
                    }).catch(err => console.error(`Event notification failed for ${user.email}:`, err));
                }
            } catch (err) {
                console.error("Failed to send event notifications:", err);
            }
        })();

        return sendSuccessResponse(res, { message: "Event created", data: withoutRegistrations(saved) }, 201);
    } catch (error) {
        return inputError(res, error);
    }
};

// Get all events (public)
exports.getAllEvents = async (req, res) => {
    try {
        const { search, page, size, limit: limitParam, type, region, category, month, when, featured } = req.query;

        // ?limit= is accepted as the page size (featured slider: limit=3).
        const { limit, offset } = getPagination(page, size || limitParam);
        const filters = { type, region, month, search, when, featured };
        const query = buildEventListQuery({ ...filters, category });

        // Upcoming: soonest first. Past: most recent first.
        const sort = when === "past"
            ? { dateTime: -1, createdAt: -1 }
            : { dateTime: 1, createdAt: -1 };

        // Registrations never leave the server on event responses (B4).
        const [events, totalItems, counts] = await Promise.all([
            EventModel.find(query).select("-registrations").sort(sort).skip(offset).limit(limit),
            EventModel.countDocuments(query),
            // Per-category counts for the same filters, ignoring the category
            // itself, for the "Browse by category" cards (B15).
            EventModel.aggregate([
                { $match: buildEventListQuery(filters) },
                { $group: { _id: "$category", count: { $sum: 1 } } },
            ]),
        ]);

        const categoryCounts = counts.reduce((acc, row) => {
            if (row._id) acc[row._id] = row.count;
            return acc;
        }, {});

        return sendSuccessResponse(res, {
            ...getPaginationData({ count: totalItems, docs: transformEvents(events) }, page, limit),
            categoryCounts,
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Get event by ID
exports.getEventById = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!isValidObjectId(eventId)) {
            return sendErrorResponse(res, "Event not found", 404, true, true);
        }
        const event = await EventModel.findById(eventId).select("-registrations");
        if (!event) {
            return sendErrorResponse(res, "Event not found", 404, true, true);
        }
        return sendSuccessResponse(res, { data: event });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Update event
exports.updateEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!isValidObjectId(eventId)) {
            return sendErrorResponse(res, "Event not found", 404, true, true);
        }
        const event = await EventModel.findById(eventId);
        if (!event) {
            return sendErrorResponse(res, "Event not found", 404, true, true);
        };

        const updateData = readEventInput(req.body, event);
        const featuredImage = await uploadFeaturedImage(req);
        if (featuredImage) updateData.featuredImage = featuredImage;

        Object.assign(event, updateData);
        const updated = await event.save();

        return sendSuccessResponse(res, { message: "Event updated", data: withoutRegistrations(updated) });
    } catch (error) {
        return inputError(res, error);
    }
};

// Delete event
exports.deleteEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await EventModel.findByIdAndDelete(eventId);
        if (!event) {
            return sendErrorResponse(res, "Event not found", 404, true, true);
        }
        return sendSuccessResponse(res, { message: "Event deleted" });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};
