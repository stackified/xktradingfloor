const EventModel = require("../models/event.model");
const { sendSuccessResponse, sendErrorResponse } = require("../utils/response");
const { getPagination, getPaginationData, escapeRegex } = require("../utils/fn");
const r2 = require("../helpers/r2.helper");

// Create event
exports.createEvent = async (req, res) => {
    try {
        const { _id: adminId, role } = req.user;

        let featuredImage = "";
        if (req?.files?.featuredImage) {
            featuredImage = req.files.featuredImage[0];
            const pathN = featuredImage?.path;
            const npathN = pathN.replaceAll("\\", "/");
            featuredImage.path = npathN;

            // Upload to Cloudflare R2
            const url = await r2.uploadPublic(featuredImage?.path, `${featuredImage?.filename}`, `Events`);
            featuredImage = url;
        };

        const eventData = req.body;
        if (featuredImage) {
            eventData.featuredImage = featuredImage;
        };
        eventData.adminId = adminId;

        const event = new EventModel(eventData);
        const saved = await event.save();
        return sendSuccessResponse(res, { message: "Event created", data: saved }, 201);
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Get all events
exports.getAllEvents = async (req, res) => {
    try {
        const { search, page, size } = req.query;
        const { type } = req.body;

        const { limit, offset } = getPagination(page, size);
        const searchTerm = escapeRegex(search);

        const query = {};
        if (type) query.type = type;
        if (searchTerm) {
            query.$or = [
                { title: { $regex: searchTerm, $options: "i" } },
                { description: { $regex: searchTerm, $options: "i" } },
            ];
        }

        const events = await EventModel.find(query)
            .sort({ dateTime: 1, createdAt: -1 })
            .skip(offset)
            .limit(limit);
        const totalItems = await EventModel.countDocuments(query);

        const transformed = events.map((event) => {
            const e = event.toObject();
            e.id = e._id.toString();
            return e;
        });

        return sendSuccessResponse(
            res,
            getPaginationData({ count: totalItems, docs: transformed }, page, limit)
        );
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};

// Get event by ID
exports.getEventById = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await EventModel.findById(eventId);
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
        const event = await EventModel.findById(eventId);
        if (!event) {
            return sendErrorResponse(res, "Event not found", 404, true, true);
        };

        const updateData = req.body;

        let featuredImage = "";
        if (req?.files?.featuredImage) {
            featuredImage = req.files.featuredImage[0];
            const pathN = featuredImage?.path;
            const npathN = pathN.replaceAll("\\", "/");
            featuredImage.path = npathN;

            // Upload to Cloudflare R2
            const url = await r2.uploadPublic(featuredImage?.path, `${featuredImage?.filename}`, `Events`);
            updateData.featuredImage = url;
        }

        Object.assign(event, updateData);
        const updated = await event.save();

        return sendSuccessResponse(res, { message: "Event updated", data: updated });
    } catch (error) {
        return sendErrorResponse(res, error);
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

// Register for an event
exports.registerForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await EventModel.findById(eventId);
        if (!event) {
            return sendErrorResponse(res, "Event not found", 404, true, true);
        };

        if (!req.user && (!req.body.name || !req.body.email || !req.body.phone)) {
            return sendErrorResponse(res, "Name, email, and phone are required for registration", 400, true, true);
        };

        const registration = {
            userId: req.user?._id || null,
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            registeredAt: new Date(),
        };

        if (!event.registrations) {
            event.registrations = [];
        }
        event.registrations.push(registration);
        const updated = await event.save();

        return sendSuccessResponse(res, {
            message: "Registered successfully",
            data: {
                eventId: updated._id.toString(),
                ...registration,
            },
        });
    } catch (error) {
        return sendErrorResponse(res, error);
    }
};



